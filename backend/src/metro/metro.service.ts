import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SyncMetroItemDto } from './dto/sync-metro.dto';
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto';
import { normalizeMetroItem } from './fridge-normalizer';
import {
  deriveVisibleQuantity,
  formatAmountLabel,
  normalizeUnit,
  toBasePackageAmount,
} from '../inventory/inventory-utils';

type StoredFridgeItem = {
  rawName: string;
  name: string;
  normalizedName: string;
  quantity: number;
  unit?: string;
  unitFactor?: number;
  sizeLabel?: string;
  imageUrl?: string;
};

@Injectable()
export class MetroService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async syncFridgeItems(authHeader: string | undefined, incomingItems: SyncMetroItemDto[]) {
    const userId = this.getUserIdFromHeader(authHeader);
    const syncedAt = new Date();
    const items = this.normalizeItems(incomingItems);

    try {
      await this.prisma.$transaction(async (tx) => {
        const existingItems = await tx.fridgeItem.findMany({
          where: {
            userId,
            source: 'metro',
            normalizedName: { in: items.map((item) => item.normalizedName) },
          },
        });

        const existingByName = new Map(
          existingItems.map((item) => [item.normalizedName, item]),
        );

        for (const item of items) {
          const existing = existingByName.get(item.normalizedName);
          const amountPerPackage = this.getAmountPerPackage(item.unitFactor, item.unit);
          const availableIncrement = amountPerPackage * item.quantity;

          if (existing) {
            const nextAvailable = existing.availableAmount + availableIncrement;
            const nextQuantity = deriveVisibleQuantity(
              nextAvailable,
              existing.unitFactor ?? item.unitFactor ?? null,
              existing.quantity + item.quantity,
            );

            const updated = await tx.fridgeItem.update({
              where: { id: existing.id },
              data: {
                rawName: item.rawName,
                name: item.name,
                quantity: nextQuantity,
                availableAmount: nextAvailable,
                unit: item.unit ?? existing.unit ?? null,
                unitFactor: item.unitFactor ?? existing.unitFactor ?? null,
                sizeLabel: item.sizeLabel ?? existing.sizeLabel ?? null,
                imageUrl: item.imageUrl ?? existing.imageUrl ?? null,
                syncedAt,
              },
            });

            existingByName.set(item.normalizedName, updated);
            continue;
          }

          const created = await tx.fridgeItem.create({
            data: {
              userId,
              rawName: item.rawName,
              name: item.name,
              normalizedName: item.normalizedName,
              quantity: item.quantity,
              availableAmount: availableIncrement,
              unit: item.unit ?? null,
              unitFactor: item.unitFactor ?? null,
              sizeLabel: item.sizeLabel ?? null,
              imageUrl: item.imageUrl ?? null,
              source: 'metro',
              syncedAt,
            },
          });

          existingByName.set(item.normalizedName, created);
        }
      });
    } catch (error) {
      this.handleSchemaMismatch(error);
      throw error;
    }

