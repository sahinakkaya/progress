import type { Entry, HabitTracker } from '../types';
import { calculatePeriodData, calculateStreaks } from '../components/detail/habitUtils';

export function useHabitStreak(entries: Entry[], habit: HabitTracker) {
  // For bad habits, check if current period has exceeded the goal
  if (habit.badHabit) {
    const today = new Date();
    const completedEntries = entries.filter(entry => entry.done === true);
    
    if (habit.timePeriod === 'perDay') {
      const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayEntry = completedEntries.find(entry => entry.date.split('T')[0] === todayString);
      if (todayEntry) {
        return 0; // Streak broken if bad habit was done today
      }
    } else if (habit.timePeriod === 'perWeek') {
      // Check if this week's entries exceed the goal
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const daysToSubtract = day === 0 ? 6 : day - 1;
      startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const thisWeekEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      });
      
      if (thisWeekEntries.length > habit.goal) {
        return 0; // Streak broken if exceeded goal this week
      }
    } else if (habit.timePeriod === 'perMonth') {
      // Check if this month's entries exceed the goal
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      
      const thisMonthEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      });
      
      if (thisMonthEntries.length > habit.goal) {
        return 0; // Streak broken if exceeded goal this month
      }
    }
  }
  
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