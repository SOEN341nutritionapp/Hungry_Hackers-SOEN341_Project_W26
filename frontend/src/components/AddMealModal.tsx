import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../AuthContext'

interface AddMealModalProps{
    isOpen: boolean             // is model visible
    onClose: () => void         // Close modal callback
    date: Date                  // Which day to add the meal
    mealType: string            // breakfast/lunch/dinner/snack
    onMealAdded: () => void     // callback after meal is added
}

export default function AddMealModal({
    isOpen,
    onClose,
    date,
    mealType,
    onMealAdded
}: AddMealModalProps) {
    const { user } = useAuth()
    const userId = user?.id
    const API_URL = import.meta.env.VITE_API_URL

    const [recipes, setRecipes] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // fetch recipes when mondal opens
    useEffect (() => {
        if (isOpen && userId) {
            fetchRecipes()
        }
    }, [isOpen, userId])


    // fetch user's recipes form Sprint 2 API
    const fetchRecipes = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_URL}/recipes/${userId}`)

            if (!response.ok) {
                throw new Error('Failed to fetch recipes')
            }

            const data = await response.json()
            setRecipes(data)

        } catch (err) { 
            setError(err instanceof Error ? err.message : 'An error occured')
            console.error('Error fetching recipes:', err)

        } finally {
            setLoading(false)
        }
    }

    // Add recipe to the calendart
    const handleAddRecipe = async (recipeId: string) => {
        try {
            const dateString = date.toISOString().split('T')[0]

            const response = await fetch(`${API_URL}/meal-plans/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipeId,
                    date: dateString,
                    mealType
                })
            })

            if (!response.ok) {
                throw new Error('Failed to add meal')
            }

            // close modal and refresh calendar
            onMealAdded()
            onClose()
        } catch (err) {
            alert('Failed to add meal to calendar')
            console.error('Error adding meal:', err)
        }
    }

    if (!isOpen) return null // dont render if not open

    // format date for display
    const formatDate = () => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            month: 'short',
            day: 'numeric'
        }
        return date.toLocaleDateString('en-US', options)
    }    

    return (
        <>
            {/* Backdrop */}
            <div
                className='fixed inset-0 bg-black/50 z-40'
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="card bg-base-100 w-full max-w-4xl max-h-[80vh] flex flex-col">

                    {/* Header */}
                    <div className='card-body'>
                        <div className='flex items-start justify-between mb-4'>
                            <div>
                                <h3 className='text-2xl font-bold'>Add Meal</h3>
                               <p className="opacity-70">
                                    {formatDate()} • {mealType === 'breakfast' ? 'Breakfast' : mealType === 'lunch' ? 'Lunch' : mealType === 'dinner' ? 'Dinner' : 'Snacks'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className='btn btn-circle btn-sm btn-ghost'
                            >
                                <X className='h-5 w-5' />
                            </button>
                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className='flex justify-center py-8'>
                            <span className='loading loading spinner loading-lg'></span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className='alert alert-error'>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Recipe List */}
                    {!loading && !error && (
                        <div className='overflow-y-auto flex-1'>
                            {recipes.length === 0 ? (
                                <div className='text-center py-8 opacity-70'>
                                    <p>No recipes found. Create some recipes first!</p>
                                </div>
                            ): (
                                <div className='grid gap-3'>
                                    {recipes.map((recipe) => (
                                        <div
                                            key={recipe.id}
                                            className='card bg-base-200 hover:bg-base-300 transition-colors'    
                                        >
                                            {/* Recipe Image */}
                                            {recipe.imageUrl && (
                                                <img 
                                                src={recipe.imageUrl} 
                                                alt={recipe.title}
                                                className="w-1000 h-40 rounded-lg object-cover"
                                                />
                                            )}
                                            {/* Recipe Info */}
                                            <div className='card-body p-4 flex-row items-center justify-between'>
                                                <div className='flex-1'>
                                                    <h4 className='font-semibold'>{recipe.title}</h4>
                                                    <div className='text-sm opacity-70'>
                                                        {recipe.difficulty} • {recipe.prepTime + recipe.cookTime} mins
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleAddRecipe(recipe.id)}
                                                    className='btn btn-primary btn-sm'>
                                                    Add
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>

        </>
    )
}