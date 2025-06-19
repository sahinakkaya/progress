// src/components/detail/habitUtils.ts
import type { Entry } from '../../types';

export interface PeriodData {
  start: Date;
  end: Date;
  entries: number;
  goalMet: boolean;
  isCurrent: boolean;
}

export interface StreakData {
  current: number;
  best: number;
}

export interface GoalProgress {
  percentage: number;
  completedWeeks: number;
  totalWeeks: number;
  text: string;
}

export interface BarChartItem {
  label: string;
  count: number;
  maxHeight: number;
  goalMet: boolean;
}

export const calculatePeriodData = (
  timePeriod: string,
  habitStartDate: Date,
  today: Date,
  entries: Entry[],
  goal: number,
  isBadHabit: boolean = false
): PeriodData[] => {
  if (timePeriod === 'perDay') {
    const periods = [];
    let currentDate = new Date(habitStartDate);
    
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const periodEntries = entries.filter(e => e.date.split('T')[0] === dateStr && e.done);
      const goalMet = isBadHabit ? periodEntries.length <= goal : periodEntries.length >= goal;
      const isCurrent = currentDate.toDateString() === today.toDateString();
      
      periods.push({ 
        start: new Date(currentDate), 
        end: new Date(currentDate), 
        entries: periodEntries.length, 
        goalMet, 
        isCurrent 
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return periods;
  } else if (timePeriod === 'perWeek') {
    const periods = [];
    let currentDate = new Date(habitStartDate);
    
    while (currentDate <= today) {
      const startOfWeek = new Date(currentDate);
      const dayOfWeek = currentDate.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(currentDate.getDate() - daysFromMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      const periodEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek && entryDate <= endOfWeek && entry.done;
      });
      const goalMet = isBadHabit ? periodEntries.length <= goal : periodEntries.length >= goal;
      const isCurrent = endOfWeek >= today;
      
      periods.push({ 
        start: startOfWeek, 
        end: endOfWeek, 
        entries: periodEntries.length, 
        goalMet, 
        isCurrent 
      });
      currentDate.setDate(currentDate.getDate() + 7);
    }
    return periods;
  } else if (timePeriod === 'perMonth') {
    const periods = [];
    let currentDate = new Date(habitStartDate.getFullYear(), habitStartDate.getMonth(), 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    while (currentDate <= currentMonth) {
      const monthStart = new Date(currentDate);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      const periodEntries = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd && entry.done;
      });
      const goalMet = isBadHabit ? periodEntries.length <= goal : periodEntries.length >= goal;
      const isCurrent = currentDate.getTime() === currentMonth.getTime();
      
      periods.push({ 
        start: monthStart, 
        end: monthEnd, 
        entries: periodEntries.length, 
        goalMet, 
        isCurrent 
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    return periods;
  }
  return [];
};

export const calculateStreaks = (periods: PeriodData[]): StreakData => {
  // Current streak (from most recent backwards)
  let currentStreak = 0;
  let isPositiveStreak = null;
  
  for (let i = periods.length - 1; i >= 0; i--) {
    const period = periods[i];
    // Skip current incomplete period if goal not met
    if (period.isCurrent && !period.goalMet) continue;
    
    if (isPositiveStreak === null) {
      isPositiveStreak = period.goalMet;
      currentStreak = 1;
    } else if (period.goalMet === isPositiveStreak) {
      currentStreak++;
    } else {
      break;
    }
  }
  
  // Best streak (through all periods that count)
  const countingPeriods = periods.filter(p => !p.isCurrent || (p.isCurrent && p.goalMet));
  let maxPositiveStreak = 0;
  let maxNegativeStreak = 0;
  let currentPositiveStreak = 0;
  let currentNegativeStreak = 0;
  
  for (const period of countingPeriods) {
    if (period.goalMet) {
      currentPositiveStreak++;
      currentNegativeStreak = 0;
      maxPositiveStreak = Math.max(maxPositiveStreak, currentPositiveStreak);
    } else {
      currentNegativeStreak++;
      currentPositiveStreak = 0;
      maxNegativeStreak = Math.max(maxNegativeStreak, currentNegativeStreak);
    }
  }
  
  return {
    current: isPositiveStreak ? currentStreak : -currentStreak,
    best: maxPositiveStreak > 0 ? maxPositiveStreak : -maxNegativeStreak
  };
};

export const calculateGoalProgress = (periods: PeriodData[], unit: string): GoalProgress => {
  const countingPeriods = periods.filter(p => !p.isCurrent || (p.isCurrent && p.goalMet));
  const completedPeriods = countingPeriods.filter(p => p.goalMet).length;
  const totalPeriods = countingPeriods.length;
  
  return {
    percentage: totalPeriods > 0 ? Math.round((completedPeriods / totalPeriods) * 100) : 0,
    completedWeeks: completedPeriods,
    totalWeeks: totalPeriods,
    text: `${completedPeriods}/${totalPeriods} ${unit}`
  };
};

export const generateBarChartData = (
  timePeriod: string,
  entries: Entry[],
  goal: number,
  habitStartDate: Date,
  today: Date,
  isBadHabit: boolean = false
): BarChartItem[] => {
  if (timePeriod === 'perDay') {
    // Show up to 20 days or all days since habit start (whichever is less)
    const maxDays = 20;
    const daysSinceStart = Math.ceil((today.getTime() - habitStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysToShow = Math.min(maxDays, daysSinceStart + 1);
    
    // First pass: collect all day data to find actual max count
    const dayData = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      
      if (day >= habitStartDate) {
        const dateStr = day.toISOString().split('T')[0];
        const dayEntries = entries.filter(entry => {
          return entry.date.split('T')[0] === dateStr && entry.done;
        });
        
        dayData.push({
          label: `${day.getMonth() + 1}/${day.getDate()}`,
          count: dayEntries.length,
          goalMet: isBadHabit ? dayEntries.length <= goal : dayEntries.length >= goal
        });
      }
    }
    
    // Calculate proper maxHeight based on actual data
    const actualMaxCount = Math.max(...dayData.map(d => d.count), 0);
    const maxHeight = isBadHabit ? Math.max(actualMaxCount, goal + 1) : Math.max(goal, actualMaxCount, 2);
    
    // Second pass: add maxHeight to all items
    return dayData.map(item => ({ ...item, maxHeight }));
  } else if (timePeriod === 'perMonth') {
    // Show up to 12 months or all months since habit start (whichever is less)
    const maxMonths = 12;
    const habitStartMonth = new Date(habitStartDate.getFullYear(), habitStartDate.getMonth(), 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthsSinceStart = Math.round((currentMonth.getTime() - habitStartMonth.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const monthsToShow = Math.min(maxMonths, monthsSinceStart + 1);
    
    // First pass: collect all month data
    const monthData = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      
      if (monthDate >= habitStartMonth) {
        const monthStart = new Date(monthDate);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthEntries = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= monthStart && entryDate <= monthEnd && entry.done;
        });
        
        monthData.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short' }),
          count: monthEntries.length,
          goalMet: isBadHabit ? monthEntries.length <= goal : monthEntries.length >= goal
        });
      }
    }
    
    // Calculate proper maxHeight
    const actualMaxCount = Math.max(...monthData.map(d => d.count), 0);
    const maxHeight = isBadHabit ? Math.max(actualMaxCount, goal + 1) : Math.max(goal, actualMaxCount, 4);
    
    return monthData.map(item => ({ ...item, maxHeight }));
  } else {
    // Weekly - show up to 16 weeks or all weeks since habit start
    const maxWeeks = 16;
    const weeksSinceStart = Math.ceil((today.getTime() - habitStartDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const weeksToShow = Math.min(maxWeeks, weeksSinceStart + 1);
    
    // First pass: collect all week data
    const weekData = [];
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const currentWeekMonday = new Date(today);
      const dayOfWeek = today.getDay();
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      currentWeekMonday.setDate(today.getDate() - daysFromMonday);
      currentWeekMonday.setHours(0, 0, 0, 0);
      
      const weekStart = new Date(currentWeekMonday);
      weekStart.setDate(currentWeekMonday.getDate() - (i * 7));
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      if (weekEnd >= habitStartDate) {
        const weekEntries = entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= weekStart && entryDate <= weekEnd && entry.done;
        });
        
        weekData.push({
          label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`,
          count: weekEntries.length,
          goalMet: isBadHabit ? weekEntries.length <= goal : weekEntries.length >= goal
        });
      }
    }
    
    // Calculate proper maxHeight
    const actualMaxCount = Math.max(...weekData.map(d => d.count), 0);
    const maxHeight = isBadHabit ? Math.max(actualMaxCount, goal + 1) : Math.max(goal, actualMaxCount, 4);
    
    return weekData.map(item => ({ ...item, maxHeight }));
  }
};