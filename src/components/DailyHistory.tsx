import { Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { Task } from '../types';
import { formatTime, formatDurationMs, cn } from '../lib/utils';

interface DailyHistoryProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  activeTaskId?: string | null;
}

export function DailyHistory({ tasks, onEdit, onDelete, activeTaskId }: DailyHistoryProps) {
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  // Sort tasks by start time descending
  const sortedTasks = [...tasks].sort((a, b) => b.startTime - a.startTime);

  if (sortedTasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No hay tareas registradas hoy.
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-medium">Horario</th>
                <th className="px-4 py-3 font-medium">Duración</th>
                <th className="px-4 py-3 font-medium">Proyecto / Tipo</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTasks.map((task) => {
                const isActive = task.id === activeTaskId;
                return (
                  <tr key={task.id} className={cn("hover:bg-gray-50 transition-colors", isActive && "bg-blue-50/50")}>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-600">
                      {formatTime(task.startTime)} - {task.endTime ? formatTime(task.endTime) : (isActive ? '...' : '--:--')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono font-medium">
                      {isActive ? (
                        <span className="text-blue-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                          En curso
                        </span>
                      ) : (
                        task.duration !== undefined ? formatDurationMs(task.duration) : '--'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{task.project}</span>
                        <span className="text-xs text-gray-500">{task.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900">{task.description}</span>
                        {!task.billable && (
                          <span className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">No imputable</span>
                        )}
                        {!isActive && !task.endTime && (
                           <AlertCircle className="w-4 h-4 text-red-500" title="Falta hora de fin" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(task)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTaskToDelete(task.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Borrar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {taskToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Borrar tarea?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. La tarea se eliminará permanentemente de tu historial.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDelete(taskToDelete);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Sí, borrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
