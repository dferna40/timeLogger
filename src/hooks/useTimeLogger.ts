import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Task, FavoriteTask, AppState, WorkHoursConfig } from '../types';

const STORAGE_KEY = 'time_logger_state';
const DB_NAME = 'TimeLoggerDB';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'fileHandle';

const defaultWorkHoursConfig: WorkHoursConfig = {
  monday: 8.5,
  tuesday: 8.5,
  wednesday: 8.5,
  thursday: 8.5,
  friday: 6,
  saturday: 0,
  sunday: 0,
  mode: 'inform',
};

const defaultState: AppState = {
  tasks: [],
  projects: ['Proyecto A', 'Proyecto B', 'Interno'],
  taskTypes: [
    'desarrollo',
    'análisis',
    'reunión',
    'soporte',
    'documentación',
    'formación',
    'gestión',
    'otros',
  ],
  favorites: [
    { id: '1', project: 'Interno', type: 'reunión', description: 'Reunión de seguimiento', billable: false },
    { id: '2', project: '', type: 'desarrollo', description: 'Desarrollo funcionalidad', billable: true },
    { id: '3', project: '', type: 'soporte', description: 'Análisis incidencia', billable: true },
  ],
  activeTaskId: null,
  workHoursConfig: defaultWorkHoursConfig,
};

const migrateState = (parsed: any): AppState => {
  if (parsed && parsed.tasks) {
    parsed.tasks = parsed.tasks.map((t: any) => {
      if (!t.date) {
        return { ...t, date: new Date(t.startTime || Date.now()).toISOString().split('T')[0] };
      }
      return t;
    });
  }
  
  let activeTaskId = parsed.activeTaskId;
  if (activeTaskId === undefined) {
    const activeTasks = parsed.tasks?.filter((t: any) => !t.endTime) || [];
    if (activeTasks.length > 0) {
      activeTasks.sort((a: any, b: any) => b.startTime - a.startTime);
      activeTaskId = activeTasks[0].id;
    } else {
      activeTaskId = null;
    }
  }

  const workHoursConfig = parsed.workHoursConfig || defaultWorkHoursConfig;

  return { ...defaultState, ...parsed, activeTaskId, workHoursConfig };
};

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveHandle = async (handle: any) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(handle, HANDLE_KEY);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to save handle to IndexedDB', e);
  }
};

const getHandle = async (): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(HANDLE_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to get handle from IndexedDB', e);
    return null;
  }
};

const clearHandle = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(HANDLE_KEY);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.error('Failed to clear handle from IndexedDB', e);
  }
};

