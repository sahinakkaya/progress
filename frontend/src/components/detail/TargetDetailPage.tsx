// src/components/detail/TargetDetailPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, BarChart3, Calendar, FileText, Loader2 } from 'lucide-react';
import { targetApi } from '../../services/api';
import type { TargetTracker, Entry, AddEntryRequest } from '../../types';
import TargetCharts from './TargetCharts';
import TargetHistory from './TargetHistory';
import TargetNotes from './TargetNotes';
import TargetSettings from './TargetSettings';
import TargetHeader from './TargetHeader';
import TargetPaceSection from './TargetPaceSection';
import TargetProgressIndicators from './TargetProgressIndicators';
import TargetAddEntryModal from './TargetAddEntryModal';
import { calculateTargetMetrics } from './targetUtils';

export default function TargetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [target, setTarget] = useState<TargetTracker | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('charts');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [lineVisibility, setLineVisibility] = useState({
    progress: true,
    target: true,
    trend: true
  });
  const [newEntry, setNewEntry] = useState({
    value: '',
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!id) return;
    fetchTargetDetails();
  }, [id]);

  useEffect(() => {
    if (target) {
      document.title = `${target.trackerName} | Progress`;
    }
    return () => {
      document.title = 'Progress';
    };
  }, [target]);

  const fetchTargetDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const [targetData, entriesData] = await Promise.all([
        targetApi.getById(parseInt(id)),
        targetApi.getEntries(parseInt(id))
      ]);

      setTarget(targetData);
      setEntries(entriesData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch target details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load target details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!target || !window.confirm(`Are you sure you want to delete "${target.trackerName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await targetApi.delete(target.id);
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to delete target:', err);
      alert('Failed to delete target. Please try again.');
    }
  };

  const handleUpdate = () => {
    // Only refetch entries, not the entire target data
    refetchEntries();
  };

  const handleTargetUpdate = async () => {
    // Only refetch target data, not entries
    if (!id) return;
    
    try {
      const targetData = await targetApi.getById(parseInt(id));
      setTarget(targetData);
    } catch (err) {
      console.error('Failed to fetch target details:', err);
    }
  };

  const refetchEntries = async () => {
    if (!id) return;
    
    try {
      const entriesData = await targetApi.getEntries(parseInt(id));
      setEntries(entriesData);
    } catch (err) {
      console.error('Failed to fetch entries:', err);
    }
  };

  const handleAddEntry = async () => {
    if (!target) return;

    const numValue = parseFloat(newEntry.value);
    if (isNaN(numValue) || numValue <= 0) {
      alert('Please enter a valid value greater than 0');
      return;
    }

    try {
      const selectedDate = new Date(newEntry.date);
      const now = new Date();
      selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      
      const entryData: AddEntryRequest = {
        value: numValue,
        date: selectedDate.toISOString(),
        note: newEntry.note || undefined
      };

      const newEntryResult = await targetApi.addEntry(target.id, entryData);
      
      // Optimistic update - add entry immediately
      setEntries(prevEntries => [...prevEntries, newEntryResult]);
      setNewEntry({ value: '', note: '', date: new Date().toISOString().split('T')[0] });
      setShowAddEntry(false);
    } catch (error) {
      console.error('Failed to add entry:', error);
      alert('Failed to add entry. Please try again.');
      // On error, refetch to ensure consistency
      refetchEntries();
    }
  };

  const updateNewEntry = (updates: Partial<typeof newEntry>) => {
    setNewEntry(prev => ({ ...prev, ...updates }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading target details...</span>
        </div>
      </div>
    );
  }

  if (error || !target) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Target</h2>
          <p className="text-gray-600 mb-4">{error || 'Target not found'}</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Calculate all metrics using helper function
  const metrics = calculateTargetMetrics(target, entries);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <TargetHeader
          target={target}
          onBack={() => navigate('/dashboard')}
          onDelete={handleDelete}
          onAddEntry={() => setShowAddEntry(true)}
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
            <TargetPaceSection target={target} metrics={metrics} />
            <TargetProgressIndicators target={target} metrics={metrics} />
            <TargetCharts 
              target={target} 
              entries={entries} 
              projectedDate={metrics.projectedDate} 
              lineVisibility={lineVisibility}
              onToggleLine={(lineType) => 
                setLineVisibility(prev => ({ ...prev, [lineType]: !prev[lineType] }))
              }
            />
          </TabsContent>

          <TabsContent value="history">
            <TargetHistory target={target} entries={entries} onUpdate={handleUpdate} />
          </TabsContent>

          <TabsContent value="notes">
            <TargetNotes target={target} entries={entries} />
          </TabsContent>

          <TabsContent value="settings">
            <TargetSettings target={target} onUpdate={handleTargetUpdate} onDelete={handleDelete} />
          </TabsContent>
        </Tabs>
      </div>

      <TargetAddEntryModal
        show={showAddEntry}
        newEntry={newEntry}
        onUpdateEntry={updateNewEntry}
        onSubmit={handleAddEntry}
        onCancel={() => setShowAddEntry(false)}
      />
    </div>
  );
}
