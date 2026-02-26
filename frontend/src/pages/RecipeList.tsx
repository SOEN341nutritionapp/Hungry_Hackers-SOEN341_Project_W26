import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { Plus, Edit2, Trash2, Clock, ChefHat, Search, SlidersHorizontal, X } from 'lucide-react'
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
    ingredients: Array<{ name: string; amount: string; unit: string }>
    instructions: string[]
    dietaryTags: string[]
    createdAt: string
    updatedAt: string
}

interface RecipeFilters {
    timeMax: number | null
    difficulties: string[]
    costMax: number | null
    includeUnknownCost: boolean
    dietaryTags: string[]
    servingsMin: number | null
    servingsMax: number | null
}

const createDefaultFilters = (): RecipeFilters => ({
    timeMax: null,
    difficulties: [],
    costMax: null,
    includeUnknownCost: false,
    dietaryTags: [],
    servingsMin: null,
    servingsMax: null,
})

function applyRecipeFilters(sourceRecipes: Recipe[], filters: RecipeFilters): Recipe[] {
    return sourceRecipes.filter((recipe) => {
        const totalTime = recipe.prepTime + recipe.cookTime

        if (filters.timeMax !== null && totalTime > filters.timeMax) {
            return false
        }

        if (filters.difficulties.length > 0 && !filters.difficulties.includes(recipe.difficulty)) {
            return false
        }

        if (filters.costMax !== null) {
            if (recipe.cost === null || recipe.cost === undefined) {
                if (!filters.includeUnknownCost) {
                    return false
                }
            } else if (recipe.cost > filters.costMax) {
                return false
            }
        }

        if (filters.dietaryTags.length > 0) {
            const recipeTags = new Set(recipe.dietaryTags)
            const hasAllTags = filters.dietaryTags.every((tag) => recipeTags.has(tag))

            if (!hasAllTags) {
                return false
            }
        }

        if (filters.servingsMin !== null && recipe.servings < filters.servingsMin) {
            return false
        }

        if (filters.servingsMax !== null && recipe.servings > filters.servingsMax) {
            return false
        }

        return true
    })
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
    const [searchQuery, setSearchQuery] = useState('')

    const [showFilters, setShowFilters] = useState(false)
    const [draftFilters, setDraftFilters] = useState<RecipeFilters>(createDefaultFilters)
    const [filters, setFilters] = useState<RecipeFilters>(createDefaultFilters)
    const [costMaxInput, setCostMaxInput] = useState('')

    const availableDifficulties = useMemo(() => {
        const defaults = ['Easy', 'Medium', 'Hard']
        const allValues = [...defaults, ...recipes.map((recipe) => recipe.difficulty)]
        const seen = new Set<string>()
        const options: string[] = []

        for (const value of allValues) {
            const label = value.trim()
            if (!label) {
                continue
            }

            const normalized = label.toLowerCase()
            if (!seen.has(normalized)) {
                seen.add(normalized)
                options.push(label)
            }
        }

        return options
    }, [recipes])

    const availableDietaryTags = useMemo(() => {
        const tags = new Set<string>()

        recipes.forEach((recipe) => {
            recipe.dietaryTags.forEach((tag) => {
                const trimmedTag = tag.trim()
                if (trimmedTag) {
                    tags.add(trimmedTag)
                }
            })
        })

        return Array.from(tags).sort((a, b) => a.localeCompare(b))
    }, [recipes])

    const normalizedSearch = searchQuery.trim().toLowerCase()

    const searchedRecipes = useMemo(() => {
        if (!normalizedSearch) {
            return recipes
        }

        return recipes.filter((recipe) => {
            const searchableContent = [
                recipe.title,
                recipe.description ?? '',
                recipe.dietaryTags.join(' '),
            ]
                .join(' ')
                .toLowerCase()

            return searchableContent.includes(normalizedSearch)
        })
    }, [recipes, normalizedSearch])

    const filteredRecipes = useMemo(() => {
        return applyRecipeFilters(searchedRecipes, filters)
    }, [searchedRecipes, filters])

    // Debounce cost input updates so filtering setup feels less jumpy while typing.
    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (costMaxInput.trim() === '') {
                setDraftFilters((prev) => ({ ...prev, costMax: null }))
                return
            }

            const parsed = Number(costMaxInput)
            if (Number.isFinite(parsed) && parsed >= 0) {
                setDraftFilters((prev) => ({ ...prev, costMax: parsed }))
            }
        }, 250)

        return () => window.clearTimeout(timeout)
    }, [costMaxInput])

    // Fetch recipes when component mounts
    useEffect(() => {
        if (userId) {
            fetchRecipes()
        }
    }, [userId])

    // Function to fetch all recipes for this user from the backend
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
            setError(err instanceof Error ? err.message : 'An error occurred')
            console.error('Error fetching recipes:', err)
        } finally {
            setLoading(false)
        }
    }

    // ACTION HANDLER: click delete icon to delete a recipe
    const handleDelete = async (recipeId: string, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click event from firing

        if (!confirm('Are you sure you want to delete this recipe?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/recipes/${userId}/${recipeId}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete recipe')
            }

            // Remove deleted recipe from UI immediately
            setRecipes(recipes.filter((recipe) => recipe.id !== recipeId))
        } catch (err) {
            alert('Failed to delete recipe')
            console.error('Error deleting recipe:', err)
        }
    }

    // ACTION HANDLER: click edit icon to navigate to RecipeEdit for that recipe
    const handleEdit = (recipeId: string, e: React.MouseEvent) => {
        // stop the card click event from firing
        e.stopPropagation()
        navigate(`/recipes/${recipeId}/edit`)
    }

    // ACTION HANDLER: click card to navigate to RecipeDetail for that recipe
    const handleCardClick = (recipeId: string) => {
        navigate(`/recipes/${recipeId}`)
    }

    const toggleDraftDifficulty = (difficulty: string, checked: boolean) => {
        setDraftFilters((prev) => ({
            ...prev,
            difficulties: checked
                ? [...prev.difficulties, difficulty]
                : prev.difficulties.filter((value) => value !== difficulty),
        }))
    }

    const toggleDraftDietaryTag = (tag: string, checked: boolean) => {
        setDraftFilters((prev) => ({
            ...prev,
            dietaryTags: checked
                ? [...prev.dietaryTags, tag]
                : prev.dietaryTags.filter((value) => value !== tag),
        }))
    }

    const handleApplyFilters = () => {
        setFilters({
            ...draftFilters,
            difficulties: [...draftFilters.difficulties],
            dietaryTags: [...draftFilters.dietaryTags],
        })
    }

    const handleClearFilters = () => {
        const defaultFilters = createDefaultFilters()
        setDraftFilters(defaultFilters)
        setFilters(defaultFilters)
        setCostMaxInput('')
    }

    const applyAndSyncFilters = (updater: (current: RecipeFilters) => RecipeFilters) => {
        setFilters((current) => {
            const next = updater(current)
            setDraftFilters(next)
            setCostMaxInput(next.costMax !== null ? String(next.costMax) : '')
            return next
        })
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

    const hasActiveFilters =
        filters.timeMax !== null ||
        filters.difficulties.length > 0 ||
        filters.costMax !== null ||
        filters.dietaryTags.length > 0 ||
        filters.servingsMin !== null ||
        filters.servingsMax !== null ||
        (filters.costMax !== null && filters.includeUnknownCost)

    // Main content: list of recipe cards
    return (
        <div className="max-w-7xl">
            {/* Header with title, search, filters, and add recipe button */}
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-base-content">My Recipes</h2>
                    <p className="opacity-70">Create and manage your recipe collection!</p>
                    <div className="mt-2 h-1 w-20 rounded-full bg-primary/70"></div>
                </div>

                <div className="w-full lg:max-w-xl flex items-center gap-2">
                    <label className="input input-bordered rounded-full border-primary/30 focus-within:border-primary flex items-center gap-2 w-full">
                        <Search className="h-4 w-4 opacity-60" />
                        <input
                            type="text"
                            className="grow"
                            placeholder="Search by title, description, or tag"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>
                    <button
                        onClick={() => setShowFilters((prev) => !prev)}
                        className="btn btn-outline rounded-full border-primary/30 text-base-content hover:border-primary/40 hover:text-base-content gap-2 whitespace-nowrap"
                        title="Filter recipes"
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filter
                    </button>
                </div>

                {/* Button to navigate to RecipeCreate page */}
                <button onClick={() => navigate('/recipes/new')} className="btn btn-primary gap-2">
                    <Plus className="h-5 w-5" />
                    Add Recipe
                </button>
            </div>

            {showFilters && (
                <div className="card bg-base-100 border border-primary/30 shadow-sm mb-6">
                    <div className="card-body gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Max Total Time</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={draftFilters.timeMax ?? ''}
                                    onChange={(e) =>
                                        setDraftFilters((prev) => ({
                                            ...prev,
                                            timeMax: e.target.value === '' ? null : Number(e.target.value),
                                        }))
                                    }
                                >
                                    <option value="">Any time</option>
                                    <option value="15">15 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                    <option value="90">90 min</option>
                                    <option value="120">120+ min</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Max Cost ($)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    className="input input-bordered w-full"
                                    placeholder="Any"
                                    value={costMaxInput}
                                    onChange={(e) => setCostMaxInput(e.target.value)}
                                />
                                <label className="label cursor-pointer justify-start gap-2 mt-1">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={draftFilters.includeUnknownCost}
                                        onChange={(e) =>
                                            setDraftFilters((prev) => ({
                                                ...prev,
                                                includeUnknownCost: e.target.checked,
                                            }))
                                        }
                                    />
                                    <span className="label-text">Include unknown cost</span>
                                </label>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Servings</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        min="1"
                                        className="input input-bordered w-full"
                                        placeholder="Min"
                                        value={draftFilters.servingsMin ?? ''}
                                        onChange={(e) =>
                                            setDraftFilters((prev) => ({
                                                ...prev,
                                                servingsMin: e.target.value === '' ? null : Number(e.target.value),
                                            }))
                                        }
                                    />
                                    <input
                                        type="number"
                                        min="1"
                                        className="input input-bordered w-full"
                                        placeholder="Max"
                                        value={draftFilters.servingsMax ?? ''}
                                        onChange={(e) =>
                                            setDraftFilters((prev) => ({
                                                ...prev,
                                                servingsMax: e.target.value === '' ? null : Number(e.target.value),
                                            }))
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Difficulty</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {availableDifficulties.map((difficulty) => (
                                        <label
                                            key={difficulty}
                                            className="label cursor-pointer border border-base-300 rounded-box px-3 py-2 gap-2"
                                        >
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm"
                                                checked={draftFilters.difficulties.includes(difficulty)}
                                                onChange={(e) => toggleDraftDifficulty(difficulty, e.target.checked)}
                                            />
                                            <span className="label-text">{difficulty}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">
                                    <span className="label-text font-medium">Dietary Tags (match all)</span>
                                </label>
                                {availableDietaryTags.length === 0 ? (
                                    <p className="text-sm opacity-70">No dietary tags available yet.</p>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto pr-1 flex flex-wrap gap-2">
                                        {availableDietaryTags.map((tag) => (
                                            <label
                                                key={tag}
                                                className="label cursor-pointer border border-base-300 rounded-box px-3 py-2 gap-2"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-sm"
                                                    checked={draftFilters.dietaryTags.includes(tag)}
                                                    onChange={(e) => toggleDraftDietaryTag(tag, e.target.checked)}
                                                />
                                                <span className="label-text">{tag}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-base-300">
                            <button onClick={handleClearFilters} className="btn btn-ghost">
                                Clear
                            </button>
                            <button onClick={handleApplyFilters} className="btn btn-primary">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {hasActiveFilters && (
                <div className="mb-4 flex flex-wrap gap-2">
                    {filters.timeMax !== null && (
                        <button
                            onClick={() => applyAndSyncFilters((current) => ({ ...current, timeMax: null }))}
                            className="badge badge-outline gap-1 px-3 py-3"
                        >
                            ≤ {filters.timeMax} min
                            <X className="h-3 w-3" />
                        </button>
                    )}

                    {filters.costMax !== null && (
                        <button
                            onClick={() =>
                                applyAndSyncFilters((current) => ({
                                    ...current,
                                    costMax: null,
                                    includeUnknownCost: false,
                                }))
                            }
                            className="badge badge-outline gap-1 px-3 py-3"
                        >
                            ≤ ${filters.costMax}
                            <X className="h-3 w-3" />
                        </button>
                    )}

                    {filters.costMax !== null && filters.includeUnknownCost && (
                        <button
                            onClick={() =>
                                applyAndSyncFilters((current) => ({
                                    ...current,
                                    includeUnknownCost: false,
                                }))
                            }
                            className="badge badge-outline gap-1 px-3 py-3"
                        >
                            Include unknown cost
                            <X className="h-3 w-3" />
                        </button>
                    )}

                    {filters.servingsMin !== null && (
                        <button
                            onClick={() => applyAndSyncFilters((current) => ({ ...current, servingsMin: null }))}
                            className="badge badge-outline gap-1 px-3 py-3"
                        >
                            ≥ {filters.servingsMin} servings
                            <X className="h-3 w-3" />
                        </button>
                    )}

                    {filters.servingsMax !== null && (
                        <button
                            onClick={() => applyAndSyncFilters((current) => ({ ...current, servingsMax: null }))}
                            className="badge badge-outline gap-1 px-3 py-3"
                        >
                            ≤ {filters.servingsMax} servings
                            <X className="h-3 w-3" />
                        </button>
                    )}

                    {filters.difficulties.map((difficulty) => (
                        <button
                            key={difficulty}
                            onClick={() =>
                                applyAndSyncFilters((current) => ({
                                    ...current,
                                    difficulties: current.difficulties.filter((value) => value !== difficulty),
                                }))
                            }
                            className="badge badge-outline gap-1 px-3 py-3"
                        >
                            {difficulty}
                            <X className="h-3 w-3" />
                        </button>
                    ))}

                    {filters.dietaryTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() =>
                                applyAndSyncFilters((current) => ({
                                    ...current,
                                    dietaryTags: current.dietaryTags.filter((value) => value !== tag),
                                }))
                            }
                            className="badge badge-outline gap-1 px-3 py-3"
                        >
                            {tag}
                            <X className="h-3 w-3" />
                        </button>
                    ))}
                </div>
            )}

            {/* Empty state when no recipes yet */}
            {recipes.length === 0 ? (
                <div className="card bg-base-100 border border-base-300 shadow-sm">
                    <div className="card-body items-center text-center py-16">
                        <ChefHat className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold">No recipes yet</h3>
                        <p className="opacity-70">Create your first recipe to get started!</p>
                        <button onClick={() => navigate('/recipes/new')} className="btn btn-primary gap-2">
                            <Plus className="h-5 w-5" />
                            Create Your First Recipe
                        </button>
                    </div>
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="card bg-base-100 border border-base-300 shadow-sm">
                    <div className="card-body items-center text-center py-16">
                        <Search className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold">No matching recipes</h3>
                        <p className="opacity-70">Try a different search term or adjust your filters.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() => handleCardClick(recipe.id)}
                            className="card bg-base-100 border border-base-300 hover:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
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

                                {/* Recipe image if one was provided */}
                                {recipe.imageUrl && (
                                    <figure className="rounded-box overflow-hidden -mx-6 -mt-6 mb-4">
                                        <img src={recipe.imageUrl} alt={recipe.title} className="w-full h-48 object-cover" />
                                    </figure>
                                )}

                                {/* Recipe title */}
                                <h3 className="card-title text-lg">{recipe.title}</h3>

                                {/* Recipe description, if provided */}
                                {recipe.description && <p className="opacity-70 text-sm line-clamp-2">{recipe.description}</p>}

                                {/* Recipe metadata (difficulty, total time, servings) */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <div
                                        className={`badge ${
                                            recipe.difficulty === 'Easy'
                                                ? 'badge-primary badge-outline'
                                                : recipe.difficulty === 'Medium'
                                                ? 'badge-secondary badge-outline'
                                                : 'badge-error badge-outline'
                                        }`}
                                    >
                                        {recipe.difficulty}
                                    </div>
                                    <div className="badge badge-warning badge-outline gap-1">
                                        <Clock className="h-3 w-3" />
                                        {recipe.prepTime + recipe.cookTime} mins
                                    </div>
                                    <div className="badge badge-outline">
                                        {recipe.servings}
                                        {recipe.servings === 1 ? ' serving' : ' servings'}
                                    </div>
                                    {recipe.cost !== null && recipe.cost !== undefined && (
                                        <div className="badge badge-success badge-outline">${recipe.cost.toFixed(2)}</div>
                                    )}
                                </div>

                                {/* Dietary tags - shows max 5, then +X for the rest */}
                                {recipe.dietaryTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {recipe.dietaryTags.slice(0, 5).map((tag) => (
                                            <span key={tag} className="badge badge-primary badge-sm">
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
