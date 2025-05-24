// src/components/detail/TargetCharts.tsx

import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Progress } from '@/components/ui/progress';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';

import type { TargetTracker, Entry } from '../../types';

interface TargetChartsProps {

  target: TargetTracker;

  entries: Entry[];

  projectedDate: Date;
}

export default function TargetCharts({ target, entries, projectedDate }: TargetChartsProps) {

  // Prepare data for different charts

  const sortedEntries = [...entries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Progress over time data

  const progressData = sortedEntries.map((entry, index) => {

    let cumulativeValue;

    if (target.addToTotal) {

      // For cumulative targets, add up all previous values

      cumulativeValue = target.startValue + sortedEntries.slice(0, index + 1).reduce((sum, e) => sum + (e.value || 0), 0);

    } else {

      // For replacement targets, use the current entry value

      cumulativeValue = entry.value || 0;

    }

    return {

      dateTime: new Date(entry.date).getTime(),

      dateLabel: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

      value: cumulativeValue,

      entryValue: entry.value || 0

    };

  });

  // Create target line data points

  const combinedData = [];



  // Add target line points if dates are available

  if (target.startDate && target.goalDate) {

    const startDate = new Date(target.startDate);

    const goalDate = new Date(target.goalDate);



    combinedData.push({

      dateTime: startDate.getTime(),

      dateLabel: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

      targetValue: target.startValue,

      value: null

    });

    combinedData.push({

      dateTime: startDate.getTime(),

      dateLabel: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

      projectedValue: target.startValue,

      value: null

    });
    combinedData.push({

      dateTime: projectedDate.getTime(),

      dateLabel: projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

      projectedValue: target.goalValue,

      value: null

    });



    combinedData.push({

      dateTime: goalDate.getTime(),

      dateLabel: goalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

      targetValue: target.goalValue,

      value: null

    });

  }



  // Add all progress data points

  progressData.forEach(point => {

    combinedData.push({

      ...point,

      targetValue: null,
      projectedValue: null,

    });

  });



  // Sort combined data by timestamp

  combinedData.sort((a, b) => a.dateTime - b.dateTime);

  if (progressData.length === 0) {

    return (

      <div className="bg-gray-800 p-6 rounded-lg text-center">

        <div className="text-gray-400 mb-4">

          📊

        </div>

        <h3 className="text-lg font-medium text-white mb-2">No Data Yet</h3>

        <p className="text-gray-400">

          Start logging entries to see your progress charts and statistics.

        </p>

      </div>

    );

  }

  return (

    <div className="bg-gray-800 pt-6 pr-6 rounded-lg">

      <div className="h-64">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={combinedData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>

            <CartesianGrid strokeDasharray="3 3" stroke="rgb(75, 85, 99)" />

            <XAxis
              dataKey="dateTime"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={[
                new Date(projectedDate).getTime(),
                new Date(target.startDate).getTime(),
                new Date(target.startDate).getTime() + (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) * 0.25,
                new Date(target.startDate).getTime() + (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) * 0.5,
                new Date(target.startDate).getTime() + (new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) * 0.75,
                new Date(target.goalDate).getTime(),
              ].sort((a, b) => a - b)}
              // ticks={[]}
              tick={{ fontSize: 10, fill: 'rgb(156, 163, 175)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />

            <YAxis

              domain={[target.startValue, target.goalValue]}

              tick={{ fontSize: 10, fill: 'rgb(156, 163, 175)' }}

              axisLine={false}

              tickLine={false}

            />

            {/* Actual progress line */}

            <Line

              type="monotone"

              dataKey="value"

              stroke="rgb(59, 130, 246)"

              strokeWidth={2}

              dot={{ fill: 'rgb(59, 130, 246)', strokeWidth: 1, r: 1.2 }}

              activeDot={{ r: 4, stroke: 'rgb(59, 130, 246)', strokeWidth: 1 }}

              connectNulls={false}

            />

            {/* Target line */}

            <Line

              type="monotone"

              dataKey="targetValue"

              stroke="rgb(34, 197, 94)"

              strokeWidth={2}

              strokeDasharray="5 5"

              dot={{ fill: 'rgb(34, 197, 94)', strokeWidth: 0, r: 3 }}

              activeDot={{ r: 4, stroke: 'rgb(34, 197, 94)', strokeWidth: 1 }}

              connectNulls={true}

            />
            <Line

              type="monotone"

              dataKey="projectedValue"

              stroke="rgb(197, 34, 94)"

              strokeWidth={2}

              strokeDasharray="5 5"

              dot={{ fill: 'rgb(197, 34, 94)', strokeWidth: 0, r: 3 }}

              activeDot={{ r: 4, stroke: 'rgb(197, 34, 94)', strokeWidth: 1 }}

              connectNulls={true}

            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

// Helper function to get weekly progress data

function getWeeklyProgressData(entries: Entry[], target: TargetTracker) {

  const weekMap = new Map<string, { totalValue: number; entries: number }>();

  entries.forEach(entry => {

    const date = new Date(entry.date);

    const weekStart = new Date(date);

    const day = weekStart.getDay();

    const daysToSubtract = day === 0 ? 6 : day - 1;

    weekStart.setDate(date.getDate() - daysToSubtract);

    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {

      weekMap.set(weekKey, { totalValue: 0, entries: 0 });

    }

    const week = weekMap.get(weekKey)!;

    week.entries++;

    week.totalValue += entry.value || 0;

  });

  return Array.from(weekMap.entries())

    .sort(([a], [b]) => a.localeCompare(b))

    .map(([key, data]) => ({

      week: new Date(key).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),

      ...data

    }));

}
