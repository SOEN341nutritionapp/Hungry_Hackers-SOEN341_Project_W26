import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class IngredientDto{
    @IsString()
    name: string;

    @IsString()
    amount: string;

    @IsString()
    unit: string; 
}

export class UpdateRecipeDto {
    // All field are optional for updates
    @IsOptional()
    @IsString()
    title?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    imageUrl?: string;

    @IsOptional()
    @IsString()
    difficulty?: string;

    @IsOptional()
    @IsNumber()
    prepTime?: number;

    @IsOptional()
    @IsNumber()
    cookTime?: number;

    @IsOptional()
    @IsNumber()
    servings?: number;

    @IsOptional()
    @IsNumber()
    cost?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    dietaryTags?: string[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => IngredientDto)
    ingredients?: IngredientDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    instructions?: string[];
}

