import{ Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import{ PrismaService } from '../prisma/prisma.service';
import{ CreateRecipeDto } from './dto/create-recipe.dto';
import{ UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipeService {
    constructor(private prisma: PrismaService){}

    // CREATE RECIPE
    // creates a new recipe for the logged-in user
    async create(userId: string, CreateRecipeDto: CreateRecipeDto) {
        const{
            title,
            description,
            imageUrl,
            difficulty,
            prepTime,
            cookTime,
            servings,
            cost,
            dietaryTags,
            ingredients,
            instructions,
        } = CreateRecipeDto;

        const recipe = await this.prisma.recipe.create({
            data: {
                userId,
                title,
                description,
                imageUrl,
                difficulty,
                prepTime,
                cookTime,
                servings,
                cost,
                dietaryTags,
                ingredients: ingredients as any, // cast to any for json fiels
                instructions,
            },
        });

        return recipe;
    }

    // GET ALL RECIPES
    // returns all recipes for a specific user, newest first
    async findAll(userId: string) {
        const recipes = await this.prisma.recipe.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return recipes;
    }

    // GET ONE RECIPE
    // returns a specific recipe by ID
    async findOne(recipeId: string, userId: string) {
        const recipe = await this.prisma.recipe.findUnique({
            where: { id: recipeId },
        });

        if (!recipe) {
            throw new NotFoundException('Recipe not found');
        }

        if (recipe.userId !== userId) {
            throw new ForbiddenException('You do not have access to this recipe');
        }

        return recipe;
    }

    // CUPDATE RECIPE
    // updates an existing recipe
    async update(recipeId: string, userId: string, UpdateRecipeDto: UpdateRecipeDto) {
        await this.findOne(recipeId, userId);

        const updateData: any = {};

        if (UpdateRecipeDto.title !== undefined) updateData.title = UpdateRecipeDto.title;
        if (UpdateRecipeDto.description !== undefined) updateData.description = UpdateRecipeDto.description;
        if (UpdateRecipeDto.imageUrl !== undefined) UpdateRecipeDto.imageUrl = UpdateRecipeDto.imageUrl;
        if (UpdateRecipeDto.difficulty !== undefined) UpdateRecipeDto.difficulty = UpdateRecipeDto.difficulty;
        if (UpdateRecipeDto.prepTime !== undefined) UpdateRecipeDto.prepTime = UpdateRecipeDto.prepTime;
        if (UpdateRecipeDto.cookTime !== undefined) UpdateRecipeDto.cookTime = UpdateRecipeDto.cookTime;
        if (UpdateRecipeDto.servings !== undefined) UpdateRecipeDto.servings = UpdateRecipeDto.servings;
        if (UpdateRecipeDto.cost !== undefined) UpdateRecipeDto.cost = UpdateRecipeDto.cost;
        if (UpdateRecipeDto.dietaryTags !== undefined) UpdateRecipeDto.dietaryTags = UpdateRecipeDto.dietaryTags;
        if (UpdateRecipeDto.ingredients !== undefined) UpdateRecipeDto.ingredients = UpdateRecipeDto.ingredients;
        if (UpdateRecipeDto.instructions !== undefined) UpdateRecipeDto.instructions = UpdateRecipeDto.instructions;

        if (Object.keys(updateData).length === 0) {
            throw new BadRequestException('No valid field provided to update');
        }

        const updatedRecipe = await this.prisma.recipe.update({
            where: { id: recipeId },
            data: updateData,
        });

        return updatedRecipe;

    }


    // DELETE RECIPE
    // deletes a recipe
    async remove(recipeId: string, userId: string) {
        await this.findOne(recipeId, userId);

        await this.prisma.recipe.delete({
            where: { id: recipeId },
        });

        return { message: 'Recipe deleted successfully', id: recipeId };
    }

}