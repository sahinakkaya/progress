// src/components/detail/HabitHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Target, Trash2 } from 'lucide-react';
import type { HabitTracker } from '../../types';

interface HabitHeaderProps {
  habit: HabitTracker;
  totalEntries: number;
  completedEntries: number;
  completionRate: number;
  currentStreak: number;
  onBack: () => void;
  onDelete: () => void;
}

export default function HabitHeader({ 
  habit, 
  totalEntries, 
  completedEntries, 
  completionRate, 
  currentStreak,
  onBack, 
  onDelete 
}: HabitHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            {habit.trackerName}
          </h1>
          <p className="text-gray-600">
            {habit.badHabit? "Up to" : ""} {habit.goal} times {habit.timePeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}
          </p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline">
          Started: {new Date(habit.startDate).toLocaleDateString()}
        </Badge>
        {habit.goalStreak && (
          <Badge variant="secondary">
            Goal Streak: {habit.goalStreak} days
          </Badge>
        )}
        {habit.badHabit && (
          <Badge variant="destructive">
            Bad Habit
          </Badge>
        )}
        <Badge variant="outline">
          Due: {habit.due.type === 'specificDays' 
            ? habit.due.specificDays?.join(', ') 
            : `Every ${habit.due.intervalValue} ${habit.due.intervalType}(s)`
          }
        </Badge>
      </div>
    </div>
  );
}
