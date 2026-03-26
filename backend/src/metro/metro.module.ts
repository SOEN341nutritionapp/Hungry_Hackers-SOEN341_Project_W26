import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MetroController } from './metro.controller';
import { MetroService } from './metro.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MetroController],
  providers: [MetroService],
})
export class MetroModule {}
