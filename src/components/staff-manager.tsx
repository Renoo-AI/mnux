'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Check, AlertCircle, Loader2, User, Phone, Mail, Clock, Shield, MoreVertical, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
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

export type StaffRole = 'manager' | 'waiter' | 'kitchen' | 'host' | 'cashier';
export type StaffStatus = 'active' | 'inactive' | 'on-break' | 'off-duty';

export interface StaffMember {
  id: string;
  restaurantId: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  status: StaffStatus;
  avatar?: string;
  shift: 'morning' | 'afternoon' | 'evening' | 'night';
  tablesAssigned: number;
  ordersHandled: number;
  rating: number;
  joinedAt: Date;
  lastActive: Date;
}

const roleConfig: Record<StaffRole, { label: string; color: string; icon: React.ReactNode }> = {
  manager: { label: 'Manager', color: 'bg-primary text-on-primary', icon: <Shield className="w-4 h-4" /> },
  waiter: { label: 'Waiter', color: 'bg-secondary text-on-secondary', icon: <User className="w-4 h-4" /> },
  kitchen: { label: 'Kitchen', color: 'bg-accent text-white', icon: <Clock className="w-4 h-4" /> },
  host: { label: 'Host', color: 'bg-tertiary-container text-on-tertiary-container', icon: <UserCheck className="w-4 h-4" /> },
  cashier: { label: 'Cashier', color: 'bg-surface-container-high text-primary', icon: <User className="w-4 h-4" /> },
};

const statusConfig: Record<StaffStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-500' },
  inactive: { label: 'Inactive', color: 'bg-gray-400' },
  'on-break': { label: 'On Break', color: 'bg-amber-500' },
  'off-duty': { label: 'Off Duty', color: 'bg-gray-300' },
};

interface StaffModalProps {
  staff?: StaffMember;
  onSave: (data: Omit<StaffMember, 'id' | 'restaurantId' | 'joinedAt' | 'lastActive' | 'tablesAssigned' | 'ordersHandled' | 'rating'>) => void;
  onClose: () => void;
}

