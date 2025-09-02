import type { Entry, HabitTracker } from '../types';
import { calculatePeriodData, calculateStreaks } from '../components/detail/habitUtils';

export function useHabitStreak(entries: Entry[], habit: HabitTracker) {
  // Use the same logic as the detail page
  const periods = calculatePeriodData(
    habit.timePeriod, 
    new Date(habit.startDate), 
    new Date(), 
    entries, 
    habit.goal,
    habit.badHabit || false
  );
  
  const streaks = calculateStreaks(periods);
  
  // Only return positive streaks for dashboard display
  return streaks.current > 0 ? streaks.current : 0;
}