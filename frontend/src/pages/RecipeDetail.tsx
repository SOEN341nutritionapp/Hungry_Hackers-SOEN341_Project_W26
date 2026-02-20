import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Edit2, Trash2, Clock, Users, ChefHat, DollarSign, ArrowLeft, ListOrdered } from 'lucide-react'
import { useAuth } from '../AuthContext'

// This page displays the full details of a single recipe
// The recipe ID comes from the URL (e.g. /recipes/aRecipeId)
// Has Edit and Delete buttons at the top

interface Recipe {
  id: string
  userId: string
  title: string
  description?: string
  imageUrl?: string
  difficulty: string
  prepTime: number
  cookTime: number
  servings: number
  cost?: number
  ingredients: Array<{ name: string; amount: string; unit: string }>
  instructions: string[]
  dietaryTags: string[]
  createdAt: string
  updatedAt: string
}

export default function RecipeDetail() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()

    const API_URL = import.meta.env.VITE_API_URL

    // logged-in userId from authcontext
    const { user } = useAuth()
    const userId = user?.id

    const [recipe, setRecipe] = useState<Recipe | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (id && userId) {
            fetchRecipe()
        }
    }, [id, userId])

    const fetchRecipe = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_URL}/recipes/${userId}/${id}`)

            if (!response.ok) {
                throw new Error('Failed to fetch recipe')
            }

            const data = await response.json()
            setRecipe(data)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Error fetching recipe:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this recipe?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/recipes/${userId}/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete recipe')
            }

            navigate('/recipes')
        } catch (err) {
            alert('Failed to delete recipe')
            console.error('Error deleting recipe:', err)
        }
    }

    // Loading state
    if (loading) {
        return (
        <div className="flex items-center justify-center min-h-[400px]">
            <span className="loading loading-spinner loading-lg"></span>
        </div>
        )
    }

    // Error state
    if (error || !recipe) {
        return (
        <div className="max-w-3xl">
            <div className="alert alert-error">
            <span>Error: {error || 'Recipe not found'}</span>
            </div>
            <button
            onClick={() => navigate('/recipes')}
            className="btn btn-ghost mt-4"
            >
            Back to Recipes
            </button>
        </div>
        )
    }

    return (
        <div className="max-w-4xl">
        {/* Back button */}
        <button
            onClick={() => navigate('/recipes')}
            className="btn btn-ghost btn-sm gap-2 mb-4"
        >
            <ArrowLeft className="h-4 w-4" />
            Back to Recipes
        </button>

        {/* Image */}
        {recipe.imageUrl && (
            <div className="rounded-box overflow-hidden mb-6">
            <img
                src={recipe.imageUrl}
                alt={recipe.title}
                className="w-full h-64 object-cover"
            />
            </div>
        )}

        {/* Title + Actions */}
        <div className="mb-6 flex items-start justify-between">
            <div>
            <h2 className="text-3xl font-bold text-base-content mb-2">
                {recipe.title}
            </h2>
            {recipe.description && (
                <p className="opacity-70">{recipe.description}</p>
            )}
            </div>

            <div className="flex gap-2">
            <button
                onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                className="btn btn-ghost gap-2"
            >
                <Edit2 className="h-4 w-4" />
                Edit
            </button>

            <button
                onClick={handleDelete}
                className="btn btn-ghost text-error gap-2"
            >
                <Trash2 className="h-4 w-4" />
                Delete
            </button>
            </div>
        </div>

        {/* Metadata grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-box border border-base-300 bg-base-200 p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Clock className="h-4 w-4" />
                Prep Time
            </div>
            <div className="font-semibold">{recipe.prepTime} min</div>
            </div>

            <div className="rounded-box border border-base-300 bg-base-200 p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Clock className="h-4 w-4" />
                Cook Time
            </div>
            <div className="font-semibold">{recipe.cookTime} min</div>
            </div>

            <div className="rounded-box border border-base-300 bg-base-200 p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <Users className="h-4 w-4" />
                Servings
            </div>
            <div className="font-semibold">{recipe.servings}</div>
            </div>

            <div className="rounded-box border border-base-300 bg-base-200 p-4">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <ChefHat className="h-4 w-4" />
                Difficulty
            </div>
            <div className="font-semibold">{recipe.difficulty}</div>
            </div>
        </div>

        {/* Cost */}
        {recipe.cost && (
            <div className="rounded-box border border-base-300 bg-base-200 p-4 mb-6">
            <div className="flex items-center gap-2 text-sm opacity-70 mb-1">
                <DollarSign className="h-4 w-4" />
                Estimated Cost
            </div>
            <div className="font-semibold">
                ${recipe.cost.toFixed(2)}
            </div>
            </div>
        )}

        {/* Dietary Tags */}
        {recipe.dietaryTags.length > 0 && (
            <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Dietary Tags</h3>
            <div className="flex flex-wrap gap-2">
                {recipe.dietaryTags.map((tag) => (
                <span key={tag} className="badge badge-accent badge-lg">
                    {tag}
                </span>
                ))}
            </div>
            </div>
        )}

        {/* Ingredients + Instructions */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body gap-6">

            {/* Ingredients */}
            <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Ingredients
                <span className="badge badge-ghost badge-sm">
                    {recipe.ingredients.length} items
                </span>
                </h3>

                <div className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                    <div
                    key={index}
                    className="flex justify-between items-center rounded-box border border-base-300 bg-base-200 px-4 py-3"
                    >
                    <span className="font-medium">
                        • {ingredient.name}
                    </span>
                    <span className="opacity-70">
                        {ingredient.amount} {ingredient.unit}
                    </span>
                    </div>
                ))}
                </div>
            </section>

            {/* Instructions */}
            <section>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <ListOrdered className="h-5 w-5" />
                Instructions
                <span className="badge badge-ghost badge-sm">
                    {recipe.instructions.length} steps
                </span>
                </h3>

                <div className="space-y-3">
                {recipe.instructions.map((instruction, index) => (
                    <div
                    key={index}
                    className="rounded-box border border-base-300 bg-base-200 px-4 py-3"
                    >
                    <div className="flex gap-3">
                        <div className="font-bold text-primary">
                        {index + 1}.
                        </div>
                        <div>{instruction}</div>
                    </div>
                    </div>
                ))}
                </div>
            </section>

            </div>
        </div>
        </div>
    )
}
