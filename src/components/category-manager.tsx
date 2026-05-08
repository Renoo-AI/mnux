'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Edit, Trash2, X, GripVertical, Eye, EyeOff, Check, AlertCircle, Loader2, Tag, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { menuService } from '@/services/menuService';
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

export interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  itemCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoryModalProps {
  category?: MenuCategory;
  onSave: (data: Omit<MenuCategory, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt' | 'itemCount'>) => void;
  onClose: () => void;
}

function CategoryModal({ category, onSave, onClose }: CategoryModalProps) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [isActive, setIsActive] = useState(category?.isActive ?? true);
  const [sortOrder, setSortOrder] = useState(category?.sortOrder || 1);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Category name is required';
    if (name.length > 50) newErrors.name = 'Name must be 50 characters or less';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave({
      name: name.trim(),
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: description.trim() || undefined,
      sortOrder,
      isActive,
    });
    
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-surface rounded-3xl shadow-2xl max-w-md w-full p-6 animate-scale-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-title-md text-primary">
            {category ? 'Edit Category' : 'New Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              CATEGORY NAME <span className="text-error">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Desserts"
              className={`w-full py-3 rounded-xl ${errors.name ? 'border-error ring-2 ring-error-container' : ''}`}
              maxLength={50}
            />
            {errors.name && (
              <p className="text-error text-xs mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.name}
              </p>
            )}
            <p className="text-on-surface-variant text-xs mt-1">{name.length}/50</p>
          </div>

          {/* Description */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this category"
              className="w-full py-3 px-4 rounded-xl border border-outline-variant bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20 transition-all resize-none h-20"
              maxLength={100}
            />
            <p className="text-on-surface-variant text-xs mt-1">{description.length}/100</p>
          </div>

          {/* Sort Order */}
          <div>
            <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
              DISPLAY ORDER
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSortOrder(Math.max(1, sortOrder - 1))}
                className="w-10 h-10 rounded-xl border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <span className="font-display text-2xl text-primary w-12 text-center">{sortOrder}</span>
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder + 1)}
                className="w-10 h-10 rounded-xl border border-outline-variant flex items-center justify-center hover:bg-surface-container-low transition-colors"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-3">
              {isActive ? (
                <Eye className="w-5 h-5 text-secondary" />
              ) : (
                <EyeOff className="w-5 h-5 text-on-surface-variant" />
              )}
              <span className="font-medium text-primary">
                {isActive ? 'Visible to customers' : 'Hidden from menu'}
              </span>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-block w-12 h-7 rounded-full transition-colors ${
                isActive ? 'bg-secondary' : 'bg-surface-container-high'
              }`}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 rounded-full"
            >
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
                  {category ? 'Update' : 'Create'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CategoryCardProps {
  category: MenuCategory;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isDragging?: boolean;
}

function CategoryCard({ category, onEdit, onDelete, onToggleActive, onMoveUp, onMoveDown, isDragging }: CategoryCardProps) {
  return (
    <div 
      className={`bg-white rounded-2xl p-5 shadow-card border border-outline-variant/10 hover:shadow-lg transition-all duration-300 group ${
        !category.isActive ? 'opacity-60' : ''
      } ${isDragging ? 'ring-2 ring-secondary shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Drag Handle */}
        <div className="flex flex-col items-center gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            className="p-1 rounded hover:bg-surface-container-low transition-colors"
            title="Move up"
          >
            <ArrowUp className="w-4 h-4 text-on-surface-variant" />
          </button>
          <GripVertical className="w-5 h-5 text-outline cursor-grab active:cursor-grabbing" />
          <button
            onClick={onMoveDown}
            className="p-1 rounded hover:bg-surface-container-low transition-colors"
            title="Move down"
          >
            <ArrowDown className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>

        {/* Category Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                category.isActive ? 'bg-secondary/10' : 'bg-surface-container-high'
              }`}>
                <Tag className={`w-5 h-5 ${category.isActive ? 'text-secondary' : 'text-on-surface-variant'}`} />
              </div>
              <div>
                <h3 className="font-display text-title-sm text-primary">{category.name}</h3>
                <p className="text-on-surface-variant text-xs">/{category.slug}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              category.isActive 
                ? 'bg-secondary-fixed text-on-secondary-fixed-variant' 
                : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {category.isActive ? 'Active' : 'Hidden'}
            </span>
          </div>

          {category.description && (
            <p className="text-on-surface-variant text-sm mb-3">{category.description}</p>
          )}

          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant text-sm">
              {category.itemCount ?? 0} items
            </span>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onToggleActive}
                className="p-2 rounded-full bg-surface-container-low text-on-surface-variant hover:bg-secondary-fixed hover:text-on-secondary-fixed-variant transition-all"
                title={category.isActive ? 'Hide category' : 'Show category'}
              >
                {category.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={onEdit}
                className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-secondary-fixed hover:text-on-secondary-fixed-variant transition-all"
                title="Edit category"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-full bg-surface-container-low text-error hover:bg-error-container transition-all"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryManager() {
  const { session } = useStaffSession();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategory | null>(null);
  const { toast } = useToast();

  // Subscribe to categories from Firebase
  useEffect(() => {
    if (!session?.restaurantId) {
      return;
    }

    const unsubscribe = menuService.subscribeToCategories(
      session.restaurantId,
      (fetchedCategories) => {
        // Convert to local MenuCategory type with optional fields
        const localCategories: MenuCategory[] = fetchedCategories.map(cat => ({
          ...cat,
          itemCount: 0, // Would need separate query to count items
        }));
        setCategories(localCategories);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching categories:', error);
        setIsLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load categories.',
          variant: 'destructive',
        });
      }
    );

    return () => unsubscribe();
  }, [session?.restaurantId, toast]);

  const handleSave = useCallback((data: Omit<MenuCategory, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt' | 'itemCount'>) => {
    if (editingCategory) {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id 
          ? { ...c, ...data, updatedAt: new Date() }
          : c
      ));
      toast({
        title: 'Category Updated',
        description: `${data.name} has been updated successfully.`,
      });
    } else {
      const newCategory: MenuCategory = {
        id: `cat-${Date.now()}`,
        restaurantId: session?.restaurantId || '',
        ...data,
        itemCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCategories(prev => [...prev, newCategory]);
      toast({
        title: 'Category Created',
        description: `${data.name} has been added to your menu.`,
      });
    }
    setEditingCategory(null);
  }, [editingCategory, session?.restaurantId, toast]);

  const handleDelete = useCallback(() => {
    if (!categoryToDelete) return;
    
    setCategories(prev => prev.filter(c => c.id !== categoryToDelete.id));
    setShowDeleteDialog(false);
    toast({
      title: 'Category Deleted',
      description: `${categoryToDelete.name} has been removed.`,
    });
    setCategoryToDelete(null);
  }, [categoryToDelete, toast]);

  const handleToggleActive = useCallback((id: string) => {
    const category = categories.find(c => c.id === id);
    if (!category) return;
    
    setCategories(prev => prev.map(c => 
      c.id === id ? { ...c, isActive: !c.isActive, updatedAt: new Date() } : c
    ));
    
    toast({
      title: category.isActive ? 'Category Hidden' : 'Category Visible',
      description: `${category.name} is now ${category.isActive ? 'hidden from customers' : 'visible to customers'}.`,
    });
  }, [categories, toast]);

  const handleMove = useCallback((id: string, direction: 'up' | 'down') => {
    setCategories(prev => {
      const index = prev.findIndex(c => c.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newCategories = [...prev];
      [newCategories[index], newCategories[newIndex]] = [newCategories[newIndex], newCategories[index]];
      
      // Update sort orders
      return newCategories.map((c, i) => ({ ...c, sortOrder: i + 1, updatedAt: new Date() }));
    });
  }, []);

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-headline-sm text-primary">Menu Categories</h2>
            <p className="text-on-surface-variant text-sm">Loading...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-secondary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-headline-sm text-primary">Menu Categories</h2>
          <p className="text-on-surface-variant text-sm">Organize your menu sections</p>
        </div>
        <Button
          onClick={() => {
            setEditingCategory(null);
            setShowModal(true);
          }}
          className="bg-secondary text-white hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* No restaurant selected */}
      {!session?.restaurantId && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-on-surface-variant" />
          </div>
          <h3 className="font-display text-title-sm text-primary mb-2">No restaurant selected</h3>
          <p className="text-on-surface-variant">Please log in to manage categories</p>
        </div>
      )}

      {/* Categories List */}
      {session?.restaurantId && categories.length > 0 && (
        <div className="space-y-4">
          {sortedCategories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => {
                setEditingCategory(category);
                setShowModal(true);
              }}
              onDelete={() => {
                setCategoryToDelete(category);
                setShowDeleteDialog(true);
              }}
              onToggleActive={() => handleToggleActive(category.id)}
              onMoveUp={index > 0 ? () => handleMove(category.id, 'up') : undefined}
              onMoveDown={index < sortedCategories.length - 1 ? () => handleMove(category.id, 'down') : undefined}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {session?.restaurantId && categories.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-on-surface-variant" />
          </div>
          <h3 className="font-display text-title-sm text-primary mb-2">No categories yet</h3>
          <p className="text-on-surface-variant mb-4">Create your first menu category to get started</p>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-secondary text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory || undefined}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-surface rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-title-md text-primary">
              Delete Category?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-on-surface-variant">
              Are you sure you want to delete <strong className="text-primary">{categoryToDelete?.name}</strong>?
              {categoryToDelete?.itemCount && categoryToDelete.itemCount > 0 && (
                <span className="block mt-2 text-error">
                  This category has {categoryToDelete.itemCount} items. They will become uncategorized.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-error text-on-error rounded-full"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
