// src/components/detail/TargetCharts.tsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

import type { TargetTracker, Entry } from '../../types';

interface LegendItemProps {
  color: string;
  label: string;
  visible: boolean;
  onClick: () => void;
  lineStyle: 'solid' | 'dashed';
}

function LegendItem({ color, label, visible, onClick, lineStyle }: LegendItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2 py-1 rounded text-sm transition-opacity ${
        visible ? 'opacity-100' : 'opacity-50'
      } hover:opacity-75`}
    >
      <div className="w-6 h-3 flex items-center justify-center">
        {lineStyle === 'dashed' ? (
          <div
            className="w-full h-0.5"
            style={{ 
              background: visible 
                ? `repeating-linear-gradient(to right, ${color} 0px, ${color} 3px, transparent 3px, transparent 6px)`
                : `repeating-linear-gradient(to right, transparent 0px, transparent 3px, ${color} 3px, ${color} 4px, transparent 4px, transparent 6px)`,
            }}
          />
        ) : (
          <div
            className="w-full h-0.5"
            style={{ 
              backgroundColor: visible ? color : 'transparent', 
              border: visible ? 'none' : `1px solid ${color}`,
              borderWidth: visible ? '0' : '1px 0'
            }}
          />
        )}
      </div>
      <span className="text-gray-300">{label}</span>
    </button>
  );
}

interface TargetChartsProps {

  target: TargetTracker;

  entries: Entry[];

  projectedDate: Date;
  lineVisibility: {
    progress: boolean;
    target: boolean;
    trend: boolean;
  };
  onToggleLine: (lineType: 'progress' | 'target' | 'trend') => void;
}

export default function TargetCharts({ target, entries, projectedDate, lineVisibility, onToggleLine }: TargetChartsProps) {

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

    if (lineVisibility.trend) {
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
    }



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

  // Calculate dynamic X-axis ticks based on actual data range
  const generateXAxisTicks = () => {
    if (!target.startDate || !target.goalDate) return [];
    
    const startTime = new Date(target.startDate).getTime();
    const goalTime = new Date(target.goalDate).getTime();
    const projectedTime = projectedDate.getTime();
    
    // Base ticks always include start and goal
    const baseTicks = [startTime, goalTime];
    
    // Add projected date only if trend line is shown
    if (lineVisibility.trend) {
      baseTicks.push(projectedTime);
    }
    
    // Add quarter points for better granularity
    const duration = goalTime - startTime;
    baseTicks.push(startTime + duration * 0.25);
    baseTicks.push(startTime + duration * 0.5);
    baseTicks.push(startTime + duration * 0.75);
    
    return baseTicks.sort((a, b) => a - b);
  };

  // Smart date formatter that includes year only when different from current year
  const formatTickDate = (value: number) => {
    const date = new Date(value);
    const dateYear = date.getFullYear();
    const currentYear = new Date().getFullYear();
    
    // Only show year if it's different from current year
    if (dateYear !== currentYear) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

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
      <div className="flex justify-end items-center mb-4 px-6">
        <div className="flex items-center gap-4">
          <LegendItem 
            color="rgb(59, 130, 246)" 
            label="Progress" 
            visible={lineVisibility.progress}
            onClick={() => onToggleLine('progress')}
            lineStyle="solid"
          />
          <LegendItem 
            color="rgb(34, 197, 94)" 
            label="Target" 
            visible={lineVisibility.target}
            onClick={() => onToggleLine('target')}
            lineStyle="dashed"
          />
          <LegendItem 
            color="rgb(197, 34, 94)" 
            label="Trend" 
            visible={lineVisibility.trend}
            onClick={() => onToggleLine('trend')}
            lineStyle="dashed"
          />
        </div>
      </div>

      <div className="h-64">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={combinedData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>

            <CartesianGrid strokeDasharray="3 3" stroke="rgb(75, 85, 99)" />

            <XAxis
              dataKey="dateTime"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              ticks={generateXAxisTicks()}
              // ticks={[]}
              tick={{ fontSize: 10, fill: 'rgb(156, 163, 175)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatTickDate}
            />

            <YAxis

              domain={[target.startValue, target.goalValue]}

              tick={{ fontSize: 10, fill: 'rgb(156, 163, 175)' }}

              axisLine={false}

              tickLine={false}

            />

            {/* Actual progress line */}
            {lineVisibility.progress && (
              <Line

                type="monotone"

                dataKey="value"

                stroke="rgb(59, 130, 246)"

                strokeWidth={2}

                dot={{ fill: 'rgb(59, 130, 246)', strokeWidth: 1, r: 1.2 }}

                activeDot={{ r: 4, stroke: 'rgb(59, 130, 246)', strokeWidth: 1 }}

                connectNulls={false}

              />
            )}

            {/* Target line */}
            {lineVisibility.target && (
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
            )}
            {lineVisibility.trend && (
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
            )}

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>

  );

}

