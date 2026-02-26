import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
<<<<<<< HEAD
import { MetroController } from './metro/metro.controller';


@Module({
  imports: [UsersModule, PrismaModule, AuthModule],
  controllers: [MetroController, AppController],
=======
import { RecipesModule } from './recipes/recipes.module';

@Module({
  imports: [UsersModule, PrismaModule, AuthModule, RecipesModule],
  controllers: [AppController],
>>>>>>> 14482c948a70a1d183333571fcc12253fb8a217a
  providers: [AppService, PrismaService],
})
export class AppModule {}
