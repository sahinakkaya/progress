import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { TargetTracker, Entry } from '../../types';
import { calculateTargetMetrics } from '../detail/targetUtils';

interface TargetCardProps {
  target: TargetTracker;
  entries: Entry[];
  selectedDate: Date;
  onQuickLog: (value: number) => void;
}

export default function TargetCard({ target, entries, selectedDate, onQuickLog }: TargetCardProps) {
  const navigate = useNavigate();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [hasStartedSwipe, setHasStartedSwipe] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startX = useRef(0);
  const SWIPE_THRESHOLD = 80;

  const metrics = calculateTargetMetrics(target, entries);
  const goalDate = new Date(target.goalDate).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });

  // Check if target has entry for selected date
  const selectedDateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
  const todayEntry = entries.find(entry => entry.date.split('T')[0] === selectedDateString);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
    setHasStartedSwipe(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Mark as swipe if moved more than 10px
    if (Math.abs(diff) > 10) {
      setHasStartedSwipe(true);
    }
    
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setSwipeOffset(clampedOffset);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      setShowPopup(true);
    }
    
    setSwipeOffset(0);
    setTimeout(() => setHasStartedSwipe(false), 100);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
    setHasStartedSwipe(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const diff = e.clientX - startX.current;
    
    // Mark as swipe if moved more than 10px
    if (Math.abs(diff) > 10) {
      setHasStartedSwipe(true);
    }
    
    const maxOffset = 120;
    const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    setSwipeOffset(clampedOffset);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(swipeOffset) > SWIPE_THRESHOLD) {
      setShowPopup(true);
    }
    
    setSwipeOffset(0);
    setTimeout(() => setHasStartedSwipe(false), 100);
  };

  const handleClick = () => {
    if (!hasStartedSwipe && Math.abs(swipeOffset) < 5 && !isLogging) {
      navigate(`/target/${target.id}`);
    }
  };

  const handleQuickLog = async () => {
    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0) return;
    
    setIsLogging(true);
    try {
      await onQuickLog(value);
      setInputValue('');
      setShowPopup(false);
    } catch (error) {
      console.error('Failed to create target entry:', error);
    } finally {
      setIsLogging(false);
    }
  };

  // Auto-focus input when popup opens
  useEffect(() => {
    if (showPopup && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [showPopup]);

  return (
    <>
      <div
        ref={cardRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background action indicators */}
        <div className="absolute inset-0 flex rounded-lg overflow-hidden">
          {/* Left background - quick entry */}
          <div className={`flex-1 bg-blue-500 flex items-center justify-start pl-6 transition-opacity duration-200 ${
            Math.abs(swipeOffset) > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-60'
          }`}>
            <span className="text-white font-medium">+ Add Entry</span>
          </div>
          {/* Right background - quick entry */}
          <div className={`flex-1 bg-blue-500 flex items-center justify-end pr-6 transition-opacity duration-200 ${
            Math.abs(swipeOffset) > SWIPE_THRESHOLD ? 'opacity-100' : 'opacity-60'
          }`}>
            <span className="text-white font-medium">Add Entry +</span>
          </div>
        </div>
        
        <Card 
          className={`bg-white border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative rounded-lg ${
            isLogging ? 'opacity-75' : ''
          }`}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
          }}
          onClick={handleClick}
          data-card-id={`target-${target.id}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="flex items-center justify-between flex-1 min-w-0">
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
                  <div className="text-2xl font-semibold text-blue-500">{metrics.currentValue}</div>
                  <div className={metrics.currentValue > metrics.pace ? "text-md text-green-500" : "text-md text-red-500"}>Pace: {Math.round(metrics.pace * 10) / 10}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Entry Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 m-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">{target.trackerName}</h3>
            <div className="space-y-4">
              {todayEntry && (
                <div className="text-sm text-gray-600">
                  Current entry: {todayEntry.value}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Enter value:
                </label>
                <input
                  ref={inputRef}
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue && !isNaN(parseFloat(inputValue)) && parseFloat(inputValue) > 0) {
                      handleQuickLog();
                    }
                    if (e.key === 'Escape') {
                      setShowPopup(false);
                      setInputValue('');
                    }
                  }}
                  placeholder="Enter value"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  disabled={isLogging}
                />
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    setShowPopup(false);
                    setInputValue('');
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={isLogging}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQuickLog}
                  disabled={isLogging || !inputValue || isNaN(parseFloat(inputValue)) || parseFloat(inputValue) <= 0}
                  className="flex-1"
                >
                  {isLogging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Add Entry'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}