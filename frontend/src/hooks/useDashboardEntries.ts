import { useState, useEffect } from 'react';
import { habitApi, targetApi } from '../services/api';
import type { DashboardResponse, Entry, HabitTracker, TargetTracker } from '../types';

export function useDashboardEntries(dashboard: DashboardResponse | null, selectedDate: Date) {
  const [habitEntries, setHabitEntries] = useState<Map<number, Entry[]>>(new Map());
  const [targetEntries, setTargetEntries] = useState<Map<number, Entry[]>>(new Map());

  // Fetch entries for all trackers
  useEffect(() => {
    const fetchAllEntries = async () => {
      if (!dashboard) return;
      
      // Fetch habit entries
      const habitEntriesPromises = dashboard.habitTrackers?.map(async (habit) => {
        try {
          const entries = await habitApi.getEntries(habit.id);
          return { id: habit.id, entries };
        } catch (error) {
          console.error(`Failed to fetch entries for habit ${habit.id}:`, error);
          return { id: habit.id, entries: [] };
        }
      }) || [];
      
      // Fetch target entries  
      const targetEntriesPromises = dashboard.targetTrackers?.map(async (target) => {
        try {
          const entries = await targetApi.getEntries(target.id);
          return { id: target.id, entries };
        } catch (error) {
          console.error(`Failed to fetch entries for target ${target.id}:`, error);
          return { id: target.id, entries: [] };
        }
      }) || [];
      
      const [habitResults, targetResults] = await Promise.all([
        Promise.all(habitEntriesPromises),
        Promise.all(targetEntriesPromises)
      ]);
      
      // Update state
      const newHabitEntries = new Map();
      habitResults.forEach(({ id, entries }) => newHabitEntries.set(id, entries));
      setHabitEntries(newHabitEntries);
      
      const newTargetEntries = new Map();
      targetResults.forEach(({ id, entries }) => newTargetEntries.set(id, entries));
      setTargetEntries(newTargetEntries);
    };
    
    fetchAllEntries();
  }, [dashboard]);

  // Helper function to check if habit needs action
  const habitNeedsAction = (habit: HabitTracker): boolean => {
    const entries = habitEntries.get(habit.id) || [];
    const today = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    const completedEntries = entries.filter(entry => entry.done === true);
    
    if (habit.timePeriod === 'perDay') {
      const todayEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        return entryDay.getTime() === today.getTime();
      });
      return habit.badHabit ? todayEntries.length > habit.goal : todayEntries.length < habit.goal;
    } else if (habit.timePeriod === 'perWeek') {
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const thisWeekEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      });
      return habit.badHabit ? thisWeekEntries.length > habit.goal : thisWeekEntries.length < habit.goal;
    } else if (habit.timePeriod === 'perMonth') {
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const thisMonthEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      });
      return habit.badHabit ? thisMonthEntries.length > habit.goal : thisMonthEntries.length < habit.goal;
    }
    return true;
  };

  // Helper function to check if target needs action
  const targetNeedsAction = (target: TargetTracker): boolean => {
    const entries = targetEntries.get(target.id) || [];
    const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    return !entries.some(entry => entry.date.split('T')[0] === selectedDateString);
  };

  const refetchEntries = async () => {
    if (!dashboard) return;
    
    // Fetch habit entries
    const habitEntriesPromises = dashboard.habitTrackers?.map(async (habit) => {
      try {
        const entries = await habitApi.getEntries(habit.id);
        return { id: habit.id, entries };
      } catch (error) {
        console.error(`Failed to fetch entries for habit ${habit.id}:`, error);
        return { id: habit.id, entries: [] };
      }
    }) || [];
    
    // Fetch target entries  
    const targetEntriesPromises = dashboard.targetTrackers?.map(async (target) => {
      try {
        const entries = await targetApi.getEntries(target.id);
        return { id: target.id, entries };
      } catch (error) {
        console.error(`Failed to fetch entries for target ${target.id}:`, error);
        return { id: target.id, entries: [] };
      }
    }) || [];
    
    const [habitResults, targetResults] = await Promise.all([
      Promise.all(habitEntriesPromises),
      Promise.all(targetEntriesPromises)
    ]);
    
    // Update state
    const newHabitEntries = new Map();
    habitResults.forEach(({ id, entries }) => newHabitEntries.set(id, entries));
    setHabitEntries(newHabitEntries);
    
    const newTargetEntries = new Map();
    targetResults.forEach(({ id, entries }) => newTargetEntries.set(id, entries));
    setTargetEntries(newTargetEntries);
  };

  return {
    habitEntries,
    targetEntries,
    habitNeedsAction,
    targetNeedsAction,
    refetchEntries
  };
}