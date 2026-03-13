import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/*
    This page displays a weekly meal plammer where users can view and manage
    their planned meals for breakfast, lunch, dinner, and snacks across 7 days (starting monday)
*/


export default function CalendarPage() {
    const { user } = useAuth()
    const userId = user?.id 
    const API_URL = import.meta.env.VITE_API_URL

    // STATES
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()))
    const [meals, setMeals] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // HELPER FUNCTION: Calculate the Monday of any week
    function getWeekStart(date: Date): Date {
        const d = new Date(date) // cop of the the day so we  don't modify og
        const day = d.getDay() // (0=Sunday, 1=Monday, ..., 6=Saturday)

        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        d.setDate(diff) // set to monday
        d.setHours(0,0,0,0) // reset time to midnight
        return d 
    }

    // HELPER FUNCTION: Format week range for display, converts Monday date to readable range like "Mar 3 - Mar 9"
    function formatWeekRange(weekStart: Date): string {
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6) // add 6 days to get Sunday

        const options: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric'}
        const start = weekStart.toLocaleDateString('en-US', options)
        const end = weekEnd.toLocaleDateString('en-US', options)
        return `${start} - ${end}`
    }

    // load meals whenever week changes
    useEffect(() => {
        if(userId) {
            fetchMeals()
        }
    }, [userId, currentWeekStart])

    // HELPER FUNCTION: Fetch meals from the backend
    const fetchMeals = async () => {
        try{
            setLoading(true) // show loaading spinner
            setError(null)   // clear any precious errors
            // convert Date to string format '2026-03-03' for API
            const weekStartString = currentWeekStart.toISOString().split('T')[0]
            // call backend to get all the meals for this week 
            const response = await fetch(`${API_URL}/meal-plans/${userId}/${weekStartString}`)

            if (!response.ok) {
                throw new Error('Failed to fetch meals')
            }
            // parse response and store in state
            const data = await response.json()
            setMeals(data)
        } catch (err){
            setError(err instanceof Error ? err.message : 'An error occured')
            console.error('Error fetching meals:', err)
        } finally {
            setLoading(false)
        }
    }

    // HANDLER: Navigate to previous week, when user clicks 'Previous Week' button 
    const handlePreviousWeek = () => {
        const newWeekStart = new Date(currentWeekStart)
        newWeekStart.setDate(currentWeekStart.getDate() -7) // subtract 7 days
        setCurrentWeekStart(newWeekStart) // triggers UseEffect
    }

    // HANDLER: Navigate to next week, when user clicks 'Nest Week' button
    const handleNextWeek = () => {
        const newWeekStart = new Date(currentWeekStart)
        newWeekStart.setDate(currentWeekStart.getDate() + 7) // add 7 days
        setCurrentWeekStart(newWeekStart)
    }

    // Loading state
    if (loading) {
        return (
            <div className='flex items-center justify-center min-h-[400px]'>
                <span className='loading loading-spinner loading-lg'></span>
            </div>
        )
    }

    // Error State
    if (error) {
        return (
            <div className='max-w-3xl'>
                <div className='aler alert-error'>
                    <span>Error: {error}</span>
                </div>
            </div>
        )
    }

    // Main Calendar Page
    return (
        <div className='max-w-7xl'>
            {/* Page header */}
            <div className='mb-6'>
                <h2 className='text-3xl font-bold text-base-content'>My Weekly Meal Plan</h2>
                <p className='opacity-70'>Plan your meals for the week ahead!</p>
                <div className="mt-2 h-1 w-20 rounded-full bg-primary/70"></div>

            </div>

            {/* Calendar Grid Container (to be done) */}
            <div className="flex gap-6">
                {/* LEFT: Calendar Grid (Your work - Dev 1) */}
                <div className="flex-1">
                    {/* Week Navigator */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <button onClick={handlePreviousWeek} className='btn btn-outline btn-primary gap-2'>
                            <ChevronLeft className="h-5 w-5" />
                            Previous Week
                        </button>

                    <div className='text-lg font-semibold'>
                        {formatWeekRange(currentWeekStart)}
                    </div>
                        <button onClick={handleNextWeek} className='btn btn-outline btn-primary gap-2'>
                            Next Week
                            <ChevronRight className="h-5 w-5" />

                        </button>
                    </div>
                    <div className="card bg-base-100 border border-base-300 shadow-sm p-6">
                        <p className="text-center text-base-content opacity-50">
                            Calendar grid coming next...
                        </p>
                        <p className="text-center text-sm opacity-30 mt-2">
                            Loaded {meals.length} meals for this week
                        </p>
                    </div>
                </div>

                {/* RIGHT: Recipe Sidebar (Dev 2's work) */}
                <div className="w-70">
                    <div className="card bg-base-100 border border-base-300 shadow-sm p-20">
                        <p className="text-center text-base-content opacity-50">
                            Recipe sidebar
                        </p>
                        <p className="text-center text-sm opacity-30 mt-2">
                            Dev 2 
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
