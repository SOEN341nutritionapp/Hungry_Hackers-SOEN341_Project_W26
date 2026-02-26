import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports:[PrismaModule],
  providers: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