    return {
      ok: true,
      count: items.length,
      syncedAt: syncedAt.toISOString(),
      items,
    };
  }

  async getFridgeItems(authHeader: string | undefined) {
    const userId = this.getUserIdFromHeader(authHeader);
    let items;

    try {
      items = await this.prisma.fridgeItem.findMany({
        where: {
          userId,
          availableAmount: { gt: 0 },
        },
        orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
      });
    } catch (error) {
      this.handleSchemaMismatch(error);
      throw error;
    }

    let latestSyncedAt: string | null = null;

    for (const item of items) {
      const iso = item.syncedAt.toISOString();
      if (!latestSyncedAt || iso > latestSyncedAt) {
        latestSyncedAt = iso;
      }
    }

    return {
      count: items.length,
      syncedAt: latestSyncedAt,
      items: items.map((item) => ({
        id: item.id,
        rawName: item.rawName,
        name: item.name,
        quantity: item.quantity,
        availableAmount: item.availableAmount,
        availableLabel: formatAmountLabel(
          item.availableAmount,
          this.getBaseDisplayUnit(item.unit),
        ),
        unit: normalizeUnit(item.unit),
        unitFactor: item.unitFactor,
        sizeLabel: item.sizeLabel,
        imageUrl: item.imageUrl,
        source: item.source,
        syncedAt: item.syncedAt.toISOString(),
      })),
    };
  }

  async updateFridgeItem(
    authHeader: string | undefined,
    id: string,
    updates: UpdateFridgeItemDto,
  ) {
    const userId = this.getUserIdFromHeader(authHeader);

    if (
      updates.quantityDelta === undefined &&
      updates.availableAmount === undefined
    ) {
      throw new BadRequestException('No fridge update was provided.');
    }

    if (
      updates.quantityDelta !== undefined &&
      updates.availableAmount !== undefined
    ) {
      throw new BadRequestException(
        'Send either quantityDelta or availableAmount, not both.',
      );
    }

    const item = await this.prisma.fridgeItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Fridge item not found.');
    }

    let nextAvailable = item.availableAmount;

    if (updates.availableAmount !== undefined) {
      nextAvailable = updates.availableAmount;
    } else if (updates.quantityDelta !== undefined) {
      const amountPerPackage = this.getAmountPerPackage(item.unitFactor, item.unit);
      nextAvailable = item.availableAmount + updates.quantityDelta * amountPerPackage;
    }

    if (!Number.isFinite(nextAvailable)) {
      throw new BadRequestException('Invalid fridge amount.');
    }

    if (nextAvailable <= 0) {
      await this.prisma.fridgeItem.delete({
        where: { id: item.id },
      });

      return { ok: true, removed: true };
    }

    const updated = await this.prisma.fridgeItem.update({
      where: { id: item.id },
      data: {
        availableAmount: nextAvailable,
        quantity: deriveVisibleQuantity(nextAvailable, item.unitFactor, item.quantity),
      },
    });

    return {
      ok: true,
      removed: false,
      item: {
        id: updated.id,
        rawName: updated.rawName,
        name: updated.name,
        quantity: updated.quantity,
        availableAmount: updated.availableAmount,
        availableLabel: formatAmountLabel(
          updated.availableAmount,
          this.getBaseDisplayUnit(updated.unit),
        ),
        unit: normalizeUnit(updated.unit),
        unitFactor: updated.unitFactor,
        sizeLabel: updated.sizeLabel,
        imageUrl: updated.imageUrl,
        source: updated.source,
        syncedAt: updated.syncedAt.toISOString(),
      },
    };
  }

  async deleteFridgeItem(authHeader: string | undefined, id: string) {
    const userId = this.getUserIdFromHeader(authHeader);

    const item = await this.prisma.fridgeItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException('Fridge item not found.');
    }

    await this.prisma.fridgeItem.delete({
      where: { id: item.id },
    });

    return { ok: true };
  }

  private getUserIdFromHeader(authHeader?: string) {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    const payload = this.authService.verifyToken(token) as { sub?: string };

    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return payload.sub;
  }

  private normalizeItems(items: SyncMetroItemDto[]): StoredFridgeItem[] {
    const deduped = new Map<string, StoredFridgeItem>();

    for (const rawItem of items) {
      const parsedItem = normalizeMetroItem(rawItem);
      if (!parsedItem) {
        continue;
      }

      const existing = deduped.get(parsedItem.normalizedName);

      if (existing) {
        existing.quantity += parsedItem.quantity;

        if (!existing.unit && parsedItem.unit) {
          existing.unit = parsedItem.unit;
        }

        if (!existing.unitFactor && parsedItem.unitFactor) {
          existing.unitFactor = parsedItem.unitFactor;
        }

        if (!existing.sizeLabel && parsedItem.sizeLabel) {
          existing.sizeLabel = parsedItem.sizeLabel;
        }

        if (!existing.imageUrl && parsedItem.imageUrl) {
          existing.imageUrl = parsedItem.imageUrl;
        }

        continue;
      }

      deduped.set(parsedItem.normalizedName, parsedItem);
    }

    return [...deduped.values()];
  }

  private getAmountPerPackage(unitFactor?: number | null, unit?: string | null) {
    return toBasePackageAmount(unitFactor, unit) ?? 1;
  }

  private getBaseDisplayUnit(unit?: string | null) {
    const normalized = normalizeUnit(unit ?? '');

    if (normalized === 'kg' || normalized === 'lb' || normalized === 'oz') {
      return 'g';
    }

    if (normalized === 'l' || normalized === 'cup' || normalized === 'tbsp' || normalized === 'tsp') {
      return 'ml';
    }

    return normalized;
  }

  private handleSchemaMismatch(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2021' || error.code === 'P2022')
    ) {
      throw new ServiceUnavailableException(
        'The database schema is out of date. Apply the latest Prisma migrations and try syncing again.',
      );
    }
  }
}
