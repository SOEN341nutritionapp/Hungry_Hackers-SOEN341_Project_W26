import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, X, ArrowLeft, Save, Minus } from 'lucide-react'
import { useAuth } from '../AuthContext'

// Form to edit an existing recipe
// Loads the existing recipe data and pre-fills all the fields
// Same controls as Create but with existing data already filled in

// Interface for a single ingredient
interface Ingredient {
  name: string
  amount: string
  unit: string
}

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
  ingredients: Ingredient[]
  instructions: string[]
  dietaryTags: string[]
  createdAt: string
  updatedAt: string
}

// Available units for ingredient dropdown
const UNITS = [
  'ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz',
  'g', 'kg', 'oz', 'lb',
  'piece', 'whole',
  'pinch', 'dash', 'to taste'
]

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const DIETARY_TAGS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Paleo', 'Low-Carb', 'High-Protein'
]

export default function RecipeEdit() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>() // Get recipe ID from URL

  // Get API base URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL

  // logged-in userId from authcontext
  const { user } = useAuth()
  const userId = user?.id

  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields - pre-filled with existing recipe data
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [difficulty, setDifficulty] = useState('Easy')
  const [prepTime, setPrepTime] = useState(10)
  const [cookTime, setCookTime] = useState(20)
  const [servings, setServings] = useState(1)
  const [cost, setCost] = useState('')
  const [dietaryTags, setDietaryTags] = useState<string[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [instructions, setInstructions] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')


  // New ingredient/instruction being typed in
  const [newIngredient, setNewIngredient] = useState<Ingredient>({
    name: '',
    amount: '1',
    unit: 'cup'
  })
  const [newInstruction, setNewInstruction] = useState('')

  // Fetch the existing recipe when the component mounts
  useEffect(() => {
    if (id && userId) {
      fetchRecipe()
    }
  }, [id, userId])

  // Fetch existing recipe and pre-fill all form fields
  const fetchRecipe = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${API_URL}/recipes/${userId}/${id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch recipe')
      }

      const data: Recipe = await response.json()

      // Pre-fill all form fields with existing recipe data
      setTitle(data.title)
      setDescription(data.description || '')
      setImageUrl(data.imageUrl || '')
      setDifficulty(data.difficulty)
      setPrepTime(data.prepTime)
      setCookTime(data.cookTime)
      setServings(data.servings)
      setCost(data.cost ? data.cost.toString() : '')
      setDietaryTags(data.dietaryTags)
      setIngredients(data.ingredients)
      setInstructions(data.instructions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error fetching recipe:', err)
    } finally {
      setLoading(false)
    }
  }

  // Add new ingredient to the list
  const handleAddIngredient = () => {
    if (!newIngredient.name.trim()) {
      alert('Please enter an ingredient name')
      return
    }

    setIngredients([...ingredients, newIngredient])
    setNewIngredient({ name: '', amount: '1', unit: 'cup' })
  }

  // Remove an ingredient from the list
  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  // Add new instruction to the list
  const handleAddInstruction = () => {
    if (!newInstruction.trim()) {
      alert('Please enter an instruction')
      return
    }

    setInstructions([...instructions, newInstruction])
    setNewInstruction('')
  }

  // Remove an instruction from the list
  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index))
  }

  // Adjust amount for new ingredient being added
  const adjustAmount = (delta: number) => {
    const current = parseFloat(newIngredient.amount) || 0
    const newAmount = Math.max(0, current + delta)
    setNewIngredient({ ...newIngredient, amount: newAmount.toString() })
  }

  // Toggle a dietary tag on or off
  const toggleDietaryTag = (tag: string) => {
    if (dietaryTags.includes(tag)) {
      setDietaryTags(dietaryTags.filter(t => t !== tag))
    } else {
      setDietaryTags([...dietaryTags, tag])
    }
  }

  // Save changes - send PATCH request to backend
  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a recipe title')
      return
    }
    if (ingredients.length === 0) {
      alert('Please add at least one ingredient')
      return
    }
    if (instructions.length === 0) {
      alert('Please add at least one instruction')
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Build update object with all current form values
      const updateData = {
        title,
        description: description.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        difficulty,
        prepTime,
        cookTime,
        servings,
        cost: cost ? parseFloat(cost) : undefined,
        ingredients,
        instructions,
        dietaryTags
      }

      // PATCH to our backend API to update the recipe
      const response = await fetch(`${API_URL}/recipes/${userId}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        throw new Error('Failed to update recipe')
      }

      // Navigate to the recipe detail page after saving
      navigate(`/recipes/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error updating recipe:', err)
    } finally {
      setSaving(false)
    }
  }

  // Loading state while fetching recipe
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    )
  }

  // Error state if recipe couldn't be fetched
  if (error && !title) {
    return (
      <div className="max-w-3xl">
        <div className="alert alert-error">
          <span>Error: {error}</span>
        </div>
        <button onClick={() => navigate('/recipes')} className="btn btn-ghost mt-4">
          Back to Recipes
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate(`/recipes/${id}`)}
        className="btn btn-ghost btn-sm gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Recipe
      </button>

      {/* Header with save button */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-base-content">Edit Recipe</h2>
          <p className="opacity-70">Update your recipe details</p>
        </div>

        <button
          onClick={handleSave}
          className="btn btn-primary gap-2"
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 border border-base-300 shadow-sm">
        <div className="card-body gap-6">

          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Basic Information</h3>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Recipe Title</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Description (Optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Image URL</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="input input-bordered w-full"
              />
            </div>
          </section>

          {/* Recipe Details */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Recipe Details</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Difficulty</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="select select-bordered w-full"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Servings</span>
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value) || 1)}
                  className="input input-bordered w-full"
                  min="1"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Prep Time (min)</span>
                </label>
                <input
                  type="number"
                  value={prepTime}
                  onChange={(e) => setPrepTime(parseInt(e.target.value) || 0)}
                  className="input input-bordered w-full"
                  min="0"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Cook Time (min)</span>
                </label>
                <input
                  type="number"
                  value={cookTime}
                  onChange={(e) => setCookTime(parseInt(e.target.value) || 0)}
                  className="input input-bordered w-full"
                  min="0"
                />
              </div>



              <div className="form-control md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">Estimated Cost ($)</span>
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="input input-bordered w-full"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </section>

          {/* Dietary Tags */}
          <section>
            <h3 className="text-lg font-semibold mb-3">Dietary Tags</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {DIETARY_TAGS.map((tag) => (
                <label
                  key={tag}
                  className="label cursor-pointer justify-start gap-3 rounded-box border border-base-300 bg-base-200 px-4 py-3"
                >
                  <input
                    type="checkbox"
                    checked={dietaryTags.includes(tag)}
                    onChange={() => toggleDietaryTag(tag)}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">{tag}</span>
                </label>
              ))}
            </div>
              {/* Custom tag input */}
            <div className="flex gap-2 mt-3">
                <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                className="input input-bordered flex-1"
                placeholder="Add custom tag..."
                />
                <button
                onClick={() => {
                    if (customTag.trim()) {
                    setDietaryTags([...dietaryTags, customTag.trim()])
                    setCustomTag('')
                    }
                }}
                className="btn btn-primary"
                >
                Add
                </button>
            </div>

            {/* Custom tags shown as badges */}
            {dietaryTags.filter(tag => !DIETARY_TAGS.includes(tag)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                {dietaryTags
                    .filter(tag => !DIETARY_TAGS.includes(tag))
                    .map((tag) => (
                    <span key={tag} className="badge badge-accent gap-2">
                        {tag}
                        <button onClick={() => setDietaryTags(dietaryTags.filter(t => t !== tag))}>
                        <X className="h-3 w-3" />
                        </button>
                    </span>
                    ))}
                </div>
            )}
          </section>

          {/* Ingredients */}
          <section>
            <h3 className="text-lg font-semibold mb-3">
              Ingredients
              {ingredients.length > 0 && (
                <span className="badge badge-ghost badge-sm ml-2">
                  {ingredients.length} items
                </span>
              )}
            </h3>

            {/* Existing ingredients list */}
            {ingredients.length > 0 && (
              <div className="space-y-2 mb-4">
                {ingredients.map((ing, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-box border border-base-300 bg-base-200 px-4 py-3"
                  >
                    <span>• {ing.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="opacity-70">{ing.amount} {ing.unit}</span>
                      <button
                        onClick={() => handleRemoveIngredient(index)}
                        className="btn btn-circle btn-xs btn-ghost hover:btn-error"
                        title="Remove ingredient"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add ingredient form */}
            <div className="rounded-box border border-base-300 bg-base-100 p-4">
              <div className="grid gap-3">
                <input
                  type="text"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Add ingredient..."
                />

                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustAmount(-1)}
                      className="btn btn-circle btn-sm"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={newIngredient.amount}
                      onChange={(e) => setNewIngredient({ ...newIngredient, amount: e.target.value })}
                      className="input input-bordered w-20 text-center"
                      step="0.5"
                    />
                    <button
                      onClick={() => adjustAmount(1)}
                      className="btn btn-circle btn-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <select
                    value={newIngredient.unit}
                    onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
                    className="select select-bordered flex-1"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddIngredient}
                    className="btn btn-primary gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Instructions */}
          <section>
            <h3 className="text-lg font-semibold mb-3">
              Instructions
              {instructions.length > 0 && (
                <span className="badge badge-ghost badge-sm ml-2">
                  {instructions.length} steps
                </span>
              )}
            </h3>

            {/* Existing instructions list */}
            {instructions.length > 0 && (
              <div className="space-y-2 mb-4">
                {instructions.map((inst, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-box border border-base-300 bg-base-200 px-4 py-3"
                  >
                    <div className="font-bold text-primary mt-0.5">{index + 1}.</div>
                    <div className="flex-1">{inst}</div>
                    <button
                      onClick={() => handleRemoveInstruction(index)}
                      className="btn btn-circle btn-xs btn-ghost hover:btn-error"
                      title="Remove instruction"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add instruction form */}
            <div className="rounded-box border border-base-300 bg-base-100 p-4">
              <div className="flex gap-2">
                <textarea
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  className="textarea textarea-bordered flex-1"
                  placeholder="Add instruction step..."
                  rows={2}
                />
                <button
                  onClick={handleAddInstruction}
                  className="btn btn-primary gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="card-actions justify-end gap-3 pt-4">
            <button
              onClick={() => navigate(`/recipes/${id}`)}
              className="btn btn-ghost"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}