function StaffModal({ staff, onSave, onClose }: StaffModalProps) {
  const [name, setName] = useState(staff?.name || '');
  const [email, setEmail] = useState(staff?.email || '');
  const [phone, setPhone] = useState(staff?.phone || '');
  const [role, setRole] = useState<StaffRole>(staff?.role || 'waiter');
  const [shift, setShift] = useState<'morning' | 'afternoon' | 'evening' | 'night'>(staff?.shift || 'morning');
  const [status, setStatus] = useState<StaffStatus>(staff?.status || 'active');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email format';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), role, shift, status });
    
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-title-md text-primary">
            {staff ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              FULL NAME <span className="text-error">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className={`w-full pl-12 pr-4 py-3 rounded-xl ${errors.name ? 'border-error' : ''}`}
              />
            </div>
            {errors.name && <p className="text-error text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              EMAIL <span className="text-error">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@menux.app"
                className={`w-full pl-12 pr-4 py-3 rounded-xl ${errors.email ? 'border-error' : ''}`}
              />
            </div>
            {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              PHONE <span className="text-error">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+33 6 12 34 56 78"
                className={`w-full pl-12 pr-4 py-3 rounded-xl ${errors.phone ? 'border-error' : ''}`}
              />
            </div>
            {errors.phone && <p className="text-error text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              ROLE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(roleConfig) as StaffRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    role === r
                      ? roleConfig[r].color
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                  }`}
                >
                  {roleConfig[r].icon}
                  <span className="capitalize">{r}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Shift */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              SHIFT
            </label>
            <div className="grid grid-cols-4 gap-2">
              {['morning', 'afternoon', 'evening', 'night'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShift(s as typeof shift)}
                  className={`py-2 px-3 rounded-xl text-sm font-medium transition-all capitalize ${
                    shift === s
                      ? 'bg-secondary text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant/30'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 py-3 rounded-full">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex-1 py-3 rounded-full bg-secondary text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  {staff ? 'Update' : 'Add Staff'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StaffCardProps {
  staff: StaffMember;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

function StaffCard({ staff, onEdit, onDelete, onToggleStatus }: StaffCardProps) {
  const initials = staff.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card border border-outline-variant/10 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg ${
            staff.role === 'manager' ? 'bg-primary' :
            staff.role === 'kitchen' ? 'bg-accent' :
            'bg-secondary'
          }`}>
            {initials}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${statusConfig[staff.status].color} rounded-full border-2 border-white`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display text-title-sm text-primary truncate">{staff.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleConfig[staff.role].color} flex items-center gap-1`}>
              {roleConfig[staff.role].icon}
              {roleConfig[staff.role].label}
            </span>
          </div>
          <p className="text-on-surface-variant text-sm truncate">{staff.email}</p>

          <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {staff.shift} shift
            </span>
            {staff.role === 'waiter' && (
              <span>{staff.tablesAssigned} tables</span>
            )}
            {staff.ordersHandled > 0 && (
              <span>{staff.ordersHandled} orders</span>
            )}
            {staff.rating > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                ★ {staff.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-outline-variant/20">
        <button
          onClick={onToggleStatus}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            staff.status === 'active'
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          {staff.status === 'active' ? (
            <>
              <UserCheck className="w-3 h-3" />
              {statusConfig[staff.status].label}
            </>
          ) : (
            <>
              <UserX className="w-3 h-3" />
              {statusConfig[staff.status].label}
            </>
          )}
        </button>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-secondary-fixed hover:text-on-secondary-fixed-variant transition-all"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-full bg-surface-container-low text-error hover:bg-error-container transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const { toast } = useToast();
  const { session } = useStaffSession();
  const hasRestaurant = !!session?.restaurantId;

  // Subscribe to staff collection
  useEffect(() => {
    if (!hasRestaurant) {
      return;
    }

    const staffQuery = query(
      collection(db, 'staff'),
      where('restaurantId', '==', session!.restaurantId)
    );

    const unsubscribe: Unsubscribe = onSnapshot(
      staffQuery,
      (snapshot) => {
        const staffData: StaffMember[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            restaurantId: data.restaurantId || session!.restaurantId,
            name: data.name || 'Unknown',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'waiter',
            status: data.active ? 'active' : 'inactive',
            shift: data.shift || 'morning',
            tablesAssigned: data.tablesAssigned || 0,
            ordersHandled: data.ordersHandled || 0,
            rating: data.rating || 0,
            joinedAt: data.createdAt?.toDate?.() || new Date(),
            lastActive: data.updatedAt?.toDate?.() || new Date(),
          };
        });
        setStaff(staffData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching staff:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [hasRestaurant, session]);

  const handleSave = useCallback((data: Omit<StaffMember, 'id' | 'restaurantId' | 'joinedAt' | 'lastActive' | 'tablesAssigned' | 'ordersHandled' | 'rating'>) => {
    if (editingStaff) {
      setStaff(prev => prev.map(s => 
        s.id === editingStaff.id 
          ? { ...s, ...data, lastActive: new Date() }
          : s
      ));
      toast({ title: 'Staff Updated', description: `${data.name} has been updated.` });
    } else {
      const newStaff: StaffMember = {
        id: `staff-${Date.now()}`,
        restaurantId: session?.restaurantId || '',
        ...data,
        tablesAssigned: 0,
        ordersHandled: 0,
        rating: 0,
        joinedAt: new Date(),
        lastActive: new Date(),
      };
      setStaff(prev => [...prev, newStaff]);
      toast({ title: 'Staff Added', description: `${data.name} has been added to your team.` });
    }
    setEditingStaff(null);
  }, [editingStaff, toast, session?.restaurantId]);

  const handleDelete = useCallback(() => {
    if (!staffToDelete) return;
    setStaff(prev => prev.filter(s => s.id !== staffToDelete.id));
    setShowDeleteDialog(false);
    toast({ title: 'Staff Removed', description: `${staffToDelete.name} has been removed.` });
    setStaffToDelete(null);
  }, [staffToDelete, toast]);

  const handleToggleStatus = useCallback((id: string) => {
    setStaff(prev => prev.map(s => {
      if (s.id !== id) return s;
      const newStatus: StaffStatus = s.status === 'active' ? 'off-duty' : 'active';
      return { ...s, status: newStatus, lastActive: new Date() };
    }));
  }, []);

  const filteredStaff = roleFilter === 'all' 
    ? staff 
    : staff.filter(s => s.role === roleFilter);

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    managers: staff.filter(s => s.role === 'manager').length,
    waiters: staff.filter(s => s.role === 'waiter').length,
    kitchen: staff.filter(s => s.role === 'kitchen').length,
  };

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* No Restaurant Context */}
      {!loading && !session?.restaurantId && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-on-surface-variant" />
          </div>
          <h3 className="font-display text-title-sm text-primary mb-2">No restaurant selected</h3>
          <p className="text-on-surface-variant">Please log in to manage staff</p>
        </div>
      )}

      {/* Stats */}
      {!loading && session?.restaurantId && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-on-surface-variant text-xs uppercase tracking-wider">Total Staff</p>
              <p className="font-display text-3xl text-primary mt-1">{stats.total}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-on-surface-variant text-xs uppercase tracking-wider">Active Now</p>
              <p className="font-display text-3xl text-green-600 mt-1">{stats.active}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-on-surface-variant text-xs uppercase tracking-wider">Waiters</p>
              <p className="font-display text-3xl text-secondary mt-1">{stats.waiters}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-card">
              <p className="text-on-surface-variant text-xs uppercase tracking-wider">Kitchen</p>
              <p className="font-display text-3xl text-accent mt-1">{stats.kitchen}</p>
            </div>
          </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-headline-sm text-primary">Staff Management</h2>
          <p className="text-on-surface-variant text-sm">Manage your team members</p>
        </div>
        <Button onClick={() => { setEditingStaff(null); setShowModal(true); }} className="bg-secondary text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Role Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setRoleFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            roleFilter === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
          }`}
        >
          All Staff
        </button>
        {(Object.keys(roleConfig) as StaffRole[]).map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize flex items-center gap-2 ${
              roleFilter === role ? roleConfig[role].color : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            {roleConfig[role].icon}
            {role}
          </button>
        ))}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map((s) => (
          <StaffCard
            key={s.id}
            staff={s}
            onEdit={() => { setEditingStaff(s); setShowModal(true); }}
            onDelete={() => { setStaffToDelete(s); setShowDeleteDialog(true); }}
            onToggleStatus={() => handleToggleStatus(s.id)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredStaff.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-on-surface-variant" />
          </div>
          <h3 className="font-display text-title-sm text-primary mb-2">No staff members yet</h3>
          <p className="text-on-surface-variant">Add your first team member to get started</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <StaffModal
          staff={editingStaff || undefined}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingStaff(null); }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-surface rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-title-md text-primary">
              Remove Staff Member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              Are you sure you want to remove <strong className="text-primary">{staffToDelete?.name}</strong> from your team?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-error text-on-error rounded-full">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </>
      )}
    </div>
  );
}
