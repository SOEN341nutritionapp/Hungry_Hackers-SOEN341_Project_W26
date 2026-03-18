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
private getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();  // ← Use getUTCDay() not getDay()
  
  // Calculate days to subtract to get to Monday
  const daysToSubtract = day === 0 ? 6 : day - 1;
  
  // Create new date for Monday
  const monday = new Date(Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - daysToSubtract,
    0, 0, 0, 0
  ));
    
  return monday;
}
    // ============= GET: Fetch all meals for a specific task =================
    // Called by: Get /meal-plans/:userId/:weekStart
    // example: findByWeek("user-123", "2026-03-03")
    // returns: all meal plans for that week with the full recipe details
    async findByWeek(userId: string, weekStart: string){
        // Parse as UTC midnight to match what's in database
        const [year, month, day] = weekStart.split('-').map(Number);
        const weekStartDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        
        return this.prisma.mealPlan.findMany({
            where: {
                userId,                             
                weekStart: weekStartDate,  // ← Use parsed UTC date
            },
            include: {
                recipe: true
            },
            orderBy: {
                date: 'asc',
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

        // Parse date as UTC
        const [year, month, day] = date.split('-').map(Number);
        const mealDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
                
        const weekStart = this.getWeekStart(mealDate);
        
        return this.prisma.mealPlan.create({
            data: {
                userId,
                recipeId,
                date: mealDate,
                mealType,
                weekStart,
            },
            include: {
                recipe: true,
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