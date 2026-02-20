import { useState, useEffect } from 'react'
import { useAuth } from '../AuthContext'
import { Plus, Edit2, Trash2, Clock, ChefHat } from 'lucide-react'
import { useNavigate } from 'react-router-dom'  

/**
 * RecipeList page displays all recipes for the logged-in user in a card format
 * Each card has an edit and delete icons (top right) and shows basic info like title, difficulty, 
 * total cooking time, servings, and dietary tags. 
 * Clicking on the card (except the icons) takes you to the RecipeDetail page for that selected recipe
 */


// TypeScript interface matching our Prisma Recipe model
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
    ingredients: Array<({ name: string; amount: string; unit: string })>
    instructions: string[]
    dietaryTags: string[]
    createdAt: string
    updatedAt: string
}

export default function RecipeList() {
    const navigate = useNavigate()

    // Get API base URL from environment variable
    const API_URL = import.meta.env.VITE_API_URL

    // Get logged-in user's ID from AuthContext
    const { user } = useAuth()
    const userId = user?.id

    // State to hold recipes, loading status, and error message
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch recipes when component mounts 
    useEffect(() => {
        if (userId) {
            fetchRecipes()
        }
    }, [userId])

    // Function to fetch all recipes for this user fromn the backend
    const fetchRecipes = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`${API_URL}/recipes/${userId}`)

            if (!response.ok){
                throw new Error('Failed to fetch recipes')
            }
        const data = await response.json()
        setRecipes(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Error fetching recipes:', err)
        } finally {
            setLoading(false)
        }
    }

    // ACTION HANDLER: click delete icon to delete a recipe
    const handleDelete = async (recipeId: string, e:React.MouseEvent) => {
        e.stopPropagation() // Prevent card click event from firing

        if (!confirm('Are you sure you want to delete this recipe?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/recipes/${userId}/${recipeId}`, {
                method: 'DELETE',
            })

            if(!response.ok) {
                throw new Error('Failed to delete recipe')
            }

            // Remove deeleted recipe from UI immediately
            setRecipes(recipes.filter(r => r.id !== recipeId))
        } catch (err) {
            alert('Failed to delete recipe')
            console.error('Error deleting recipe:', err)
        }
    }

    // ACTION HANDLER: click edit icon to navigate to RecipeEdit for that recipe
    const handleEdit = (recipeId: string, e:React.MouseEvent) => {
        // stop the card click event from firing
        e.stopPropagation()
        navigate(`/recipes/${recipeId}/edit`)
    }

    // ACTION HANDLER: click card to navigate to RecipeDetail for that recipe
    const handleCardClick = (recipeId: string) => {
        navigate(`/recipes/${recipeId}`)
    }
    
    // Loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Clock className="animate-spin mr-2" />
                Loading recipes...
            </div>
        )
    }
    // Error state
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500">{error}</p>
            </div>
        )
    }

    // Main content: list of recipe cars 
    return(
        <div className="max-w-7xl">
            {/* Header with title and "Add Recipe" button */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-base-content">My Recipes</h2>
                    <p className="opacity-70">Create and manage your recipe collection!</p>
                </div>

                {/* Button to navigate to RecipeCreate page */}
                <button
                onClick={() => navigate('/recipes/new')}
                className="btn btn-primary gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Add Recipe
                </button>
            </div>

            {/* Empty state when no recipes yet */}
            {/* if not, returns the recipe grid */}
            { recipes.length === 0 ? (
                <div className="card bg-base-100 border border-base-300 shadow-sm">
                    <div className="card-body items-center text-center py-16">
                        <ChefHat className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold">No recipes yet</h3>
                        <p className="opacity-70">Create your first recipe to get started!</p>
                        <button
                            onClick={() => navigate('/recipes/new')}
                            className="btn btn-primary gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Create Your First Recipe
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() => handleCardClick(recipe.id)}
                            className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative"
                        >
                            <div className="card-body">
                                {/* Edit and Delete icons in top-right corner of each card */}
                                <div className="absolute top-3 right-3 flex gap-3 z-10">
                                    {/* Edit button */}
                                    <button
                                        onClick={(e) => handleEdit(recipe.id, e)}
                                        className="btn btn-circle btn-sm btn-ghost bg-base-100/80 backdrop-blur"
                                        title="Edit recipe"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => handleDelete(recipe.id, e)}
                                        className="btn btn-circle btn-sm btn-ghost bg-base-100/80 backdrop-blur hover:btn-error"
                                        title="Delete recipe"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Recipe image if one was procided */}
                                {recipe.imageUrl && (
                                    <figure className="rounded-box overflow-hidden -mx-6 -mt-6 mb-4">
                                        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-48 object-cover" />
                                    </figure>
                                )}

                                {/* Recipe title */}
                                <h3 className="card-title text-lg">{recipe.title}</h3>

                                {/* Recipe description, if provided */}
                                {recipe.description && (
                                    <p className="opacity-70 text-sm line-clamp-2">{recipe.description}</p>
                                )}
                                {/* Recipe metadata (difficulty, total time, servings) */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <div className={`badge ${
                                    recipe.difficulty === 'Easy' ? 'badge-primary badge-outline' :   // ← Green
                                    recipe.difficulty === 'Medium' ? 'badge-secondary badge-outline' :      // ← Blue
                                    'badge-error badge-outline'
                                    }`}>
                                    {recipe.difficulty}
                                    </div>
                                    <div className="badge badge-warning badge-outline gap-1">
                                        <Clock className="h-3 w-3" />
                                        {recipe.prepTime + recipe.cookTime} mins 
                                    </div>
                                    <div className="badge badge-outline">{recipe.servings}{recipe.servings === 1 ? ' serving' : ' servings'}</div>
                                </div>

                                {/* Dietary tags - shows max 5, then +X for the rest*/}
                                {recipe.dietaryTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {recipe.dietaryTags.slice(0, 5).map((tag) => (
                                            <span key ={tag} className="badge badge-primary badge-sm">
                                                {tag}
                                            </span>
                                        ))}
                                        {recipe.dietaryTags.length > 5 && (
                                            <span className="badge badge-primary badge-sm">
                                                +{recipe.dietaryTags.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>    
                    ))}
                </div>
            )}
        </div>
    )
}
