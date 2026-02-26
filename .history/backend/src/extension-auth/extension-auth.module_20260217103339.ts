import { Module } from '@nestjs/common';
import { ExtensionAuthController } from './extension-auth.controller';
import { ExtensionAuthService } from './extension-auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ExtensionAuthController],
  providers: [ExtensionAuthService, PrismaService],
  exports: [ExtensionAuthService],
})
export class ExtensionAuthModule {}
