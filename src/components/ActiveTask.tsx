import { useState, useEffect } from 'react';
import { Play, Square, Clock } from 'lucide-react';
import { Task } from '../types';
import { formatDurationMs } from '../lib/utils';
import { cn } from '../lib/utils';

interface ActiveTaskProps {
  task?: Task;
  onStop: () => void;
}

export function ActiveTask({ task, onStop }: ActiveTaskProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!task) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - task.startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [task]);

  if (!task) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center min-h-[160px]">
        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-900 font-medium">No hay tarea activa</h3>
        <p className="text-gray-500 text-sm mt-1">Inicia una tarea para comenzar a registrar tu tiempo.</p>
      </div>
    );
  }

  const isLongRunning = elapsed > 4 * 60 * 60 * 1000; // > 4 hours

  return (
    <div className={cn(
      "rounded-2xl p-6 shadow-sm border transition-colors",
      isLongRunning ? "bg-orange-50 border-orange-200" : "bg-blue-50 border-blue-100"
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2.5 w-2.5 relative">
              <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isLongRunning ? "bg-orange-400" : "bg-blue-400")}></span>
              <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", isLongRunning ? "bg-orange-500" : "bg-blue-500")}></span>
            </span>
            <span className={cn("text-xs font-semibold uppercase tracking-wider", isLongRunning ? "text-orange-700" : "text-blue-700")}>
              {isLongRunning ? '¡Atención! Tarea muy larga' : 'Tarea Activa'}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mt-1">{task.description || 'Sin descripción'}</h3>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
            <span className="bg-white/60 px-2 py-0.5 rounded-md font-medium">{task.project}</span>
            <span>•</span>
            <span>{task.type}</span>
            {task.billable && (
              <>
                <span>•</span>
                <span className="text-green-700 font-medium">Imputable</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn("text-3xl font-light font-mono tabular-nums", isLongRunning ? "text-orange-800" : "text-blue-800")}>
            {formatDurationMs(elapsed)}
          </div>
          <button
            onClick={onStop}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            title="Detener tarea"
          >
            <Square className="w-6 h-6 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
}
