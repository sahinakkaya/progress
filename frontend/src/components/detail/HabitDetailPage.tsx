// src/components/detail/HabitDetailPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, BarChart3, Calendar, FileText } from 'lucide-react';
import { habitApi } from '../../services/api';
import type { HabitTracker, Entry, AddEntryRequest } from '../../types';
import HabitHistory from './HabitHistory';
import HabitNotes from './HabitNotes';
import HabitSettings from './HabitSettings';
import HabitHeader from './HabitHeader';
import HabitQuickEntry from './HabitQuickEntry';
import HabitCalendar from './HabitCalendar';
import HabitMetrics from './HabitMetrics';
import HabitModals from './HabitModals';
import { 
  calculatePeriodData, 
  calculateStreaks, 
  calculateGoalProgress, 
  generateBarChartData 
} from './habitUtils';

export default function HabitDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<HabitTracker | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('charts');
  const [addingEntry, setAddingEntry] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDateEntryModal, setShowDateEntryModal] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showStartDateModal, setShowStartDateModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchHabitDetails();
  }, [id]);

  const fetchHabitDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [habitData, entriesData] = await Promise.all([
        habitApi.getById(parseInt(id)),
        habitApi.getEntries(parseInt(id))
      ]);
      
      setHabit(habitData);
      setEntries(entriesData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch habit details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load habit details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!habit || !window.confirm(`Are you sure you want to delete "${habit.trackerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await habitApi.delete(habit.id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete habit:', err);
      alert('Failed to delete habit. Please try again.');
    }
  };

  const handleUpdate = () => {
    // Only refetch entries, not the entire habit data
    refetchEntries();
  };

  const handleHabitUpdate = async () => {
    // Only refetch habit data, not entries
    if (!id) return;
    
    try {
      const habitData = await habitApi.getById(parseInt(id));
      setHabit(habitData);
    } catch (err) {
      console.error('Failed to fetch habit details:', err);
    }
  };

  const refetchEntries = async () => {
    if (!id) return;
    
    try {
      const entriesData = await habitApi.getEntries(parseInt(id));
      setEntries(entriesData);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  };

  const handleQuickEntry = async (completed: boolean) => {
    if (!habit) return;
    
    setAddingEntry(true);
    try {
      const now = new Date();
      const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
      const entryData: AddEntryRequest = {
        done: completed,
        date: todayUTC.toISOString(),
        note: `Quick entry: ${
          habit.badHabit 
            ? (completed ? 'Yes' : 'No')
            : (completed ? 'Completed' : 'Missed')
        } from detail page`
      };

      const newEntry = await habitApi.addEntry(habit.id, entryData);
      
      // Optimistic update - add entry immediately to avoid full refetch
      setEntries(prevEntries => [...prevEntries, newEntry]);
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Failed to add entry. Please try again.');
      // On error, refetch to ensure consistency
      refetchEntries();
    } finally {
      setAddingEntry(false);
    }
  };

  const handleDateClick = (dateStr: string, event: React.MouseEvent) => {
    if (!habit) return;
    
    const clickedDate = new Date(dateStr);
    const habitStartDate = new Date(habit.startDate);
    
    if (clickedDate < habitStartDate) {
      setSelectedDate(dateStr);
      setShowStartDateModal(true);
    } else {
      setSelectedDate(dateStr);
      setMousePosition({ x: event.clientX, y: event.clientY });
      setShowDateEntryModal(true);
    }
  };

  const handleDateEntry = async (completed: boolean) => {
    if (!habit || !selectedDate) return;
    
    setAddingEntry(true);
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      const selectedDateTime = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const entryData: AddEntryRequest = {
        done: completed,
        date: selectedDateTime.toISOString(),
        note: `Entry for ${new Date(selectedDate).toLocaleDateString()}: ${completed ? 'Completed' : 'Missed'}`
      };

      const newEntry = await habitApi.addEntry(habit.id, entryData);
      
      // Optimistic update - add entry immediately
      setEntries(prevEntries => [...prevEntries, newEntry]);
      setShowDateEntryModal(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Failed to add entry. Please try again.');
      // On error, refetch to ensure consistency
      refetchEntries();
    } finally {
      setAddingEntry(false);
    }
  };

  const handleChangeStartDate = async () => {
    if (!habit || !selectedDate) return;
    
    try {
      const updateData = {
        trackerName: habit.trackerName,
        goal: habit.goal,
        timePeriod: habit.timePeriod,
        startDate: selectedDate,
        goalStreak: habit.goalStreak,
        badHabit: habit.badHabit,
        due: habit.due
      };

      await habitApi.update(habit.id, updateData);
      
      // Optimistic update - update habit immediately
      setHabit(prevHabit => prevHabit ? { ...prevHabit, startDate: selectedDate } : null);
      setShowStartDateModal(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Failed to update start date:', error);
      alert('Failed to update start date. Please try again.');
      // On error, refetch to ensure consistency
      fetchHabitDetails();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading habit details...</div>
      </div>
    );
  }

  if (error || !habit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Habit</h2>
          <p className="text-gray-600 mb-4">{error || 'Habit not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Calculate stats and metrics
  const totalEntries = entries.length;
  const completedEntries = entries.filter(entry => entry.done).length;
  const completionRate = totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0;
  
  // Calculate current streak (simple version for header)
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentStreak = 0;
  for (const entry of sortedEntries) {
    if (entry.done) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate all metrics using helper functions
  const periods = calculatePeriodData(
    habit.timePeriod, 
    new Date(habit.startDate), 
    new Date(), 
    entries, 
    habit.goal,
    habit.badHabit || false
  );
  
  const streaks = calculateStreaks(periods);
  const goalProgress = calculateGoalProgress(
    periods, 
    habit.timePeriod === 'perDay' ? 'days' : 
    habit.timePeriod === 'perWeek' ? 'weeks' : 'months'
  );
  const barChartData = generateBarChartData(
    habit.timePeriod,
    entries,
    habit.goal,
    new Date(habit.startDate),
    new Date(),
    habit.badHabit || false
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <HabitHeader
          habit={habit}
          totalEntries={totalEntries}
          completedEntries={completedEntries}
          completionRate={completionRate}
          currentStreak={currentStreak}
          onBack={() => navigate('/dashboard')}
          onDelete={handleDelete}
        />

        <HabitQuickEntry
          habit={habit}
          addingEntry={addingEntry}
          onQuickEntry={handleQuickEntry}
          onDetailedEntry={() => setActiveTab('history')}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <HabitCalendar
                  habit={habit}
                  entries={entries}
                  onDateClick={handleDateClick}
                />
                
                <HabitMetrics
                  habit={habit}
                  streaks={streaks}
                  goalProgress={goalProgress}
                  barChartData={barChartData}
                />
              </CardContent>
            </Card>
            
          </TabsContent>

          <TabsContent value="history">
            <HabitHistory habit={habit} entries={entries} onUpdate={handleUpdate} />
          </TabsContent>

          <TabsContent value="notes">
            <HabitNotes habit={habit} entries={entries} />
          </TabsContent>

          <TabsContent value="settings">
            <HabitSettings habit={habit} onUpdate={handleHabitUpdate} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </div>

      <HabitModals
        habit={habit}
        showDateEntryModal={showDateEntryModal}
        showStartDateModal={showStartDateModal}
        selectedDate={selectedDate}
        mousePosition={mousePosition}
        addingEntry={addingEntry}
        onDateEntry={handleDateEntry}
        onChangeStartDate={handleChangeStartDate}
        onCloseDateEntryModal={() => {
          setShowDateEntryModal(false);
          setSelectedDate(null);
        }}
        onCloseStartDateModal={() => {
          setShowStartDateModal(false);
          setSelectedDate(null);
        }}
      />
    </div>
  );
}
