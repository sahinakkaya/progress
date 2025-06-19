// src/components/detail/TargetAddEntryModal.tsx
import { DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface TargetAddEntryModalProps {
  show: boolean;
  newEntry: {
    value: string;
    note: string;
    date: string;
  };
  onUpdateEntry: (updates: Partial<{ value: string; note: string; date: string; }>) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function TargetAddEntryModal({
  show,
  newEntry,
  onUpdateEntry,
  onSubmit,
  onCancel
}: TargetAddEntryModalProps) {
  return (
    <DialogPrimitive.Root open={show} onOpenChange={(open) => !open && onCancel()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/20" />
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Entry</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newEntry.value}
                  onChange={(e) => onUpdateEntry({ value: e.target.value })}
                  placeholder="Enter value"
                />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => onUpdateEntry({ date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea
                placeholder="Add a note about this entry"
                value={newEntry.note}
                onChange={(e) => onUpdateEntry({ note: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={onSubmit}>
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
