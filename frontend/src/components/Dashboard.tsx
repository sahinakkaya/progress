// src/components/Dashboard.tsx - Mobile-style redesigned dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Target, Calendar, Plus, Loader2, Settings, BarChart } from 'lucide-react';
import { habitApi } from '../services/api';
import type { HabitTracker, TargetTracker, Entry } from '../types';
import { useDashboard, useDueCounts } from '../hooks/useDashboard';
import WeeklyCalendar from './WeeklyCalendar';
import CreateHabitForm from './forms/CreateHabitForm';
import CreateTargetForm from './forms/CreateTargetForm';

interface HabitCardProps {
  habit: HabitTracker;
}

function HabitCard({ habit }: HabitCardProps) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[]>([]);

  // Fetch entries for this habit
  React.useEffect(() => {
    const fetchEntries = async () => {
      try {
        const habitEntries = await habitApi.getEntries(habit.id);
        setEntries(habitEntries);
      } catch (error) {
        console.error('Failed to fetch habit entries:', error);
        setEntries([]);
      }
    };
    fetchEntries();
  }, [habit.id]);


  // Calculate period-based status
  const getHabitStatus = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get completed entries only
    const completedEntries = entries.filter(entry => entry.done === true);
    
    if (habit.timePeriod === 'perDay') {
      // Count today's entries
      const todayEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        return entryDay.getTime() === today.getTime();
      });
      
      // Check yesterday's entries
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const entryDay = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());
        return entryDay.getTime() === yesterday.getTime();
      });
      
      const todayCount = Math.min(todayEntries.length, habit.goal);
      const missedYesterday = yesterdayEntries.length < habit.goal;
      
      return {
        statusText: missedYesterday ? 'Missed yesterday' : 'On track',
        progress: `${todayCount}/${habit.goal}`,
        period: 'today'
      };
      
    } else if (habit.timePeriod === 'perWeek') {
      // Current week (Monday to Sunday)
      const startOfWeek = new Date(today);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      // Previous week
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      const endOfLastWeek = new Date(startOfWeek);
      endOfLastWeek.setDate(endOfLastWeek.getDate() - 1);
      
      const thisWeekEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfWeek && entryDate <= endOfWeek;
      });
      
      const lastWeekEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfLastWeek && entryDate <= endOfLastWeek;
      });
      
      const thisWeekCount = Math.min(thisWeekEntries.length, habit.goal);
      const missedLastWeek = lastWeekEntries.length < habit.goal;
      
      return {
        statusText: missedLastWeek ? 'Missed last week' : 'On track',
        progress: `${thisWeekCount}/${habit.goal}`,
        period: 'this week'
      };
      
    } else if (habit.timePeriod === 'perMonth') {
      // Current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Previous month
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      
      const thisMonthEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfMonth && entryDate <= endOfMonth;
      });
      
      const lastMonthEntries = completedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startOfLastMonth && entryDate <= endOfLastMonth;
      });
      
      const thisMonthCount = Math.min(thisMonthEntries.length, habit.goal);
      const missedLastMonth = lastMonthEntries.length < habit.goal;
      
      return {
        statusText: missedLastMonth ? 'Missed last month' : 'On track',
        progress: `${thisMonthCount}/${habit.goal}`,
        period: 'this month'
      };
    }
    
    // Fallback
    return {
      statusText: 'On track',
      progress: `0/${habit.goal}`,
      period: 'today'
    };
  };

  const status = getHabitStatus();

  return (
    <Card 
      className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/habit/${habit.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">
                {habit.trackerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{habit.trackerName}</h3>
              <p className="text-sm text-gray-500">{status.statusText}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-blue-600">
              {status.progress.split('/')[0]}
            </div>
            <div className="text-sm text-gray-500">/{habit.goal}</div>
            <div className="text-xs text-gray-400">{status.period}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TargetCardProps {
  target: TargetTracker;
}

function TargetCard({ target }: TargetCardProps) {
  const navigate = useNavigate();


  const currentValue = target.currentValue ?? target.startValue;
  const goalDate = new Date(target.goalDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Calculate pace - rough estimate based on days
  const totalDays = Math.ceil((new Date(target.goalDate).getTime() - new Date(target.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const daysPassed = Math.ceil((Date.now() - new Date(target.startDate).getTime()) / (1000 * 60 * 60 * 24));
  const expectedProgress = (daysPassed / totalDays) * (target.goalValue - target.startValue) + target.startValue;

  return (
    <Card 
      className="bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/target/${target.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
              <span className="text-sm font-semibold text-teal-600">
                {target.trackerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{target.trackerName}</h3>
              <p className="text-sm text-gray-500">Goal: {target.goalValue} by {goalDate}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-teal-600">{currentValue}</div>
            <div className="text-sm text-teal-500">Pace: {Math.round(expectedProgress * 10) / 10}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [showCreateHabit, setShowCreateHabit] = useState(false);
  const [showCreateTarget, setShowCreateTarget] = useState(false);
  
  const { dashboard, loading, error, refetch, selectedDate, setSelectedDate } = useDashboard();
  const { dueCounts } = useDueCounts(selectedDate);

  useEffect(() => {
    document.title = 'Dashboard | Progress';
    return () => {
      document.title = 'Progress';
    };
  }, []);

  const handleEntryAdded = () => {
    refetch();
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load dashboard</p>
          <Button onClick={refetch}>Try Again</Button>
        </div>
      </div>
    );
  }

  const totalTrackers = (dashboard?.habitTrackers?.length || 0) + (dashboard?.targetTrackers?.length || 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <Settings className="w-6 h-6" />
          <h1 className="text-xl font-semibold">Today</h1>
          <BarChart className="w-6 h-6" />
        </div>
        
        {/* Week Calendar */}
        <WeeklyCalendar 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          dueCounts={dueCounts}
        />
        
        {/* Due count */}
        <div className="text-center mt-4">
          <p className="text-blue-100">Due: {totalTrackers}</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gray-50 min-h-screen p-4 space-y-3">
        {/* Habit Trackers */}
        {dashboard?.habitTrackers?.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
          />
        ))}

        {/* Target Trackers */}
        {dashboard?.targetTrackers?.map(target => (
          <TargetCard
            key={target.id}
            target={target}
          />
        ))}

        {/* Empty state */}
        {totalTrackers === 0 && (
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Calendar className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-500 mb-4">
                {isToday ? 'No trackers due today' : 'No trackers due on this date'}
              </p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateHabit(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Habit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTarget(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Target
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Floating Add Buttons */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="flex space-x-3">
            <Button
              className="rounded-full w-12 h-12 bg-blue-600 hover:bg-blue-700 shadow-lg"
              onClick={() => setShowCreateHabit(true)}
              title="Add Habit"
            >
              <CheckCircle className="w-6 h-6" />
            </Button>
            <Button
              className="rounded-full w-12 h-12 bg-teal-600 hover:bg-teal-700 shadow-lg"
              onClick={() => setShowCreateTarget(true)}
              title="Add Target"
            >
              <Target className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Create Forms */}
        <CreateHabitForm
          open={showCreateHabit}
          onOpenChange={setShowCreateHabit}
          onSuccess={handleEntryAdded}
        />

        <CreateTargetForm
          open={showCreateTarget}
          onOpenChange={setShowCreateTarget}
          onSuccess={handleEntryAdded}
        />
      </div>
    </div>
  );
}