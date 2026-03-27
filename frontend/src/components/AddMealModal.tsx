import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useAuth } from '../AuthContext'
import { apiGet, apiPost } from '../api'

interface AddMealModalProps {
    isOpen: boolean
    onClose: () => void
    date: Date
    mealType: string
    onMealAdded: () => void
}

export default function AddMealModal({
    isOpen,
    onClose,
    date,
    mealType,
    onMealAdded,
}: AddMealModalProps) {
    const { user } = useAuth()
    const userId = user?.id

    const [recipes, setRecipes] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && userId) {
            fetchRecipes()
        }
    }, [isOpen, userId])

    const fetchRecipes = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await apiGet<any[]>(`/recipes/${userId}`)
            setRecipes(Array.isArray(data) ? data.filter(Boolean) : [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occured')
            setRecipes([])
            console.error('Error fetching recipes:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddRecipe = async (recipeId: string) => {
        if (!userId) {
            return
        }

        try {
            const dateString = date.toISOString().split('T')[0]
            await apiPost(`/meal-plans/${userId}`, {
                recipeId,
                date: dateString,
                mealType,
            })
            onMealAdded()
            onClose()
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to add meal to calendar'
            alert(message)
            console.error('Error adding meal:', err)
        }
    }

    if (!isOpen) {
        return null
    }

    const formatDate = () => {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
        }
        return date.toLocaleDateString('en-US', options)
    }

    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            ></div>

            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="card bg-base-100 w-full max-w-4xl max-h-[80vh] flex flex-col">
                    <div className="card-body">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-2xl font-bold">Add Meal</h3>
                                <p className="opacity-70">
                                    {formatDate()} | {mealType === 'breakfast' ? 'Breakfast' : mealType === 'lunch' ? 'Lunch' : mealType === 'dinner' ? 'Dinner' : 'Snacks'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="btn btn-circle btn-sm btn-ghost"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {loading && (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && !error && (
                        <div className="overflow-y-auto flex-1">
                            {recipes.length === 0 ? (
                                <div className="text-center py-8 opacity-70">
                                    <p>No recipes found. Create some recipes first.</p>
                                </div>
                            ) : (
                                <div className="grid gap-3">
                                    {recipes.map((recipe) => {
                                        const recipeTitle = recipe?.title || 'Untitled Recipe'
                                        const difficulty = recipe?.difficulty || 'Unknown'
                                        const totalTime = Number(recipe?.prepTime ?? 0) + Number(recipe?.cookTime ?? 0)

                                        return (
                                            <div
                                                key={recipe.id}
                                                className="card bg-base-200 hover:bg-base-300 transition-colors"
                                            >
                                                {recipe.imageUrl && (
                                                    <img
                                                        src={recipe.imageUrl}
                                                        alt={recipeTitle}
                                                        className="w-full h-40 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div className="card-body p-4 flex-row items-center justify-between">
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold">{recipeTitle}</h4>
                                                        <div className="text-sm opacity-70">
                                                            {difficulty} | {totalTime} mins
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddRecipe(recipe.id)}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        Add
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
