import { useState, useEffect } from 'react';
import { apiGet } from '../api'; 
import RecipeCard from './RecipeCard';

interface RecipeSidebarProps {
    userId: string | undefined;
}

export default function RecipeSidebar({ userId }: RecipeSidebarProps) {
    const [recipes, setRecipes] = useState<any[]>([]);

    useEffect(() => {
        if (userId) {
            apiGet<any[]>(`/recipes/${userId}`)
                .then((data) => setRecipes(data))
                .catch((err) => console.error("Error fetching recipes:", err));
        }
    }, [userId]);

    return (
        <div className="w-80 bg-slate-50/50 backdrop-blur-sm p-5 rounded-3xl flex flex-col h-[750px] shadow-inner border border-slate-200 sticky top-6">
            
            <div className="px-1 mb-5">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                    My Recipes
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                    {recipes.length} recipes available
                </p>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {recipes.length > 0 ? (
                    recipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center mt-20">
                        <p className="text-sm font-medium text-slate-400">No recipes found</p>
                    </div>
                )}
            </div>
        </div>
    );
}