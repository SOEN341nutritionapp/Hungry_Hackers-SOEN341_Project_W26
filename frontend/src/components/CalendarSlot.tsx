import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'
import AddMealModal from './AddMealModal' 
import { useAuth } from '../AuthContext'


/* 
    This component corresponds to ONE slot in the calendar grid
    This slot can be empty (shows '+' button) or filled (shows recipe card with X button)
*/

interface CalendarSlotProps {
    date: Date              // Which day this slot is for
    mealType: string        // breakfast/lunch/dinner/snack
    existingMeal?: any      // The meal plan if one exists, undefined if empty
    onMealAdded: () => void // Callback when meal is added
    onMealDeleted: () => void // Callback when meal is deleted
    isDuplicateCheck: (recipeId: string) => boolean; //Check if recipe is already planned for the week
}

export default function CalendarSlot({ 
    date, 
    mealType, 
    existingMeal, 
    onMealAdded, 
    onMealDeleted,
    isDuplicateCheck
}: CalendarSlotProps) 

    {
    const navigate = useNavigate()

    const { user } = useAuth()
    const userId = user?.id
    const API_URL = import.meta.env.VITE_API_URL
    
    // State for AddMealModal
    const [isModalOpen, setIsModalOpen] = useState(false)  

    // State for drag-and-drop visual feedback
    const [isDragOver, setIsDragOver] = useState(false)

    // HANDLER: Click on recipe card ->  Navigate to RecipeDetail
    const handleRecipeClick = () => {
        if (existingMeal?.recipe?.id) {
        navigate(`/recipes/${existingMeal.recipe.id}`)
        }
    }

    // HANDLER: Click + button -> Open AddMealModal
    const handleAddClick = () => {
        setIsModalOpen(true)  
    }

    // HANDLER: Click X button -> Delete meal
    const handleDeleteClick = async (e: React.MouseEvent) => {
        e.stopPropagation()  // Don't trigger recipe click when clicking X
        
        if(!confirm('Remove this meal from your calendar?')){
            return
        }
        try {
            const response = await fetch(`${API_URL}/meal-plans/${userId}/${existingMeal.id}`, {
                method: 'DELETE'
            })

            if(!response.ok) {
                throw new Error('Failed to delete meal')
            }
            onMealDeleted()

        } catch (err) {
            alert('Failed to delete meal')
            console.error('Error deleting meal')
        }
    }

    // =============== DRAG & DROP HANDLERS (Dylan) ====================
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()  // Allow drop
        if (!existingMeal) {  // Only if slot is empty
            setIsDragOver(true)
        }
    }
    const handleDragLeave = () => {
        setIsDragOver(false)
    }



    const handleDrop = async (e: React.DragEvent) => {
       e.preventDefault();
        setIsDragOver(false);

        //Exit early if the slot is already occupied
        if(existingMeal) return;

        //Extract the ID 
        const recipeId = e.dataTransfer.getData('recipeId');

        //Block URLs, If the browser grabbed a link, stop here so the backend doesn't crash
        if (!recipeId || recipeId.startsWith('http')) {
            console.warn("Invalid drop ignored:", recipeId);
            return;
        }

        //Ensure recipe isnt already in the week
        if (isDuplicateCheck(recipeId)) {
            alert("This recipe is already planned for this week!");
            return; 
        }
        
        try {
            const dateString = date.toISOString().split('T')[0]
            //Execute POST: Link the recipe to the specific date and meal category
            const response = await fetch(`${API_URL}/meal-plans/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipeId, // Passing the recipeId string
                    date: dateString,
                    mealType,
                })
            })
    
            if (!response.ok) {
                throw new Error('Failed to add meal')
            }
    
            //Refresh the global calendar state to show the new meal immediately
            onMealAdded()
    
        } catch (err) {
            alert('Failed to add meal from drag-drop')
            console.error('Error in handleDrop:', err)
        }
    }

    // RENDER: Filled Slot (has a meal)
    if (existingMeal) {
        return (
            <div 
                onClick={handleRecipeClick}
                className="relative border-2 border-base-300 rounded-lg p-3 min-h-[100px] bg-base-100 hover:bg-base-200 cursor-pointer transition-colors"
            >   
                {/* Recipe Image */}
                {existingMeal.recipe?.imageUrl && (
                    <img 
                        src={existingMeal.recipe.imageUrl} 
                        alt={existingMeal.recipe.title}
                        className="w-50 h-10 object-cover rounded-md mb-1"
                    />
                )}
                {/* Recipe info */}
                <div className="text-sm text-center font-semibold line-clamp-2 mb-1">
                    {existingMeal.recipe?.title || 'Untitled Recipe'}
                </div>
            
                <div className="text-xs text-center opacity-70">
                    {existingMeal.recipe?.difficulty} • {existingMeal.recipe?.prepTime + existingMeal.recipe?.cookTime} min
                </div>

                {/* Delete button (X) */}
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

    // RENDER: Empty Slot (no meal)
    return (
        <>
            <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                relative border-2 rounded-lg p-3 min-h-[100px] transition-all
                ${isDragOver 
                ? 'border-primary bg-primary/10 border-dashed'  // Dragging over
                : 'border-base-300 bg-base-100 hover:bg-base-200'  // Normal
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
            {/* Modal is now outside the slot div */}
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