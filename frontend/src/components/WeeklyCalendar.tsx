// src/components/WeeklyCalendar.tsx - Mobile-style horizontal calendar
import { useState, useEffect } from 'react';

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

  // Calculate week start (Sunday) for given date
  const getWeekStart = (date: Date): Date => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const day = d.getDay(); // Sunday = 0, Monday = 1, etc.
    d.setDate(d.getDate() - day); // Go back to Sunday
    return d;
  };

  // Generate week days array starting from Sunday
  const getWeekDays = (weekStart: Date): DayInfo[] => {
    const days: DayInfo[] = [];
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedLocal = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i);
      const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      const isToday = date.getTime() === todayLocal.getTime();
      const isSelected = date.getTime() === selectedLocal.getTime();

      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

      days.push({
        date,
        dateString,
        dayAbbrev: dayNames[date.getDay()],
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

  const weekDays = getWeekDays(weekStart);

  const handleDateClick = (day: DayInfo) => {
    onDateChange(day.date);
  };

  return (
    <div className="flex justify-center space-x-2 px-2">
      {weekDays.map((day) => (
        <div
          key={day.dateString}
          className="flex flex-col items-center cursor-pointer"
          onClick={() => handleDateClick(day)}
        >
          {/* Day abbreviation */}
          <div className="text-xs text-blue-200 mb-1 font-medium">
            {day.dayAbbrev}
          </div>
          
          {/* Date circle */}
          <div
            className={`
              relative w-10 h-10 rounded-full flex items-center justify-center
              text-sm font-medium transition-all duration-200
              ${day.isSelected
                ? 'bg-white text-blue-600 shadow-md'
                : day.isToday
                ? 'bg-blue-500 text-white border-2 border-blue-300'
                : 'bg-blue-500/20 text-blue-100 hover:bg-blue-500/30'
              }
            `}
          >
            {day.dayNumber}
            
            {/* Due count badge */}
            {day.dueCount > 0 && (
              <div
                className={`
                  absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium
                  ${day.isSelected 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-red-500 text-white'
                  }
                `}
              >
                {day.dueCount}
              </div>
            )}
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