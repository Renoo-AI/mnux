'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Minus, ShoppingCart, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { restaurantService } from '@/services/restaurantService';
import { menuService } from '@/services/menuService';
import { tableService } from '@/services/tableService';
import { useCartStore } from '@/stores/cartStore';
import type { Restaurant, MenuItem, MenuCategory, Table } from '@/types';

export default function TableOrderingPage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    items, 
    addItem, 
    removeItem, 
    updateQuantity, 
    setContext, 
    getTotalItems, 
    getTotalPrice,
    getItemByItemId 
  } = useCartStore();
  const cartItemCount = getTotalItems();
  const cartTotal = getTotalPrice();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get restaurant by slug
        const restaurantData = await restaurantService.getBySlug(resolvedParams.slug);
        if (!restaurantData) {
          setError('Restaurant not found');
          return;
        }
        setRestaurant(restaurantData);
        
        // Get table
        const tableData = await tableService.getTableByName(restaurantData.id, resolvedParams.tableId);
        if (!tableData) {
          setError('Table not found');
          return;
        }
        setTable(tableData);
        
        // Check if table is available for ordering
        if (tableData.state === 'ACTIVE') {
          setError('This table already has an active order. Please speak with staff.');
          return;
        }
        
        if (tableData.state === 'OFFLINE') {
          setError('This table is currently unavailable. Please speak with staff.');
          return;
        }
        
        // Set cart context
        setContext(restaurantData.id, restaurantData.slug, tableData.id);
        
        // Load categories and menu items
        const [categoriesData, itemsData] = await Promise.all([
          menuService.getCategories(restaurantData.id),
          menuService.getMenuItems(restaurantData.id),
        ]);
        
        setCategories(categoriesData);
        setMenuItems(itemsData);
        
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      } catch (err) {
        console.error('Error loading menu:', err);
        setError('Failed to load menu');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [resolvedParams.slug, resolvedParams.tableId, setContext]);

  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.categoryId === selectedCategory && item.isAvailable)
    : menuItems.filter(item => item.isAvailable);

  const handleAddToCart = (item: MenuItem) => {
    addItem({
      itemId: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      imageUrl: item.imageUrl,
    });
  };

  const handleQuantityChange = (item: MenuItem, delta: number) => {
    const cartItem = getItemByItemId(item.id);
    if (cartItem) {
      const newQuantity = cartItem.quantity + delta;
      if (newQuantity <= 0) {
        removeItem(item.id);
      } else {
        updateQuantity(item.id, newQuantity);
      }
    } else if (delta > 0) {
      handleAddToCart(item);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle className="w-16 h-16 text-error" />
        <h1 className="font-display text-headline-md text-primary text-center">
          {error.includes('active order') ? 'Table Busy' : 
           error.includes('unavailable') ? 'Table Offline' : 'Error'}
        </h1>
        <p className="text-on-surface-variant text-center max-w-md">{error}</p>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body pb-32">
      {/* Header */}
      <header className="px-6 pt-10 pb-4 flex justify-between items-end sticky top-0 bg-background/90 backdrop-blur-md z-30">
        <div>
          <p className="font-label-caps text-label-caps text-outline mb-1">{restaurant?.name?.toUpperCase()}</p>
          <h1 className="font-display text-headline-md text-primary">{table?.name}</h1>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-outline">room_service</span>
          <span className="font-label-caps text-label-caps text-on-surface">Service</span>
        </div>
      </header>

      {/* Categories */}
      <nav className="overflow-x-auto hide-scrollbar px-6 py-4 flex gap-2 sticky top-[100px] bg-background/90 backdrop-blur-md z-20">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors font-label-caps ${
              selectedCategory === category.id
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {category.name}
          </button>
        ))}
      </nav>

      {/* Menu Grid */}
      <main className="px-6 py-4 flex flex-col gap-6">
        {filteredItems.map((item) => {
          const cartItem = getItemByItemId(item.id);
          const quantity = cartItem?.quantity || 0;
          
          return (
            <article
              key={item.id}
              className="bg-surface-container-lowest rounded-xl shadow-card p-4 flex gap-4 items-center"
            >
              <div className="w-24 h-24 rounded-lg bg-surface-variant shrink-0 overflow-hidden relative">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                    <span className="material-symbols-outlined text-outline">restaurant</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-display text-title-sm text-primary mb-1">{item.name}</h3>
                  <p className="font-body text-outline text-sm truncate">{item.description}</p>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="font-display text-title-sm text-primary">${item.price.toFixed(2)}</span>
                  
                  {quantity > 0 ? (
                    <div className="flex items-center gap-2 bg-surface-container-high rounded-full px-1 py-1">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        className="w-6 h-6 rounded-full bg-surface text-primary flex items-center justify-center"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-label-caps text-label-caps text-primary w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="w-6 h-6 rounded-full bg-surface text-primary flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center hover:bg-surface-container-highest transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
        
        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">no_meals</span>
            <p>No items available in this category</p>
          </div>
        )}
      </main>

      {/* Sticky Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest shadow-[0px_-10px_30px_rgba(58,50,45,0.05)] rounded-t-xl z-50 px-6 py-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-body text-on-surface-variant">{cartItemCount} Items</p>
              <p className="font-display text-title-sm text-primary">${cartTotal.toFixed(2)}</p>
            </div>
            <Button
              asChild
              className="bg-secondary text-on-secondary hover:opacity-90"
            >
              <Link href={`/r/${restaurant?.slug}/t/${table?.name}/review`}>
                <span>Review Order</span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="w-12 h-1 bg-surface-container-highest rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
        </div>
      )}
    </div>
  );
}
