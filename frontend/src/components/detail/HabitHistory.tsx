// src/components/detail/HabitHistory.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { habitApi, entriesApi } from '../../services/api';
import type { HabitTracker, Entry, AddEntryRequest } from '../../types';

interface HabitHistoryProps {
  habit: HabitTracker;
  entries: Entry[];
  onUpdate: () => void;
}

export default function HabitHistory({ habit, entries, onUpdate }: HabitHistoryProps) {
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [newEntry, setNewEntry] = useState({
    done: true,
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddEntry = async () => {
    try {
      // Convert date to datetime format with current time
      const selectedDate = new Date(newEntry.date);
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      const entryData: AddEntryRequest = {
        done: newEntry.done,
        date: selectedDate.toISOString(),
        note: newEntry.note || undefined
      };

      await habitApi.addEntry(habit.id, entryData);
      setNewEntry({ done: true, note: '', date: new Date().toISOString().split('T')[0] });
      setShowAddEntry(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Failed to add entry. Please try again.');
    }
  };

  const handleDeleteEntry = async (entry: Entry) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await entriesApi.delete(entry.id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  return (
    <div className="space-y-6">
      {/* Add Entry Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Log History
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddEntry(!showAddEntry)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </CardHeader>
        
        {showAddEntry && (
          <CardContent className="border-t">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={newEntry.done}
                    onChange={() => setNewEntry(prev => ({ ...prev, done: true }))}
                  />
                  <CheckCircle className={`w-4 h-4 ${
                    habit.badHabit ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <span>{habit.badHabit ? 'Yes' : 'Completed'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!newEntry.done}
                    onChange={() => setNewEntry(prev => ({ ...prev, done: false }))}
                  />
                  <XCircle className={`w-4 h-4 ${
                    habit.badHabit ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span>{habit.badHabit ? 'No' : 'Missed'}</span>
                </label>
              </div>
              
              <Input
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
              />
              
              <Textarea
                placeholder="Add a note (optional)"
                value={newEntry.note}
                onChange={(e) => setNewEntry(prev => ({ ...prev, note: e.target.value }))}
                rows={3}
              />
              
              <div className="flex gap-2">
                <Button onClick={handleAddEntry}>
                  Add Entry
                </Button>
                <Button variant="outline" onClick={() => setShowAddEntry(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        {sortedEntries.length > 0 ? (
          sortedEntries.map((entry) => (
            <Card key={entry.id} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {entry.done ? (
                        <CheckCircle className={`w-5 h-5 ${
                          habit.badHabit ? 'text-red-600' : 'text-green-600'
                        }`} />
                      ) : (
                        <XCircle className={`w-5 h-5 ${
                          habit.badHabit ? 'text-green-600' : 'text-red-600'
                        }`} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {habit.badHabit 
                            ? (entry.done ? 'Yes' : 'No')
                            : (entry.done ? 'Completed' : 'Missed')
                          }
                        </span>
                        <Badge 
                          variant={habit.badHabit 
                            ? (entry.done ? 'destructive' : 'default')
                            : (entry.done ? 'default' : 'destructive')
                          } 
                          className="text-xs"
                        >
                          {habit.badHabit 
                            ? (entry.done ? 'Yes' : 'No')
                            : (entry.done ? 'Done' : 'Missed')
                          }
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {formatDate(entry.date)} • {getTimeAgo(entry.createdAt)}
                      </div>
                      
                      {entry.note && (
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mt-2">
                          "{entry.note}"
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingEntry(entry)}
                      className="p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteEntry(entry)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                📝
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Entries Yet</h3>
              <p className="text-gray-500 mb-4">
                Start logging your habit to see your history here.
              </p>
              <Button onClick={() => setShowAddEntry(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Entry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Statistics Summary */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
                <div className="text-sm text-gray-500">Total Entries</div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  habit.badHabit ? 'text-red-600' : 'text-green-600'
                }`}>
                  {entries.filter(e => e.done).length}
                </div>
                <div className="text-sm text-gray-500">
                  {habit.badHabit ? 'Yes' : 'Completed'}
                </div>
              </div>
              <div>
                <div className={`text-2xl font-bold ${
                  habit.badHabit ? 'text-green-600' : 'text-red-600'
                }`}>
                  {entries.filter(e => !e.done).length}
                </div>
                <div className="text-sm text-gray-500">
                  {habit.badHabit ? 'No' : 'Missed'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {entries.length > 0 ? Math.round((entries.filter(e => e.done).length / entries.length) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Entry Modal/Dialog would go here */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={editingEntry.done || false}
                    onChange={() => setEditingEntry(prev => prev ? { ...prev, done: true } : null)}
                  />
                  <CheckCircle className={`w-4 h-4 ${
                    habit.badHabit ? 'text-red-600' : 'text-green-600'
                  }`} />
                  <span>{habit.badHabit ? 'Yes' : 'Completed'}</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!(editingEntry.done || false)}
                    onChange={() => setEditingEntry(prev => prev ? { ...prev, done: false } : null)}
                  />
                  <XCircle className={`w-4 h-4 ${
                    habit.badHabit ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <span>{habit.badHabit ? 'No' : 'Missed'}</span>
                </label>
              </div>
              
              <Textarea
                placeholder="Add a note (optional)"
                value={editingEntry.note || ''}
                onChange={(e) => setEditingEntry(prev => prev ? { ...prev, note: e.target.value } : null)}
                rows={3}
              />
              
              <div className="flex gap-2">
                <Button onClick={() => {
                  // Save edit logic here
                  console.log('Edit entry not implemented yet');
                  setEditingEntry(null);
                }}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
