// src/components/detail/targetUtils.ts
import type { TargetTracker, Entry } from '../../types';

export interface TargetMetrics {
  currentValue: number;
  progressPercentage: number;
  displayPercentage: number;
  totalEntries: number;
  averageValue: number;
  daysUntilGoal: number;
  daysActive: number;
  totalDuration: number;
  daysPassed: number;
  expectedProgress: number;
  actualProgress: number;
  aheadPace: boolean;
  pacePercentage: number;
  pace: number;
  remainingValue: number;
  dailyRequired: number;
  projectedDaysToComplete: number;
  projectedDate: Date;
  projectedValueOnGoalDate: number;
}

export const calculateTargetMetrics = (target: TargetTracker, entries: Entry[]): TargetMetrics => {
  // Calculate current value
  const currentValue = target.addToTotal
    ? target.startValue + entries.reduce((sum, entry) => sum + (entry.value || 0), 0)
    : entries.length > 0
      ? entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].value || target.startValue
      : target.startValue;

  // Calculate progress percentage
  const progressPercentage = target.addToTotal
    ? ((currentValue - target.startValue) / (target.goalValue - target.startValue)) * 100
    : ((target.startValue - currentValue) / (target.startValue - target.goalValue)) * 100;

  const displayPercentage = Math.min(Math.max(progressPercentage, 0), 100);

  // Basic stats
  const totalEntries = entries.length;
  const averageValue = totalEntries > 0 ? entries.reduce((sum, entry) => sum + (entry.value || 0), 0) / totalEntries : 0;

  // Date calculations
  const daysUntilGoal = Math.ceil(
    (new Date(target.goalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysActive = Math.ceil(
    (new Date().getTime() - new Date(target.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Pace calculations
  const totalDuration = Math.ceil(
    (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysPassed = Math.max(0, daysActive);
  const expectedProgress = totalDuration > 0 ? (daysPassed / totalDuration) * 100 : 0;
  const actualProgress = displayPercentage;
  const aheadPace = actualProgress >= expectedProgress;
  const pacePercentage = totalDuration > 0 ? (daysPassed / totalDuration) * 100 : 0;
  const pace = (target.goalValue - target.startValue) * pacePercentage / 100 + target.startValue;

  // Remaining calculations
  const remainingValue = Math.max(0, target.goalValue - currentValue);
  const dailyRequired = daysUntilGoal > 0 ? remainingValue / daysUntilGoal : 0;

  // Projected completion
  const projectedDaysToComplete = pacePercentage * totalDuration / actualProgress;
  const projectedDate = new Date(target.startDate);
  projectedDate.setDate(projectedDate.getDate() + projectedDaysToComplete);
  
  // Calculate projected value on goal date based on current daily rate
  const dailyRate = daysActive > 0 ? (currentValue - target.startValue) / daysActive : 0;
  const projectedValueOnGoalDate = target.startValue + (dailyRate * totalDuration);

  return {
    currentValue,
    progressPercentage,
    displayPercentage,
    totalEntries,
    averageValue,
    daysUntilGoal,
    daysActive,
    totalDuration,
    daysPassed,
    expectedProgress,
    actualProgress,
    aheadPace,
    pacePercentage,
    pace,
    remainingValue,
    dailyRequired,
    projectedDaysToComplete,
    projectedDate,
    projectedValueOnGoalDate
  };
};
