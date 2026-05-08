'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Plus, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { restaurantService } from '@/services/restaurantService';
import { menuService } from '@/services/menuService';
import { useCartStore } from '@/stores/cartStore';
import { MenuSkeleton } from '@/components/ui/menu-skeleton';
import type { Restaurant, MenuItem, MenuCategory } from '@/types';

// Demo data for when Firebase is not connected
const DEMO_RESTAURANT: Restaurant = {
  id: 'demo-restaurant-id',
  slug: 'demo',
  name: 'Café Élégance',
  cuisineType: 'French Café',
  address: '123 Rue de la Paix, Paris',
  phone: '+33 1 23 45 67 89',
  email: 'hello@cafe-elegance.fr',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', restaurantId: 'demo-restaurant-id', name: 'Signature Coffee', slug: 'signature-coffee', sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-2', restaurantId: 'demo-restaurant-id', name: 'Artisan Pastries', slug: 'artisan-pastries', sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-3', restaurantId: 'demo-restaurant-id', name: 'Light Meals', slug: 'light-meals', sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const DEMO_MENU_ITEMS: MenuItem[] = [
  {
    id: 'item-1',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-1',
    name: 'Ethiopian Yirgacheffe',
    description: 'Single-origin pour-over with bright citrus notes and a floral finish. Sourced from smallholder farms in the Sidamo region.',
    price: 5.50,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    isAvailable: true,
    isFeatured: true,
    tags: ['BESTSELLER'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-2',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-1',
    name: 'Colombian Supremo',
    description: 'Rich and full-bodied with caramel sweetness and a hint of dark chocolate. A classic espresso blend.',
    price: 4.50,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
    isAvailable: true,
    isFeatured: false,
    tags: [],
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-3',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-1',
    name: 'Lavender Oat Latte',
    description: 'House-made lavender syrup swirled into velvety oat milk and double-shot espresso.',
    price: 6.50,
    imageUrl: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=300&fit=crop',
    isAvailable: true,
    isFeatured: true,
    tags: ['VEGAN', 'POPULAR'],
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-4',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-2',
    name: 'Croissant aux Amandes',
    description: 'Buttery croissant filled with frangipane and topped with sliced almonds and powdered sugar.',
    price: 4.80,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop',
    isAvailable: true,
    isFeatured: false,
    tags: [],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-5',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-2',
    name: 'Pain au Chocolat',
    description: 'Classic French pastry with dark chocolate batons, baked to golden perfection.',
    price: 4.20,
    imageUrl: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=300&fit=crop',
    isAvailable: true,
    isFeatured: true,
    tags: ['BESTSELLER'],
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-6',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-3',
    name: 'Avocado Toast',
    description: 'Sourdough topped with smashed avocado, cherry tomatoes, microgreens, and a sprinkle of everything seasoning.',
    price: 12.50,
    imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop',
    isAvailable: true,
    isFeatured: false,
    tags: ['VEGAN'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-7',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-3',
    name: 'Smoked Salmon Tartine',
    description: 'House-cured salmon on rye bread with cream cheese, capers, red onion, and fresh dill.',
    price: 15.00,
    imageUrl: 'https://images.unsplash.com/photo-1514326640560-7d063ef2b88f?w=400&h=300&fit=crop',
    isAvailable: true,
    isFeatured: true,
    tags: ['POPULAR'],
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function PublicMenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { items, addItem, getTotalItems, getTotalPrice } = useCartStore();
  const cartItemCount = getTotalItems();
  const cartTotal = getTotalPrice();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Check if this is the demo restaurant
        if (resolvedParams.slug === 'demo') {
          setRestaurant(DEMO_RESTAURANT);
          setCategories(DEMO_CATEGORIES);
          setMenuItems(DEMO_MENU_ITEMS);
          setIsDemoMode(true);
          if (DEMO_CATEGORIES.length > 0) {
            setSelectedCategory(DEMO_CATEGORIES[0].id);
          }
          setLoading(false);
          return;
        }
        
        // Try to get restaurant from Firebase
        const restaurantData = await restaurantService.getBySlug(resolvedParams.slug);
        if (!restaurantData) {
          setError('Restaurant not found');
          return;
        }
        setRestaurant(restaurantData);
        
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
        // If there's an error and it might be Firebase connection, show demo data
        if (resolvedParams.slug === 'demo' || !restaurant) {
          setRestaurant(DEMO_RESTAURANT);
          setCategories(DEMO_CATEGORIES);
          setMenuItems(DEMO_MENU_ITEMS);
          setIsDemoMode(true);
          if (DEMO_CATEGORIES.length > 0) {
            setSelectedCategory(DEMO_CATEGORIES[0].id);
          }
        } else {
          setError('Failed to load menu');
        }
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [resolvedParams.slug]);

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

  if (loading) {
    return <MenuSkeleton />;
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-8">
        <h1 className="font-display text-headline-md text-primary">
          {error === 'Restaurant not found' ? 'Restaurant Not Found' : 'Error'}
        </h1>
        <p className="text-on-surface-variant">{error || 'Unable to load restaurant'}</p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-body pb-24">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-secondary-container text-on-secondary-container px-4 py-2 text-center text-label-sm">
          <span className="font-semibold">Demo Mode</span> — This is a preview of Menux with sample menu items
        </div>
      )}
      
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-4 sticky top-0 bg-surface shadow-card z-40">
        <div className="flex items-center gap-2">
          <span className="font-display text-title-sm font-bold text-primary">{restaurant.name}</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-full">
          <span className="material-symbols-outlined text-outline text-xl">room_service</span>
          <span className="font-label-caps text-label-caps text-on-surface">Service</span>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pt-6 pb-4">
        <h1 className="font-display text-headline-md text-primary mb-2">
          {categories.find(c => c.id === selectedCategory)?.name || 'Menu'}
        </h1>
        <p className="text-on-surface-variant max-w-md">
          Curated artisanal roasts and handmade pastries delivered to your table.
        </p>
      </section>

      {/* Category Tabs */}
      <nav className="sticky top-[72px] z-30 bg-surface/90 backdrop-blur-md overflow-x-auto hide-scrollbar flex items-center gap-4 px-6 py-4">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`whitespace-nowrap px-6 py-2 rounded-full font-label-caps transition-all ${
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
      <main className="px-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.map((item) => (
          <article
            key={item.id}
            className="bg-white rounded-3xl overflow-hidden shadow-card border border-surface-container transition-all hover:-translate-y-1"
          >
            <div className="relative h-48 w-full bg-surface-variant">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-container-low">
                  <span className="material-symbols-outlined text-outline text-4xl">restaurant</span>
                </div>
              )}
              {item.isFeatured && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-label-sm flex items-center gap-1">
                  <Star className="w-4 h-4 text-secondary fill-secondary" />
                  <span>Best Seller</span>
                </div>
              )}
              {item.tags?.includes('VEGAN') && (
                <div className="absolute top-3 left-3 bg-tertiary-fixed/90 backdrop-blur-md px-3 py-1 rounded-full">
                  <span className="font-label-caps text-[10px] text-on-tertiary-fixed">VEGAN</span>
                </div>
              )}
            </div>
            
            <div className="p-6 flex flex-col gap-2">
              <div className="flex justify-between items-start">
                <h3 className="font-display text-title-sm text-primary">{item.name}</h3>
                <span className="text-secondary font-bold text-title-sm">${item.price.toFixed(2)}</span>
              </div>
              <p className="text-on-surface-variant text-sm line-clamp-2">{item.description}</p>
              
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  {item.tags?.filter(t => t !== 'VEGAN' && t !== 'BESTSELLER').slice(0, 2).map((tag) => (
                    <span key={tag} className="bg-surface-container-low text-on-surface-variant px-3 py-1 rounded-full text-label-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-all shadow-md"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </article>
        ))}
        
        {filteredItems.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl mb-4">no_meals</span>
            <p>No items available in this category</p>
          </div>
        )}
      </main>

      {/* Sticky Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 w-full z-50 p-4 flex justify-center pointer-events-none">
          <Link
            href={`/r/${restaurant.slug}/t/order`}
            className="bg-primary text-on-primary w-full max-w-md h-16 rounded-full shadow-2xl flex items-center justify-between px-6 pointer-events-auto active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                {cartItemCount}
              </div>
              <span className="font-bold font-label-caps tracking-widest uppercase">
                View Order
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">${cartTotal.toFixed(2)}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
