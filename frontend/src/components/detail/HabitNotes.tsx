// src/components/detail/HabitNotes.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageCircle } from 'lucide-react';
import type { HabitTracker, Entry } from '../../types';

interface HabitNotesProps {
  habit: HabitTracker;
  entries: Entry[];
}

export function HabitNotes({ habit, entries }: HabitNotesProps) {
  const [newNote, setNewNote] = useState('');
  
  // Get entries with notes
  const entriesWithNotes = entries.filter(entry => entry.note && entry.note.trim());
  
  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    // This would typically create a new entry with just a note
    console.log('Add note functionality not fully implemented');
    setNewNote('');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Add Note Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Add Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Write a note about your habit, observations, or reflections..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          <Button onClick={handleAddNote} disabled={!newNote.trim()}>
            Add Note
          </Button>
        </CardContent>
      </Card>

      {/* Notes from Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Entry Notes ({entriesWithNotes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entriesWithNotes.length > 0 ? (
            <div className="space-y-4">
              {entriesWithNotes
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <div key={entry.id} className="border-l-4 border-blue-200 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={entry.done ? 'default' : 'destructive'} className="text-xs">
                        {entry.done ? 'Completed' : 'Missed'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.date)}
                      </span>
                    </div>
                    <p className="text-gray-700">{entry.note}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📝</div>
              <p className="text-gray-500">
                No notes yet. Add notes when logging entries to track your thoughts and observations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habit Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Habit Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Goal</h4>
            <p className="text-gray-600">
              {habit.goal} {habit.timePeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Schedule</h4>
            <p className="text-gray-600">
              {habit.due.type === 'specificDays' 
                ? `Every ${habit.due.specificDays?.join(', ')}`
                : `Every ${habit.due.intervalValue} ${habit.due.intervalType}(s)`
              }
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Started</h4>
            <p className="text-gray-600">
              {new Date(habit.startDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          
          {habit.goalStreak && (
            <div>
              <h4 className="font-medium mb-2">Goal Streak</h4>
              <p className="text-gray-600">{habit.goalStreak} days</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default HabitNotes;
