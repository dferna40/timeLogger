import { useState } from 'react';
import { Clock, ListTodo, BarChart2, Settings, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Save, Database, FilePlus, FolderOpen, Download, Check } from 'lucide-react';
import { useTimeLogger } from './hooks/useTimeLogger';
import { ActiveTask } from './components/ActiveTask';
import { QuickStart } from './components/QuickStart';
import { FavoritesList } from './components/FavoritesList';
import { DailyHistory } from './components/DailyHistory';
import { Summary } from './components/Summary';
import { Export } from './components/Export';
import { TaskEditModal } from './components/TaskEditModal';
import { SettingsModal } from './components/SettingsModal';
import { Task } from './types';
import { formatDate, getTargetHoursForDate, formatDurationMs } from './lib/utils';
import { format, addDays, subDays, parseISO } from 'date-fns';

type Tab = 'hoy' | 'resumen';

export default function App() {
  const { 
    state, activeTask, startTask, stopActiveTask, updateTask, deleteTask, addManualTask, addProject, editProject, deleteProject, updateWorkHoursConfig,
    isReady, needsPermission, fileName, isSupported, hasLocalData, connectFile, createFile, migrateLocalData, disconnectFile, requestPermission, importJsonFallback, exportJsonFallback
  } = useTimeLogger();
  
  const [activeTab, setActiveTab] = useState<Tab>('hoy');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const selectedTasks = state.tasks.filter(t => t.date === selectedDate);
  const showActiveTask = activeTask && activeTask.date === selectedDate;

  const handlePrevDay = () => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  const handleNextDay = () => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));

  const validateTaskDuration = (dateStr: string, newDurationMs: number, excludeTaskId?: string): boolean => {
    if (!state.workHoursConfig) return true;
    
    const targetHours = getTargetHoursForDate(dateStr, state.workHoursConfig);
    const targetMs = targetHours * 60 * 60 * 1000;
    
    const existingTasks = state.tasks.filter(t => t.date === dateStr && t.id !== excludeTaskId);
    const existingDurationMs = existingTasks.reduce((acc, t) => {
      if (t.duration !== undefined) return acc + t.duration;
      if (t.id === state.activeTaskId && t.startTime) {
        return acc + (Date.now() - t.startTime);
      }
      return acc;
    }, 0);
    
    const totalMs = existingDurationMs + newDurationMs;
    
    if (totalMs > targetMs || (newDurationMs === 0 && totalMs >= targetMs)) {
      const excessMs = Math.max(0, totalMs - targetMs);
      const excessStr = formatDurationMs(excessMs > 0 ? excessMs : 0);
      
      if (state.workHoursConfig.mode === 'block') {
        alert(`No se puede guardar. Se supera la jornada diaria de ${targetHours}h${excessMs > 0 ? ` por ${excessStr}` : ''}.`);
        return false;
      } else if (state.workHoursConfig.mode === 'warn') {
        return window.confirm(`Esta acción superará la jornada diaria de ${targetHours}h${excessMs > 0 ? ` por ${excessStr}` : ''}. ¿Deseas continuar?`);
      }
    }
    return true;
  };

  const handleStartTask = (taskData: Omit<Task, 'id' | 'date' | 'startTime'>) => {
    if (!validateTaskDuration(selectedDate, 0)) {
      return;
    }
    startTask(taskData, selectedDate);
  };

  if (needsPermission) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans text-gray-900">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Reconectar Archivo</h1>
          <p className="text-gray-500 mb-8 text-sm">
            Time Logger necesita permiso para volver a acceder a tu archivo <strong>{fileName}</strong>.
          </p>

          <div className="space-y-3">
            <button onClick={requestPermission} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-sm">
              <Check className="w-5 h-5" />
              Conceder permiso
            </button>
            <button onClick={disconnectFile} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
              Elegir otro archivo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 font-sans text-gray-900">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Save className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Almacenamiento Local</h1>
          <p className="text-gray-500 mb-8 text-sm">
            Time Logger guarda tus datos en un archivo JSON en tu ordenador para mayor privacidad y control.
          </p>

          <div className="space-y-3">
            {hasLocalData && (
              <button onClick={migrateLocalData} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-sm">
                <Database className="w-5 h-5" />
                Migrar datos guardados
              </button>
            )}
            <button onClick={() => createFile()} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-sm">
              <FilePlus className="w-5 h-5" />
              Crear nuevo archivo
            </button>
            <button onClick={connectFile} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
              <FolderOpen className="w-5 h-5" />
              Abrir archivo existente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-gray-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight hidden sm:block">Time Logger</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Storage Indicator */}
              {isSupported ? (
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <Save className="w-4 h-4" />
                  <span className="truncate max-w-[120px]">{fileName || 'Sin archivo'}</span>
                  <button onClick={disconnectFile} className="ml-1 text-blue-600 hover:text-blue-700" title="Cambiar archivo">
                    Cambiar
                  </button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <Database className="w-4 h-4" />
                  <span>Local Storage</span>
                  <label className="ml-1 text-blue-600 hover:text-blue-700 cursor-pointer" title="Importar JSON">
                    Importar
                    <input type="file" accept=".json" className="hidden" onChange={importJsonFallback} />
                  </label>
                  <button onClick={exportJsonFallback} className="ml-1 text-blue-600 hover:text-blue-700" title="Exportar JSON">
                    Exportar
                  </button>
                </div>
              )}

              <div className="w-px h-6 bg-gray-200 hidden md:block"></div>

              {/* Date Controls */}
              <button 
                onClick={handlePrevDay}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Día anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-sm font-medium text-gray-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                />
              </div>

              <button 
                onClick={handleNextDay}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                title="Día siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {selectedDate !== todayStr && (
                <button 
                  onClick={() => setSelectedDate(todayStr)}
                  className="ml-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md transition-colors"
                >
                  Hoy
                </button>
              )}

              <div className="w-px h-6 bg-gray-200 hidden md:block ml-1"></div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Configuración de jornada"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab('hoy')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'hoy' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                {selectedDate === todayStr ? 'Hoy' : 'Tareas'}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('resumen')}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'resumen' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4" />
                Resumen
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'hoy' && (
          <div className="space-y-8">
            {showActiveTask && (
              <section>
                <ActiveTask task={activeTask} onStop={stopActiveTask} />
              </section>
            )}
            
            <section>
              <QuickStart 
                state={state} 
                onStart={(task) => handleStartTask(task)} 
                hasActiveTask={!!activeTask} 
                addProject={addProject}
                editProject={editProject}
                deleteProject={deleteProject}
              />
              <FavoritesList favorites={state.favorites} onStart={(task) => handleStartTask(task)} currentProject={state.projects[0]} />
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Historial del {formatDate(selectedDate)}
                </h2>
                <button
                  onClick={() => setEditingTask({
                    id: crypto.randomUUID(),
                    date: selectedDate,
                    startTime: Date.now() - 3600000,
                    endTime: Date.now(),
                    duration: 3600000,
                    project: state.projects[0] || '',
                    type: state.taskTypes[0] || '',
                    description: '',
                    billable: true,
                  })}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  + Añadir manual
                </button>
              </div>
              <DailyHistory 
                tasks={selectedTasks} 
                onEdit={setEditingTask} 
                onDelete={deleteTask} 
                activeTaskId={state.activeTaskId}
              />
            </section>
          </div>
        )}

        {activeTab === 'resumen' && (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumen del {formatDate(selectedDate)}
              </h2>
              <Summary tasks={selectedTasks} dateStr={selectedDate} config={state.workHoursConfig} activeTaskId={state.activeTaskId} />
            </section>
            
            <section>
              <Export tasks={selectedTasks} selectedDate={selectedDate} />
            </section>
          </div>
        )}
      </main>

      {/* Modals */}
      {isSettingsOpen && state.workHoursConfig && (
        <SettingsModal
          config={state.workHoursConfig}
          onSave={updateWorkHoursConfig}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {editingTask && (
        <TaskEditModal
          task={editingTask}
          state={state}
          onClose={() => setEditingTask(null)}
          addProject={addProject}
          editProject={editProject}
          deleteProject={deleteProject}
          validateTaskDuration={validateTaskDuration}
          onSave={(id, updates) => {
            const exists = state.tasks.some(t => t.id === id);
            if (exists) {
              updateTask(id, updates);
            } else {
              // Add new task
              const newTask: Task = {
                ...editingTask,
                ...updates,
              } as Task;
              // Recalculate duration
              if (newTask.startTime && newTask.endTime) {
                newTask.duration = newTask.endTime - newTask.startTime;
              }
              addManualTask(newTask);
            }
          }}
        />
      )}
    </div>
  );
}
