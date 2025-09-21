// src/components/detail/HabitCalendar.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { HabitTracker, Entry } from '../../types';

interface HabitCalendarProps {
  habit: HabitTracker;
  entries: Entry[];
  onDateClick: (dateStr: string, event: React.MouseEvent) => void;
}

export default function HabitCalendar({ habit, entries, onDateClick }: HabitCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const firstDay = new Date(currentYear, currentMonth, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7)); // Start from Monday
  
  // Navigation functions
  const goToPreviousMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };
  
  const goToNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };
  
  const goToCurrentMonth = () => {
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };
  
  // Check if we can navigate to previous/next months
  const habitStartDate = new Date(habit.startDate);
  const habitStartMonth = new Date(habitStartDate.getFullYear(), habitStartDate.getMonth(), 1);
  const currentMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const canGoToPrevious = viewDate > habitStartMonth;
  const canGoToNext = viewDate < currentMonthDate;
  const isCurrentMonth = viewDate.getTime() === currentMonthDate.getTime();
  
  const days = [];
  const currentDate = new Date(startDate);
  
  // Generate 6 weeks (42 days) to cover the month
  for (let i = 0; i < 42; i++) {
    // Create date string without timezone conversion
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayEntries = entries.filter(e => e.date.split('T')[0] === dateStr);
    const hasCompletedEntry = dayEntries.some(e => e.done === true);
    const completedCount = dayEntries.filter(e => e.done === true).length;
    const totalCount = dayEntries.length;
    const isCurrentMonth = currentDate.getMonth() === currentMonth;
    const isToday = currentDate.toDateString() === today.toDateString();
    const habitStartDate = new Date(habit.startDate);
    // Compare dates without time components
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const startDateOnly = new Date(habitStartDate.getFullYear(), habitStartDate.getMonth(), habitStartDate.getDate());
    const isBeforeStartDate = currentDateOnly < startDateOnly;
    const isAfterCurrentDate = currentDate > today;
    const isClickable = !isAfterCurrentDate;
    
    // Calculate completion percentage for progress circle (only for daily habits with goal > 1)
    const showProgressCircle = habit.timePeriod === 'perDay' && habit.goal > 1;
    
    // For weekly bad habits, show small dots on individual days and vertical bar on Monday
    const showWeeklyBadHabitDots = habit.timePeriod === 'perWeek' && habit.badHabit;
    const isMonday = currentDate.getDay() === 1;
    
    // Calculate weekly totals for the vertical bar (only for Monday)
    let weeklyCount = 0;
    if (showWeeklyBadHabitDots && isMonday) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      weeklyCount = entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd && entry.done;
      }).length;
    }
    
    // For bad habits: goal is the limit, exceeding it is bad
    let completionPercentage, isFullyCompleted, hasPartialCompletion, isOverLimit;
    
    if (habit.badHabit) {
      isOverLimit = completedCount > habit.goal;
      completionPercentage = showProgressCircle ? Math.min((completedCount / habit.goal) * 100, 100) : completedCount > 0 ? 100 : 0;
      isFullyCompleted = completedCount === 0; // For bad habits, 0 is "fully completed" (good)
      hasPartialCompletion = completedCount > 0 && completedCount <= habit.goal;
    } else {
      // For good habits: original logic
      isOverLimit = false;
      completionPercentage = showProgressCircle ? (completedCount / habit.goal) * 100 : completedCount > 0 ? 100 : 0;
      isFullyCompleted = completedCount >= habit.goal;
      hasPartialCompletion = completedCount > 0 && completedCount < habit.goal;
    }
    
    days.push(
      <div key={dateStr} className="relative w-10 h-10 flex items-center justify-center">
        {/* Vertical weekly bar for weekly bad habits on Monday */}
        {showWeeklyBadHabitDots && isMonday && !isAfterCurrentDate && (
          <svg className="absolute left-0 top-0 w-2 h-10" viewBox="0 0 8 40">
            <defs>
              <linearGradient id={`weeklyGradient-${dateStr}`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop 
                  offset={`${(weeklyCount / (habit.goal + 1)) * 100}%`} 
                  stopColor="rgb(239, 68, 68)" 
                />
                <stop 
                  offset={`${(weeklyCount / (habit.goal + 1)) * 100}%`} 
                  stopColor="rgb(34, 197, 94)" 
                />
              </linearGradient>
            </defs>
            
            {/* Border */}
            <rect
              x="1" y="1" width="6" height="38"
              stroke="rgb(229, 231, 235)"
              strokeWidth="1"
              fill="transparent"
            />
            
            {/* Filled bar */}
            <rect
              x="2" y="2" width="4" height="36"
              fill={
                weeklyCount === 0 
                  ? "rgb(34, 197, 94)" // Completely green when 0 
                  : weeklyCount > habit.goal 
                    ? "rgb(239, 68, 68)" // Completely red when over limit
                    : `url(#weeklyGradient-${dateStr})` // Gradient when under/at limit
              }
            />
          </svg>
        )}

        {/* Multiple dots for weekly bad habits showing count of daily occurrences */}
        {showWeeklyBadHabitDots && !isAfterCurrentDate && !isBeforeStartDate && completedCount > 0 && (
          <div className="absolute top-0 right-0 flex flex-wrap gap-0.5 max-w-6">
            {Array.from({ length: Math.min(completedCount, 4) }, (_, i) => (
              <div key={i} className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
            ))}
            {completedCount > 4 && (
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full relative">
                <span className="absolute -top-1 -right-1 text-xs font-bold text-red-600">+</span>
              </div>
            )}
          </div>
        )}

        {/* Progress circle for daily goals > 1 (good habits only) */}
        {showProgressCircle && !habit.badHabit && !isAfterCurrentDate && !isBeforeStartDate && isCurrentMonth && (
          <svg className="absolute inset-0 w-10 h-10 transform -rotate-90" viewBox="0 0 40 40">
            {/* Background circle */}
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="rgb(229, 231, 235)"
              strokeWidth="2"
              fill="transparent"
            />
            {/* Progress circle */}
            {completedCount > 0 && (
              <circle
                cx="20"
                cy="20"
                r="18"
                stroke={
                  habit.badHabit 
                    ? (isOverLimit ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)") // Red if over limit, green if under
                    : (isFullyCompleted ? "rgb(34, 197, 94)" : "rgb(59, 130, 246)") // Original logic for good habits
                }
                strokeWidth="2"
                fill="transparent"
                strokeDasharray={`${(completionPercentage / 100) * 113.1} 113.1`}
                strokeLinecap="round"
              />
            )}
          </svg>
        )}

        {/* Filled circle indicator for daily goals > 1 (bad habits only) */}
        {showProgressCircle && !isAfterCurrentDate && habit.badHabit && (
          <svg className="absolute inset-0 w-10 h-10" viewBox="0 0 40 40">
            <defs>
              <linearGradient id={`healthGradient-${dateStr}`} x1="0%" y1="100%" x2="0%" y2="0%">
                {/* Bottom to top gradient for health bar effect */}
                <stop 
                  offset={`${(completedCount / (habit.goal + 1)) * 100}%`} 
                  stopColor="rgb(239, 68, 68)" 
                />
                <stop 
                  offset={`${(completedCount / (habit.goal + 1)) * 100}%`} 
                  stopColor="rgb(34, 197, 94)" 
                />
              </linearGradient>
            </defs>
            
            {/* Border circle */}
            <circle
              cx="20"
              cy="20"
              r="18"
              stroke="rgb(229, 231, 235)"
              strokeWidth="1"
              fill="transparent"
            />
            
            {/* Filled circle */}
            <circle
              cx="20"
              cy="20"
              r="17"
              fill={
                completedCount === 0 
                  ? "rgb(34, 197, 94)" // Completely green when 0 (perfect for bad habit)
                  : completedCount > habit.goal 
                    ? "rgb(239, 68, 68)" // Completely red when over limit
                    : `url(#healthGradient-${dateStr})` // Gradient when under/at limit
              }
            />
          </svg>
        )}
        
        {/* Day number */}
        <div
          onClick={(e) => isClickable ? onDateClick(dateStr, e) : null}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium relative z-10
            ${isAfterCurrentDate ? 'text-gray-300' : 'cursor-pointer hover:bg-gray-100'}
            ${isBeforeStartDate ? 'text-gray-900 ' : ''}
            ${isToday ? 'ring-blue-500 font-extrabold' : ''}
            ${!isAfterCurrentDate && !isBeforeStartDate && habit.badHabit && (
              showWeeklyBadHabitDots ? '' : // No special styling for weekly bad habits, just show dots
              showProgressCircle ? (
                'text-white font-bold' // Always white text for progress circles
              ) : (
                isOverLimit ? 'bg-red-500 text-white hover:bg-red-600' :
                completedCount === 0 ? 'bg-green-500 text-white hover:bg-green-600' :
                'bg-yellow-500 text-white hover:bg-yellow-600'
              )
            )}
            ${!isAfterCurrentDate && !isBeforeStartDate && !habit.badHabit && (
              !showProgressCircle ? (
                hasCompletedEntry && completedCount === totalCount ? 'bg-green-500 text-white hover:bg-green-600' :
                hasCompletedEntry && completedCount < totalCount ? 'bg-green-300 text-white hover:bg-green-400' :
                dayEntries.length > 0 && !hasCompletedEntry ? 'bg-red-500 text-white hover:bg-red-600' : ''
              ) : (
                isFullyCompleted ? 'bg-green-500 text-white hover:bg-green-600' :
                hasPartialCompletion ? 'text-blue-600 font-bold' : ''
              )
            )}
            ${dayEntries.length === 0 && isClickable && isCurrentMonth ? 'text-gray-900' : ''}
            ${!isCurrentMonth ? 'text-neutral-300' : ''}
          `}
        >
          {currentDate.getDate()}
        </div>
      </div>
    );
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate monthly progress for monthly bad habits
  const getMonthlyProgress = () => {
    if (habit.timePeriod !== 'perMonth' || !habit.badHabit) return null;
    
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startOfMonth && entryDate <= endOfMonth && entry.done;
    });
    
    const count = monthEntries.length;
    const isOverLimit = count > habit.goal;
    
    // For bad habits: progress decreases linearly as count increases
    // For limit of 2: 0=100%, 1=66%, 2=33%, 3+=100% red
    let percentage;
    if (isOverLimit) {
      percentage = 100; // Full red bar when over limit
    } else {
      // Green progress decreases linearly: 100% - (count / (goal + 1)) * 100%
      percentage = 100 - ((count / (habit.goal + 1)) * 100);
    }
    
    return {
      count,
      isOverLimit,
      percentage,
      isGood: count === 0
    };
  };

  const monthlyProgress = getMonthlyProgress();

  return (
    <div className="mb-6">
      {/* Monthly Progress Bar for Monthly Bad Habits */}
      {monthlyProgress && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Monthly Progress</span>
            <span>{monthlyProgress.count}/{habit.goal} limit</span>
          </div>
          <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            {monthlyProgress.isOverLimit ? (
              // When over limit, show full red bar
              <div className="h-full bg-red-500 transition-all duration-300" style={{ width: '100%' }} />
            ) : (
              // When within limit, show green progress + red remaining
              <>
                <div className="h-full bg-red-500 transition-all duration-300" style={{ width: '100%' }} />
                <div 
                  className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${monthlyProgress.percentage}%` }}
                />
              </>
            )}
            {/* Goal limit line */}
            <div 
              className="absolute top-0 h-full w-0.5 bg-gray-600 opacity-70"
              style={{ left: `${100 - ((habit.goal / (habit.goal + 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Month Navigation Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={goToPreviousMonth}
          disabled={!canGoToPrevious}
          className="p-2"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">
            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          {!isCurrentMonth && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToCurrentMonth}
              className="text-xs"
            >
              Today
            </Button>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToNextMonth}
          disabled={!canGoToNext}
          className="p-2"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days}
      </div>
    </div>
  );
}
