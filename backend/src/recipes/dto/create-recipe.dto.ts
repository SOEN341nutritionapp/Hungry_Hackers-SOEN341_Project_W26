import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO for a single ingredient
export class IngredientDto{
    @IsString()
    name: string;

    @IsString()
    amount: string;

    @IsString()
    unit: string; // ml, g, tsp, tbsp, cup, piece, etc
}

export class CreateRecipeDto {
    @IsString()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsString()
    difficulty: string; // Easy, MEdium, Hard

    @IsNumber()
    prepTime: number; // in minutes

    @IsNumber()
    cookTime: number; // in minutes

    @IsNumber()
    servings: number; // number of people

    @IsOptional()
    @IsNumber()
    cost?: number; // estimated cost

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    dietaryTags: string[];

    // Ingredients - array of objects
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    ingredients: IngredientDto[];

    // Instructions - array of strings
    @IsArray()
    @IsString({ each: true })
    instructions: string[];
}