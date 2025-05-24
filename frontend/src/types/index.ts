export interface Due {
  type: 'specificDays' | 'interval';
  specificDays?: string[];
  intervalType?: 'day' | 'week' | 'month';
  intervalValue?: number;
}

export interface HabitTracker {
  id: number;
  trackerName: string;
  goal: number;
  timePeriod: string;
  startDate: string;
  due: Due;
  badHabit?: boolean;
  goalStreak?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TargetTracker {
  id: number;
  trackerName: string;
  startValue: number;
  goalValue: number;
  currentValue?: number;
  startDate: string;
  goalDate: string;
  addToTotal: boolean;
  due: Due;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: number;
  trackerID: number;
  type: 'HABIT' | 'TARGET';
  done?: boolean;
  value?: number;
  note?: string;
  date: string;
  createdAt: string;
}

export interface DashboardResponse {
  date: string;
  habitTrackers: HabitTracker[];
  targetTrackers: TargetTracker[];
}

// Request types
export interface CreateHabitRequest {
  trackerName: string;
  goal: number;
  timePeriod: string;
  startDate: string;
  due: Due;
  badHabit?: boolean;
  goalStreak?: number;
}

export interface CreateTargetRequest {
  trackerName: string;
  startValue: number;
  goalValue: number;
  startDate: string;
  goalDate: string;
  addToTotal: boolean;
  due: Due;
}

export interface AddEntryRequest {
  done?: boolean;
  value?: number;
  date?: string;
  note?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

