import { IsString, IsNotEmpty, IsDateString } from "class-validator";

/*
    This file validates the incoming data when creating a meal plan
*/ 

export class CreateMealPlanDto {
    @IsString()
    @IsNotEmpty()
    recipeId: string;

    @IsDateString()
    @IsNotEmpty()
    date: string; // "2026-03-03"

    @IsString()
    @IsNotEmpty()
    mealType: string;  // "breakfast", "lunch", "dinner", "snacks"
}