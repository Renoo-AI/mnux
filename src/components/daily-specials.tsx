'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Clock,
  Star,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Calendar,
  Percent,
  ChefHat,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

export interface DailySpecial {
  id: string;
  name: string;
  description: string;
  originalPrice: number;
  specialPrice: number;
  image?: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  quantityAvailable: number;
  quantitySold: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface DailySpecialCardProps {
  special: DailySpecial;
  onEdit: (special: DailySpecial) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onFeature: (id: string) => void;
}

function DailySpecialCard({ special, onEdit, onDelete, onToggle, onFeature }: DailySpecialCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const discount = Math.round((1 - special.specialPrice / special.originalPrice) * 100);
  const isAvailable = special.quantityAvailable > special.quantitySold;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group relative bg-card border rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl ${
          !special.isActive ? 'opacity-60' : ''
        } ${special.isFeatured ? 'ring-2 ring-primary' : ''}`}
      >
        {/* Featured badge */}
        {special.isFeatured && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-primary text-primary-foreground shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
          </div>
        )}

        {/* Discount badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="destructive" className="shadow-lg">
            <Percent className="h-3 w-3 mr-1" />
            {discount}% OFF
          </Badge>
        </div>

        {/* Image placeholder */}
        <div className="relative h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          {special.image ? (
            <img src={special.image} alt={special.name} className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground/50 mt-2">{special.name}</p>
            </div>
          )}

          {/* Time indicator */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <Badge variant="secondary" className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
              <Clock className="h-3 w-3 mr-1" />
              {special.startTime} - {special.endTime}
            </Badge>
            <Badge
              variant={isAvailable ? 'default' : 'secondary'}
              className={isAvailable ? 'bg-green-500' : 'bg-red-500'}
            >
              {special.quantityAvailable - special.quantitySold} left
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">{special.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{special.description}</p>

          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">${special.specialPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through ml-2">
                ${special.originalPrice.toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {special.quantitySold} sold
            </div>
          </div>
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
          <div className="p-4 w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onToggle(special.id)}
              >
                {special.isActive ? (
                  <>
                    <ToggleRight className="h-4 w-4 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-1" />
                    Inactive
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onFeature(special.id)}
              >
                <Star className={`h-4 w-4 mr-1 ${special.isFeatured ? 'fill-current' : ''}`} />
                {special.isFeatured ? 'Unfeature' : 'Feature'}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => onEdit(special)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Special</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{special.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                onDelete(special.id);
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

interface DailySpecialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  special?: DailySpecial | null;
  onSave: (special: Omit<DailySpecial, 'id' | 'createdAt' | 'quantitySold'>) => void;
}

function DailySpecialModal({ open, onOpenChange, special, onSave }: DailySpecialModalProps) {
  const [formData, setFormData] = useState({
    name: special?.name || '',
    description: special?.description || '',
    originalPrice: special?.originalPrice || 0,
    specialPrice: special?.specialPrice || 0,
    image: special?.image || '',
    startTime: special?.startTime || '11:00',
    endTime: special?.endTime || '22:00',
    daysOfWeek: special?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
    quantityAvailable: special?.quantityAvailable || 20,
    isActive: special?.isActive ?? true,
    isFeatured: special?.isFeatured ?? false,
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {special ? 'Edit Special' : 'Create Daily Special'}
          </DialogTitle>
          <DialogDescription>
            Add a limited-time offer that appears on your menu during specific hours.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Name *</Label>
            <Input
              placeholder="e.g., Truffle Pasta Special"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe your special..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Original Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>Special Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.specialPrice}
                onChange={(e) => setFormData({ ...formData, specialPrice: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Quantity Available</Label>
            <Input
              type="number"
              value={formData.quantityAvailable}
              onChange={(e) => setFormData({ ...formData, quantityAvailable: parseInt(e.target.value) || 0 })}
            />
          </div>

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

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch
              id="active"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {special ? 'Save Changes' : 'Create Special'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DailySpecialsManager() {
  const [specials, setSpecials] = useState<DailySpecial[]>([
    {
      id: '1',
      name: 'Truffle Pasta',
      description: 'Fresh tagliatelle with black truffle cream sauce and parmesan.',
      originalPrice: 24.99,
      specialPrice: 18.99,
      startTime: '17:00',
      endTime: '21:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      quantityAvailable: 15,
      quantitySold: 8,
      isActive: true,
      isFeatured: true,
      createdAt: '2025-01-01',
    },
    {
      id: '2',
      name: 'Brunch Special',
      description: 'Eggs Benedict with smoked salmon and bottomless mimosas.',
      originalPrice: 32.00,
      specialPrice: 24.00,
      startTime: '10:00',
      endTime: '14:00',
      daysOfWeek: [0, 6],
      quantityAvailable: 20,
      quantitySold: 12,
      isActive: true,
      isFeatured: false,
      createdAt: '2025-01-01',
    },
    {
      id: '3',
      name: 'Lunch Express',
      description: 'Your choice of soup + half sandwich + drink.',
      originalPrice: 18.50,
      specialPrice: 12.99,
      startTime: '11:30',
      endTime: '14:00',
      daysOfWeek: [1, 2, 3, 4, 5],
      quantityAvailable: 30,
      quantitySold: 25,
      isActive: true,
      isFeatured: false,
      createdAt: '2025-01-01',
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState<DailySpecial | null>(null);

  const handleSave = (data: Omit<DailySpecial, 'id' | 'createdAt' | 'quantitySold'>) => {
    if (editingSpecial) {
      setSpecials(
        specials.map((s) =>
          s.id === editingSpecial.id
            ? { ...s, ...data }
            : s
        )
      );
      toast.success('Special updated successfully');
    } else {
      const newSpecial: DailySpecial = {
        ...data,
        id: Date.now().toString(),
        quantitySold: 0,
        createdAt: new Date().toISOString(),
      };
      setSpecials([...specials, newSpecial]);
      toast.success('Special created successfully');
    }
    setEditingSpecial(null);
  };

  const handleDelete = (id: string) => {
    setSpecials(specials.filter((s) => s.id !== id));
    toast.success('Special deleted');
  };

  const handleToggle = (id: string) => {
    setSpecials(
      specials.map((s) => {
        if (s.id === id) {
          toast.success(`Special ${!s.isActive ? 'activated' : 'deactivated'}`);
          return { ...s, isActive: !s.isActive };
        }
        return s;
      })
    );
  };

  const handleFeature = (id: string) => {
    setSpecials(
      specials.map((s) => {
        if (s.id === id) {
          return { ...s, isFeatured: !s.isFeatured };
        }
        return s;
      })
    );
  };

  const activeSpecials = specials.filter((s) => s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Daily Specials</h2>
          <p className="text-sm text-muted-foreground">
            {activeSpecials.length} active specials
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSpecial(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Special
        </Button>
      </div>

      {/* Grid */}
      {specials.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">No specials yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first daily special to attract more customers.
          </p>
          <Button
            onClick={() => {
              setEditingSpecial(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Special
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {specials.map((special) => (
              <DailySpecialCard
                key={special.id}
                special={special}
                onEdit={(s) => {
                  setEditingSpecial(s);
                  setModalOpen(true);
                }}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onFeature={handleFeature}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <DailySpecialModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingSpecial(null);
        }}
        special={editingSpecial}
        onSave={handleSave}
      />
    </div>
  );
}
