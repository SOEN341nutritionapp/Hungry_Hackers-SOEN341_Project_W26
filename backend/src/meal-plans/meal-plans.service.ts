import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { FridgeItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';
import {
  deriveVisibleQuantity,
  formatAmountLabel,
  getUnitFamily,
  parseIngredient,
  scoreIngredientItemMatch,
} from '../inventory/inventory-utils';

@Injectable()
export class MealPlansService {
  constructor(private prisma: PrismaService) {}

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getUTCDay();
    const daysToSubtract = day === 0 ? 6 : day - 1;

    return new Date(
      Date.UTC(
        d.getUTCFullYear(),
        d.getUTCMonth(),
        d.getUTCDate() - daysToSubtract,
        0,
        0,
        0,
        0,
      ),
    );
  }

  async findByWeek(userId: string, weekStart: string) {
    const [year, month, day] = weekStart.split('-').map(Number);
    const weekStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    return this.prisma.mealPlan.findMany({
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
    });
  }

  async create(userId: string, createMealPlanDto: CreateMealPlanDto) {
    const { recipeId, date, mealType } = createMealPlanDto;
    const [year, month, day] = date.split('-').map(Number);
    const mealDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const weekStart = this.getWeekStart(mealDate);

    const existingMealInWeek = await this.prisma.mealPlan.findFirst({
      where: {
        userId,
        recipeId,
        weekStart,
      },
    });

    if (existingMealInWeek) {
      throw new ConflictException('This recipe is already planned for this week!');
    }

    return this.prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.findFirst({
        where: {
          id: recipeId,
          userId,
        },
      });

      if (!recipe) {
        throw new NotFoundException('Recipe not found');
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
      });

      const fridgeItems = await tx.fridgeItem.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
      });

      const consumedItems: Array<{
        ingredientName: string;
        fridgeItemName: string;
        amountConsumed: number;
        unit: string;
        label: string;
      }> = [];

      const missingIngredients: Array<{
        ingredientName: string;
        amountRequested: number;
        unit: string;
      }> = [];

      const ingredients = Array.isArray(recipe.ingredients)
        ? (recipe.ingredients as Prisma.JsonArray)
        : [];

      for (const rawIngredient of ingredients) {
        const parsedIngredient = parseIngredient(rawIngredient);
        if (!parsedIngredient) {
          continue;
        }

        const matchedItem = this.findBestFridgeMatch(parsedIngredient.name, parsedIngredient.baseUnit, fridgeItems);
        if (!matchedItem) {
          missingIngredients.push({
            ingredientName: parsedIngredient.name,
            amountRequested: parsedIngredient.baseAmount,
            unit: parsedIngredient.baseUnit,
          });
          continue;
        }

        const amountConsumed = Math.min(
          parsedIngredient.baseAmount,
          matchedItem.availableAmount,
        );

        if (amountConsumed <= 0) {
          missingIngredients.push({
            ingredientName: parsedIngredient.name,
            amountRequested: parsedIngredient.baseAmount,
            unit: parsedIngredient.baseUnit,
          });
          continue;
        }

        const nextAvailableAmount = matchedItem.availableAmount - amountConsumed;
        const nextQuantity =
          nextAvailableAmount > 0
            ? deriveVisibleQuantity(
                nextAvailableAmount,
                matchedItem.unitFactor,
                matchedItem.quantity,
              )
            : 0;

        await tx.fridgeItem.update({
          where: { id: matchedItem.id },
          data: {
            availableAmount: nextAvailableAmount,
            quantity: nextQuantity,
          },
        });

        matchedItem.availableAmount = nextAvailableAmount;
        matchedItem.quantity = nextQuantity;

        await tx.mealPlanConsumption.create({
          data: {
            mealPlanId: mealPlan.id,
            fridgeItemId: matchedItem.id,
            ingredientName: parsedIngredient.name,
            amountConsumed,
            unit: parsedIngredient.baseUnit,
          },
        });

        consumedItems.push({
          ingredientName: parsedIngredient.name,
          fridgeItemName: matchedItem.name,
          amountConsumed,
          unit: parsedIngredient.baseUnit,
          label: formatAmountLabel(amountConsumed, parsedIngredient.baseUnit),
        });

        if (amountConsumed < parsedIngredient.baseAmount) {
          missingIngredients.push({
            ingredientName: parsedIngredient.name,
            amountRequested: parsedIngredient.baseAmount - amountConsumed,
            unit: parsedIngredient.baseUnit,
          });
        }
      }

      return {
        ...mealPlan,
        fridgeUpdates: consumedItems,
        missingIngredients: missingIngredients.map((item) => ({
          ...item,
          label: formatAmountLabel(item.amountRequested, item.unit),
        })),
      };
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const mealPlan = await tx.mealPlan.findUnique({
        where: { id },
        include: {
          consumptions: true,
        },
      });

      if (!mealPlan || mealPlan.userId !== userId) {
        throw new NotFoundException('Meal Plan Not Found');
      }

      const restoredItems: Array<{
        ingredientName: string;
        amountRestored: number;
        unit: string;
        label: string;
      }> = [];

      for (const consumption of mealPlan.consumptions) {
        if (!consumption.fridgeItemId) {
          continue;
        }

        const fridgeItem = await tx.fridgeItem.findUnique({
          where: { id: consumption.fridgeItemId },
        });

        if (!fridgeItem) {
          continue;
        }

        const nextAvailableAmount =
          fridgeItem.availableAmount + consumption.amountConsumed;
        const nextQuantity = deriveVisibleQuantity(
          nextAvailableAmount,
          fridgeItem.unitFactor,
          fridgeItem.quantity || 1,
        );

        await tx.fridgeItem.update({
          where: { id: fridgeItem.id },
          data: {
            availableAmount: nextAvailableAmount,
            quantity: nextQuantity,
          },
        });

        restoredItems.push({
          ingredientName: consumption.ingredientName,
          amountRestored: consumption.amountConsumed,
          unit: consumption.unit,
          label: formatAmountLabel(consumption.amountConsumed, consumption.unit),
        });
      }

      await tx.mealPlan.delete({
        where: { id: mealPlan.id },
      });

      return {
        ok: true,
        restoredItems,
      };
    });
  }

  private findBestFridgeMatch(
    ingredientName: string,
    unit: string,
    fridgeItems: FridgeItem[],
  ) {
    const targetFamily = getUnitFamily(unit);

    return fridgeItems
      .filter((item) => item.availableAmount > 0)
      .filter((item) => {
        const itemFamily = getUnitFamily(item.unit);
        return !targetFamily || !itemFamily || targetFamily === itemFamily;
      })
      .map((item) => ({
        item,
        score: scoreIngredientItemMatch(ingredientName, item.name),
      }))
      .filter((candidate) => candidate.score >= 0)
      .sort((left, right) => right.score - left.score)[0]?.item;
  }
}
