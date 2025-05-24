// src/components/detail/HabitModals.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import type { HabitTracker } from '../../types';

interface HabitModalsProps {
  habit: HabitTracker;
  showDateEntryModal: boolean;
  showStartDateModal: boolean;
  selectedDate: string | null;
  mousePosition: { x: number; y: number };
  addingEntry: boolean;
  onDateEntry: (completed: boolean) => Promise<void>;
  onChangeStartDate: () => Promise<void>;
  onCloseDateEntryModal: () => void;
  onCloseStartDateModal: () => void;
}

export default function HabitModals({
  habit,
  showDateEntryModal,
  showStartDateModal,
  selectedDate,
  mousePosition,
  addingEntry,
  onDateEntry,
  onChangeStartDate,
  onCloseDateEntryModal,
  onCloseStartDateModal
}: HabitModalsProps) {
  return (
    <>
      {/* Date Entry Popup */}
      {showDateEntryModal && selectedDate && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={onCloseDateEntryModal}
          />
          <div 
            className="fixed bg-white rounded-lg shadow-lg border z-50 p-2"
            style={{ 
              left: `${mousePosition.x - 60}px`, 
              top: `${mousePosition.y - 80}px`,
              minWidth: '120px'
            }}
          >
            <div className="flex flex-col gap-1">
              <Button
                onClick={() => onDateEntry(true)}
                disabled={addingEntry}
                size="sm"
                className={habit.badHabit ? "bg-red-600 hover:bg-red-700 text-white text-xs" : "bg-green-600 hover:bg-green-700 text-white text-xs"}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                {habit.badHabit ? 'Yes' : 'Completed'}
              </Button>
              <Button
                onClick={() => onDateEntry(false)}
                disabled={addingEntry}
                size="sm"
                variant="outline"
                className={habit.badHabit ? "border-green-300 text-green-600 hover:bg-green-50 text-xs" : "border-red-300 text-red-600 hover:bg-red-50 text-xs"}
              >
                {habit.badHabit ? 'No' : 'Missed'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Start Date Change Modal */}
      {showStartDateModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center">Change Start Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-gray-600">
                This tracker doesn't begin until <strong>{new Date(habit.startDate).toLocaleDateString()}</strong>.
              </p>
              <p className="text-center text-gray-600">
                Do you want to change the start date to <strong>{new Date(selectedDate).toLocaleDateString()}</strong>?
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onCloseStartDateModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onChangeStartDate}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}