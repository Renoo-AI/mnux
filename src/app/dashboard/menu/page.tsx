'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Search, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { menuService } from '@/services/menuService';
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

export default function MenuManagementPage() {
  const [categories] = useState<MenuCategory[]>(demoCategories);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(demoItems);
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === '1' || item.categoryId === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleItemAvailability = (itemId: string) => {
    setMenuItems(items => items.map(item => 
      item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
    ));
  };

  return (
    <DashboardLayout>
      <TopAppBar
        title="Menu Management"
        showSearch={false}
        user={{ name: 'Manager', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl w-full mx-auto space-y-8">
        {/* Category Tabs & Primary CTA */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full font-label-caps whitespace-nowrap transition-transform ${
                  selectedCategory === category.id
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-high text-on-surface'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <Button className="bg-primary text-on-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Item
          </Button>
        </section>

        {/* Menu Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className={`bg-surface-container-lowest p-4 rounded-3xl shadow-card border border-outline-variant/10 group ${
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
                    <span className="material-symbols-outlined text-outline text-4xl">restaurant</span>
                  </div>
                )}
                {item.isFeatured && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full">
                    <p className="font-label-caps text-[10px] text-primary">BESTSELLER</p>
                  </div>
                )}
                {item.tags?.includes('VEGAN') && (
                  <div className="absolute top-2 left-2 bg-tertiary-fixed/90 backdrop-blur-md px-3 py-1 rounded-full">
                    <p className="font-label-caps text-[10px] text-on-tertiary-fixed">VEGAN</p>
                  </div>
                )}
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <p className="bg-white/90 text-primary font-label-caps px-6 py-2 rounded-full text-xs">
                      OUT OF STOCK
                    </p>
                  </div>
                )}
              </div>

              <div className="px-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-display text-title-sm text-primary">{item.name}</h3>
                  <span className="font-display text-title-sm text-secondary">${item.price.toFixed(2)}</span>
                </div>
                <p className="font-body text-on-surface-variant text-sm mb-4 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleItemAvailability(item.id)}
                      className={`w-10 h-6 rounded-full relative transition-colors flex items-center px-1 ${
                        item.isAvailable ? 'bg-secondary-fixed' : 'bg-surface-container-highest'
                      }`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        item.isAvailable ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className="font-label-caps text-xs text-on-surface-variant">
                      {item.isAvailable ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="p-2 rounded-full bg-surface-container-low text-primary hover:bg-secondary-fixed transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-full bg-surface-container-low text-error hover:bg-error-container transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {/* Add New Item Placeholder */}
          <button className="border-2 border-dashed border-outline-variant/40 p-4 rounded-3xl flex flex-col items-center justify-center gap-4 group hover:bg-surface-container-low transition-all min-h-[400px]">
            <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center text-on-surface-variant group-hover:bg-secondary-fixed group-hover:text-on-secondary-fixed-variant transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <div className="text-center">
              <h3 className="font-display text-title-sm text-primary">Add New Item</h3>
              <p className="font-body text-on-surface-variant text-sm">Create a new dish or beverage</p>
            </div>
          </button>
        </section>
      </div>
    </DashboardLayout>
  );
}
