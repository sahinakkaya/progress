// src/components/detail/HabitQuickEntry.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, CheckCircle } from 'lucide-react';
import type { HabitTracker } from '../../types';

interface HabitQuickEntryProps {
  habit: HabitTracker;
  addingEntry: boolean;
  onQuickEntry: (completed: boolean) => Promise<void>;
  onDetailedEntry: () => void;
}

export default function HabitQuickEntry({ habit, addingEntry, onQuickEntry, onDetailedEntry }: HabitQuickEntryProps) {
  return (
    <Card className="mb-6 border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="w-5 h-5 text-green-600" />
          Quick Entry
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Button
            onClick={() => onQuickEntry(true)}
            disabled={addingEntry}
            className={`flex-1 ${
              habit.badHabit 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {addingEntry ? 'Adding...' : (habit.badHabit ? 'Yes' : 'Mark Completed')}
          </Button>
          <Button
            onClick={() => onQuickEntry(false)}
            disabled={addingEntry}
            variant="outline"
            className={`flex-1 ${
              habit.badHabit 
                ? 'border-green-300 text-green-600 hover:bg-green-50' 
                : 'border-red-300 text-red-600 hover:bg-red-50'
            }`}
          >
            {habit.badHabit ? 'No' : 'Mark Missed'}
          </Button>
          <Button
            onClick={onDetailedEntry}
            variant="outline"
            className="border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Detailed Entry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}