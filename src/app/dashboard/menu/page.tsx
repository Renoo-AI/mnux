'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Star, X, AlertCircle, Loader2, Check, ImageIcon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { menuService } from '@/services/menuService';
import { useFormValidation, validationPatterns } from '@/hooks/use-form-validation';
import { useToast } from '@/hooks/use-toast';
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

const DEMO_RESTAURANT_ID = 'demo-restaurant';

// Demo data for development
const demoCategories: MenuCategory[] = [
  { id: '1', restaurantId: DEMO_RESTAURANT_ID, name: 'All Items', slug: 'all', sortOrder: 0, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', restaurantId: DEMO_RESTAURANT_ID, name: 'Coffee', slug: 'coffee', sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', restaurantId: DEMO_RESTAURANT_ID, name: 'Pastries', slug: 'pastries', sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', restaurantId: DEMO_RESTAURANT_ID, name: 'Teas', slug: 'teas', sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const demoItems: MenuItem[] = [
  { id: '1', restaurantId: DEMO_RESTAURANT_ID, categoryId: '2', name: 'Classic Flat White', description: 'Double shot of reserve espresso with silky micro-foam texture.', price: 5.50, imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, tags: ['BESTSELLER'], sortOrder: 1, createdAt: new Date(), updatedAt: new Date() },
  { id: '2', restaurantId: DEMO_RESTAURANT_ID, categoryId: '3', name: 'Almond Croissant', description: 'Hand-rolled sourdough pastry with organic almond frangipane.', price: 6.25, imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop', isAvailable: true, tags: ['VEGAN'], sortOrder: 2, createdAt: new Date(), updatedAt: new Date() },
  { id: '3', restaurantId: DEMO_RESTAURANT_ID, categoryId: '4', name: 'Iced Hibiscus Tea', description: 'Cold-brewed Egyptian hibiscus with citrus and raw honey.', price: 4.75, imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop', isAvailable: false, sortOrder: 3, createdAt: new Date(), updatedAt: new Date() },
  { id: '4', restaurantId: DEMO_RESTAURANT_ID, categoryId: '5', name: 'Heirloom Avo Toast', description: 'Whipped avocado, pickled radish, and volcanic salt on local rye.', price: 14.00, imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop', isAvailable: true, sortOrder: 4, createdAt: new Date(), updatedAt: new Date() },
];

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
  categoryId: '2',
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

export default function MenuManagementPage() {
  const [categories] = useState<MenuCategory[]>(demoCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(demoItems);
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  
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
  } = useFormValidation<MenuItemFormValues>(initialFormValues, formConfig);

  // Filter items by category and search query
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === '1' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItemAvailability = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    setMenuItems(items => items.map(item => 
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    ));
    
    toast({
      title: item.isAvailable ? 'Item Unavailable' : 'Item Available',
      description: `${item.name} is now ${item.isAvailable ? 'unavailable' : 'available'} for ordering.`,
    });
  };

  const onCreateItem = useCallback(async () => {
    setIsCreating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        restaurantId: DEMO_RESTAURANT_ID,
        categoryId: values.categoryId,
        name: values.name,
        description: values.description,
        price: parseFloat(values.price),
        imageUrl: values.imageUrl || undefined,
        isAvailable: true,
        sortOrder: menuItems.length + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      setMenuItems(prev => [...prev, newItem]);
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
        description: 'Failed to create menu item. Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  }, [values, menuItems.length, resetForm, toast]);

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
        description: 'Failed to delete menu item. Please try again.',
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
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

  return (
    <DashboardLayout>
      <TopAppBar
        title="Menu Management"
        showSearch={false}
        user={{ name: 'Manager', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8 animate-fade-in">
        {/* Category Tabs, Search & Primary CTA */}
        <section className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
              {categories.map((category) => (
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
                className="bg-primary text-on-primary flex items-center gap-2 hover:scale-105 transition-transform duration-300 shrink-0"
                onClick={() => setShowAddItemForm(true)}
              >
                <Plus className="w-5 h-5" />
                Add Item
              </Button>
            </div>
          </div>
          
          {/* Search Results Count */}
          {searchQuery && (
            <p className="text-on-surface-variant text-sm">
              Found <strong className="text-primary">{filteredItems.length}</strong> item{filteredItems.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </p>
          )}
        </section>

        {/* Add Item Modal */}
        {showAddItemForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-surface rounded-3xl shadow-2xl max-w-lg w-full p-8 animate-scale-up max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-title-md text-primary">Add New Menu Item</h2>
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
                      {categories.filter(c => c.id !== '1').map(category => (
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

        {/* Menu Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={`bg-surface-container-lowest p-4 rounded-3xl shadow-card border border-outline-variant/10 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                !item.isAvailable ? 'opacity-60' : ''
              }`}
            >
              <div className={`relative h-48 w-full rounded-xl overflow-hidden mb-4 ${!item.isAvailable ? 'grayscale' : ''}`}>
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
                {item.isFeatured && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                    <p className="font-label-caps text-[10px] text-primary">BESTSELLER</p>
                  </div>
                )}
                {item.tags?.includes('VEGAN') && (
                  <div className="absolute top-2 left-2 bg-tertiary-fixed/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
                    <p className="font-label-caps text-[10px] text-on-tertiary-fixed">VEGAN</p>
                  </div>
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <p className="bg-white/90 text-primary font-label-caps px-6 py-2 rounded-full text-xs shadow-md">
                      OUT OF STOCK
                    </p>
                  </div>
                )}
              </div>

              <div className="px-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-display text-title-sm text-primary group-hover:text-secondary transition-colors">{item.name}</h3>
                  <span className="font-display text-title-sm text-secondary">${item.price.toFixed(2)}</span>
                </div>
                <p className="font-body text-on-surface-variant text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleItemAvailability(item.id)}
                      className={`w-10 h-6 rounded-full relative transition-all duration-300 flex items-center px-1 hover:scale-105 ${
                        item.isAvailable ? 'bg-secondary-fixed' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                        item.isAvailable ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className="font-label-caps text-xs text-on-surface-variant">
                      {item.isAvailable ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-secondary-fixed hover:text-on-secondary-fixed-variant transition-all duration-300 hover:scale-110">
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
              <p className="text-on-surface-variant">Try adjusting your search or filter criteria</p>
              <Button 
                variant="outline" 
                className="mt-4 rounded-full"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* Add New Item Placeholder */}
          {!searchQuery && (
            <button 
              onClick={() => setShowAddItemForm(true)}
              className="border-2 border-dashed border-outline-variant/40 p-4 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:bg-surface-container-low hover:border-secondary transition-all duration-300 min-h-[400px] hover:shadow-lg"
            >
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant group-hover:bg-secondary-fixed group-hover:text-on-secondary-fixed-variant group-hover:scale-110 transition-all duration-300">
                <Plus className="w-8 h-8" />
              </div>
              <div className="text-center">
                <h3 className="font-display text-title-sm text-primary">Add New Item</h3>
                <p className="font-body text-on-surface-variant text-sm">Create a new dish or beverage</p>
              </div>
            </button>
          )}
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-surface rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-error-container rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <AlertDialogTitle className="font-display text-title-md text-primary">
                Delete Menu Item?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-on-surface-variant">
              Are you sure you want to delete <strong className="text-primary">{itemToDelete?.name}</strong>? 
              This action cannot be undone and will remove the item from your menu immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel 
              className="rounded-full border border-outline-variant px-6"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-error text-on-error rounded-full px-6 hover:bg-error/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete Item'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
