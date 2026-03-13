import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealPlanDto } from './dto/create-meal-plan.dto';

@Injectable()
export class MealPlansService {
    // inject prosmaservice so we can access the database
    constructor(private prisma: PrismaService) {}

    // helper function: calculate the Monday of any given week, 
    // since we store weekStart (the Monday) to make queerying easier
    // so if ua user gives us wednesdat march 5, we calculate Monnday March 3
    private getWeekStart(date:Date): Date{
        const day = date.getDay(); 

        // calculate how many days to subrtact to get to Mondau
        // if it's Sunday (0), go back 6 days, otherwise go back (day - 1) days
        const diff = date.getDate() - day + (day === 0 ? -6 :1); 

        return new Date(date.setDate(diff));
    }

    // ============= GET: Fetch all meals for a specific task =================
    // Called by: Get /meal-plans/:userId/:weekStart
    // example: findByWeek("user-123", "2026-03-03")
    // returns: all meal plans for that week with the full recipe details
    async findByWeek(userId: string, weekStart: string){
        return this.prisma.mealPlan.findMany({
            where: {
                userId,                             // only this user's meals
                weekStart: new Date(weekStart),     // only this week (Monday date)
            },
            include: {
                recipe: true                        // include full recipe object (title, ingredients, etc..)
            },
            orderBy: {
                date: 'asc',                        // sort by date (monday first, sunday last)
            },
        });
    }

    // ============= POST: Create a new meal plan =============================
    // Called bu: POST /meal-plans/:userId
    /* workflow:
        1. takes the recipe ID, date, and meal type from the request
        2. Calculates which Monday that date belongs to (weekStart)
        3. Creates a new entry in the MealPlan table
        4. Returns the created meal plan 
    */
    async create(userId: string, CreateMealPlanDto: CreateMealPlanDto) {
        const { recipeId, date, mealType } = CreateMealPlanDto;

        const mealDate = new Date(date);
        const weekStart = this.getWeekStart(new Date(date));

        // create the meal plan in the database
        return this.prisma.mealPlan.create({
            data: {
                userId,         // who owns this meal plan
                recipeId,       // which recipes to use
                date: mealDate, // which dat
                mealType,       // which meal (breakfast/dinner...)
                weekStart,      // which week's monday 
            },
            include: {
                recipe: true,   // return the full recipe object so frontend can display it immediately
            },
        });
    }


     // =========== DELETE: Remove a meal plan ================================
     // called by: Delete /meal-plans/:userId/:id
    async remove(userId: string, id: string) {
        const mealPlan = await this.prisma.mealPlan.findUnique({
            where: { id }, // find by meal plan id
        });

        if(!mealPlan) {
            throw new NotFoundException('Meal Plan Not Found');
        }

        if (mealPlan.userId !== userId) {
            throw new NotFoundException('Meal Plan Not Found');
        }

        return this.prisma.mealPlan.delete({
            where: { id },
        });
    }
}