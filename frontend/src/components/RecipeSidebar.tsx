import { useState, useEffect } from 'react';
import { apiGet } from '../api'; 
import RecipeCard from './RecipeCard';

interface RecipeSidebarProps {
    userId: string | undefined;
}

export default function RecipeSidebar({ userId }: RecipeSidebarProps) {
    const [recipes, setRecipes] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    //Fetches the recipe list based on the logged-in user's ID
    useEffect(() => {
        if (userId) {
            apiGet<any[]>(`/recipes/${userId}`)
                .then((data) => setRecipes(Array.isArray(data) ? data.filter(Boolean) : []))
                .catch((err) => console.error("Error fetching recipes:", err));
        } else {
            setRecipes([])
        }
    }, [userId]);

    const filteredRecipes = recipes.filter((recipe) =>
        String(recipe?.title ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

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

            <div className="px-1 mb-4">
                <input
                    type="text"
                    placeholder="Search by title..."
                    className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-slate-400 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>


            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredRecipes.length > 0 ? (
                    // Renders the list of recipes as draggable RecipeCard components
                    filteredRecipes.map((recipe) => (
                        <RecipeCard key={recipe.id} recipe={recipe} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center mt-20">
                        <p className="text-sm font-medium text-slate-400">
                            {searchTerm ? "No matches found" : "No recipes found"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
