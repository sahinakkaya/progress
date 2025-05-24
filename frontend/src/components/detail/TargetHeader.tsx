// src/components/detail/TargetHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, Trash2, Plus } from 'lucide-react';
import type { TargetTracker } from '../../types';

interface TargetHeaderProps {
  target: TargetTracker;
  onBack: () => void;
  onDelete: () => void;
  onAddEntry: () => void;
}

export default function TargetHeader({ target, onBack, onDelete, onAddEntry }: TargetHeaderProps) {
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
            <Target className="w-6 h-6 text-green-600" />
            {target.trackerName}
          </h1>
          <p className="text-gray-600">
            {target.startValue} → {target.goalValue} by {new Date(target.goalDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddEntry}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}