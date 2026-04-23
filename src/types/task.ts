export type TaskStatus = 'pending' | 'done' | 'overdue' | 'upcoming' | 'skipped';
export type TaskType =
  | 'land_prep'
  | 'planting'
  | 'fertilizer'
  | 'chemical'
  | 'water'
  | 'labor'
  | 'machinery'
  | 'harvest'
  | 'other';

export interface Task {
  id: string;
  farmId: string;
  seasonId: string;
  name: string;
  description?: string;
  dayNumber: number;
  scheduledDate: Date;
  type: TaskType;
  estimatedCost: number;
  actualCost?: number;
  status: TaskStatus;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  voiceNoteUrl?: string;
  photoUrl?: string;
  isCustom: boolean;
  assignedTo?: string;
  reminderDaysBefore: number;
}

export interface TaskGroup {
  phase: string;
  stage: string;
  tasks: Task[];
  totalTasks: number;
  doneTasks: number;
}