// src/components/detail/HabitMetrics.tsx
import React from 'react';
import type { HabitTracker } from '../../types';
import type { StreakData, GoalProgress, BarChartItem } from './habitUtils';

interface HabitMetricsProps {
  habit: HabitTracker;
  streaks: StreakData;
  goalProgress: GoalProgress;
  barChartData: BarChartItem[];
}

export default function HabitMetrics({ habit, streaks, goalProgress, barChartData }: HabitMetricsProps) {
  const getPeriodUnit = () => {
    return habit.timePeriod === 'perDay' ? 'days' : 
           habit.timePeriod === 'perWeek' ? 'weeks' : 'months';
  };

  return (
    <div className="space-y-6">
      {/* Progress Circle and Metrics */}
      <div className="grid grid-cols-3 gap-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Current</div>
          <div className="text-sm text-gray-600 mb-1">Streak</div>
          <div className={`text-2xl font-bold ${streaks.current >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {streaks.current}
          </div>
          <div className="text-xs text-gray-500">
            {getPeriodUnit()}
          </div>
        </div>
        
        {/* Goal Progress Circle */}
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-2">
            <svg className="w-20 h-20" viewBox="0 0 100 100">
              <defs>
                {habit.badHabit && (
                  <linearGradient id="progressGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop 
                      offset={`${goalProgress.percentage}%`} 
                      stopColor="rgb(34, 197, 94)" 
                    />
                    <stop 
                      offset={`${goalProgress.percentage}%`} 
                      stopColor="rgb(239, 68, 68)" 
                    />
                  </linearGradient>
                )}
              </defs>
              
              {/* Border circle */}
              <circle
                cx="50" cy="50" r="40"
                stroke="rgb(229, 231, 235)"
                strokeWidth="2"
                fill="transparent"
              />
              
              {/* Filled circle */}
              <circle
                cx="50" cy="50" r="38"
                fill={
                  habit.badHabit 
                    ? "url(#progressGradient)"
                    : "transparent"
                }
              />
              
              {/* Progress stroke for good habits */}
              {!habit.badHabit && (
                <circle
                  cx="50" cy="50" r="40"
                  stroke="rgb(59, 130, 246)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${(goalProgress.percentage / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={`text-lg font-bold ${habit.badHabit ? 'text-white' : 'text-red-500'}`}>
                %{goalProgress.percentage}
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {habit.badHabit ? 'Under Limit' : 'Goal Met'}<br/>
            {goalProgress.text}
          </div>
        </div>
        
        {/* Best Streak */}
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-1">Best</div>
          <div className="text-sm text-gray-600 mb-1">Streak</div>
          <div className={`text-2xl font-bold ${streaks.best >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {streaks.best}
          </div>
          <div className="text-xs text-gray-500">
            {getPeriodUnit()}
          </div>
        </div>
      </div>
      
      {/* Daily/Weekly Bar Chart */}
      <div className="mb-4">
        <div className="relative">
          <div className="flex items-end justify-center space-x-1 h-32 overflow-x-auto">
            {barChartData.map((item, index) => (
              <div key={index} className="flex flex-col items-center flex-shrink-0">
                {/* Always render bar container for consistent spacing */}
                <div className="w-8 flex items-end justify-center" style={{ height: "100px" }}>
                  {item.count > 0 && (
                    <div 
                      className={`w-8 rounded-t ${
                        habit.badHabit 
                          ? (item.count > habit.goal ? 'bg-red-500' : 'bg-green-500') // For bad habits: red if over limit, green if under/at limit
                          : (item.goalMet ? 'bg-green-500' : 'bg-blue-500') // For good habits: original logic
                      } flex items-start justify-center text-white text-xs font-medium pt-1`}
                      style={{ height: `${Math.max((item.count / item.maxHeight) * 100, 20)}px` }}
                    >
                      {item.count}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 whitespace-nowrap">{item.label}</div>
              </div>
            ))}
          </div>
          
          {/* Goal Target Line */}
          {barChartData.length > 0 && (
            <div 
              className="absolute left-0 right-0 border-t-2 border-red-500 border-dashed"
              style={{ 
                bottom: `${20 + (habit.goal / barChartData[0].maxHeight) * 100}px`,
                left: '10%',
                right: '10%'
              }}
            >
              <div className="absolute -right-8 -top-3 text-xs text-red-500 font-medium">
                {habit.badHabit ? `≤${habit.goal}` : habit.goal}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
