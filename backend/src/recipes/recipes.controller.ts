import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common'; 
import { RecipeService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Controller('recipes')
export class RecipesController {
    constructor(private readonly recipeService: RecipeService) {}

    // POST: CREATE A NEW RECIPE for the logged-in user
    @Post(':userId')
    create(
        @Param('userId') userId: string,
        @Body() CreateRecipeDto: CreateRecipeDto,
    ) {
        return this.recipeService.create(userId, CreateRecipeDto);
    }

    // GET: ALL RECIPES ofr a specific user, newest first
    @Get(':userId')
    findAll(@Param('userId') userId: string) {
        return this.recipeService.findAll(userId);
    }

    // GET: ONE RECIPE by ID
    @Get(':userId/:id')
    findOne(
        @Param('userId') userId: string,
        @Param('id') id: string,
    ) {
        return this.recipeService.findOne(id, userId);
    }

    // Patch: UPDATE A RECIPE by ID for the logged-in user
    @Patch(':userId/:id')
    update(
        @Param('userId') userId: string,
        @Param('id') id: string,
        @Body() UpdateRecipeDto: UpdateRecipeDto,
    ) {
        return this.recipeService.update(id, userId, UpdateRecipeDto);
    }

    // DELETE: A RECIPE by IF for the logged-in user
    @Delete(':userId/:id')
    remove(
        @Param('userId') userId: string,
        @Param('id') id:string,
    ) {
        return this.recipeService.remove(id, userId);
    }
}