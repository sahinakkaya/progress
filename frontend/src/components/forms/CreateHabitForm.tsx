// src/components/forms/CreateHabitForm.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, X } from 'lucide-react';
import { habitApi } from '../../services/api';
import type { CreateHabitRequest, Due } from '../../types';

interface CreateHabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const WEEKDAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
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

export default function CreateHabitForm({ open, onOpenChange, onSuccess }: CreateHabitFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trackerName: '',
    goal: '',
    timePeriod: 'perDay',
    startDate: new Date().toISOString().split('T')[0],
    badHabit: false,
    goalStreak: '',
    dueType: 'specificDays' as 'specificDays' | 'interval',
    specificDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as string[],
    intervalType: 'day',
    intervalValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.trackerName.trim()) {
      newErrors.trackerName = 'Habit name is required';
    }

    const goalNum = parseFloat(formData.goal);
    if (!formData.goal || isNaN(goalNum) || goalNum <= 0) {
      newErrors.goal = 'Goal must be greater than 0';
    }

    if (formData.dueType === 'specificDays' && formData.specificDays.length === 0) {
      newErrors.specificDays = 'Select at least one day';
    }

    if (formData.dueType === 'interval') {
      const intervalNum = parseInt(formData.intervalValue);
      if (!formData.intervalValue || isNaN(intervalNum) || intervalNum <= 0) {
        newErrors.intervalValue = 'Interval must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const due: Due = formData.dueType === 'specificDays'
        ? {
          type: 'specificDays',
          specificDays: formData.specificDays,
        }
        : {
          type: 'interval',
          intervalType: formData.intervalType,
          intervalValue: parseInt(formData.intervalValue),
        };

      const habitData: CreateHabitRequest = {
        trackerName: formData.trackerName.trim(),
        goal: parseFloat(formData.goal),
        timePeriod: formData.timePeriod,
        startDate: formData.startDate,
        due,
        badHabit: formData.badHabit,
        goalStreak: formData.goalStreak ? parseInt(formData.goalStreak) : undefined,
      };

      console.log('Creating habit:', habitData);
      await habitApi.create(habitData);

      // Reset form
      setFormData({
        trackerName: '',
        goal: '',
        timePeriod: 'perDay',
        startDate: new Date().toISOString().split('T')[0],
        badHabit: false,
        goalStreak: '',
        dueType: 'specificDays',
        specificDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        intervalType: 'day',
        intervalValue: '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create habit:', error);
      setErrors({ submit: 'Failed to create habit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      specificDays: prev.specificDays.includes(day)
        ? prev.specificDays.filter(d => d !== day)
        : [...prev.specificDays, day]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Habit</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-1">
          {/* Habit Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Habit Name *</Label>
            <Input
              id="name"
              value={formData.trackerName}
              onChange={(e) => setFormData(prev => ({ ...prev, trackerName: e.target.value }))}
              placeholder="e.g., Exercise, Drink Water, Read"
              className={`w-full ${errors.trackerName ? 'border-red-500' : ''}`}
            />
            {errors.trackerName && (
              <p className="text-sm text-red-500">{errors.trackerName}</p>
            )}
          </div>

          {/* Goal and Time Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="goal" className="text-sm font-medium">
                {formData.badHabit ? "Limit" : "Goal"} *
              </Label>
              <div className="flex items-center gap-3">
                {formData.badHabit && (<span>Up to</span>)}
                <Input
                  id="goal"
                  type="number"
                  min="1"
                  value={formData.goal}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                  className={`w-20 ${errors.goal ? 'border-red-500' : ''}`}
                />
                <span>times</span>
              </div>
              {errors.goal && (
                <p className="text-sm text-red-500">{errors.goal}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timePeriod" className="text-sm font-medium">Time Period</Label>
              <select
                id="timePeriod"
                value={formData.timePeriod}
                onChange={(e) => setFormData(prev => ({ ...prev, timePeriod: e.target.value }))}
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
            <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full"
            />
          </div>

          {/* Goal Streak */}
          <div className="space-y-2">
            <Label htmlFor="goalStreak" className="text-sm font-medium">Goal Streak (optional)</Label>
            <Input
              id="goalStreak"
              type="number"
              min="1"
              value={formData.goalStreak}
              onChange={(e) => setFormData(prev => ({ ...prev, goalStreak: e.target.value }))}
              placeholder="e.g., 30 days"
              className="w-full"
            />
          </div>

          {/* Bad Habit Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Switch
              id="badHabit"
              checked={formData.badHabit}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, badHabit: checked }))}
            />
            <Label htmlFor="badHabit" className="text-sm">This is a bad habit (track to reduce)</Label>
          </div>

          {/* Due Schedule */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">When is this habit due?</Label>

            <div className="flex gap-6">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="specificDays"
                  checked={formData.dueType === 'specificDays'}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueType: e.target.value as any }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">Specific Days</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  value="interval"
                  checked={formData.dueType === 'interval'}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueType: e.target.value as any }))}
                  className="w-4 h-4"
                />
                <span className="text-sm">Interval</span>
              </label>
            </div>

            {formData.dueType === 'specificDays' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map(day => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${formData.specificDays.includes(day.key)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                        }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                {errors.specificDays && (
                  <p className="text-sm text-red-500">{errors.specificDays}</p>
                )}
              </div>
            )}

            {formData.dueType === 'interval' && (
              <div className="flex gap-3 items-end">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Every</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.intervalValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, intervalValue: e.target.value }))}
                    className={`w-20 ${errors.intervalValue ? 'border-red-500' : ''}`}
                  />
                </div>
                <div className="space-y-2 flex-1">
                  <Label className="text-sm font-medium">Period</Label>
                  <select
                    value={formData.intervalType}
                    onChange={(e) => setFormData(prev => ({ ...prev, intervalType: e.target.value }))}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {INTERVAL_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.intervalValue && (
                  <p className="text-sm text-red-500">{errors.intervalValue}</p>
                )}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
              onClick={handleSubmit}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Habit'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
