// src/components/detail/HabitSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2, AlertTriangle, Check, Clock } from 'lucide-react';
import { habitApi } from '../../services/api';
import type { HabitTracker } from '../../types';

interface HabitSettingsProps {
  habit: HabitTracker;
  onUpdate: () => void;
  onDelete: () => void;
}

const WEEKDAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

const TIME_PERIODS = [
  { value: 'perDay', label: 'Per Day' },
  { value: 'perWeek', label: 'Per Week' },
  { value: 'perMonth', label: 'Per Month' },
];

const INTERVAL_TYPES = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
];

export default function HabitSettings({ habit, onUpdate, onDelete }: HabitSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    trackerName: habit.trackerName,
    goal: habit.goal.toString(),
    timePeriod: habit.timePeriod,
    startDate: new Date(habit.startDate).toISOString().split('T')[0],
    badHabit: habit.badHabit || false,
    goalStreak: habit.goalStreak || '',
    dueType: habit.due.type,
    specificDays: habit.due.specificDays || [],
    intervalType: habit.due.intervalType || 'day',
    intervalValue: (habit.due.intervalValue || 1).toString(),
  });

  // Auto-save function with debouncing
  const autoSave = async (newFormData: typeof formData) => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(async () => {
      setSaving(true);
      try {
        const updateData = {
          trackerName: newFormData.trackerName,
          goal: parseInt(newFormData.goal) || 0,
          timePeriod: newFormData.timePeriod,
          startDate: newFormData.startDate,
          badHabit: newFormData.badHabit,
          goalStreak: newFormData.goalStreak || undefined,
          due: newFormData.dueType === 'specificDays'
            ? {
              type: 'specificDays' as const,
              specificDays: newFormData.specificDays,
            }
            : {
              type: 'interval' as const,
              intervalType: newFormData.intervalType,
              intervalValue: parseInt(newFormData.intervalValue) || 1,
            }
        };

        await habitApi.update(habit.id, updateData);
        setLastSaved(new Date());
        onUpdate();
      } catch (error) {
        console.error('Failed to update habit:', error);
        alert('Failed to update habit. Please try again.');
      } finally {
        setSaving(false);
      }
    }, 1000); // 1 second debounce

    setSaveTimeout(timeout);
  };

  // Update form data and trigger auto-save
  const updateFormData = (updates: Partial<typeof formData>) => {
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    autoSave(newFormData);
  };

  const toggleDay = (day: string) => {
    const newSpecificDays = formData.specificDays.includes(day)
      ? formData.specificDays.filter(d => d !== day)
      : [...formData.specificDays, day];

    updateFormData({ specificDays: newSpecificDays });
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, [saveTimeout]);

  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.round((now.getTime() - lastSaved.getTime()) / 1000);

    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.round(diff / 60)} min ago`;
    return `Saved at ${lastSaved.toLocaleTimeString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Habit Settings
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {saving ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : lastSaved ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  {formatLastSaved()}
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label>Habit Name</Label>
            <Input
              value={formData.trackerName}
              onChange={(e) => updateFormData({ trackerName: e.target.value })}
              placeholder="Enter habit name"
            />
          </div>

          {/* Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{formData.badHabit ? "Limit" : "Goal"} *</Label>
              <div className="flex items-center gap-3">
                {formData.badHabit && (<span>Up to</span>)}
                <Input
                  type="number"
                  min="0"
                  value={formData.goal}
                  onChange={(e) => updateFormData({ goal: e.target.value })}
                  className={`w-70`}
                />
                <span>times</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Time Period</Label>
              <select
                value={formData.timePeriod}
                onChange={(e) => updateFormData({ timePeriod: e.target.value })}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_PERIODS.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.startDate}
              onChange={(e) => updateFormData({ startDate: e.target.value })}
            />
          </div>

          {/* Goal Streak */}
          <div className="space-y-2">
            <Label>Goal Streak (optional)</Label>
            <Input
              type="number"
              min="1"
              value={formData.goalStreak}
              onChange={(e) => updateFormData({ goalStreak: e.target.value })}
              placeholder="e.g., 30 days"
            />
          </div>

          {/* Bad Habit Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Switch
              checked={formData.badHabit}
              onCheckedChange={(checked) => updateFormData({ badHabit: checked })}
            />
            <Label>This is a bad habit (track to reduce)</Label>
          </div>

          {/* Due Schedule */}
          <div className="space-y-4">
            <Label>When is this habit due?</Label>

            <div className="flex gap-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="specificDays"
                  checked={formData.dueType === 'specificDays'}
                  onChange={(e) => updateFormData({ dueType: e.target.value as any })}
                />
                <span>Specific Days</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="interval"
                  checked={formData.dueType === 'interval'}
                  onChange={(e) => updateFormData({ dueType: e.target.value as any })}
                />
                <span>Interval</span>
              </label>
            </div>

            {formData.dueType === 'specificDays' && (
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${formData.specificDays.includes(day.key)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}

            {formData.dueType === 'interval' && (
              <div className="flex gap-3 items-end">
                <div className="space-y-2">
                  <Label>Every</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.intervalValue}
                    onChange={(e) => updateFormData({ intervalValue: e.target.value })}
                    className="w-20"
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label>Period</Label>
                  <select
                    value={formData.intervalType}
                    onChange={(e) => updateFormData({ intervalType: e.target.value })}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INTERVAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Current Settings Summary */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-2 text-blue-900">Current Settings</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p><strong>Goal:</strong> {formData.goal} {formData.timePeriod.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
              <p><strong>Schedule:</strong> {
                formData.dueType === 'specificDays'
                  ? formData.specificDays.join(', ') || 'No days selected'
                  : `Every ${formData.intervalValue} ${formData.intervalType}(s)`
              }</p>
              <p><strong>Started:</strong> {new Date(formData.startDate).toLocaleDateString()}</p>
              {formData.goalStreak && <p><strong>Goal Streak:</strong> {formData.goalStreak} days</p>}
              {formData.badHabit && <p><strong>Type:</strong> Bad habit</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-md">
            <div>
              <h4 className="font-medium text-red-900">Delete Habit</h4>
              <p className="text-sm text-red-700">
                This will permanently delete this habit and all its entries. This action cannot be undone.
              </p>
            </div>
            <Button variant="destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