export function useTimeLogger() {
  const [state, setState] = useState<AppState>(defaultState);
  const [fileHandle, setFileHandle] = useState<any>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const isSupported = 'showOpenFilePicker' in window;
  const isInitialMount = useRef(true);

  // Check for existing local data on mount
  useEffect(() => {
    const checkInitialState = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHasLocalData(true);
        if (!isSupported) {
          try {
            setState(migrateState(JSON.parse(saved)));
          } catch (e) {
            console.error('Failed to parse local state', e);
          }
        }
      }

      if (isSupported) {
        const handle = await getHandle();
        if (handle) {
          setFileHandle(handle);
          setFileName(handle.name);
          
          // Check permission without requesting (since request requires user gesture)
          const options = { mode: 'readwrite' };
          if ((await handle.queryPermission(options)) === 'granted') {
            try {
              const file = await handle.getFile();
              const contents = await file.text();
              const parsed = JSON.parse(contents);
              setState(migrateState(parsed));
              setIsReady(true);
            } catch (e) {
              console.error('Error reading file on mount', e);
              setNeedsPermission(true);
            }
          } else {
            setNeedsPermission(true);
          }
        }
      } else {
        setIsReady(true);
      }
    };
    checkInitialState();
  }, [isSupported]);

  // Auto-save effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (isReady && fileHandle) {
      const save = async () => {
        try {
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(state, null, 2));
          await writable.close();
        } catch (e) {
          console.error('Error saving to file', e);
        }
      };
      save();
    }
  }, [state, isReady, fileHandle]);

  const requestPermission = async () => {
    if (!fileHandle) return;
    try {
      const options = { mode: 'readwrite' };
      if ((await fileHandle.requestPermission(options)) === 'granted') {
        const file = await fileHandle.getFile();
        const contents = await file.text();
        const parsed = JSON.parse(contents);
        setState(migrateState(parsed));
        setNeedsPermission(false);
        setIsReady(true);
      }
    } catch (e) {
      console.error('Error requesting permission', e);
    }
  };

  const connectFile = async () => {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      });
      const file = await handle.getFile();
      const contents = await file.text();
      const parsed = JSON.parse(contents);
      setState(migrateState(parsed));
      setFileHandle(handle);
      setFileName(file.name);
      setIsReady(true);
      setNeedsPermission(false);
      await saveHandle(handle);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Error opening file', e);
        alert('Hubo un error al acceder al archivo.');
      }
    }
  };

  const createFile = async (dataToSave: AppState = defaultState) => {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: 'time-logger-data.json',
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(dataToSave, null, 2));
      await writable.close();
      
      setState(dataToSave);
      setFileHandle(handle);
      setFileName(handle.name);
      setIsReady(true);
      setNeedsPermission(false);
      await saveHandle(handle);
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        console.error('Error creating file', e);
        alert('Hubo un error al crear el archivo.');
      }
    }
  };

  const migrateLocalData = async () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = migrateState(JSON.parse(saved));
        await createFile(parsed);
        localStorage.removeItem(STORAGE_KEY);
        setHasLocalData(false);
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          console.error('Error migrating data', e);
          alert('Hubo un error al migrar los datos.');
        }
      }
    }
  };

  const disconnectFile = async () => {
    setFileHandle(null);
    setFileName(null);
    setIsReady(false);
    setNeedsPermission(false);
    await clearHandle();
  };

  const importJsonFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setState(migrateState(parsed));
      } catch (err) {
        alert('Error al leer el archivo JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const exportJsonFallback = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'time-logger-backup.json';
    link.click();
  };

  const activeTask = state.activeTaskId 
    ? state.tasks.find((t) => t.id === state.activeTaskId) 
    : undefined;

  const startTask = useCallback((taskData: Omit<Task, 'id' | 'date' | 'startTime'>, selectedDate?: string) => {
    setState((prev) => {
      const now = Date.now();
      const today = new Date(now).toISOString().split('T')[0];
      const taskDate = selectedDate || today;
      
      // Stop any active task
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === prev.activeTaskId && !t.endTime) {
          return { ...t, endTime: now, duration: now - t.startTime };
        }
        return t;
      });

      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        date: taskDate,
        startTime: now,
      };

      const newProjects = prev.projects.includes(taskData.project) 
        ? prev.projects 
        : [...prev.projects, taskData.project];

      return { 
        ...prev, 
        tasks: [...updatedTasks, newTask], 
        projects: newProjects,
        activeTaskId: newTask.id 
      };
    });
  }, []);

  const stopActiveTask = useCallback(() => {
    setState((prev) => {
      if (!prev.activeTaskId) return prev;
      
      const now = Date.now();
      const updatedTasks = prev.tasks.map((t) => {
        if (t.id === prev.activeTaskId && !t.endTime) {
          return { ...t, endTime: now, duration: now - t.startTime };
        }
        return t;
      });
      return { ...prev, tasks: updatedTasks, activeTaskId: null };
    });
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setState((prev) => {
      const newProjects = (updates.project && !prev.projects.includes(updates.project))
        ? [...prev.projects, updates.project]
        : prev.projects;

      let newActiveTaskId = prev.activeTaskId;

      const newTasks = prev.tasks.map((t) => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          if (updated.startTime && updated.endTime) {
            updated.duration = updated.endTime - updated.startTime;
            if (id === prev.activeTaskId) {
              newActiveTaskId = null;
            }
          } else if (!updated.endTime) {
            updated.duration = undefined;
          }
          return updated;
        }
        return t;
      });

      return {
        ...prev,
        projects: newProjects,
        tasks: newTasks,
        activeTaskId: newActiveTaskId,
      };
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      activeTaskId: prev.activeTaskId === id ? null : prev.activeTaskId,
    }));
  }, []);

  const addManualTask = useCallback((task: Task) => {
    setState((prev) => {
      const newProjects = !prev.projects.includes(task.project)
        ? [...prev.projects, task.project]
        : prev.projects;

      return {
        ...prev,
        projects: newProjects,
        tasks: [...prev.tasks, task],
      };
    });
  }, []);

  const addProject = useCallback((project: string) => {
    setState((prev) => {
      if (prev.projects.includes(project)) return prev;
      return { ...prev, projects: [...prev.projects, project] };
    });
  }, []);

  const editProject = useCallback((oldName: string, newName: string) => {
    setState((prev) => {
      const trimmed = newName.trim();
      if (oldName === trimmed || !trimmed) return prev;
      
      const newProjects = prev.projects.map(p => p === oldName ? trimmed : p);
      const newTasks = prev.tasks.map(t => t.project === oldName ? { ...t, project: trimmed } : t);
      const newFavorites = prev.favorites.map(f => f.project === oldName ? { ...f, project: trimmed } : f);

      return { ...prev, projects: newProjects, tasks: newTasks, favorites: newFavorites };
    });
  }, []);

  const deleteProject = useCallback((project: string) => {
    setState((prev) => {
      const newProjects = prev.projects.filter(p => p !== project);
      return { ...prev, projects: newProjects };
    });
  }, []);

  const updateWorkHoursConfig = useCallback((config: WorkHoursConfig) => {
    setState((prev) => ({ ...prev, workHoursConfig: config }));
  }, []);

  return {
    state,
    activeTask,
    startTask,
    stopActiveTask,
    updateTask,
    deleteTask,
    addManualTask,
    addProject,
    editProject,
    deleteProject,
    updateWorkHoursConfig,
    isReady,
    needsPermission,
    fileName,
    isSupported,
    hasLocalData,
    connectFile,
    createFile,
    migrateLocalData,
    disconnectFile,
    requestPermission,
    importJsonFallback,
    exportJsonFallback,
  };
}
