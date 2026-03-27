import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMealPlanDto } from './dto/create-meal-plan.dto'
import { inventoryNamesMatch, normalizeInventoryName, parseIngredientAmount } from '../inventory/inventory-utils'

type RecipeIngredient = {
  name?: string
  amount?: string
  unit?: string
}

@Injectable()
export class MealPlansService {
    private readonly logger = new Logger(MealPlansService.name)

    constructor(private prisma: PrismaService) {}

    private getWeekStart(date: Date): Date {
        const d = new Date(date)
        const day = d.getUTCDay()
        const daysToSubtract = day === 0 ? 6 : day - 1

        return new Date(Date.UTC(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate() - daysToSubtract,
            0, 0, 0, 0,
        ))
    }

    async findByWeek(userId: string, weekStart: string) {
        const [year, month, day] = weekStart.split('-').map(Number)
        const weekStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

        try {
            return await this.prisma.mealPlan.findMany({
                where: {
                    userId,
                    weekStart: weekStartDate,
                },
                include: {
                    recipe: true,
                },
                orderBy: {
                    date: 'asc',
                },
            })
        } catch (error) {
            this.logger.error(
                `Failed to load meal plans for user ${userId} and week ${weekStart}`,
                error instanceof Error ? error.stack : String(error),
            )
            return []
        }
    }

    async create(userId: string, createMealPlanDto: CreateMealPlanDto) {
        const { recipeId, date, mealType } = createMealPlanDto
        const [year, month, day] = date.split('-').map(Number)
        const mealDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
        const weekStart = this.getWeekStart(mealDate)

        return this.prisma.$transaction(async (tx) => {
            const recipe = await tx.recipe.findUnique({
                where: { id: recipeId },
            })

            if (!recipe || recipe.userId !== userId) {
                throw new NotFoundException('Recipe not found')
            }

            const existingMealInWeek = await tx.mealPlan.findFirst({
                where: {
                    userId,
                    recipeId,
                    weekStart,
                },
            })

            if (existingMealInWeek) {
                throw new ConflictException('This recipe is already planned for this week!')
            }

            const mealPlan = await tx.mealPlan.create({
                data: {
                    userId,
                    recipeId,
                    date: mealDate,
                    mealType,
                    weekStart,
                },
                include: {
                    recipe: true,
                },
            })

            await this.consumeRecipeIngredients(tx, userId, mealPlan.id, recipe.ingredients as RecipeIngredient[])

            return mealPlan
        })
    }

    async remove(userId: string, id: string) {
        return this.prisma.$transaction(async (tx) => {
            const mealPlan = await tx.mealPlan.findUnique({
                where: { id },
                include: {
                    consumptions: true,
                },
            })

            if (!mealPlan || mealPlan.userId !== userId) {
                throw new NotFoundException('Meal Plan Not Found')
            }

            for (const consumption of mealPlan.consumptions) {
                if (!consumption.fridgeItemId) {
                    continue
                }

                const fridgeItem = await tx.fridgeItem.findUnique({
                    where: { id: consumption.fridgeItemId },
                })

                if (!fridgeItem) {
                    continue
                }

                const restoredAvailableAmount = this.roundAmount(
                    fridgeItem.availableAmount + consumption.amountConsumed,
                )

                await tx.fridgeItem.update({
                    where: { id: fridgeItem.id },
                    data: {
                        availableAmount: restoredAvailableAmount,
                        quantity: this.deriveVisibleQuantity(restoredAvailableAmount, fridgeItem.unitFactor),
                    },
                })
            }

            return tx.mealPlan.delete({
                where: { id },
            })
        })
    }

    private async consumeRecipeIngredients(
        tx: Prisma.TransactionClient,
        userId: string,
        mealPlanId: string,
        ingredients: RecipeIngredient[],
    ) {
        if (!Array.isArray(ingredients) || ingredients.length === 0) {
            return
        }

        const fridgeItems = await tx.fridgeItem.findMany({
            where: {
                userId,
                availableAmount: {
                    gt: 0,
                },
            },
            orderBy: [{ syncedAt: 'asc' }, { createdAt: 'asc' }],
        })

        const inventory = fridgeItems.map((item) => ({
            ...item,
            inventoryKey: normalizeInventoryName(item.name),
        }))

        const consumptionRows: Array<{
            mealPlanId: string
            fridgeItemId: string
            ingredientName: string
            amountConsumed: number
            unit: string
        }> = []

        for (const ingredient of ingredients) {
            const ingredientName = ingredient?.name?.trim()
            const ingredientAmount = ingredient?.amount?.trim()
            const ingredientUnit = ingredient?.unit?.trim()

            if (!ingredientName || !ingredientAmount || !ingredientUnit) {
                continue
            }

            const normalizedIngredient = normalizeInventoryName(ingredientName)
            const requestedAmount = parseIngredientAmount(ingredientAmount, ingredientUnit)

            if (!requestedAmount) {
                continue
            }

            let remaining = requestedAmount.value

            for (const item of inventory) {
                if (remaining <= 0) {
                    break
                }

                if (!inventoryNamesMatch(item.inventoryKey, normalizedIngredient) || item.unit !== requestedAmount.unit) {
                    continue
                }

                if (item.availableAmount <= 0) {
                    continue
                }

                const amountConsumed = Math.min(item.availableAmount, remaining)
                item.availableAmount = this.roundAmount(item.availableAmount - amountConsumed)
                remaining = this.roundAmount(remaining - amountConsumed)

                consumptionRows.push({
                    mealPlanId,
                    fridgeItemId: item.id,
                    ingredientName,
                    amountConsumed: this.roundAmount(amountConsumed),
                    unit: requestedAmount.unit,
                })
            }
        }

        if (consumptionRows.length === 0) {
            return
        }

        const updates = inventory.filter((item, index) => item.availableAmount !== fridgeItems[index].availableAmount)

        for (const item of updates) {
            await tx.fridgeItem.update({
                where: { id: item.id },
                data: {
                    availableAmount: item.availableAmount,
                    quantity: this.deriveVisibleQuantity(item.availableAmount, item.unitFactor),
                },
            })
        }

        await tx.mealPlanConsumption.createMany({
            data: consumptionRows,
        })
    }

    private deriveVisibleQuantity(availableAmount: number, unitFactor?: number | null) {
        if (availableAmount <= 0) {
            return 0
        }

        const packageAmount = unitFactor && unitFactor > 0 ? unitFactor : 1
        return Math.max(1, Math.ceil(availableAmount / packageAmount))
    }

    private roundAmount(value: number) {
        return Number(value.toFixed(3))
    }
}
