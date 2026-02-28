import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RecipesModule } from './recipes/recipes.module';
import { MetroController } from './metro/metro.controller';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, RecipesModule],
  controllers: [MetroController, AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}