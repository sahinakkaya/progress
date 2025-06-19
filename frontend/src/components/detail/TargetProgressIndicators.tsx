// src/components/detail/TargetProgressIndicators.tsx
import type { TargetTracker } from '../../types';
import type { TargetMetrics } from './targetUtils';

interface TargetProgressIndicatorsProps {
  target: TargetTracker;
  metrics: TargetMetrics;
}

export default function TargetProgressIndicators({ target, metrics }: TargetProgressIndicatorsProps) {
  const {
    dailyRequired,
    currentValue,
    displayPercentage,
    remainingValue,
    projectedDate,
    projectedValueOnGoalDate
  } = metrics;

  return (
    <div className="grid grid-cols-3 gap-6 mb-6 bg-gray-800 p-6 rounded-lg">
      {/* Daily Goal */}
      <div className="text-center text-white mt-3">
        <div className="text-sm text-gray-400">Daily Goal</div>
        <div className="text-lg font-bold">
          {dailyRequired.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">per day</div>
      </div>

      {/* Current with Arc */}
      <div className="text-center text-white">
        <div className="relative w-24 h-24 mx-auto mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="47"
              stroke="rgb(55, 65, 81)"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50" cy="50" r="47"
              stroke="rgb(34, 197, 94)"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={`${(displayPercentage / 100) * 250.8} 250.8`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-sm text-gray-300 ">Current</div>
            <span className="text-md font-bold text-green-400">
              {currentValue.toFixed(1)}
            </span>
            <span className="text-sm text-gray-400">
              {remainingValue.toFixed(1)} to go
            </span>
          </div>
        </div>
      </div>

      {/* Projected */}
      <div className="text-center text-white mt-5">
        <div className="text-sm text-gray-400">Projected</div>
        {projectedDate <= new Date(target.goalDate) ? (
          <>
            <div className="text-lg font-bold">
              {target.goalValue}
            </div>
            <div className="text-xs text-green-400">
              on {projectedDate.toLocaleDateString('en-UK', { month: 'numeric', day: 'numeric', year: '2-digit' })}
            </div>
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-yellow-400">
              {projectedValueOnGoalDate.toFixed(1)}
            </div>
            <div className="text-xs">
              on {new Date(target.goalDate).toLocaleDateString('en-UK', { month: 'numeric', day: 'numeric', year: '2-digit' })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
