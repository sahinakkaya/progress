// src/components/detail/TargetPaceSection.tsx
import { Card, CardContent } from '@/components/ui/card';
import type { TargetTracker } from '../../types';
import type { TargetMetrics } from './targetUtils';

interface TargetPaceSectionProps {
  target: TargetTracker;
  metrics: TargetMetrics;
}

export default function TargetPaceSection({ target, metrics }: TargetPaceSectionProps) {
  const {
    pace,
    displayPercentage,
    aheadPace,
    pacePercentage,
    currentValue
  } = metrics;

  return (
    <Card className="mb-6 bg-gray-800 text-white">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="text-lg font-medium">
            Pace: {pace.toFixed(1)}
          </div>

          {/* Pace values above progress bar */}
          <div className="flex justify-between items-center text-sm text-gray-300">
            <span>{target.startValue}</span>
            <span>{(target.startValue + (target.goalValue - target.startValue) * 0.25).toFixed(1)}</span>
            <span>{(target.startValue + (target.goalValue - target.startValue) * 0.5).toFixed(1)}</span>
            <span>{(target.startValue + (target.goalValue - target.startValue) * 0.75).toFixed(1)}</span>
            <span>{target.goalValue}</span>
          </div>

          {/* Progress bar with overlay text */}
          <div className="relative">
            <div className="h-20 bg-gray-700 rounded-lg overflow-hidden">
              <div
                className={`h-full ${aheadPace ? 'bg-green-500' : 'bg-red-500'} transition-all duration-300`}
                style={{ width: `${displayPercentage}%` }}
              ></div>
              {/* Pace line */}
              <div
                className="absolute top-0 w-1 h-full bg-white opacity-70"
                style={{ left: `${Math.min(pacePercentage, 100)}%` }}
              ></div>
            </div>

            {/* Progress text overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white font-medium">Progress</div>
                <div className="text-white text-lg font-bold">
                  {(currentValue - target.startValue).toFixed(2)}/{(target.goalValue - target.startValue).toFixed(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Dates at bottom */}
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>{new Date(target.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(new Date(target.startDate).getTime() + (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) * 0.25).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(new Date(target.startDate).getTime() + (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) * 0.5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(new Date(target.startDate).getTime() + (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) * 0.75).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span>{new Date(target.goalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
