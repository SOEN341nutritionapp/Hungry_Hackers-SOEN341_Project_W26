
import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module'; // make sure path is correct

@Module({
  imports: [PrismaModule], // UsersService depends on PrismaService
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // export if other modules (like Auth) need it
})
export class UsersModule {}
