import { useState, FormEvent } from 'react';
import { Play, Check, X, Edit2, Trash2 } from 'lucide-react';
import { Task, AppState } from '../types';

interface QuickStartProps {
  state: AppState;
  onStart: (task: Omit<Task, 'id' | 'date' | 'startTime'>) => void;
  hasActiveTask: boolean;
  addProject: (project: string) => void;
  editProject: (oldName: string, newName: string) => void;
  deleteProject: (project: string) => void;
}

export function QuickStart({ state, onStart, hasActiveTask, addProject, editProject, deleteProject }: QuickStartProps) {
  const [project, setProject] = useState(state.projects[0] || '');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [type, setType] = useState(state.taskTypes[0] || '');
  const [description, setDescription] = useState('');
  const [billable, setBillable] = useState(true);

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
    if (!project || !type || !description.trim()) return;

    onStart({
      project,
      type,
      description: description.trim(),
      billable,
    });
    
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Nueva Tarea</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-500">Proyecto</label>
            {!isAddingProject && !isEditingProject && project && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => {
                  setIsEditingProject(true);
                  setNewProjectName(project);
                }} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar proyecto">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={handleDeleteProject} className="text-gray-400 hover:text-red-600 transition-colors" title="Borrar proyecto">
                  <Trash2 className="w-3.5 h-3.5" />
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
        
        <div className="md:col-span-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {state.taskTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        
        <div className="md:col-span-4">
          <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿Qué estás haciendo?"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div className="md:col-span-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer h-6">
            <input
              type="checkbox"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            Imputable
          </label>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {hasActiveTask ? 'Cambiar' : 'Iniciar'}
          </button>
        </div>
      </div>
    </form>
  );
}
