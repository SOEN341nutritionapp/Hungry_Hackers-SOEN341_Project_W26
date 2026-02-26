import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ExtensionAuthService {
  constructor(private prisma: PrismaService) {}

  async createExtensionSession(params: {
    userId: string;
    label?: string;
    userAgent?: string;
  }) {
    const ttlMinutes = parseInt(process.env.EXT_JWT_TTL_MINUTES || '60', 10);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);

    const jti = randomUUID();

    await this.prisma.extensionSession.create({
      data: {
        jti,
        userId: params.userId,
        expiresAt,
        label: params.label ?? 'Chrome MV3',
        userAgent: params.userAgent ?? null,
      },
    });

    const token = jwt.sign(
      {
        sub: params.userId,
        jti,
        scope: ['metro:sync'],
        typ: 'ext',
      },
      process.env.EXT_JWT_SECRET!,
      {
        expiresIn: `${ttlMinutes}m`,
        issuer: 'mealmajor-backend',
        audience: 'metro-extension',
      },
    );

    return { extensionToken: token, expiresAt: expiresAt.toISOString() };
  }
}
