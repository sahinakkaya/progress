// src/components/detail/TargetNotes.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageCircle, Target } from 'lucide-react';
import type { TargetTracker, Entry } from '../../types';

interface TargetNotesProps {
  target: TargetTracker;
  entries: Entry[];
}

export default function TargetNotes({ target, entries }: TargetNotesProps) {
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

  // Calculate current progress
  const currentValue = target.addToTotal 
    ? target.startValue + entries.reduce((sum, entry) => sum + (entry.value || 0), 0)
    : entries.length > 0 
      ? entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value || target.startValue
      : target.startValue;

  const progressPercentage = target.addToTotal
    ? ((currentValue - target.startValue) / (target.goalValue - target.startValue)) * 100
    : ((target.startValue - currentValue) / (target.startValue - target.goalValue)) * 100;

  const displayPercentage = Math.min(Math.max(progressPercentage, 0), 100);

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
            placeholder="Write a note about your target progress, observations, or reflections..."
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
                  <div key={entry.id} className="border-l-4 border-green-200 pl-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        Value: {(entry.value || 0).toFixed(1)}
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

      {/* Target Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Target Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Goal</h4>
            <p className="text-gray-600">
              {target.addToTotal ? 'Increase' : 'Change'} from {target.startValue} to {target.goalValue}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Current Progress</h4>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-green-600">{currentValue.toFixed(1)}</span>
              <Badge variant="outline">{Math.round(displayPercentage)}% Complete</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Target Type</h4>
            <p className="text-gray-600">
              {target.addToTotal ? (
                <>
                  <Badge className="mr-2">Cumulative</Badge>
                  Values are added together to reach the goal
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="mr-2">Replacement</Badge>
                  Each entry replaces the previous value
                </>
              )}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Schedule</h4>
            <p className="text-gray-600">
              {target.due.type === 'specificDays' 
                ? `Every ${target.due.specificDays?.join(', ')}`
                : `Every ${target.due.intervalValue} ${target.due.intervalType}(s)`
              }
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Start Date</h4>
              <p className="text-gray-600">
                {new Date(target.startDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Goal Date</h4>
              <p className="text-gray-600">
                {new Date(target.goalDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Duration</h4>
            <p className="text-gray-600">
              {Math.ceil(
                (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) / (1000 * 60 * 60 * 24)
              )} days total
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Progress Insights */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Entry Statistics</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Entries:</span>
                    <span>{entries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Value:</span>
                    <span>{(entries.reduce((sum, e) => sum + (e.value || 0), 0) / entries.length).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Highest Entry:</span>
                    <span>{Math.max(...entries.map(e => e.value || 0)).toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lowest Entry:</span>
                    <span>{Math.min(...entries.map(e => e.value || 0)).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Time Analysis</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Active:</span>
                    <span>{Math.ceil((new Date().getTime() - new Date(target.startDate).getTime()) / (1000 * 60 * 60 * 24))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Remaining:</span>
                    <span>
                      {Math.max(0, Math.ceil((new Date(target.goalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entries with Notes:</span>
                    <span>{entriesWithNotes.length}</span>
                  </div>
                </div>
              </div>
            </div>

            {displayPercentage >= 100 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="font-medium text-green-800 mb-1">🎉 Goal Achieved!</h4>
                <p className="text-sm text-green-700">
                  Congratulations! You've reached your target goal. Consider setting a new challenge or maintaining your progress.
                </p>
              </div>
            )}

            {displayPercentage < 100 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-800 mb-1">Keep Going!</h4>
                <p className="text-sm text-blue-700">
                  You're {Math.round(displayPercentage)}% of the way to your goal. 
                  {target.addToTotal 
                    ? ` You need ${(target.goalValue - currentValue).toFixed(1)} more to reach ${target.goalValue}.`
                    : ` You need to reach ${target.goalValue} from your current ${currentValue.toFixed(1)}.`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
