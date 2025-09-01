import type { 
  DashboardResponse, 
  HabitTracker, 
  TargetTracker, 
  Entry, 
  CreateHabitRequest, 
  CreateTargetRequest, 
  AddEntryRequest 
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

class ApiError extends Error {
  status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new ApiError(
        response.status,
        `API Error: ${response.status} ${response.statusText}`
      );
    }

    // Handle empty responses (like DELETE)
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, `Network Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Dashboard API
export const dashboardApi = {
  getDashboard: (date?: string): Promise<DashboardResponse> => {
    const params = date ? `?date=${date}` : '';
    return apiRequest<DashboardResponse>(`/dashboard${params}`);
  },
};

// Habit Tracker API
export const habitApi = {
  getAll: (): Promise<HabitTracker[]> =>
    apiRequest<HabitTracker[]>('/habit-trackers'),
  
  getById: (id: number): Promise<HabitTracker> =>
    apiRequest<HabitTracker>(`/habit-trackers/${id}`),
  
  create: (data: CreateHabitRequest): Promise<HabitTracker> =>
    apiRequest<HabitTracker>('/habit-trackers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<CreateHabitRequest>): Promise<HabitTracker> =>
    apiRequest<HabitTracker>(`/habit-trackers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> =>
    apiRequest<void>(`/habit-trackers/${id}`, {
      method: 'DELETE',
    }),
  
  addEntry: (id: number, entry: AddEntryRequest): Promise<Entry> =>
    apiRequest<Entry>(`/habit-trackers/${id}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
  
  getEntries: (id: number): Promise<Entry[]> =>
    apiRequest<Entry[]>(`/habit-trackers/${id}/entries`),
};

// Target Tracker API
export const targetApi = {
  getAll: (): Promise<TargetTracker[]> =>
    apiRequest<TargetTracker[]>('/target-trackers'),
  
  getById: (id: number): Promise<TargetTracker> =>
    apiRequest<TargetTracker>(`/target-trackers/${id}`),
  
  create: (data: CreateTargetRequest): Promise<TargetTracker> =>
    apiRequest<TargetTracker>('/target-trackers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  update: (id: number, data: Partial<CreateTargetRequest>): Promise<TargetTracker> =>
    apiRequest<TargetTracker>(`/target-trackers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (id: number): Promise<void> =>
    apiRequest<void>(`/target-trackers/${id}`, {
      method: 'DELETE',
    }),
  
  addEntry: (id: number, entry: AddEntryRequest): Promise<Entry> =>
    apiRequest<Entry>(`/target-trackers/${id}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    }),
  
  getEntries: (id: number): Promise<Entry[]> =>
    apiRequest<Entry[]>(`/target-trackers/${id}/entries`),
};

// Entries API
export const entriesApi = {
  getAll: (): Promise<Entry[]> =>
    apiRequest<Entry[]>('/entries'),
  
  delete: (id: number): Promise<void> =>
    apiRequest<void>(`/entries/${id}`, {
      method: 'DELETE',
    }),
  
  bulkDelete: (ids: number[]): Promise<void> =>
    apiRequest<void>('/entries', {
      method: 'DELETE',
      body: JSON.stringify(ids),
    }),
};

// Hook for API calls with loading and error states
import { useState, useEffect } from 'react';

export function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        if (mounted) {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, dependencies);

  return { data, loading, error, refetch: () => useEffect(() => {}, []) };
}
