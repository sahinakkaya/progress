// src/components/WeeklyCalendar.tsx - Mobile-style horizontal calendar
import { useState, useEffect, useRef } from 'react';

interface WeeklyCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  dueCounts?: Record<string, number>;
}

interface DayInfo {
  date: Date;
  dateString: string;
  dayAbbrev: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  dueCount: number;
}

export default function WeeklyCalendar({ selectedDate, onDateChange, dueCounts = {} }: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);

  // Calculate week start (Monday) for given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // Sunday = 0, Monday = 1, etc.
    const daysToSubtract = day === 0 ? 6 : day - 1; // If Sunday, go back 6 days, otherwise go back (day - 1) days
    d.setDate(d.getDate() - daysToSubtract); // Go back to Monday
    return d;
  };

  // Generate extended days array for scrolling (6 weeks)
  const getExtendedDays = (centerWeekStart: Date): DayInfo[] => {
    const days: DayInfo[] = [];
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    // Start from three weeks before the center week
    const startDate = new Date(centerWeekStart);
    startDate.setDate(startDate.getDate() - 21);

    // Generate 42 days (6 weeks) to fill screen
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const isToday = date.getTime() === todayLocal.getTime();
      const isSelected = date.getTime() === selectedLocal.getTime();

      // Calculate days difference from today
      const daysDiff = Math.abs((date.getTime() - todayLocal.getTime()) / (1000 * 60 * 60 * 24));
      
      const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      
      // Show day abbreviation for days within 6 days of today, otherwise show month
      const dayAbbrev = daysDiff <= 6 
        ? dayNames[(date.getDay() + 6) % 7] 
        : monthNames[date.getMonth()];

      days.push({
        date,
        dateString,
        dayAbbrev,
        dayNumber: date.getDate(),
        isToday,
        isSelected,
        dueCount: dueCounts[dateString] || 0
      });
    }

    return days;
  };

  // Initialize week start based on selected date
  useEffect(() => {
    setWeekStart(getWeekStart(selectedDate));
  }, [selectedDate]);

  const extendedDays = getExtendedDays(weekStart);

  const handleDateClick = (day: DayInfo) => {
    onDateChange(day.date);
  };

  // Scroll to selected date on mount and when selection changes
  useEffect(() => {
    if (scrollRef.current) {
      const selectedIndex = extendedDays.findIndex(day => day.isSelected);
      if (selectedIndex >= 0) {
        const dayWidth = 56; // w-12 + gap
        const containerWidth = scrollRef.current.clientWidth;
        const scrollTo = (selectedIndex * dayWidth) - (containerWidth / 2) + (dayWidth / 2);
        scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
      }
    }
  }, [selectedDate, extendedDays]);

  return (
    <div 
      ref={scrollRef}
      className="flex space-x-2 px-2 overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {extendedDays.map((day) => (
        <div
          key={day.dateString}
          className="flex flex-col items-center cursor-pointer flex-shrink-0"
          onClick={() => handleDateClick(day)}
        >
          {/* Date circle with day and number */}
          <div
            className={`
              relative w-12 h-12 rounded-full flex flex-col items-center justify-center
              text-xs font-medium transition-all duration-200
              ${day.isSelected
                ? 'bg-white text-blue-600 shadow-md'
                : day.isToday
                ? 'bg-blue-500 text-white border-2 border-blue-300'
                : 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
              }
            `}
          >
            <div className="text-xs">{day.dayAbbrev}</div>
            <div className="text-sm font-semibold">{day.dayNumber}</div>
          </div>

          {/* Today indicator dot */}
          {day.isToday && (
            <div className="w-1 h-1 bg-blue-300 rounded-full mt-1"></div>
          )}
        </div>
      ))}
    </div>
  );
}