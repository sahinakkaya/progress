// src/components/forms/CreateTargetForm.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { targetApi } from '../../services/api';
import type { CreateTargetRequest, Due } from '../../types';

interface CreateTargetFormProps {
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

const INTERVAL_TYPES = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
];

export default function CreateTargetForm({ open, onOpenChange, onSuccess }: CreateTargetFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    trackerName: '',
    startValue: '',
    goalValue: '',
    startDate: new Date().toISOString().split('T')[0],
    goalDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + 3); // Default to 3 months from now
      return date.toISOString().split('T')[0];
    })(),
    addToTotal: true,
    dueType: 'specificDays' as 'specificDays' | 'interval',
    specificDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as string[],
    intervalType: 'day',
    intervalValue: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.trackerName.trim()) {
      newErrors.trackerName = 'Target name is required';
    }

    const startNum = parseFloat(formData.startValue);
    const goalNum = parseFloat(formData.goalValue);
    
    if (!formData.startValue || isNaN(startNum)) {
      newErrors.startValue = 'Start value is required';
    }
    
    if (!formData.goalValue || isNaN(goalNum)) {
      newErrors.goalValue = 'Goal value is required';
    } else if (!isNaN(startNum) && goalNum <= startNum && formData.addToTotal) {
      newErrors.goalValue = 'Goal value must be greater than start value for additive targets';
    }

    if (new Date(formData.goalDate) <= new Date(formData.startDate)) {
      newErrors.goalDate = 'Goal date must be after start date';
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

      const targetData: CreateTargetRequest = {
        trackerName: formData.trackerName.trim(),
        startValue: parseFloat(formData.startValue),
        goalValue: parseFloat(formData.goalValue),
        startDate: formData.startDate,
        goalDate: formData.goalDate,
        addToTotal: formData.addToTotal,
        due,
      };

      console.log('Creating target:', targetData);
      await targetApi.create(targetData);
      
      // Reset form
      setFormData({
        trackerName: '',
        startValue: '',
        goalValue: '',
        startDate: new Date().toISOString().split('T')[0],
        goalDate: (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + 3);
          return date.toISOString().split('T')[0];
        })(),
        addToTotal: true,
        dueType: 'specificDays',
        specificDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        intervalType: 'day',
        intervalValue: '',
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to create target:', error);
      setErrors({ submit: 'Failed to create target. Please try again.' });
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
          <DialogTitle className="text-xl font-semibold">Create New Target</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 p-1">
          {/* Target Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Target Name *</Label>
            <Input
              id="name"
              value={formData.trackerName}
              onChange={(e) => setFormData(prev => ({ ...prev, trackerName: e.target.value }))}
              placeholder="e.g., Save Money, Lose Weight, Read Pages"
              className={`w-full ${errors.trackerName ? 'border-red-500' : ''}`}
            />
            {errors.trackerName && (
              <p className="text-sm text-red-500">{errors.trackerName}</p>
            )}
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startValue" className="text-sm font-medium">Start Value</Label>
              <Input
                id="startValue"
                type="number"
                step="0.1"
                value={formData.startValue}
                onChange={(e) => setFormData(prev => ({ ...prev, startValue: e.target.value }))}
                className={`w-full ${errors.startValue ? 'border-red-500' : ''}`}
              />
              {errors.startValue && (
                <p className="text-sm text-red-500">{errors.startValue}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="goalValue" className="text-sm font-medium">Goal Value *</Label>
              <Input
                id="goalValue"
                type="number"
                step="0.1"
                value={formData.goalValue}
                onChange={(e) => setFormData(prev => ({ ...prev, goalValue: e.target.value }))}
                className={`w-full ${errors.goalValue ? 'border-red-500' : ''}`}
              />
              {errors.goalValue && (
                <p className="text-sm text-red-500">{errors.goalValue}</p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="goalDate" className="text-sm font-medium">Goal Date *</Label>
              <Input
                id="goalDate"
                type="date"
                value={formData.goalDate}
                onChange={(e) => setFormData(prev => ({ ...prev, goalDate: e.target.value }))}
                className={`w-full ${errors.goalDate ? 'border-red-500' : ''}`}
              />
              {errors.goalDate && (
                <p className="text-sm text-red-500">{errors.goalDate}</p>
              )}
            </div>
          </div>

          {/* Add to Total Toggle */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
              <Switch
                id="addToTotal"
                checked={formData.addToTotal}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, addToTotal: checked }))}
              />
              <Label htmlFor="addToTotal" className="text-sm">Add to Total (Accumulative)</Label>
            </div>
            <p className="text-xs text-gray-500 px-3">
              {formData.addToTotal 
                ? "Each entry will be added to your current progress" 
                : "Each entry will replace your current value (e.g., for tracking weight, temperature)"}
            </p>
          </div>

          {/* Due Schedule */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">When should you update this target?</Label>
            
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
                      className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                        formData.specificDays.includes(day.key)
                          ? 'bg-green-500 text-white border-green-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
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
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
                'Create Target'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
