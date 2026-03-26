import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RecipesModule } from './recipes/recipes.module';
import { MetroModule } from './metro/metro.module';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, RecipesModule, MetroModule],
  controllers: [AppController],
  providers: [AppService],
import { MealPlansModule } from './meal-plans/meal-plans.module';
import { MetroController } from './metro/metro.controller';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, RecipesModule, MealPlansModule],
  controllers: [MetroController, AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
