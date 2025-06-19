// src/components/detail/TargetHistory.tsx
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { targetApi, entriesApi } from '../../services/api';
import type { TargetTracker, Entry, AddEntryRequest } from '../../types';

interface TargetHistoryProps {
  target: TargetTracker;
  entries: Entry[];
  onUpdate: () => void;
}

export default function TargetHistory({ target, entries, onUpdate }: TargetHistoryProps) {
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editFormData, setEditFormData] = useState({
    value: '',
    note: ''
  });
  const [newEntry, setNewEntry] = useState({
    value: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddEntry = async () => {
    const numValue = parseFloat(newEntry.value);
    if (isNaN(numValue) || numValue <= 0) {
      alert('Please enter a valid value greater than 0');
      return;
    }

    try {
      const selectedDate = new Date(newEntry.date);
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      const entryData: AddEntryRequest = {
        value: numValue,
        date: selectedDate.toISOString(),
        note: newEntry.note || undefined
      };

      await targetApi.addEntry(target.id, entryData);
      setNewEntry({ value: '', note: '', date: new Date().toISOString().split('T')[0] });
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

  // Calculate running total for cumulative targets
  const getRunningTotal = (entryIndex: number) => {
    if (!target.addToTotal) return null;
    
    const relevantEntries = sortedEntries.slice(entryIndex);
    const total = target.startValue + relevantEntries.reduce((sum, entry) => sum + (entry.value || 0), 0);
    return total;
  };


  return (
    <div className="space-y-6">
      {/* Add Entry Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Entry History
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Value</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newEntry.value}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Enter value"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={newEntry.date}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional)</label>
                <Textarea
                  placeholder="Add a note about this entry"
                  value={newEntry.note}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, note: e.target.value }))}
                  rows={3}
                />
              </div>
              
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
          sortedEntries.map((entry, index) => {
            const runningTotal = getRunningTotal(index);
            const prevEntry = sortedEntries[index + 1];
            const trend = prevEntry ? (entry.value || 0) - (prevEntry.value || 0) : 0;
            
            return (
              <Card key={entry.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Value Display */}
                      <div className="flex-shrink-0 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {(entry.value || 0).toFixed(1)}
                        </div>
                        {target.addToTotal && runningTotal && (
                          <div className="text-xs text-gray-500">
                            Total: {runningTotal.toFixed(1)}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Entry Value: {(entry.value || 0).toFixed(1)}</span>
                          {trend !== 0 && (
                            <div className="flex items-center gap-1">
                              {trend > 0 ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                  <span className="text-xs text-green-600">+{trend.toFixed(1)}</span>
                                </>
                              ) : (
                                <>
                                  <TrendingDown className="w-4 h-4 text-red-600" />
                                  <span className="text-xs text-red-600">{trend.toFixed(1)}</span>
                                </>
                              )}
                            </div>
                          )}
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
                        onClick={() => {
                          setEditingEntry(entry);
                          setEditFormData({
                            value: (entry.value || 0).toString(),
                            note: entry.note || ''
                          });
                        }}
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
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                📝
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Entries Yet</h3>
              <p className="text-gray-500 mb-4">
                Start logging progress to track your target here.
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
                <div className="text-2xl font-bold text-green-600">
                  {(entries.reduce((sum, e) => sum + (e.value || 0), 0) / entries.length).toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Average Value</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...entries.map(e => e.value || 0)).toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Highest Entry</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {entries.reduce((sum, e) => sum + (e.value || 0), 0).toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Entry</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Value</label>
                <Input
                  type="number"
                  step="0.1"
                  value={editFormData.value}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    value: e.target.value
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Note</label>
                <Textarea
                  placeholder="Add a note (optional)"
                  value={editFormData.note}
                  onChange={(e) => setEditFormData(prev => ({
                    ...prev,
                    note: e.target.value
                  }))}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={() => {
                  // Save edit logic here
                  console.log('Edit entry not implemented yet');
                  setEditingEntry(null);
                }}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditingEntry(null);
                  setEditFormData({ value: '', note: '' });
                }}>
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
