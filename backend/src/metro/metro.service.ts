import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AuthService } from '../auth/auth.service'
import { SyncMetroItemDto } from './dto/sync-metro.dto'
import { normalizeMetroItem } from './fridge-normalizer'
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto'
import { formatInventoryAmount } from '../inventory/inventory-utils'

type StoredFridgeItem = {
  rawName: string
  name: string
  normalizedName: string
  quantity: number
  unit?: string
  unitFactor?: number
  sizeLabel?: string
  imageUrl?: string
}

const METRO_SOURCE = 'metro'

@Injectable()
export class MetroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async syncFridgeItems(authHeader: string | undefined, incomingItems: SyncMetroItemDto[]) {
    const userId = this.getUserIdFromHeader(authHeader)
    const syncedAt = new Date()
    const items = this.normalizeItems(incomingItems)

    try {
      await this.prisma.$transaction(async (tx) => {
        const previousStates = await tx.fridgeSyncState.findMany({
          where: { userId, source: METRO_SOURCE },
        })

        const previousByName = new Map(
          previousStates.map((state) => [state.normalizedName, state.lastSyncedQuantity]),
        )
        const seenNames = new Set<string>()

        for (const item of items) {
          seenNames.add(item.normalizedName)

          const previousQuantity = previousByName.get(item.normalizedName) ?? 0
          const quantityDelta = Math.max(item.quantity - previousQuantity, 0)

          if (quantityDelta > 0) {
            const availableAmountDelta = this.getAvailableAmountDelta(quantityDelta, item.unitFactor)

            await tx.fridgeItem.upsert({
              where: {
                userId_normalizedName_source: {
                  userId,
                  normalizedName: item.normalizedName,
                  source: METRO_SOURCE,
                },
              },
              update: {
                rawName: item.rawName,
                name: item.name,
                quantity: { increment: quantityDelta },
                availableAmount: { increment: availableAmountDelta },
                unit: item.unit ?? null,
                unitFactor: item.unitFactor ?? null,
                sizeLabel: item.sizeLabel ?? null,
                imageUrl: item.imageUrl ?? null,
                syncedAt,
              },
              create: {
                userId,
                rawName: item.rawName,
                name: item.name,
                normalizedName: item.normalizedName,
                quantity: quantityDelta,
                availableAmount: availableAmountDelta,
                unit: item.unit ?? null,
                unitFactor: item.unitFactor ?? null,
                sizeLabel: item.sizeLabel ?? null,
                imageUrl: item.imageUrl ?? null,
                source: METRO_SOURCE,
                syncedAt,
              },
            })
          }

          await tx.fridgeSyncState.upsert({
            where: {
              userId_source_normalizedName: {
                userId,
                source: METRO_SOURCE,
                normalizedName: item.normalizedName,
              },
            },
            update: {
              lastSyncedQuantity: item.quantity,
            },
            create: {
              userId,
              source: METRO_SOURCE,
              normalizedName: item.normalizedName,
              lastSyncedQuantity: item.quantity,
            },
          })
        }

        for (const state of previousStates) {
          if (!seenNames.has(state.normalizedName) && state.lastSyncedQuantity !== 0) {
            await tx.fridgeSyncState.update({
              where: { id: state.id },
              data: { lastSyncedQuantity: 0 },
            })
          }
        }
      })
    } catch (error) {
      this.handleSchemaMismatch(error)
      throw error
    }

