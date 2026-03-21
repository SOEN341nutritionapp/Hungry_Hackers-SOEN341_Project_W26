import React from 'react';

interface RecipeCardProps {
    recipe: {
        id: string | number;
        title: string;
        imageUrl?: string;
    };
}

export default function RecipeCard({ recipe }: RecipeCardProps) {
    const handleDragStart = (e: React.DragEvent) => {
        // Attach the ID to the drag event for the calendar to read
        e.dataTransfer.setData('recipeId', recipe.id.toString());
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div 
            draggable 
            onDragStart={handleDragStart}
            className="group flex items-center gap-3 p-2 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all duration-300 cursor-grab active:cursor-grabbing overflow-hidden mb-2"
        >
            {/* Rectangular image container with a slight zoom effect on hover */}
            <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <img 
                    src={recipe.imageUrl || 'https://via.placeholder.com/150'} 
                    alt={recipe.title}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" 
                />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-700 truncate leading-tight group-hover:text-emerald-600 transition-colors">
                    {recipe.title}
                </h3>
                
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 font-medium italic">
                        Drag to add
                    </span>
                </div>
            </div>

            {/* Drag indicator appears when the user hovers over the card */}
            <div className="pr-1 opacity-0 group-hover:opacity-30 transition-opacity">
                <svg width="12" height="18" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 2H4.01M4 9H4.01M4 16H4.01M8 2H8.01M8 9H8.01M8 16H8.01" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
            </div>
        </div>
    );
}