// src/components/detail/TargetSettings.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Trash2, AlertTriangle, Check, Clock } from 'lucide-react';
import { targetApi } from '../../services/api';
import type { TargetTracker, TrendWeightType } from '../../types';

interface TargetSettingsProps {
  target: TargetTracker;
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

const INTERVAL_TYPES = [
  { value: 'day', label: 'Day(s)' },
  { value: 'week', label: 'Week(s)' },
  { value: 'month', label: 'Month(s)' },
];

export default function TargetSettings({ target, onUpdate, onDelete }: TargetSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const [formData, setFormData] = useState({
    trackerName: target.trackerName,
    startValue: target.originalStartValue.toString(),
    goalValue: target.goalValue.toString(),
    startDate: new Date(target.startDate).toISOString().split('T')[0],
    goalDate: new Date(target.goalDate).toISOString().split('T')[0],
    addToTotal: target.addToTotal,
    useActualBounds: target.useActualBounds,
    trendWeightType: target.trendWeightType || 'none',
    dueType: target.due.type,
    specificDays: target.due.specificDays || [],
    intervalType: target.due.intervalType || 'day',
    intervalValue: (target.due.intervalValue || 1).toString(),
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
          startValue: parseFloat(newFormData.startValue) || 0,
          goalValue: parseFloat(newFormData.goalValue) || 0,
          startDate: newFormData.startDate,
          goalDate: newFormData.goalDate,
          addToTotal: newFormData.addToTotal,
          useActualBounds: newFormData.useActualBounds,
          trendWeightType: newFormData.trendWeightType,
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

        await targetApi.update(target.id, updateData);
        setLastSaved(new Date());
        onUpdate();
      } catch (error) {
        console.error('Failed to update target:', error);
        alert('Failed to update target. Please try again.');
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

  // Calculate some stats for display
  const daysUntilGoal = Math.ceil(
    (new Date(formData.goalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const totalDuration = Math.ceil(
    (new Date(formData.goalDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const targetRange = Math.abs(parseFloat(formData.goalValue) - parseFloat(formData.startValue));

  return (
    <div className="space-y-6">
      {/* Basic Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Target Settings
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
            <Label>Target Name</Label>
            <Input
              value={formData.trackerName}
              onChange={(e) => updateFormData({ trackerName: e.target.value })}
              placeholder="Enter target name"
            />
          </div>

          {/* Values */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Value</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.startValue}
                onChange={(e) => updateFormData({ startValue: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Goal Value</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.goalValue}
                onChange={(e) => updateFormData({ goalValue: e.target.value })}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormData({ startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Goal Date</Label>
              <Input
                type="date"
                value={formData.goalDate}
                onChange={(e) => updateFormData({ goalDate: e.target.value })}
              />
            </div>
          </div>

          {/* Add to Total Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
            <Switch
              checked={formData.addToTotal}
              onCheckedChange={(checked) => updateFormData({ addToTotal: checked })}
            />
            <Label>Add to total (cumulative progress)</Label>
          </div>

          {/* Use Actual Bounds Toggle */}
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-md">
            <Switch
              checked={formData.useActualBounds}
              onCheckedChange={(checked) => updateFormData({ useActualBounds: checked })}
            />
            <div className="flex-1">
              <Label>Use actual data bounds for trend calculations</Label>
              <p className="text-sm text-gray-600 mt-1">
                When enabled, trend lines will start from your actual progress bounds instead of the original start value.
                This provides more realistic projections when your progress differs from the planned baseline.
              </p>
            </div>
          </div>

          {/* Trend Weight Type */}
          <div className="space-y-2">
            <Label>Trend Line Weighting</Label>
            <p className="text-sm text-gray-600">
              Controls how much recent data points influence the trend line projection
            </p>
            <select
              value={formData.trendWeightType}
              onChange={(e) => updateFormData({ trendWeightType: e.target.value as TrendWeightType })}
              className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="none">None - All data points equal (1x)</option>
              <option value="quadratic">Quadratic - Very gentle (1.6x recent weight)</option>
              <option value="exponential_low">Exponential Low - Gentle (2.7x recent weight)</option>
              <option value="sqrt">Square Root - Moderate (3x recent weight)</option>
              <option value="linear">Linear - Strong (5x recent weight)</option>
              <option value="exponential_high">Exponential High - Very strong (7.4x recent weight)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Higher weights make the trend line more responsive to your recent progress.
            </p>
          </div>

          {/* Due Schedule */}
          <div className="space-y-4">
            <Label>When should you work on this target?</Label>
            
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
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      formData.specificDays.includes(day.key)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-500'
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
                    onChange={(e) => updateFormData({ intervalType: e.target.value as 'day' | 'week' | 'month' })}
                    className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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
          <div className="mt-6 p-4 bg-green-50 rounded-md">
            <h4 className="font-medium mb-2 text-green-900">Current Settings</h4>
            <div className="space-y-1 text-sm text-green-800">
              <p><strong>Target:</strong> {formData.startValue} → {formData.goalValue} (Range: {targetRange.toFixed(1)})</p>
              <p><strong>Timeline:</strong> {new Date(formData.startDate).toLocaleDateString()} to {new Date(formData.goalDate).toLocaleDateString()} ({totalDuration} days)</p>
              <p><strong>Schedule:</strong> {
                formData.dueType === 'specificDays' 
                  ? formData.specificDays.join(', ') || 'No days selected'
                  : `Every ${formData.intervalValue} ${formData.intervalType}(s)`
              }</p>
              <p><strong>Progress Type:</strong> {formData.addToTotal ? 'Cumulative (add each entry)' : 'Latest value only'}</p>
              <p><strong>Trend Calculation:</strong> {formData.useActualBounds ? 'Uses actual data bounds' : 'Uses original start value'}</p>
              <p><strong>Trend Weighting:</strong> {
                formData.trendWeightType === 'none' ? 'Standard (equal weights)' :
                formData.trendWeightType === 'linear' ? 'Linear (5x recent)' :
                formData.trendWeightType === 'sqrt' ? 'Square Root (3x recent)' :
                formData.trendWeightType === 'quadratic' ? 'Quadratic (1.6x recent)' :
                formData.trendWeightType === 'exponential_low' ? 'Exponential Low (2.7x recent)' :
                'Exponential High (7.4x recent)'
              }</p>
              {daysUntilGoal > 0 && <p><strong>Days Remaining:</strong> {daysUntilGoal} days</p>}
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
              <h4 className="font-medium text-red-900">Delete Target</h4>
              <p className="text-sm text-red-700">
                This will permanently delete this target and all its entries. This action cannot be undone.
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