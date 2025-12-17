import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import type { HabitTracker, Entry } from '../../types';
import { useHabitStreak } from '../../hooks/useHabitStreak';

interface HabitCardProps {
  habit: HabitTracker;
  entries: Entry[];
  selectedDate: Date;
  onQuickLog: (done: boolean) => void;
  hasFailed?: boolean;
}

export default function HabitCard({ habit, entries, selectedDate, onQuickLog, hasFailed = false }: HabitCardProps) {
  const navigate = useNavigate();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [hasStartedSwipe, setHasStartedSwipe] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const SWIPE_THRESHOLD = 80;

  // Calculate period-based status
  const getHabitStatus = () => {
    const today = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    // Get completed entries only
    const completedEntries = entries.filter(entry => entry.done === true);

    if (habit.timePeriod === 'perDay') {
      // Count today's entries
      const todayEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        return entryDay.getTime() === today.getTime();
      });

      const todayCount = todayEntries.length;

      // For bad habits, show different status based on whether they failed
      if (habit.badHabit) {
        return {
          statusText: hasFailed ? 'Failed - exceeded limit' : todayCount === 0 ? 'Perfect!' : 'Within limit',
          progress: `${todayCount}/${habit.goal}`,
          period: 'today'
        };
      }

      // For regular habits, check yesterday's entries
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        return entryDay.getTime() === yesterday.getTime();
      });

      const displayCount = Math.min(todayCount, habit.goal);
      const missedYesterday = yesterdayEntries.length < habit.goal;

      return {
        statusText: missedYesterday ? 'Missed yesterday' : 'On track',
        progress: `${displayCount}/${habit.goal}`,
        period: 'today'
      };
      
    } else if (habit.timePeriod === 'perWeek') {
      // Current week (Monday to Sunday)
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const thisWeekEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      });

      const thisWeekCount = thisWeekEntries.length;

      // For bad habits, show different status
      if (habit.badHabit) {
        return {
          statusText: hasFailed ? 'Failed - exceeded limit' : thisWeekCount === 0 ? 'Perfect!' : 'Within limit',
          progress: `${thisWeekCount}/${habit.goal}`,
          period: 'this week'
        };
      }

      // For regular habits, check last week
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      const endOfLastWeek = new Date(startOfWeek);
      endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);

      const lastWeekEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfLastWeek && entryDate <= endOfLastWeek;
      });

      const displayCount = Math.min(thisWeekCount, habit.goal);
      const missedLastWeek = lastWeekEntries.length < habit.goal;

      return {
        statusText: missedLastWeek ? 'Missed last week' : 'On track',
        progress: `${displayCount}/${habit.goal}`,
        period: 'this week'
      };
      
    } else if (habit.timePeriod === 'perMonth') {
      // Selected date's month
      const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const thisMonthEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      });

      const thisMonthCount = thisMonthEntries.length;

      // For bad habits, show different status
      if (habit.badHabit) {
        return {
          statusText: hasFailed ? 'Failed - exceeded limit' : thisMonthCount === 0 ? 'Perfect!' : 'Within limit',
          progress: `${thisMonthCount}/${habit.goal}`,
          period: 'this month'
        };
      }

      // For regular habits, check last month
      const startOfLastMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
      const endOfLastMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0, 23, 59, 59, 999);

      const lastMonthEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfLastMonth && entryDate <= endOfLastMonth;
      });

      const displayCount = Math.min(thisMonthCount, habit.goal);
      const missedLastMonth = lastMonthEntries.length < habit.goal;

      return {
        statusText: missedLastMonth ? 'Missed last month' : 'On track',
        progress: `${displayCount}/${habit.goal}`,
        period: 'this month'
      };
    }
    
    // Fallback
    return {
      statusText: 'On track',
      progress: `0/${habit.goal}`,
      period: 'today'
    };
  };

  const status = getHabitStatus();
  const currentStreak = useHabitStreak(entries, habit);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    setIsDragging(true);
    setHasStartedSwipe(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - startX.current;
    const diffY = currentY - startY.current;
    
    // Cancel if vertical movement is larger (user is scrolling)
    if (Math.abs(diffY) > 15 && Math.abs(diffY) > Math.abs(diffX)) {
      setIsDragging(false);
      setSwipeOffset(0);
      return;
    }
    
    // Mark as swipe if moved more than 10px horizontally
    if (Math.abs(diffX) > 10) {
      setHasStartedSwipe(true);
    }
    
    // Limit swipe distance for visual feedback
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diffX));
    setSwipeOffset(clampedOffset);
  };

  const handleTouchEnd = async () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      setIsLogging(true);
      try {
        // Left swipe (negative offset) = undone/no
        // Right swipe (positive offset) = done/yes
        await onQuickLog(swipeOffset > 0);
      } catch (error) {
        console.error('Failed to log entry:', error);
      } finally {
        setIsLogging(false);
      }
    }
    
    // Reset swipe offset
    setSwipeOffset(0);
    setTimeout(() => setHasStartedSwipe(false), 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
    setHasStartedSwipe(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startX.current;
    
    // Mark as swipe if moved more than 10px
    if (Math.abs(diff) > 10) {
      setHasStartedSwipe(true);
    }
    
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setSwipeOffset(clampedOffset);
  };

  const handleMouseUp = async () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      setIsLogging(true);
      try {
        await onQuickLog(swipeOffset > 0);
      } catch (error) {
        console.error('Failed to log entry:', error);
      } finally {
        setIsLogging(false);
      }
    }
    
    setSwipeOffset(0);
    setTimeout(() => setHasStartedSwipe(false), 100);
  };

  const handleClick = () => {
    if (!hasStartedSwipe && Math.abs(swipeOffset) < 5 && !isLogging) {
      navigate(`/habit/${habit.id}`);
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background action indicators */}
      <div className="absolute inset-0 flex rounded-lg overflow-hidden">
        {/* Left background - done/yes */}
        <div className={`flex-1 ${habit.badHabit ? 'bg-red-500' : 'bg-green-500'} flex items-center justify-start pl-6 transition-opacity duration-200 ${
          swipeOffset < -SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-60'
        }`}>
          <span className="text-white font-medium">{habit.badHabit ? 'Yes' : 'Done'} ✓</span>
        </div>
        {/* Right background - undone/no */}
        <div className={`flex-1 ${habit.badHabit ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-end pr-6 transition-opacity duration-200 ${
          swipeOffset > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-60'
        }`}>
          <span className="text-white font-medium">✕ {habit.badHabit ? 'No' : 'Undone'}</span>
        </div>
      </div>
      
      <Card 
        className={`bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative rounded-lg ${
          isLogging ? 'opacity-75' : ''
        }`}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onClick={handleClick}
        data-card-id={`habit-${habit.id}`}
      >
        <CardContent className="p-4">
          <div className="flex items-center">
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  hasFailed ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <span className={`text-sm font-semibold ${
                    hasFailed ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {habit.trackerName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{habit.trackerName}</h3>
                    {habit.badHabit && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                        Bad Habit
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <p className={`text-sm ${hasFailed ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {status.statusText}
                    </p>
                    {currentStreak > 0 && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                        Current streak: 🔥 {currentStreak}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-semibold ${
                  hasFailed ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {status.progress.split('/')[0]}
                </div>
                <div className="text-sm text-gray-500">/{habit.goal}</div>
                <div className="text-xs text-gray-400">{status.period}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}