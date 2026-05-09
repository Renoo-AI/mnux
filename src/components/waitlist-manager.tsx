'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Clock,
  Phone,
  MessageSquare,
  Plus,
  Check,
  X,
  Bell,
  User,
  Timer,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export type WaitlistStatus = 'waiting' | 'notified' | 'seated' | 'cancelled' | 'no_show';

export interface WaitlistEntry {
  id: string;
  name: string;
  partySize: number;
  phone: string;
  email?: string;
  notes?: string;
  preferences?: string;
  estimatedWait: number; // in minutes
  actualWait?: number;
  status: WaitlistStatus;
  quotedTime: string;
  createdAt: string;
  notifiedAt?: string;
  seatedAt?: string;
}

function formatWaitTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function getTimeSince(dateString: string): number {
  const start = new Date(dateString).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 60000);
}

interface WaitlistCardProps {
  entry: WaitlistEntry;
  onNotify: (id: string) => void;
  onSeat: (id: string) => void;
  onEdit: (entry: WaitlistEntry) => void;
  onRemove: (id: string) => void;
  onCancel: (id: string) => void;
}

function WaitlistCard({ entry, onNotify, onSeat, onEdit, onRemove, onCancel }: WaitlistCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const timeWaiting = getTimeSince(entry.createdAt);
  const isOverdue = timeWaiting > entry.estimatedWait + 5;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={`bg-card border rounded-xl p-4 transition-all duration-300 ${
          isOverdue && entry.status === 'waiting' ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10' : ''
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              entry.status === 'waiting' ? 'bg-amber-100 dark:bg-amber-900/30' :
              entry.status === 'notified' ? 'bg-blue-100 dark:bg-blue-900/30' :
              entry.status === 'seated' ? 'bg-green-100 dark:bg-green-900/30' :
              'bg-gray-100 dark:bg-gray-900/30'
            }`}>
              <User className={`h-5 w-5 ${
                entry.status === 'waiting' ? 'text-amber-600 dark:text-amber-400' :
                entry.status === 'notified' ? 'text-blue-600 dark:text-blue-400' :
                entry.status === 'seated' ? 'text-green-600 dark:text-green-400' :
                'text-gray-600 dark:text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold">{entry.name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{entry.partySize} {entry.partySize === 1 ? 'guest' : 'guests'}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(entry)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCancel(entry.id)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setShowRemoveDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span className="font-mono">{entry.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className={isOverdue && entry.status === 'waiting' ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
              {timeWaiting} min / ~{entry.estimatedWait} min wait
            </span>
          </div>
        </div>

        {entry.notes && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3 bg-muted/50 rounded-lg p-2">
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{entry.notes}</span>
          </div>
        )}

        {entry.preferences && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {entry.preferences.split(',').map((pref, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {pref.trim()}
              </Badge>
            ))}
          </div>
        )}

        {entry.status === 'waiting' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onNotify(entry.id)}
            >
              <Bell className="h-4 w-4 mr-1" />
              Notify
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onSeat(entry.id)}
            >
              <Check className="h-4 w-4 mr-1" />
              Seat Now
            </Button>
          </div>
        )}

        {entry.status === 'notified' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onSeat(entry.id)}
            >
              <Check className="h-4 w-4 mr-1" />
              Seat Now
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onCancel(entry.id)}
            >
              <X className="h-4 w-4 mr-1" />
              No Show
            </Button>
          </div>
        )}
      </motion.div>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Waitlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {entry.name} from the waitlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onRemove(entry.id);
                setShowRemoveDialog(false);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface AddToWaitlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (entry: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>) => void;
  editingEntry?: WaitlistEntry | null;
  onUpdate?: (id: string, entry: Partial<WaitlistEntry>) => void;
}

function AddToWaitlistModal({ open, onOpenChange, onAdd, editingEntry, onUpdate }: AddToWaitlistModalProps) {
  const [formData, setFormData] = useState({
    name: editingEntry?.name || '',
    partySize: editingEntry?.partySize || 2,
    phone: editingEntry?.phone || '',
    email: editingEntry?.email || '',
    notes: editingEntry?.notes || '',
    preferences: editingEntry?.preferences || '',
    estimatedWait: editingEntry?.estimatedWait || 15,
    quotedTime: editingEntry?.quotedTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  });

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    if (editingEntry && onUpdate) {
      onUpdate(editingEntry.id, formData);
      toast.success('Entry updated');
    } else {
      onAdd(formData);
      toast.success('Added to waitlist');
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            {editingEntry ? 'Edit Waitlist Entry' : 'Add to Waitlist'}
          </DialogTitle>
          <DialogDescription>
            Enter customer details to add them to the waitlist.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input
                placeholder="Customer name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Party Size</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={formData.partySize}
                onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Phone *</Label>
              <Input
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Est. Wait (min)</Label>
              <Input
                type="number"
                min="0"
                step="5"
                value={formData.estimatedWait}
                onChange={(e) => setFormData({ ...formData, estimatedWait: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Quoted Time</Label>
              <Input
                type="time"
                value={formData.quotedTime}
                onChange={(e) => setFormData({ ...formData, quotedTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Seating Preferences</Label>
            <Input
              placeholder="e.g., Window, High chair, Quiet area"
              value={formData.preferences}
              onChange={(e) => setFormData({ ...formData, preferences: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Special requests, allergies, etc."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingEntry ? 'Update' : 'Add to Waitlist'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WaitlistManager() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([
    {
      id: '1',
      name: 'Johnson Family',
      partySize: 4,
      phone: '+1 555 123 4567',
      notes: 'Anniversary dinner',
      preferences: 'Window seat',
      estimatedWait: 20,
      status: 'waiting',
      quotedTime: '7:00 PM',
      createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    },
    {
      id: '2',
      name: 'Sarah Williams',
      partySize: 2,
      phone: '+1 555 987 6543',
      notes: '',
      preferences: 'Quiet area',
      estimatedWait: 15,
      status: 'notified',
      quotedTime: '6:45 PM',
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
      notifiedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    },
    {
      id: '3',
      name: 'Michael Chen',
      partySize: 3,
      phone: '+1 555 456 7890',
      notes: 'Allergic to shellfish',
      estimatedWait: 25,
      status: 'waiting',
      quotedTime: '7:15 PM',
      createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WaitlistEntry | null>(null);

  const waiting = waitlist.filter((e) => e.status === 'waiting');
  const notified = waitlist.filter((e) => e.status === 'notified');
  const avgWait = waiting.length > 0
    ? Math.round(waiting.reduce((acc, e) => acc + e.estimatedWait, 0) / waiting.length)
    : 0;

  const handleAdd = (data: Omit<WaitlistEntry, 'id' | 'createdAt' | 'status'>) => {
    const newEntry: WaitlistEntry = {
      ...data,
      id: Date.now().toString(),
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };
    setWaitlist([...waitlist, newEntry]);
  };

  const handleUpdate = (id: string, data: Partial<WaitlistEntry>) => {
    setWaitlist(waitlist.map((e) => (e.id === id ? { ...e, ...data } : e)));
  };

  const handleNotify = (id: string) => {
    setWaitlist(
      waitlist.map((e) =>
        e.id === id ? { ...e, status: 'notified', notifiedAt: new Date().toISOString() } : e
      )
    );
    toast.success('Customer notified');
  };

  const handleSeat = (id: string) => {
    const entry = waitlist.find((e) => e.id === id);
    if (entry) {
      const actualWait = getTimeSince(entry.createdAt);
      setWaitlist(
        waitlist.map((e) =>
          e.id === id ? { ...e, status: 'seated', seatedAt: new Date().toISOString(), actualWait } : e
        )
      );
      toast.success(`${entry.name} seated (waited ${actualWait} min)`);
    }
  };

  const handleCancel = (id: string) => {
    setWaitlist(
      waitlist.map((e) => (e.id === id ? { ...e, status: 'cancelled' } : e))
    );
    toast.info('Entry cancelled');
  };

  const handleRemove = (id: string) => {
    setWaitlist(waitlist.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="text-sm text-amber-600 dark:text-amber-400">Waiting</div>
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{waiting.length}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <div className="text-sm text-blue-600 dark:text-blue-400">Notified</div>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{notified.length}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Avg. Wait</div>
          <div className="text-3xl font-bold">{avgWait} min</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Parties</div>
          <div className="text-3xl font-bold">{waiting.reduce((acc, e) => acc + e.partySize, 0)}</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Current Waitlist</h2>
        <Button
          onClick={() => {
            setEditingEntry(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Guest
        </Button>
      </div>

      {/* Waitlist Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Waiting Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="h-4 w-4" />
            Waiting ({waiting.length})
          </div>
          <AnimatePresence mode="popLayout">
            {waiting.map((entry) => (
              <WaitlistCard
                key={entry.id}
                entry={entry}
                onNotify={handleNotify}
                onSeat={handleSeat}
                onEdit={(e) => {
                  setEditingEntry(e);
                  setModalOpen(true);
                }}
                onRemove={handleRemove}
                onCancel={handleCancel}
              />
            ))}
          </AnimatePresence>
          {waiting.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
              No one waiting
            </div>
          )}
        </div>

        {/* Notified Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Bell className="h-4 w-4" />
            Notified / Ready ({notified.length})
          </div>
          <AnimatePresence mode="popLayout">
            {notified.map((entry) => (
              <WaitlistCard
                key={entry.id}
                entry={entry}
                onNotify={handleNotify}
                onSeat={handleSeat}
                onEdit={(e) => {
                  setEditingEntry(e);
                  setModalOpen(true);
                }}
                onRemove={handleRemove}
                onCancel={handleCancel}
              />
            ))}
          </AnimatePresence>
          {notified.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
              No notified guests
            </div>
          )}
        </div>
      </div>

      <AddToWaitlistModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingEntry(null);
        }}
        onAdd={handleAdd}
        editingEntry={editingEntry}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
