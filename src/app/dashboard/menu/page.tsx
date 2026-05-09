'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Star, X, AlertCircle, Loader2, Check, ImageIcon, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useFormValidation, validationPatterns } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { auth } from '@/lib/firebase';
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
import type { MenuItem, MenuCategory } from '@/types';

interface MenuItemFormValues {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string;
}

const initialFormValues: MenuItemFormValues = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  imageUrl: '',
};

const formConfig = {
  name: {
    rules: { required: true, minLength: 2, maxLength: 100 },
    label: 'Item Name',
  },
  description: {
    rules: { maxLength: 500 },
    label: 'Description',
  },
  price: {
    rules: { 
      required: true, 
      pattern: validationPatterns.price,
      custom: (value: unknown) => {
        const num = parseFloat(String(value));
        if (isNaN(num) || num < 0) return 'Price must be a positive number';
        if (num > 9999.99) return 'Price cannot exceed $9,999.99';
        return undefined;
      }
    },
    label: 'Price',
  },
  categoryId: {
    rules: { required: true },
    label: 'Category',
  },
  imageUrl: {
    rules: { pattern: validationPatterns.url },
    label: 'Image URL',
  },
};

// Helper to get Firebase ID token
async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

// API helper functions
async function fetchCategories(restaurantId: string): Promise<MenuCategory[]> {
  const response = await fetch(`/api/categories?restaurantId=${restaurantId}`);
  if (!response.ok) throw new Error('Failed to fetch categories');
  const data = await response.json();
  return data.categories.map((cat: MenuCategory) => ({
    ...cat,
    createdAt: new Date(cat.createdAt),
    updatedAt: new Date(cat.updatedAt),
  }));
}

async function fetchMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const response = await fetch(`/api/menu-items?restaurantId=${restaurantId}`);
  if (!response.ok) throw new Error('Failed to fetch menu items');
  const data = await response.json();
  return data.items.map((item: MenuItem) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
}

async function createMenuItem(token: string, item: Partial<MenuItem>): Promise<MenuItem> {
  const response = await fetch('/api/menu-items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(item),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create menu item');
  }
  const data = await response.json();
  return data.item;
}

async function updateMenuItem(token: string, id: string, updates: Partial<MenuItem>): Promise<void> {
  const response = await fetch('/api/menu-items', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ id, ...updates }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update menu item');
  }
}

