// src/components/detail/targetUtils.ts
import type { TargetTracker, Entry, TrendWeightType } from '../../types';

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

/**
 * Calculate weighted linear regression (least squares fit) for the data points
 * Returns slope and intercept for the best-fit line: y = slope * x + intercept
 *
 * @param points - Array of {x, y} data points
 * @param weightType - Type of weighting to apply to recent data
 *   - 'none': All points equal weight (standard linear regression)
 *   - 'linear': Weight = 1 + i (5x ratio)
 *   - 'sqrt': Weight = 1 + sqrt(i) (3x ratio)
 *   - 'quadratic': Weight = 1 + (i/n)² (1.6x ratio)
 *   - 'exponential_low': Weight = exp(i/n) (2.7x ratio)
 *   - 'exponential_high': Weight = exp(2*i/n) (7.4x ratio)
 */
export function calculateLinearRegression(
  points: Array<{ x: number; y: number }>,
  weightType: TrendWeightType = 'none'
): { slope: number; intercept: number } {
  if (points.length < 2) {
    return { slope: 0, intercept: 0 };
  }

  const n = points.length;

  // Generate weights based on selected type
  const weights = points.map((_, i) => {
    switch (weightType) {
      case 'none':
        return 1;
      case 'linear':
        return 1 + i;
      case 'sqrt':
        return 1 + Math.sqrt(i);
      case 'quadratic':
        return 1 + Math.pow(i / n, 2);
      case 'exponential_low':
        return Math.exp(i / n);
      case 'exponential_high':
        return Math.exp(2 * i / n);
      default:
        return 1;
    }
  });

  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;
  let sumWXY = 0;
  let sumWX2 = 0;

  for (let i = 0; i < n; i++) {
    const w = weights[i];
    const x = points[i].x;
    const y = points[i].y;

    sumW += w;
    sumWX += w * x;
    sumWY += w * y;
    sumWXY += w * x * y;
    sumWX2 += w * x * x;
  }

  // Weighted least squares formulas
  const slope = (sumW * sumWXY - sumWX * sumWY) / (sumW * sumWX2 - sumWX * sumWX);
  const intercept = (sumWY - slope * sumWX) / sumW;

  return { slope, intercept };
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

  // Projected completion using linear regression
  let projectedDate = new Date(target.goalDate);
  let projectedValueOnGoalDate = target.goalValue;
  let projectedDaysToComplete = totalDuration;

  if (entries.length >= 2) {
    // Sort entries by date
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Build progress data points
    const progressPoints = sortedEntries.map((entry, index) => {
      let cumulativeValue;
      if (target.addToTotal) {
        cumulativeValue = target.startValue + sortedEntries.slice(0, index + 1).reduce((sum, e) => sum + (e.value || 0), 0);
      } else {
        cumulativeValue = entry.value || 0;
      }

      return {
        x: new Date(entry.date).getTime(),
        y: cumulativeValue
      };
    });

    // Calculate linear regression with user's preferred weighting
    const regression = calculateLinearRegression(progressPoints, target.trendWeightType || 'none');

    // Calculate when the trend line will reach the goal value
    // goalValue = slope * time + intercept
    // time = (goalValue - intercept) / slope
    if (regression.slope !== 0) {
      const projectedTime = (target.goalValue - regression.intercept) / regression.slope;
      projectedDate = new Date(projectedTime);

      // Calculate days from start
      const projectedMillis = projectedTime - new Date(target.startDate).getTime();
      projectedDaysToComplete = projectedMillis / (1000 * 60 * 60 * 24);
    }

    // Calculate projected value on goal date using regression
    const goalTime = new Date(target.goalDate).getTime();
    projectedValueOnGoalDate = regression.slope * goalTime + regression.intercept;
  } else {
    // Fallback to old calculation if not enough data
    projectedDaysToComplete = pacePercentage > 0 && actualProgress > 0
      ? pacePercentage * totalDuration / actualProgress
      : totalDuration;
    projectedDate = new Date(target.startDate);
    projectedDate.setDate(projectedDate.getDate() + projectedDaysToComplete);

    const dailyRate = daysActive > 0 ? (currentValue - target.startValue) / daysActive : 0;
    projectedValueOnGoalDate = target.startValue + (dailyRate * totalDuration);
  }

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
