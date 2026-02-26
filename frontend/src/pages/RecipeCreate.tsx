import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ArrowLeft, Minus } from 'lucide-react'
import { useAuth } from '../AuthContext'

// Form to create a new recipe
// Has dynamic ingredient and instruction lists
// Ingredients have +/- buttons for amount and a dropdown for units

// Interface for a single ingredient
interface Ingredient {
  name: string
  amount: string
  unit: string
}

// Available units for ingredient dropdown
const UNITS = [
  'ml', 'l', 'tsp', 'tbsp', 'cup', 'fl oz',
  'g', 'kg', 'oz', 'lb',
  'piece', 'whole',
  'pinch', 'dash', 'to taste'
]

// Difficulty options for dropdown
const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

// Dietary tag options for checkboxes
const DIETARY_TAGS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Keto', 'Paleo', 'Low-Carb', 'High-Protein'
]

export default function RecipeCreate() {
  const navigate = useNavigate()

  // Get API base URL from environment variable
  const API_URL = import.meta.env.VITE_API_URL

  // Get userId from auth context
  const { user } = useAuth()
  const userId = user?.id

  // Form state for all recipe fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [difficulty, setDifficulty] = useState('Easy')
  const [prepTime, setPrepTime] = useState(10)
  const [cookTime, setCookTime] = useState(20)
  const [servings, setServings] = useState(1)
  const [cost, setCost] = useState('')
  const [dietaryTags, setDietaryTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState('')

  // List of ingredients added so far
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  // The ingredient currently being typed in
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient>({
    name: '',
    amount: '1',
    unit: 'cup'
  })

  // List of instructions added so far
  const [instructions, setInstructions] = useState<string[]>([])
  // The instruction currently being typed in
  const [currentInstruction, setCurrentInstruction] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Add the current ingredient to the ingredients list
  const handleAddIngredient = () => {
    if (!currentIngredient.name.trim()) {
      alert('Please enter an ingredient name')
      return
    }

    setIngredients([...ingredients, currentIngredient])
    // Reset ingredient input fields
    setCurrentIngredient({ name: '', amount: '1', unit: 'cup' })
  }

  // Remove an ingredient from the list by index
  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  // Increase or decrease the amount of the current ingredient
  const adjustAmount = (delta: number) => {
    const current = parseFloat(currentIngredient.amount) || 0
    const newAmount = Math.max(0, current + delta)
    setCurrentIngredient({ ...currentIngredient, amount: newAmount.toString() })
  }

  // Add the current instruction to the instructions list
  const handleAddInstruction = () => {
    if (!currentInstruction.trim()) {
      alert('Please enter an instruction')
      return
    }

    setInstructions([...instructions, currentInstruction])
    setCurrentInstruction('')
  }

  // Remove an instruction from the list by index
  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index))
  }

  // Toggle a dietary tag on or off
  const toggleDietaryTag = (tag: string) => {
    if (dietaryTags.includes(tag)) {
      setDietaryTags(dietaryTags.filter(t => t !== tag))
    } else {
      setDietaryTags([...dietaryTags, tag])
    }
  }

  // Submit the form and create the recipe
  const handleSubmit = async () => {
    // Basic validation
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
      setLoading(true)
      setError(null)

      // Build the recipe object to send to backend
      const recipeData = {
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

      // POST to our backend API
      const response = await fetch(`${API_URL}/recipes/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(recipeData),
      })

      if (!response.ok) {
        throw new Error('Failed to create recipe')
      }

      const newRecipe = await response.json()

      // Navigate to the newly created recipe's detail page
      navigate(`/recipes/${newRecipe.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      console.error('Error creating recipe:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/recipes')}
        className="btn btn-ghost btn-sm gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Recipes
      </button>

      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-base-content">Create Recipe</h2>
        <p className="opacity-70">Add a new recipe to your collection</p>
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
                <span className="label-text font-medium">Recipe Title *</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input input-bordered w-full"
                placeholder="e.g., Mushroom Omelette"
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text font-medium">Description</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input input-bordered w-full"
                placeholder="A brief description of your recipe"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Image URL (optional)</span>
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="input input-bordered w-full"
                placeholder="https://example.com/image.jpg"
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
                  <span className="label-text font-medium">Prep Time (minutes)</span>
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
                  <span className="label-text font-medium">Cook Time (minutes)</span>
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
                  <span className="label-text font-medium">Estimated Cost ($) (optional)</span>
                </label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="input input-bordered w-full"
                  placeholder="0.00"
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
              Ingredients *
              {ingredients.length > 0 && (
                <span className="badge badge-ghost badge-sm ml-2">
                  {ingredients.length} items
                </span>
              )}
            </h3>

            {/* List of added ingredients */}
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
                {/* Ingredient name input */}
                <input
                  type="text"
                  value={currentIngredient.name}
                  onChange={(e) => setCurrentIngredient({ ...currentIngredient, name: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="Ingredient name (e.g., Eggs)"
                />

                {/* Amount controls and unit dropdown */}
                <div className="flex gap-2">
                  {/* Minus button, amount input, plus button */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => adjustAmount(-1)}
                      className="btn btn-circle btn-sm"
                      type="button"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      value={currentIngredient.amount}
                      onChange={(e) => setCurrentIngredient({ ...currentIngredient, amount: e.target.value })}
                      className="input input-bordered w-20 text-center"
                      min="0"
                      step="0.5"
                    />
                    <button
                      onClick={() => adjustAmount(1)}
                      className="btn btn-circle btn-sm"
                      type="button"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Unit dropdown */}
                  <select
                    value={currentIngredient.unit}
                    onChange={(e) => setCurrentIngredient({ ...currentIngredient, unit: e.target.value })}
                    className="select select-bordered flex-1"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>

                  {/* Add ingredient button */}
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
              Instructions *
              {instructions.length > 0 && (
                <span className="badge badge-ghost badge-sm ml-2">
                  {instructions.length} steps
                </span>
              )}
            </h3>

            {/* List of added instructions */}
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
                  value={currentInstruction}
                  onChange={(e) => setCurrentInstruction(e.target.value)}
                  className="textarea textarea-bordered flex-1"
                  placeholder="Enter instruction step..."
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
              onClick={() => navigate('/recipes')}
              className="btn btn-ghost"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Recipe
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}