    return {
      ok: true,
      count: items.length,
      syncedAt: syncedAt.toISOString(),
      items,
    }
  }

  async getFridgeItems(authHeader: string | undefined) {
    const userId = this.getUserIdFromHeader(authHeader)

    try {
      const items = await this.prisma.fridgeItem.findMany({
        where: {
          userId,
          availableAmount: {
            gt: 0,
          },
        },
        orderBy: [{ syncedAt: 'desc' }, { createdAt: 'desc' }],
      })

      return {
        count: items.length,
        syncedAt: items[0]?.syncedAt.toISOString() ?? null,
        items: items.map((item) => this.serializeFridgeItem(item)),
      }
    } catch (error) {
      this.handleSchemaMismatch(error)
      throw error
    }
  }

  async adjustFridgeItem(
    authHeader: string | undefined,
    id: string,
    updateFridgeItemDto: UpdateFridgeItemDto,
  ) {
    const userId = this.getUserIdFromHeader(authHeader)
    const { quantityDelta, availableAmount } = updateFridgeItemDto

    if (quantityDelta === undefined && availableAmount === undefined) {
      throw new BadRequestException('Provide quantityDelta or availableAmount')
    }

    if (quantityDelta === 0) {
      throw new BadRequestException('quantityDelta must not be zero')
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const item = await tx.fridgeItem.findFirst({
          where: { id, userId },
        })

        if (!item) {
          throw new NotFoundException('Fridge item not found')
        }

        let nextAvailableAmount = item.availableAmount

        if (availableAmount !== undefined) {
          nextAvailableAmount = Number(availableAmount.toFixed(3))
        } else if (quantityDelta !== undefined) {
          const availableAmountDelta = this.getAvailableAmountDelta(quantityDelta, item.unitFactor)
          nextAvailableAmount = Number((item.availableAmount + availableAmountDelta).toFixed(3))
        }

        const nextQuantity = this.deriveVisibleQuantity(nextAvailableAmount, item.unitFactor)

        if (nextAvailableAmount < 0) {
          throw new BadRequestException('Cannot reduce fridge item below zero')
        }

        if (nextAvailableAmount === 0) {
          await tx.fridgeItem.delete({ where: { id: item.id } })
          return {
            ok: true,
            removed: true,
          }
        }

        const updated = await tx.fridgeItem.update({
          where: { id: item.id },
          data: {
            quantity: nextQuantity,
            availableAmount: nextAvailableAmount,
          },
        })

        return {
          ok: true,
          removed: false,
          item: this.serializeFridgeItem(updated),
        }
      })
    } catch (error) {
      this.handleSchemaMismatch(error)
      throw error
    }
  }

  async removeFridgeItem(authHeader: string | undefined, id: string) {
    const userId = this.getUserIdFromHeader(authHeader)

    try {
      const item = await this.prisma.fridgeItem.findFirst({
        where: { id, userId },
      })

      if (!item) {
        throw new NotFoundException('Fridge item not found')
      }

      await this.prisma.fridgeItem.delete({ where: { id: item.id } })
      return { ok: true }
    } catch (error) {
      this.handleSchemaMismatch(error)
      throw error
    }
  }

  private serializeFridgeItem(item: {
    id: string
    rawName: string
    name: string
    quantity: number
    availableAmount: number
    unit: string | null
    unitFactor: number | null
    sizeLabel: string | null
    imageUrl: string | null
    source: string
    syncedAt: Date
  }) {
    return {
      id: item.id,
      rawName: item.rawName,
      name: item.name,
      quantity: item.quantity,
      availableAmount: item.availableAmount,
      availableLabel: item.unit ? formatInventoryAmount(item.availableAmount, item.unit) : null,
      unit: item.unit,
      unitFactor: item.unitFactor,
      sizeLabel: item.sizeLabel,
      imageUrl: item.imageUrl,
      source: item.source,
      syncedAt: item.syncedAt.toISOString(),
    }
  }

  private getUserIdFromHeader(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token')
    }

    const token = authHeader.slice('Bearer '.length).trim()
    const payload = this.authService.verifyToken(token) as { sub?: string }

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload')
    }

    return payload.sub
  }

  private normalizeItems(items: SyncMetroItemDto[]): StoredFridgeItem[] {
    const deduped = new Map<string, StoredFridgeItem>()

    for (const rawItem of items) {
      const parsedItem = normalizeMetroItem(rawItem)
      if (!parsedItem) {
        continue
      }

      const existing = deduped.get(parsedItem.normalizedName)

      if (existing) {
        existing.quantity += parsedItem.quantity

        if (!existing.unit && parsedItem.unit) {
          existing.unit = parsedItem.unit
        }

        if (!existing.unitFactor && parsedItem.unitFactor) {
          existing.unitFactor = parsedItem.unitFactor
        }

        if (!existing.sizeLabel && parsedItem.sizeLabel) {
          existing.sizeLabel = parsedItem.sizeLabel
        }

        if (!existing.imageUrl && parsedItem.imageUrl) {
          existing.imageUrl = parsedItem.imageUrl
        }

        continue
      }

      deduped.set(parsedItem.normalizedName, parsedItem)
    }

    return [...deduped.values()]
  }

  private getAvailableAmountDelta(quantityDelta: number, unitFactor?: number | null) {
    const packageAmount = unitFactor && Number.isFinite(unitFactor) && unitFactor > 0 ? unitFactor : 1
    return Number((quantityDelta * packageAmount).toFixed(3))
  }

  private deriveVisibleQuantity(availableAmount: number, unitFactor?: number | null) {
    if (availableAmount <= 0) {
      return 0
    }

    const packageAmount = unitFactor && Number.isFinite(unitFactor) && unitFactor > 0 ? unitFactor : 1
    return Math.max(1, Math.ceil(availableAmount / packageAmount))
  }

  private handleSchemaMismatch(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    ) {
      throw new ServiceUnavailableException(
        'The database schema is out of date. Apply the latest Prisma migrations and try again.',
      )
    }
  }
}
