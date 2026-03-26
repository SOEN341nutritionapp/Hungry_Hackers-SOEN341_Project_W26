import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { SyncMetroItemDto } from './dto/sync-metro.dto';

type StoredFridgeItem = {
  name: string;
  normalizedName: string;
  quantity: number;
  unit?: string;
  unitFactor?: number;
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

    await this.prisma.$transaction(async (tx) => {
      await tx.fridgeItem.deleteMany({ where: { userId } });

      if (items.length > 0) {
        await tx.fridgeItem.createMany({
          data: items.map((item) => ({
            userId,
            name: item.name,
            normalizedName: item.normalizedName,
            quantity: item.quantity,
            unit: item.unit ?? null,
            unitFactor: item.unitFactor ?? null,
            source: 'metro',
            syncedAt,
          })),
        });
      }
    });

    return {
      ok: true,
      count: items.length,
      syncedAt: syncedAt.toISOString(),
      items,
    };
  }

  async getFridgeItems(authHeader: string | undefined) {
    const userId = this.getUserIdFromHeader(authHeader);
    const items = await this.prisma.fridgeItem.findMany({
      where: { userId },
      orderBy: [{ syncedAt: 'desc' }, { name: 'asc' }],
    });

    return {
      count: items.length,
      syncedAt: items[0]?.syncedAt.toISOString() ?? null,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        unitFactor: item.unitFactor,
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
      const trimmedName = rawItem.name.trim();
      if (!trimmedName) {
        continue;
      }

      const normalizedName = trimmedName.toLowerCase();
      const existing = deduped.get(normalizedName);

      if (existing) {
        existing.quantity += rawItem.quantity;

        if (!existing.unit && rawItem.unit?.trim()) {
          existing.unit = rawItem.unit.trim().toLowerCase();
        }

        if (!existing.unitFactor && rawItem.unitFactor) {
          existing.unitFactor = rawItem.unitFactor;
        }

        continue;
      }

      deduped.set(normalizedName, {
        name: trimmedName,
        normalizedName,
        quantity: rawItem.quantity,
        unit: rawItem.unit?.trim().toLowerCase() || undefined,
        unitFactor: rawItem.unitFactor || undefined,
      });
    }

    return [...deduped.values()];
  }
}
