import CalendarSlot from './CalendarSlot'
import { Sunrise, Sunset, SunIcon, Pizza } from 'lucide-react'

/* 
    This component displays the 7x4 grid meal slots
    7 columns for days (Monday-Sunday) 
    4 Rows for meal types (Breakfast/Lunch/Dinner/Snacks)
*/

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const MEAL_TYPES = [
    { key: 'breakfast', label:'Breakfast', icon: Sunrise},
    { key: 'lunch', label: 'Lunch', icon: SunIcon },
    { key: 'dinner', label: 'Dinner', icon: Sunset },
    { key: 'snack', label: 'Snacks', icon: Pizza }
]

interface CalendarGridProps {
    weekStart: Date          // The Monday of the week we're displaying
    meals: any[]             // Array of meal plans from backend
    onMealAdded: () => void  // Callback to refresh meals after adding
    onMealDeleted: () => void // Callback to refresh meals after deleting
    isDuplicateCheck: (recipeId: string) => boolean; //Check if recipe is already planned for the week
}

export default function CalendarGrid({ weekStart, meals, onMealAdded, onMealDeleted, isDuplicateCheck }: CalendarGridProps) {
    const safeMeals = Array.isArray(meals) ? meals.filter(Boolean) : []
  
    // HELPER: Get date for a specific day offset
    const getDayDate = (dayIndex: number): Date => {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + dayIndex)
        return date
    }

    // Searches the meals array to find if there's a meal planned, for a specific day and meal type
const findMeal = (date: Date, mealType: string) => {
    const dateString = date.toISOString().split('T')[0]
    
    const found = safeMeals.find(meal => {
        if (!meal?.date || !meal?.mealType) {
            return false
        }

        const parsedMealDate = new Date(meal.date)
        if (Number.isNaN(parsedMealDate.getTime())) {
            return false
        }

        const mealDateString = parsedMealDate.toISOString().split('T')[0]
        const matches = mealDateString === dateString && meal.mealType === mealType
        
        return matches
    })
    return found
}

    return (
        <div className="card bg-base-100 border border-base-300 shadow-sm overflow-x-auto">
            {/* Grid container - 8 columns (1 for labels + 7 for days) */}
            <div className="grid grid-cols-8 gap-2 p-4 min-w-[800px]">
                {/* HEADER ROW - Days of the week */}
                <div></div> {/* Empty corner cell */}
                {DAYS.map((day, index) => {
                    const date = getDayDate(index)
                    const dateNum = date.getDate()
            
                     // Check if this is today's date
                    const today = new Date()
                    const isToday = 
                        date.getDate() === today.getDate() &&
                        date.getMonth() === today.getMonth() &&
                        date.getFullYear() === today.getFullYear()
            
                    return (
                        <div key={day} className="text-center font-semibold pb-2">
                        <div>{day}</div>
                        <div className={`text-sm ${isToday ? 'bg-primary text-primary-content rounded-full w-8 h-8 flex items-center justify-center mx-auto font-bold' : 'opacity-70'}`}>
                            {dateNum}
                        </div>
                    </div>
                    )
                })}

                {/* MEAL TYPE ROWS */}
                {MEAL_TYPES.map(mealType => (
                    <div key={mealType.key} className="contents">
                    {/* Row label (Breakfast, Lunch, etc.) */}
                        <div className="flex font-semibold">
                        <div className="flex items-center gap-2">
                            <mealType.icon className='h-5 w-5'/>
                            <div className="hidden sm:block">{mealType.label}</div>
                        </div>
                    </div>

                {/* Slots for each day */}
                {DAYS.map((day, dayIndex) => {
                    const date = getDayDate(dayIndex)
                    const meal = findMeal(date, mealType.key)
              
                    return (
                        <CalendarSlot
                        key={`${day}-${mealType.key}`}
                        date={date}
                        mealType={mealType.key}
                        existingMeal={meal}
                        onMealAdded={onMealAdded}
                        onMealDeleted={onMealDeleted}
                        isDuplicateCheck={isDuplicateCheck}
                        />
                    )
                })}
                </div>
                ))}
            </div>
        </div>
    )
}
