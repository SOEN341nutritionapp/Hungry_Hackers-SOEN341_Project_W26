import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import AddMealModal from './AddMealModal'
import { useAuth } from '../AuthContext'
import { apiDelete, apiPost } from '../api'

interface CalendarSlotProps {
    date: Date
    mealType: string
    existingMeal?: any
    onMealAdded: () => void
    onMealDeleted: () => void
    isDuplicateCheck: (recipeId: string) => boolean
}

export default function CalendarSlot({
    date,
    mealType,
    existingMeal,
    onMealAdded,
    onMealDeleted,
    isDuplicateCheck,
}: CalendarSlotProps) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const userId = user?.id

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)

    const handleRecipeClick = () => {
        if (existingMeal?.recipe?.id) {
            navigate(`/recipes/${existingMeal.recipe.id}`)
        }
    }

    const handleAddClick = () => {
        setIsModalOpen(true)
    }

    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation()

        if (!existingMeal?.id || !userId) {
            return
        }

        if (!confirm('Remove this meal from your calendar?')) {
            return
        }

        try {
            await apiDelete(`/meal-plans/${userId}/${existingMeal.id}`)
            onMealDeleted()
        } catch (err) {
            alert('Failed to delete meal')
            console.error('Error deleting meal:', err)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!existingMeal) {
            setIsDragOver(true)
        }
    }

    const handleDragLeave = () => {
        setIsDragOver(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        if (existingMeal || !userId) {
            return
        }

        const recipeId = e.dataTransfer.getData('recipeId')
        if (!recipeId || recipeId.startsWith('http')) {
            console.warn('Invalid drop ignored:', recipeId)
            return
        }

        if (isDuplicateCheck(recipeId)) {
            alert('This recipe is already planned for this week!')
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
        } catch (err) {
            alert('Failed to add meal from drag-drop')
            console.error('Error in handleDrop:', err)
        }
    }

    if (existingMeal) {
        const recipeTitle = existingMeal.recipe?.title || 'Untitled Recipe'
        const recipeDifficulty = existingMeal.recipe?.difficulty || 'Unknown'
        const prepTime = Number(existingMeal.recipe?.prepTime ?? 0)
        const cookTime = Number(existingMeal.recipe?.cookTime ?? 0)
        const totalTime = Number.isFinite(prepTime + cookTime) ? prepTime + cookTime : 0

        return (
            <div
                onClick={handleRecipeClick}
                className="relative border-2 border-base-300 rounded-lg p-3 min-h-[100px] bg-base-100 hover:bg-base-200 cursor-pointer transition-colors"
            >
                {existingMeal.recipe?.imageUrl && (
                    <img
                        src={existingMeal.recipe.imageUrl}
                        alt={recipeTitle}
                        className="w-50 h-10 object-cover rounded-md mb-1"
                    />
                )}
                <div className="text-sm text-center font-semibold line-clamp-2 mb-1">
                    {recipeTitle}
                </div>
                <div className="text-xs text-center opacity-70">
                    {recipeDifficulty} | {totalTime} min
                </div>

                <button
                    onClick={handleDeleteClick}
                    className="absolute top-2 right-2 btn btn-circle btn-xs hover:btn-error"
                    title="Remove meal"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        )
    }

    return (
        <>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                relative border-2 rounded-lg p-3 min-h-[100px] transition-all
                ${isDragOver
                    ? 'border-primary bg-primary/10 border-dashed'
                    : 'border-base-300 bg-base-100 hover:bg-base-200'
                }
            `}
            >
                {isDragOver ? (
                    <div className="flex items-center justify-center h-full text-primary font-semibold text-sm">
                        Drop to add
                    </div>
                ) : (
                    <button
                        onClick={handleAddClick}
                        className="absolute bottom-2 right-2 btn btn-circle btn-outline btn-primary"
                        title="Add meal"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                )}
            </div>
            <AddMealModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                date={date}
                mealType={mealType}
                onMealAdded={onMealAdded}
            />
        </>
    )
}
