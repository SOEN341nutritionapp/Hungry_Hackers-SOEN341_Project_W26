import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { MealPlansService } from './meal-plans.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';

@Controller('meal-plans')
export class MealPlansController {
    constructor(private readonly mealPlansService: MealPlansService) {}

    // GET /meal-plans/:userId/:weekStart - Fetch all meals for a week
    @Get(':userId/:weekStart')
    async findByWeek(
        @Param('userId') userId: string,
        @Param('weekStart') weekStart: string
    ) {
        return this.mealPlansService.findByWeek(userId, weekStart);
    }

    // POST /meal-plans/:userId - Create new meal plan
    @Post(':userId')
    async create (
        @Param('userId') userId: string,
        @Body() CreateMealPlanDto: CreateMealPlanDto
    ) {
        return this.mealPlansService.create(userId, CreateMealPlanDto);
    }

    // DELETE /meal-plans/:userId/:id - Remove meal plan
    @Delete(':userId/:id')
    async remove(
        @Param('userId') userId: string,
        @Param('id') id:string
    ) {
        return this.mealPlansService.remove(userId, id);
    }
}