async function deleteMenuItem(token: string, id: string): Promise<void> {
  const response = await fetch(`/api/menu-items?id=${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete menu item');
  }
}

export default function MenuManagementPage() {
  const { session, isLoading: sessionLoading } = useStaffSession();
  const restaurantId = session?.restaurantId;
  
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Delete confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
  } = useFormValidation<MenuItemFormValues>(initialFormValues, formConfig);

  // Load data on mount
  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const [categoriesData, itemsData] = await Promise.all([
        fetchCategories(restaurantId),
        fetchMenuItems(restaurantId),
      ]);
      
      setCategories(categoriesData);
      setMenuItems(itemsData);
    } catch (error) {
      console.error('Failed to load menu data:', error);
      setLoadError(error instanceof Error ? error.message : 'Failed to load menu data');
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (restaurantId) {
      loadData();
    }
  }, [restaurantId, loadData]);

  // Filter items by category and search query
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItemAvailability = async (item: MenuItem) => {
    const token = await getIdToken();
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in again to make changes.',
      });
      return;
    }
    
    try {
      await updateMenuItem(token, item.id, { available: !item.available });
      
      setMenuItems(items => items.map(i => 
        i.id === item.id ? { ...i, available: !i.available } : i
      ));
      
      toast({
        title: item.available ? 'Item Unavailable' : 'Item Available',
        description: `${item.name} is now ${item.available ? 'unavailable' : 'available'} for ordering.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update item availability.',
      });
    }
  };

  const toggleItemFeatured = async (item: MenuItem) => {
    const token = await getIdToken();
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in again to make changes.',
      });
      return;
    }
    
    try {
      await updateMenuItem(token, item.id, { isFeatured: !item.isFeatured });
      
      setMenuItems(items => items.map(i => 
        i.id === item.id ? { ...i, isFeatured: !i.isFeatured } : i
      ));
      
      toast({
        title: item.isFeatured ? 'Removed from Featured' : 'Added to Featured',
        description: `${item.name} ${item.isFeatured ? 'removed from' : 'added to'} featured items.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update featured status.',
      });
    }
  };

  const onCreateItem = useCallback(async () => {
    const token = await getIdToken();
    if (!token || !restaurantId) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in again to add items.',
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      const newItem = await createMenuItem(token, {
        restaurantId,
        categoryId: values.categoryId,
        name: values.name,
        description: values.description || undefined,
        price: parseFloat(values.price),
        imageUrl: values.imageUrl || undefined,
        available: true,
        sortOrder: menuItems.length + 1,
      });
      
      setMenuItems(prev => [...prev, {
        ...newItem,
        createdAt: new Date(newItem.createdAt),
        updatedAt: new Date(newItem.updatedAt),
      }]);
      setShowAddItemForm(false);
      resetForm();
      
      toast({
        title: 'Menu Item Created',
        description: `${newItem.name} has been added to your menu.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create menu item.',
      });
    } finally {
      setIsCreating(false);
    }
  }, [values, restaurantId, menuItems.length, resetForm, toast]);

  const handleEditClick = (item: MenuItem) => {
    setEditingItem(item);
    setValues({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = useCallback(async () => {
    if (!editingItem) return;
    
    const token = await getIdToken();
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in again to make changes.',
      });
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await updateMenuItem(token, editingItem.id, {
        name: values.name,
        description: values.description || undefined,
        price: parseFloat(values.price),
        categoryId: values.categoryId,
        imageUrl: values.imageUrl || undefined,
      });
      
      setMenuItems(prev => prev.map(item => 
        item.id === editingItem.id 
          ? {
              ...item,
              name: values.name,
              description: values.description,
              price: parseFloat(values.price),
              categoryId: values.categoryId,
              imageUrl: values.imageUrl || undefined,
              updatedAt: new Date(),
            }
          : item
      ));
      
      setShowEditModal(false);
      setEditingItem(null);
      resetForm();
      
      toast({
        title: 'Item Updated',
        description: `${values.name} has been updated successfully.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update menu item.',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [editingItem, values, resetForm, toast]);

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    const token = await getIdToken();
    if (!token) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in again to delete items.',
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      await deleteMenuItem(token, itemToDelete.id);
      
      setMenuItems(prev => prev.filter(item => item.id !== itemToDelete.id));
      setShowDeleteDialog(false);
      
      toast({
        title: 'Item Deleted',
        description: `${itemToDelete.name} has been removed from your menu.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete menu item.',
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const duplicateItem = async (item: MenuItem) => {
    const token = await getIdToken();
    if (!token || !restaurantId) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in again to duplicate items.',
      });
      return;
    }
    
    try {
      const newItem = await createMenuItem(token, {
        restaurantId,
        categoryId: item.categoryId,
        name: `${item.name} (Copy)`,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        available: item.available,
        isFeatured: false, // Don't copy featured status
        tags: item.tags,
        allergens: item.allergens,
        sortOrder: menuItems.length + 1,
      });
      
      setMenuItems(prev => [...prev, {
        ...newItem,
        createdAt: new Date(newItem.createdAt),
        updatedAt: new Date(newItem.updatedAt),
      }]);
      
      toast({
        title: 'Item Duplicated',
        description: `${item.name} has been duplicated. You can now edit the copy.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to duplicate item.',
      });
    }
  };

  const getFieldError = (fieldName: keyof MenuItemFormValues) => {
    return touched[fieldName] && errors[fieldName];
  };

  const getFieldClasses = (fieldName: keyof MenuItemFormValues) => {
    const baseClasses = 'w-full p-4 border rounded-xl bg-surface-container-low transition-all duration-200 outline-none';
    const hasError = getFieldError(fieldName);
    
    if (hasError) {
      return `${baseClasses} border-error focus:border-error focus:ring-2 focus:ring-error-container`;
    }
    return `${baseClasses} border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20`;
  };

  // Stats
  const stats = {
    total: menuItems.length,
    available: menuItems.filter(i => i.available).length,
    featured: menuItems.filter(i => i.isFeatured).length,
    outOfStock: menuItems.filter(i => !i.available).length,
  };

  // Filter categories to exclude "All Items" pseudo-category
  const realCategories = categories.filter(c => c.slug !== 'all');

  // Show loading state while session is loading
  if (sessionLoading) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Menu Management"
          showSearch={false}
          user={{ name: 'Loading...', role: 'manager' }}
        />
        <div className="p-6 md:p-10 max-w-7xl w-full mx-auto flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-on-surface-variant">Loading session...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error if no restaurant ID
  if (!restaurantId) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Menu Management"
          showSearch={false}
          user={{ name: 'Guest', role: 'manager' }}
        />
        <div className="p-6 md:p-10 max-w-7xl w-full mx-auto flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-error" />
            <h2 className="font-display text-title-md text-primary">No Restaurant Selected</h2>
            <p className="text-on-surface-variant">Please log in to access your menu management.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopAppBar
        title="Menu Management"
        showSearch={false}
        user={{ name: session?.staffName || 'Manager', role: session?.role || 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-on-surface-variant">Loading menu data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <AlertCircle className="w-12 h-12 text-error" />
            <h2 className="font-display text-title-md text-primary">Failed to Load Menu</h2>
            <p className="text-on-surface-variant">{loadError}</p>
            <Button onClick={loadData} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !loadError && (
          <>
            {/* Stats Bar */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-on-surface-variant font-label-caps text-xs uppercase tracking-wider">Total Items</p>
                    <p className="font-display text-3xl text-primary mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-on-surface-variant font-label-caps text-xs uppercase tracking-wider">Available</p>
                    <p className="font-display text-3xl text-secondary mt-1">{stats.available}</p>
                  </div>
                  <div className="w-12 h-12 bg-secondary/5 rounded-xl flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                    <Eye className="w-6 h-6 text-secondary" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-on-surface-variant font-label-caps text-xs uppercase tracking-wider">Featured</p>
                    <p className="font-display text-3xl text-accent mt-1">{stats.featured}</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/5 rounded-xl flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                    <Star className="w-6 h-6 text-accent fill-accent" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-on-surface-variant font-label-caps text-xs uppercase tracking-wider">Out of Stock</p>
                    <p className="font-display text-3xl text-error mt-1">{stats.outOfStock}</p>
                  </div>
                  <div className="w-12 h-12 bg-error/5 rounded-xl flex items-center justify-center group-hover:bg-error/10 transition-colors">
                    <EyeOff className="w-6 h-6 text-error" />
                  </div>
                </div>
              </div>
            </section>

            {/* Category Tabs, Search & Primary CTA */}
            <section className="flex flex-col gap-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Category Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-6 py-3 rounded-full font-label-caps whitespace-nowrap transition-all duration-300 hover:scale-105 ${
                      selectedCategory === 'all'
                        ? 'bg-primary text-on-primary shadow-md'
                        : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    All Items
                  </button>
                  {realCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-6 py-3 rounded-full font-label-caps whitespace-nowrap transition-all duration-300 hover:scale-105 ${
                        selectedCategory === category.id
                          ? 'bg-primary text-on-primary shadow-md'
                          : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
                    <Input
                      type="text"
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-full border border-outline-variant bg-surface-container-low focus:border-secondary focus:ring-2 focus:ring-secondary-fixed/20 transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <Button 
                    className="bg-primary text-on-primary flex items-center gap-2 hover:scale-105 transition-transform duration-300 shrink-0 shadow-md"
                    onClick={() => {
                      resetForm();
                      setValues({
                        ...initialFormValues,
                        categoryId: realCategories[0]?.id || '',
                      });
                      setShowAddItemForm(true);
                    }}
                    disabled={realCategories.length === 0}
                  >
                    <Plus className="w-5 h-5" />
                    Add Item
                  </Button>
                </div>
              </div>
              
              {/* No categories message */}
              {realCategories.length === 0 && (
                <div className="bg-surface-container-low rounded-2xl p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-warning mx-auto mb-3" />
                  <p className="text-on-surface-variant">
                    No categories found. Please add categories first before creating menu items.
                  </p>
                </div>
              )}
              
              {/* Search Results Count */}
              {searchQuery && (
                <p className="text-on-surface-variant text-sm">
                  Found <strong className="text-primary">{filteredItems.length}</strong> item{filteredItems.length !== 1 ? 's' : ''} matching &quot;{searchQuery}&quot;
                </p>
              )}
            </section>

            {/* Add Item Modal */}
            {showAddItemForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-surface rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-up max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="font-display text-title-md text-primary">Add New Menu Item</h2>
                      <p className="text-on-surface-variant text-sm mt-1">Fill in the details to add a new item</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddItemForm(false);
                        resetForm();
                      }}
                      className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(onCreateItem);
                  }} className="space-y-6">
                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                        ITEM NAME <span className="text-error">*</span>
                      </label>
                      <Input
                        value={values.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g., Signature Latte"
                        className={getFieldClasses('name')}
                        maxLength={100}
                        disabled={isCreating}
                      />
                      {getFieldError('name') && (
                        <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                          <AlertCircle className="w-4 h-4" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                        DESCRIPTION
                      </label>
                      <textarea
                        value={values.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        onBlur={() => handleBlur('description')}
                        placeholder="Brief description of the item..."
                        className={`${getFieldClasses('description')} resize-none h-24`}
                        maxLength={500}
                        disabled={isCreating}
                      />
                      <p className="text-on-surface-variant text-xs mt-1 text-right">
                        {values.description.length}/500
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                          PRICE <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={values.price}
                            onChange={(e) => handleChange('price', e.target.value)}
                            onBlur={() => handleBlur('price')}
                            placeholder="0.00"
                            className={`${getFieldClasses('price')} pl-8`}
                            disabled={isCreating}
                          />
                        </div>
                        {getFieldError('price') && (
                          <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                            <AlertCircle className="w-4 h-4" />
                            {errors.price}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                          CATEGORY <span className="text-error">*</span>
                        </label>
                        <select
                          value={values.categoryId}
                          onChange={(e) => handleChange('categoryId', e.target.value)}
                          onBlur={() => handleBlur('categoryId')}
                          className={getFieldClasses('categoryId')}
                          disabled={isCreating}
                        >
                          <option value="">Select a category</option>
                          {realCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                        IMAGE URL
                      </label>
                      <Input
                        type="url"
                        value={values.imageUrl}
                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                        onBlur={() => handleBlur('imageUrl')}
                        placeholder="https://example.com/image.jpg"
                        className={getFieldClasses('imageUrl')}
                        disabled={isCreating}
                      />
                      {getFieldError('imageUrl') && (
                        <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                          <AlertCircle className="w-4 h-4" />
                          {errors.imageUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 py-4 rounded-full border border-outline-variant"
                        onClick={() => {
                          setShowAddItemForm(false);
                          resetForm();
                        }}
                        disabled={isCreating}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 py-4 rounded-full bg-primary text-on-primary hover:opacity-90"
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Add Item
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Item Modal */}
            {showEditModal && editingItem && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-surface rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-up max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="font-display text-title-md text-primary">Edit Menu Item</h2>
                      <p className="text-on-surface-variant text-sm mt-1">Update the details for {editingItem.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingItem(null);
                        resetForm();
                      }}
                      className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit(handleUpdateItem);
                  }} className="space-y-6">
                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                        ITEM NAME <span className="text-error">*</span>
                      </label>
                      <Input
                        value={values.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                        placeholder="e.g., Signature Latte"
                        className={getFieldClasses('name')}
                        maxLength={100}
                        disabled={isUpdating}
                      />
                      {getFieldError('name') && (
                        <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                          <AlertCircle className="w-4 h-4" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                        DESCRIPTION
                      </label>
                      <textarea
                        value={values.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        onBlur={() => handleBlur('description')}
                        placeholder="Brief description of the item..."
                        className={`${getFieldClasses('description')} resize-none h-24`}
                        maxLength={500}
                        disabled={isUpdating}
                      />
                      <p className="text-on-surface-variant text-xs mt-1 text-right">
                        {values.description.length}/500
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                          PRICE <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">$</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={values.price}
                            onChange={(e) => handleChange('price', e.target.value)}
                            onBlur={() => handleBlur('price')}
                            placeholder="0.00"
                            className={`${getFieldClasses('price')} pl-8`}
                            disabled={isUpdating}
                          />
                        </div>
                        {getFieldError('price') && (
                          <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                            <AlertCircle className="w-4 h-4" />
                            {errors.price}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                          CATEGORY <span className="text-error">*</span>
                        </label>
                        <select
                          value={values.categoryId}
                          onChange={(e) => handleChange('categoryId', e.target.value)}
                          onBlur={() => handleBlur('categoryId')}
                          className={getFieldClasses('categoryId')}
                          disabled={isUpdating}
                        >
                          <option value="">Select a category</option>
                          {realCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                        IMAGE URL
                      </label>
                      <Input
                        type="url"
                        value={values.imageUrl}
                        onChange={(e) => handleChange('imageUrl', e.target.value)}
                        onBlur={() => handleBlur('imageUrl')}
                        placeholder="https://example.com/image.jpg"
                        className={getFieldClasses('imageUrl')}
                        disabled={isUpdating}
                      />
                      {getFieldError('imageUrl') && (
                        <p className="text-error text-sm mt-2 flex items-center gap-1 animate-slide-in-up">
                          <AlertCircle className="w-4 h-4" />
                          {errors.imageUrl}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 py-4 rounded-full border border-outline-variant"
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingItem(null);
                          resetForm();
                        }}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 py-4 rounded-full bg-secondary text-on-secondary hover:opacity-90"
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Menu Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className={`bg-surface-container-lowest p-4 rounded-3xl shadow-card border border-outline-variant/10 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden ${
                    !item.available ? 'opacity-70' : ''
                  }`}
                >
                  {/* Featured Badge */}
                  {item.isFeatured && (
                    <div className="absolute top-3 left-3 z-10 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                      Featured
                    </div>
                  )}
                  
                  <div className={`relative h-48 w-full rounded-xl overflow-hidden mb-4 ${!item.available ? 'grayscale' : ''}`}>
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-outline" />
                      </div>
                    )}
                    {item.tags?.includes('VEGAN') && (
                      <div className="absolute top-2 right-2 bg-green-500/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                        <p className="font-label-caps text-[10px] text-white font-bold">VEGAN</p>
                      </div>
                    )}
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <p className="bg-white/95 text-primary font-label-caps px-6 py-2 rounded-full text-xs shadow-lg">
                          OUT OF STOCK
                        </p>
                      </div>
                    )}
                    
                    {/* Quick Action Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-secondary hover:text-white transition-all duration-200 hover:scale-110"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => toggleItemFeatured(item)}
                          className={`p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
                            item.isFeatured 
                              ? 'bg-accent text-white hover:bg-accent/80' 
                              : 'bg-white hover:bg-accent hover:text-white'
                          }`}
                        >
                          <Star className={`w-5 h-5 ${item.isFeatured ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => duplicateItem(item)}
                          className="p-3 bg-white rounded-full shadow-lg hover:bg-secondary hover:text-white transition-all duration-200 hover:scale-110"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="px-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-display text-title-sm text-primary group-hover:text-secondary transition-colors">{item.name}</h3>
                      <span className="font-display text-title-sm text-secondary font-bold">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="font-body text-on-surface-variant text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleItemAvailability(item)}
                          className={`w-10 h-6 rounded-full relative transition-all duration-300 flex items-center px-1 hover:scale-105 ${
                            item.available ? 'bg-secondary-fixed' : 'bg-surface-container-highest'
                          }`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                            item.available ? 'translate-x-4' : 'translate-x-0'
                          }`} />
                        </button>
                        <span className="font-label-caps text-xs text-on-surface-variant">
                          {item.available ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-secondary-fixed hover:text-on-secondary-fixed-variant transition-all duration-300 hover:scale-110"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 rounded-full bg-surface-container-low text-error hover:bg-error-container transition-all duration-300 hover:scale-110"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {/* No Results */}
              {filteredItems.length === 0 && searchQuery && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-on-surface-variant" />
                  </div>
                  <h3 className="font-display text-title-sm text-primary mb-2">No items found</h3>
                  <p className="text-on-surface-variant">Try a different search term or clear your search</p>
                </div>
              )}

              {/* Empty State */}
              {menuItems.length === 0 && !searchQuery && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-on-surface-variant" />
                  </div>
                  <h3 className="font-display text-title-sm text-primary mb-2">No menu items yet</h3>
                  <p className="text-on-surface-variant mb-4">Start building your menu by adding your first item</p>
                  <Button 
                    onClick={() => {
                      resetForm();
                      setValues({
                        ...initialFormValues,
                        categoryId: realCategories[0]?.id || '',
                      });
                      setShowAddItemForm(true);
                    }}
                    disabled={realCategories.length === 0}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Item
                  </Button>
                </div>
              )}

              {/* Category Empty State */}
              {filteredItems.length === 0 && menuItems.length > 0 && !searchQuery && (
                <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-on-surface-variant" />
                  </div>
                  <h3 className="font-display text-title-sm text-primary mb-2">No items in this category</h3>
                  <p className="text-on-surface-variant mb-4">Add items to this category or select another category</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{itemToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-error text-white hover:bg-error/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
