import { Module } from '@nestjs/common';
import { RecipeService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [RecipesController], // our api endpoints 
    providers: [RecipeService],  // our business logic, database interactions
    exports: [RecipeService],
})

export class RecipesModule {}