// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../services/api';
import type { DashboardResponse } from '../types';

export interface UseDashboardReturn {
  dashboard: DashboardResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export function useDashboard(inputDate?: Date): UseDashboardReturn {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (inputDate) {
      return new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate());
    }
    const today = new Date();
    // Use local date components to avoid timezone issues
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  });

  const fetchDashboard = useCallback(async (date?: Date) => {
    try {
      setLoading(true);
      setError(null);
      
      const targetDate = date || selectedDate;
      // Format date manually to avoid timezone issues
      const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      

      // Call API with date parameter
      const data = await dashboardApi.getDashboard(dateString);
      
      setDashboard(data);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');

      // Fallback to empty dashboard
      const targetDate = date || selectedDate;
      const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
      
      setDashboard({
        date: dateString,
        habitTrackers: [],
        targetTrackers: []
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Fetch data when selected date changes
  useEffect(() => {
    fetchDashboard(selectedDate);
  }, [selectedDate, fetchDashboard]);

  const refetch = useCallback(async () => {
    await fetchDashboard(selectedDate);
  }, [fetchDashboard, selectedDate]);

  const handleDateChange = useCallback((date: Date) => {
    // Ensure we're working with local date components only
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(localDate);
  }, []);

  return {
    dashboard,
    loading,
    error,
    refetch,
    selectedDate,
    setSelectedDate: handleDateChange
  };
}

// Hook to calculate due counts for the weekly calendar
export function useDueCounts(selectedDate?: Date) {
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    
    const calculateDueCounts = async () => {
      setLoading(true);
      try {
        // Get the week range (Monday to Sunday)
        const weekStart = new Date(selectedDate);
        const day = weekStart.getDay();
        const daysToSubtract = day === 0 ? 6 : day - 1; // If Sunday, go back 6 days, otherwise go back (day - 1) days
        weekStart.setDate(selectedDate.getDate() - daysToSubtract);
        
        const counts: Record<string, number> = {};
        
        // Fetch due counts for each day of the week
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
          const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          
          try {
            // Fetch dashboard data for this specific date
            const dayData = await dashboardApi.getDashboard(dateString);
            const habitCount = dayData.habitTrackers?.length || 0;
            const targetCount = dayData.targetTrackers?.length || 0;
            const totalDue = habitCount + targetCount;
            
            
            counts[dateString] = totalDue;
          } catch (error) {
            console.error(`Failed to fetch due count for ${dateString}:`, error);
            // Fallback to 0 if API call fails
            counts[dateString] = 0;
          }
        }
        
        setDueCounts(counts);
        
        // Calculate total for today
        const todayString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
        setTotalDue(counts[todayString] || 0);
      } catch (error) {
        console.error('Failed to calculate due counts:', error);
        
        // Fallback to empty counts
        setDueCounts({});
        setTotalDue(0);
      } finally {
        setLoading(false);
      }
    };

    calculateDueCounts();
  }, [selectedDate]);

  return { dueCounts, totalDue, loading };
}
