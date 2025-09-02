// src/components/Dashboard.tsx - Mobile-style redesigned dashboard
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Target, Calendar, Plus, Loader2, Settings, BarChart } from 'lucide-react';
import { habitApi, targetApi } from '../services/api';
import { useDashboard, useDueCounts } from '../hooks/useDashboard';
import { useDashboardEntries } from '../hooks/useDashboardEntries';
import WeeklyCalendar from './WeeklyCalendar';
import CreateHabitForm from './forms/CreateHabitForm';
import CreateTargetForm from './forms/CreateTargetForm';
import HabitCard from './dashboard/HabitCard';
import TargetCard from './dashboard/TargetCard';

export default function Dashboard() {
  const [showCreateHabit, setShowCreateHabit] = useState(false);
  const [showCreateTarget, setShowCreateTarget] = useState(false);
  
  const { dashboard, loading, error, refetch, selectedDate, setSelectedDate } = useDashboard();
  const { dueCounts } = useDueCounts(selectedDate);
  const { habitEntries, targetEntries, habitNeedsAction, targetNeedsAction, refetchEntries } = useDashboardEntries(dashboard, selectedDate);

  useEffect(() => {
    document.title = 'Dashboard | Progress';
    return () => {
      document.title = 'Progress';
    };
  }, []);

  const handleEntryAdded = () => {
    refetch();
    // Small delay to ensure the new entry is saved before refetching
    setTimeout(refetchEntries, 100);
  };

  const handleHabitQuickLog = async (habitId: number, done: boolean) => {
    try {
      const selectedDateTime = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 12, 0, 0));
      await habitApi.addEntry(habitId, {
        date: selectedDateTime.toISOString(),
        done: done
      });
      handleEntryAdded();
    } catch (error) {
      console.error('Failed to create habit entry:', error);
    }
  };

  const handleTargetQuickLog = async (targetId: number, value: number) => {
    try {
      const entryDate = new Date(selectedDate);
      const now = new Date();
      entryDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      await targetApi.addEntry(targetId, {
        date: entryDate.toISOString(),
        value: value
      });
      handleEntryAdded();
    } catch (error) {
      console.error('Failed to create target entry:', error);
    }
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

  // Group trackers by action status
  const habitsNeedingAction = dashboard?.habitTrackers?.filter(habitNeedsAction) || [];
  const habitsCompleted = dashboard?.habitTrackers?.filter(habit => !habitNeedsAction(habit)) || [];
  const targetsNeedingAction = dashboard?.targetTrackers?.filter(targetNeedsAction) || [];
  const targetsCompleted = dashboard?.targetTrackers?.filter(target => !targetNeedsAction(target)) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-700">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <Settings className="w-6 h-6" />
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">
              {isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </h1>
            {!isToday && (
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-sm bg-blue-500 hover:bg-blue-400 px-3 py-1 rounded-full transition-colors"
              >
                Go to Today
              </button>
            )}
          </div>
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
      <div className="bg-gray-50 min-h-screen p-4 space-y-6">
        {/* Trackers Needing Action */}
        {(habitsNeedingAction.length > 0 || targetsNeedingAction.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-700 px-2">Needs Action</h2>
            {habitsNeedingAction.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                entries={habitEntries.get(habit.id) || []}
                selectedDate={selectedDate}
                onQuickLog={(done: boolean) => handleHabitQuickLog(habit.id, done)}
              />
            ))}
            {targetsNeedingAction.map(target => (
              <TargetCard
                key={target.id}
                target={target}
                entries={targetEntries.get(target.id) || []}
                selectedDate={selectedDate}
                onQuickLog={(value: number) => handleTargetQuickLog(target.id, value)}
              />
            ))}
          </div>
        )}

        {/* Completed Trackers */}
        {(habitsCompleted.length > 0 || targetsCompleted.length > 0) && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-700 px-2">Completed</h2>
            {habitsCompleted.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                entries={habitEntries.get(habit.id) || []}
                selectedDate={selectedDate}
                onQuickLog={(done: boolean) => handleHabitQuickLog(habit.id, done)}
              />
            ))}
            {targetsCompleted.map(target => (
              <TargetCard
                key={target.id}
                target={target}
                entries={targetEntries.get(target.id) || []}
                selectedDate={selectedDate}
                onQuickLog={(value: number) => handleTargetQuickLog(target.id, value)}
              />
            ))}
          </div>
        )}

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