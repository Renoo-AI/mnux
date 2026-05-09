'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  Percent,
  DollarSign,
  Clock,
  Calendar,
  Tag,
  Plus,
  Edit,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
  Users,
  ShoppingCart,
  Sparkles,
  X,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export type PromotionType = 'percentage' | 'fixed' | 'bogo' | 'free_item';
export type PromotionStatus = 'active' | 'scheduled' | 'expired' | 'paused';

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: PromotionType;
  value: number;
  code?: string;
  minOrderValue?: number;
  maxDiscount?: number;
  applicableItems: string[]; // empty = all items
  startDate: string;
  endDate: string;
  startTime?: string; // for daily time windows
  endTime?: string;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  usageLimit?: number;
  currentUsage: number;
  status: PromotionStatus;
  createdAt: string;
}

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onDuplicate: (promotion: Promotion) => void;
}

function PromotionCard({ promotion, onEdit, onDelete, onToggle, onDuplicate }: PromotionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getTypeIcon = () => {
    switch (promotion.type) {
      case 'percentage':
        return <Percent className="h-4 w-4" />;
      case 'fixed':
        return <DollarSign className="h-4 w-4" />;
      case 'bogo':
        return <ShoppingCart className="h-4 w-4" />;
      case 'free_item':
        return <Gift className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}% Off`;
      case 'fixed':
        return `$${promotion.value} Off`;
      case 'bogo':
        return 'Buy 1 Get 1';
      case 'free_item':
        return 'Free Item';
    }
  };

  const getStatusColor = () => {
    switch (promotion.status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'expired':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
      case 'paused':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    }
  };

  const isActive = promotion.status === 'active';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`group relative bg-card border rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 ${
          !isActive ? 'opacity-60' : ''
        }`}
      >
        {/* Status indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          promotion.status === 'active' ? 'bg-green-500' :
          promotion.status === 'scheduled' ? 'bg-blue-500' :
          promotion.status === 'paused' ? 'bg-amber-500' : 'bg-gray-300'
        }`} />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg ${
              isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            }`}>
              {getTypeIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{promotion.name}</h3>
              <Badge variant="secondary" className="mt-1">
                {getTypeLabel()}
              </Badge>
            </div>
          </div>
          <Badge className={getStatusColor()}>
            {promotion.status.charAt(0).toUpperCase() + promotion.status.slice(1)}
          </Badge>
        </div>

        {promotion.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {promotion.description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          {promotion.code && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              <code className="bg-muted px-2 py-0.5 rounded font-mono text-xs">
                {promotion.code}
              </code>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}</span>
          </div>
          {promotion.startTime && promotion.endTime && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{promotion.startTime} - {promotion.endTime}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{promotion.currentUsage}/{promotion.usageLimit || '∞'} uses</span>
          </div>
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => onToggle(promotion.id)}
            >
              {isActive ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
              {isActive ? 'Pause' : 'Activate'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => onDuplicate(promotion)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Duplicate
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => onEdit(promotion)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:text-white hover:bg-white/20"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{promotion.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(promotion.id);
                setShowDeleteDialog(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PromotionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotion?: Promotion | null;
  onSave: (promotion: Omit<Promotion, 'id' | 'createdAt' | 'currentUsage'>) => void;
}

function PromotionModal({ open, onOpenChange, promotion, onSave }: PromotionModalProps) {
  const [formData, setFormData] = useState({
    name: promotion?.name || '',
    description: promotion?.description || '',
    type: promotion?.type || 'percentage' as PromotionType,
    value: promotion?.value || 10,
    code: promotion?.code || '',
    minOrderValue: promotion?.minOrderValue || 0,
    maxDiscount: promotion?.maxDiscount || 0,
    applicableItems: promotion?.applicableItems || [],
    startDate: promotion?.startDate || new Date().toISOString().split('T')[0],
    endDate: promotion?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: promotion?.startTime || '',
    endTime: promotion?.endTime || '',
    daysOfWeek: promotion?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    usageLimit: promotion?.usageLimit || 0,
    status: promotion?.status || 'active' as PromotionStatus,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.value <= 0) newErrors.value = 'Value must be greater than 0';
    if (formData.type === 'percentage' && formData.value > 100) {
      newErrors.value = 'Percentage cannot exceed 100%';
    }
    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    onSave(formData);
    onOpenChange(false);
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {promotion ? 'Edit Promotion' : 'Create Promotion'}
          </DialogTitle>
          <DialogDescription>
            Set up discounts, special offers, and promotional codes for your customers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Basic Info */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Promotion Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Summer Sale, Happy Hour"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your promotion..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          {/* Discount Type & Value */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Discount Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: PromotionType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">
                    <div className="flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Percentage Off
                    </div>
                  </SelectItem>
                  <SelectItem value="fixed">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Fixed Amount Off
                    </div>
                  </SelectItem>
                  <SelectItem value="bogo">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Buy 1 Get 1 Free
                    </div>
                  </SelectItem>
                  <SelectItem value="free_item">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4" />
                      Free Item
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>
                {formData.type === 'percentage' ? 'Percentage' : formData.type === 'fixed' ? 'Amount ($)' : 'Value'}
              </Label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                className={errors.value ? 'border-destructive' : ''}
              />
              {errors.value && <p className="text-xs text-destructive">{errors.value}</p>}
            </div>
          </div>

          {/* Promo Code */}
          <div className="grid gap-2">
            <Label>Promo Code (Optional)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., SUMMER20"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="font-mono"
              />
              <Button variant="outline" onClick={generateCode}>
                Generate
              </Button>
            </div>
          </div>

          {/* Order Requirements */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Minimum Order ($)</Label>
              <Input
                type="number"
                value={formData.minOrderValue}
                onChange={(e) => setFormData({ ...formData, minOrderValue: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Maximum Discount ($)</Label>
              <Input
                type="number"
                value={formData.maxDiscount}
                onChange={(e) => setFormData({ ...formData, maxDiscount: parseFloat(e.target.value) || 0 })}
                placeholder="0 = no limit"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={errors.endDate ? 'border-destructive' : ''}
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>
          </div>

          {/* Time Window */}
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Daily Time Window (Optional)
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                placeholder="Start time"
              />
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                placeholder="End time"
              />
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid gap-2">
            <Label>Active Days</Label>
            <div className="flex flex-wrap gap-2">
              {days.map((day, index) => (
                <Button
                  key={day}
                  size="sm"
                  variant={formData.daysOfWeek.includes(index) ? 'default' : 'outline'}
                  onClick={() => {
                    const newDays = formData.daysOfWeek.includes(index)
                      ? formData.daysOfWeek.filter((d) => d !== index)
                      : [...formData.daysOfWeek, index];
                    setFormData({ ...formData, daysOfWeek: newDays });
                  }}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {/* Usage Limit */}
          <div className="grid gap-2">
            <Label>Usage Limit</Label>
            <Input
              type="number"
              value={formData.usageLimit}
              onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || 0 })}
              placeholder="0 = unlimited"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {promotion ? 'Save Changes' : 'Create Promotion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PromotionsManager() {
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      name: 'Happy Hour Special',
      description: 'Enjoy 20% off all beverages during happy hour!',
      type: 'percentage',
      value: 20,
      code: 'HAPPY20',
      minOrderValue: 10,
      applicableItems: [],
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      startTime: '16:00',
      endTime: '19:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      currentUsage: 156,
      status: 'active',
      createdAt: '2025-01-01',
    },
    {
      id: '2',
      name: 'Weekend Brunch Deal',
      description: 'Buy any brunch item and get a free coffee!',
      type: 'free_item',
      value: 0,
      applicableItems: ['brunch'],
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      startTime: '10:00',
      endTime: '14:00',
      daysOfWeek: [0, 6],
      currentUsage: 89,
      status: 'active',
      createdAt: '2025-01-01',
    },
    {
      id: '3',
      name: 'Summer Launch',
      description: '$5 off orders over $30 this summer!',
      type: 'fixed',
      value: 5,
      minOrderValue: 30,
      applicableItems: [],
      startDate: '2025-06-01',
      endDate: '2025-08-31',
      currentUsage: 0,
      status: 'scheduled',
      createdAt: '2025-01-15',
    },
  ]);

  const [filter, setFilter] = useState<'all' | PromotionStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);

  const filteredPromotions = promotions.filter(
    (p) => filter === 'all' || p.status === filter
  );

  const stats = {
    total: promotions.length,
    active: promotions.filter((p) => p.status === 'active').length,
    scheduled: promotions.filter((p) => p.status === 'scheduled').length,
    totalUsage: promotions.reduce((acc, p) => acc + p.currentUsage, 0),
  };

  const handleSave = (data: Omit<Promotion, 'id' | 'createdAt' | 'currentUsage'>) => {
    if (editingPromotion) {
      setPromotions(
        promotions.map((p) =>
          p.id === editingPromotion.id
            ? { ...p, ...data }
            : p
        )
      );
      toast.success('Promotion updated successfully');
    } else {
      const newPromotion: Promotion = {
        ...data,
        id: Date.now().toString(),
        currentUsage: 0,
        createdAt: new Date().toISOString(),
      };
      setPromotions([...promotions, newPromotion]);
      toast.success('Promotion created successfully');
    }
    setEditingPromotion(null);
  };

  const handleDelete = (id: string) => {
    setPromotions(promotions.filter((p) => p.id !== id));
    toast.success('Promotion deleted');
  };

  const handleToggle = (id: string) => {
    setPromotions(
      promotions.map((p) => {
        if (p.id === id) {
          const newStatus = p.status === 'active' ? 'paused' : 'active';
          toast.success(`Promotion ${newStatus === 'active' ? 'activated' : 'paused'}`);
          return { ...p, status: newStatus };
        }
        return p;
      })
    );
  };

  const handleDuplicate = (promotion: Promotion) => {
    const newPromotion: Promotion = {
      ...promotion,
      id: Date.now().toString(),
      name: `${promotion.name} (Copy)`,
      currentUsage: 0,
      createdAt: new Date().toISOString(),
      status: 'paused',
    };
    setPromotions([...promotions, newPromotion]);
    toast.success('Promotion duplicated');
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Promotions</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.active}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Scheduled</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</div>
        </div>
        <div className="bg-card border rounded-xl p-4">
          <div className="text-sm text-muted-foreground">Total Uses</div>
          <div className="text-2xl font-bold">{stats.totalUsage}</div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'scheduled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('scheduled')}
          >
            Scheduled
          </Button>
          <Button
            variant={filter === 'paused' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('paused')}
          >
            Paused
          </Button>
          <Button
            variant={filter === 'expired' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('expired')}
          >
            Expired
          </Button>
        </div>
        <Button
          onClick={() => {
            setEditingPromotion(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Promotion
        </Button>
      </div>

      {/* Promotions Grid */}
      {filteredPromotions.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No promotions found</h3>
          <p className="text-muted-foreground mb-4">
            {filter === 'all'
              ? 'Create your first promotion to start attracting more customers.'
              : `No ${filter} promotions at the moment.`}
          </p>
          <Button
            onClick={() => {
              setFilter('all');
              setEditingPromotion(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPromotions.map((promotion) => (
              <PromotionCard
                key={promotion.id}
                promotion={promotion}
                onEdit={(p) => {
                  setEditingPromotion(p);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onDuplicate={handleDuplicate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <PromotionModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingPromotion(null);
        }}
        promotion={editingPromotion}
        onSave={handleSave}
      />
    </div>
  );
}
