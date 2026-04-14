export interface Task {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: number; // timestamp
  endTime?: number; // timestamp, undefined if active
  duration?: number; // in milliseconds, calculated on stop
  project: string;
  type: string;
  description: string;
  billable: boolean;
  notes?: string;
}

export interface FavoriteTask {
  id: string;
  project: string;
  type: string;
  description: string;
  billable: boolean;
}

export type ControlMode = 'inform' | 'warn' | 'block';

export interface WorkHoursConfig {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  mode: ControlMode;
}

export interface AppState {
  tasks: Task[];
  projects: string[];
  taskTypes: string[];
  favorites: FavoriteTask[];
  activeTaskId?: string | null;
  workHoursConfig?: WorkHoursConfig;
}
