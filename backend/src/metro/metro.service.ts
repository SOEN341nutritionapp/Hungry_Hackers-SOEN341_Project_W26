import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SyncMetroItemDto } from './dto/sync-metro.dto';
import { normalizeMetroItem } from './fridge-normalizer';

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
        await tx.fridgeItem.deleteMany({ where: { userId } });

        if (items.length > 0) {
          await tx.fridgeItem.createMany({
            data: items.map((item) => ({
              userId,
              rawName: item.rawName,
              name: item.name,
              normalizedName: item.normalizedName,
              quantity: item.quantity,
              unit: item.unit ?? null,
              unitFactor: item.unitFactor ?? null,
              sizeLabel: item.sizeLabel ?? null,
              imageUrl: item.imageUrl ?? null,
              source: 'metro',
              syncedAt,
            })),
          });
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
        where: { userId },
        orderBy: [{ syncedAt: 'desc' }, { name: 'asc' }],
      });
    } catch (error) {
      this.handleSchemaMismatch(error);
      throw error;
    }

    return {
      count: items.length,
      syncedAt: items[0]?.syncedAt.toISOString() ?? null,
      items: items.map((item) => ({
        id: item.id,
        rawName: item.rawName,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitFactor: item.unitFactor,
        sizeLabel: item.sizeLabel,
        imageUrl: item.imageUrl,
        source: item.source,
        syncedAt: item.syncedAt.toISOString(),
      })),
    };
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
