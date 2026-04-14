import { Play } from 'lucide-react';
import { FavoriteTask, Task } from '../types';

interface FavoritesListProps {
  favorites: FavoriteTask[];
  onStart: (task: Omit<Task, 'id' | 'date' | 'startTime'>) => void;
  currentProject?: string;
}

export function FavoritesList({ favorites, onStart, currentProject }: FavoritesListProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Tareas Frecuentes</h3>
      <div className="flex flex-wrap gap-2">
        {favorites.map((fav) => {
          const projectToUse = fav.project || currentProject || '';
          return (
            <button
              key={fav.id}
              onClick={() => onStart({
                project: projectToUse,
                type: fav.type,
                description: fav.description,
                billable: fav.billable,
              })}
              className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 rounded-full px-4 py-1.5 text-sm transition-colors text-left"
            >
              <Play className="w-3.5 h-3.5 text-gray-400" />
              <span className="font-medium text-gray-700">{fav.description}</span>
              <span className="text-gray-400 text-xs hidden sm:inline">({projectToUse})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
