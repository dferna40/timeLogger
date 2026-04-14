import { useState, useEffect, FormEvent } from 'react';
import { X, Check, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { Task, AppState } from '../types';
import { format } from 'date-fns';

interface TaskEditModalProps {
  task: Task | null;
  state: AppState;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Task>) => void;
  addProject: (project: string) => void;
  editProject: (oldName: string, newName: string) => void;
  deleteProject: (project: string) => void;
  validateTaskDuration?: (dateStr: string, durationMs: number, excludeTaskId?: string) => boolean;
}

export function TaskEditModal({ task, state, onClose, onSave, addProject, editProject, deleteProject, validateTaskDuration }: TaskEditModalProps) {
  const [project, setProject] = useState('');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [dateStr, setDateStr] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setProject(task.project);
      setDateStr(task.date);
      setType(task.type);
      setDescription(task.description);
      setBillable(task.billable);
      setNotes(task.notes || '');
      setStartTimeStr(format(task.startTime, 'HH:mm'));
      setEndTimeStr(task.endTime ? format(task.endTime, 'HH:mm') : '');
      setError(null);
    }
  }, [task]);

  if (!task) return null;

  const isClosedTask = task.endTime !== undefined;

  const handleAddProject = () => {
    const trimmed = newProjectName.trim();
    if (trimmed) {
      addProject(trimmed);
      setProject(trimmed);
    }
    setIsAddingProject(false);
    setNewProjectName('');
  };

  const handleEditProject = () => {
    const trimmed = newProjectName.trim();
    if (trimmed && trimmed !== project) {
      editProject(project, trimmed);
      setProject(trimmed);
    }
    setIsEditingProject(false);
    setNewProjectName('');
  };

  const handleDeleteProject = () => {
    if (window.confirm(`¿Seguro que quieres borrar el proyecto "${project}"?`)) {
      deleteProject(project);
      setProject(state.projects.find(p => p !== project) || '');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isClosedTask && !endTimeStr) {
      setError('La hora de fin es obligatoria para tareas cerradas.');
      return;
    }

    // Parse times
    const [startH, startM] = startTimeStr.split(':').map(Number);
    const startObj = new Date(`${dateStr}T00:00:00`);
    startObj.setHours(startH, startM, 0, 0);
    const newStartTime = startObj.getTime();

    let newEndTime: number | undefined = undefined;

    if (endTimeStr) {
      const [endH, endM] = endTimeStr.split(':').map(Number);
      const endObj = new Date(`${dateStr}T00:00:00`);
      endObj.setHours(endH, endM, 0, 0);
      newEndTime = endObj.getTime();

      if (newEndTime < newStartTime) {
        setError('La hora de fin no puede ser anterior a la hora de inicio.');
        return;
      }
    }

    if (newEndTime && validateTaskDuration) {
      const durationMs = newEndTime - newStartTime;
      if (!validateTaskDuration(dateStr, durationMs, task.id)) {
        return; // Validation failed
      }
    }

    const updates: Partial<Task> = {
      project,
      date: dateStr,
      type,
      description,
      billable,
      notes,
      startTime: newStartTime,
      endTime: newEndTime,
    };

    onSave(task.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Editar Tarea</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form id="task-edit-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  value={startTimeStr}
                  onChange={(e) => setStartTimeStr(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Hora Fin {isClosedTask && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="time"
                  value={endTimeStr}
                  onChange={(e) => setEndTimeStr(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={isClosedTask}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-500">Proyecto</label>
                  {!isAddingProject && !isEditingProject && project && (
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => {
                        setIsEditingProject(true);
                        setNewProjectName(project);
                      }} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar proyecto">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={handleDeleteProject} className="text-gray-400 hover:text-red-600 transition-colors" title="Borrar proyecto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                {isAddingProject ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="Nuevo proyecto..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddProject();
                        } else if (e.key === 'Escape') {
                          setIsAddingProject(false);
                        }
                      }}
                    />
                    <button type="button" onClick={handleAddProject} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setIsAddingProject(false)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : isEditingProject ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEditProject();
                        } else if (e.key === 'Escape') {
                          setIsEditingProject(false);
                        }
                      }}
                    />
                    <button type="button" onClick={handleEditProject} className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => setIsEditingProject(false)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select
                    value={project}
                    onChange={(e) => {
                      if (e.target.value === '___NEW___') {
                        setIsAddingProject(true);
                        setNewProjectName('');
                      } else {
                        setProject(e.target.value);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {state.projects.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="___NEW___" className="font-medium text-blue-600">+ Añadir nuevo...</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {state.taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Observaciones (opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              Imputable
            </label>
          </form>
        </div>

        <div className="p-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="task-edit-form"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
