'use client';

import { useState, useEffect, useRef } from 'react';
import { X, User, Clock, Phone, Mail, Check, AlertCircle, Users, Edit, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';

interface Waiter {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  status: 'available' | 'busy' | 'off-duty';
  assignedTables: number;
  shift: 'morning' | 'afternoon' | 'evening';
}

interface WaiterAssignmentProps {
  tableId: string;
  tableName: string;
  currentWaiter?: Waiter;
  onAssign: (waiterId: string) => void;
  onUnassign: () => void;
  onClose: () => void;
}

export function WaiterAssignmentPanel({
  tableId,
  tableName,
  currentWaiter,
  onAssign,
  onUnassign,
  onClose,
}: WaiterAssignmentProps) {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWaiter, setSelectedWaiter] = useState<Waiter | null>(currentWaiter || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showAddWaiter, setShowAddWaiter] = useState(false);
  const [newWaiterName, setNewWaiterName] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const { session } = useStaffSession();
  const hasRestaurant = !!session?.restaurantId;

  // Subscribe to staff collection for waiters
  useEffect(() => {
    if (!hasRestaurant) {
      return;
    }

    const staffQuery = query(
      collection(db, 'staff'),
      where('restaurantId', '==', session!.restaurantId),
      where('role', '==', 'waiter')
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      staffQuery,
      (snapshot) => {
        const waiterData: Waiter[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || 'Unknown',
            phone: data.phone || '',
            email: data.email || '',
            status: data.active ? 'available' : 'off-duty',
            assignedTables: data.tablesAssigned || 0,
            shift: data.shift || 'morning',
          };
        });
        setWaiters(waiterData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching waiters:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hasRestaurant, session]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredWaiters = waiters.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: Waiter['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-amber-500';
      case 'off-duty': return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: Waiter['status']) => {
    switch (status) {
      case 'available': return 'Available';
      case 'busy': return 'Busy';
      case 'off-duty': return 'Off Duty';
    }
  };

  const handleAssign = async () => {
    if (!selectedWaiter) return;
    setIsAssigning(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onAssign(selectedWaiter.id);
    setIsAssigning(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        ref={panelRef}
        className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-up"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="font-display text-title-md text-primary">Assign Waiter</h2>
            <p className="text-on-surface-variant text-sm">Table: {tableName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Assignment */}
        {currentWaiter && (
          <div className="mb-6 p-4 bg-secondary-fixed/20 rounded-xl border border-secondary-fixed/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-semibold">
                  {currentWaiter.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-primary">{currentWaiter.name}</p>
                  <p className="text-xs text-on-surface-variant">Currently assigned</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onUnassign}
                className="text-error border-error hover:bg-error-container"
              >
                Unassign
              </Button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <Input
            type="text"
            placeholder="Search waiters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20 transition-all"
          />
        </div>

        {/* Waiters List */}
        <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredWaiters.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-3">
                <User className="w-6 h-6 text-on-surface-variant" />
              </div>
              <h3 className="font-display text-title-sm text-primary mb-1">No waiters yet</h3>
              <p className="text-on-surface-variant text-sm">Add staff with waiter role to assign them to tables</p>
            </div>
          ) : (
            filteredWaiters.map((waiter) => (
              <button
                key={waiter.id}
                onClick={() => waiter.status !== 'off-duty' && setSelectedWaiter(waiter)}
                disabled={waiter.status === 'off-duty'}
                className={`w-full p-4 rounded-xl flex items-center justify-between transition-all duration-200 ${
                  waiter.status === 'off-duty'
                    ? 'bg-surface-container-low opacity-50 cursor-not-allowed'
                    : selectedWaiter?.id === waiter.id
                      ? 'bg-secondary-fixed/30 border-2 border-secondary ring-2 ring-secondary-fixed/20'
                      : 'bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold">
                      {waiter.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(waiter.status)} rounded-full border-2 border-white`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-primary">{waiter.name}</p>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        waiter.status === 'available' ? 'bg-green-100 text-green-700' :
                        waiter.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {getStatusLabel(waiter.status)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {waiter.assignedTables} tables
                      </span>
                    </div>
                  </div>
                </div>
                {selectedWaiter?.id === waiter.id && (
                  <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))
          )}
        </div>

        {/* Add New Waiter */}
        {showAddWaiter ? (
          <div className="mt-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
            <Input
              type="text"
              placeholder="Waiter name"
              value={newWaiterName}
              onChange={(e) => setNewWaiterName(e.target.value)}
              className="w-full mb-3"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddWaiter(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button size="sm" className="flex-1 bg-secondary text-white">
                Add Waiter
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddWaiter(true)}
            className="mt-4 w-full py-3 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Waiter
          </button>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 py-3 rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedWaiter || selectedWaiter.status === 'off-duty' || isAssigning}
            className="flex-1 py-3 rounded-full bg-secondary text-white"
          >
            {isAssigning ? 'Assigning...' : 'Assign Waiter'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WaiterBadge({ waiter, compact = false }: { waiter: Waiter; compact?: boolean }) {
  if (!waiter) return null;

  const getStatusColor = (status: Waiter['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-amber-500';
      case 'off-duty': return 'bg-gray-400';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-semibold">
          {waiter.name.split(' ').map(n => n[0]).join('')}
        </div>
        <span className="text-xs text-on-surface-variant">{waiter.name.split(' ')[0]}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low rounded-full">
      <div className="relative">
        <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-white text-xs font-semibold">
          {waiter.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 ${getStatusColor(waiter.status)} rounded-full border border-white`} />
      </div>
      <span className="text-xs font-medium text-primary">{waiter.name.split(' ')[0]}</span>
    </div>
  );
}

export type { Waiter };
