'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Minus, ChevronRight, AlertTriangle, Loader2, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { restaurantService } from '@/services/restaurantService';
import { menuService } from '@/services/menuService';
import { tableService } from '@/services/tableService';
import { useCartStore } from '@/stores/cartStore';
import { Watermark, WatermarkSpacer } from '@/components/Watermark';
import type { Restaurant, MenuItem, MenuCategory, Table } from '@/types';

interface MenuDisplayItem {
  id: string;
  category: string;
  categoryAr: string;
  nameFr: string;
  nameAr: string;
  price: string;
  description?: string;
  categoryId: string;
  available: boolean;
}

// Demo menu items
const DEMO_MENU_ITEMS: MenuDisplayItem[] = [
  { id: '1', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Express / Demi / Allongé', nameAr: 'إكسبريسو / دمي / ألونجي', price: '2.5', categoryId: 'cat-1', available: true },
  { id: '2', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Cappuccino / Americano', nameAr: 'كابوتشينو / أمريكانو', price: '2.8', categoryId: 'cat-1', available: true },
  { id: '3', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Direct', nameAr: 'قهوة ديريكت', price: '3.2', categoryId: 'cat-1', available: true },
  { id: '4', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Spécial', nameAr: 'قهوة خاصة', price: '3.5', categoryId: 'cat-1', available: true },
  { id: '5', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Jus Frais', nameAr: 'عصير طازج', price: '4', categoryId: 'cat-2', available: true },
  { id: '6', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Citronnade', nameAr: 'ليموناضة', price: '3', categoryId: 'cat-2', available: true },
  { id: '7', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Mojito', nameAr: 'موهيتو', price: '6', categoryId: 'cat-2', available: true },
  { id: '8', category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Croissant', nameAr: 'كرواسون', price: '2.5', categoryId: 'cat-3', available: true },
  { id: '9', category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Pâté', nameAr: 'باتي', price: '2', categoryId: 'cat-3', available: true },
];

// UI Strings for language toggle
const uiStrings = {
  fr: { 
    tag: 'The Experience', 
    footer: 'Merci de votre visite',
    toggle: 'عربي',
    reviewOrder: 'Voir la commande',
    items: 'articles',
    table: 'Table'
  },
  ar: { 
    tag: 'التجربة الفريدة', 
    footer: 'شكراً لزيارتكم',
    toggle: 'Français',
    reviewOrder: 'عرض الطلب',
    items: 'منتجات',
    table: 'طاولة'
  }
};

// Shimmer Loading
function ShimmerCard() {
  return (
    <div className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-black/[0.03]">
      <div className="h-5 w-1/3 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-md mb-6 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between items-center py-2">
            <div className="h-4 w-32 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-md animate-pulse" />
            <div className="h-4 w-12 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TableOrderingPage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [menuItems, setMenuItems] = useState<MenuDisplayItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState<'fr' | 'ar'>('fr');
  
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

  // Toggle language
  const toggleLang = () => {
    setCurrentLang(currentLang === 'fr' ? 'ar' : 'fr');
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get restaurant by slug
        const restaurantData = await restaurantService.getBySlug(resolvedParams.slug);
        if (!restaurantData) {
          // Use demo mode if restaurant not found
          setRestaurant({
            id: 'demo',
            slug: resolvedParams.slug,
            name: 'ZCOFFEE',
            status: 'ACTIVE',
            currency: 'TND',
            plan: 'free',
            slugType: 'free-random',
            watermarkEnabled: false,
            maxMenuItems: 50,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setTable({ id: 'demo-table', restaurantId: 'demo', name: resolvedParams.tableId, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() });
          setMenuItems(DEMO_MENU_ITEMS);
          setContext('demo', resolvedParams.slug, 'demo-table');
          setLoading(false);
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
        if (tableData.status === 'OFFLINE') {
          setError('This table is currently unavailable. Please speak with staff.');
          return;
        }
        
        if (tableData.status === 'AWAITING_PAYMENT') {
          setError('This table is awaiting payment. Please speak with staff to settle the bill.');
          return;
        }
        
        // Set cart context
        setContext(restaurantData.id, restaurantData.slug, tableData.id);
        
        // Load categories and menu items
        const [categoriesData, itemsData] = await Promise.all([
          menuService.getCategories(restaurantData.id),
          menuService.getMenuItems(restaurantData.id),
        ]);
        
        // Convert to display format
        const displayItems: MenuDisplayItem[] = itemsData
          .filter(item => item.available)
          .map((item) => {
            const category = categoriesData.find(c => c.id === item.categoryId);
            return {
              id: item.id,
              category: category?.name || 'Autre',
              categoryAr: (category as any)?.nameAr || category?.name || 'آخر',
              nameFr: item.name,
              nameAr: (item as any).nameAr || item.name,
              price: item.price.toFixed(1),
              description: item.description,
              categoryId: item.categoryId,
              available: item.available,
            };
          });
        
        setMenuItems(displayItems.length > 0 ? displayItems : DEMO_MENU_ITEMS);
        if (categoriesData.length > 0) {
          setSelectedCategory(categoriesData[0].id);
        }
      } catch (err) {
        console.error('Error loading menu:', err);
        // Fallback to demo
        setRestaurant({
          id: 'demo',
          slug: resolvedParams.slug,
          name: 'ZCOFFEE',
          status: 'ACTIVE',
          currency: 'TND',
          plan: 'free',
          slugType: 'free-random',
          watermarkEnabled: false,
          maxMenuItems: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setTable({ id: 'demo-table', restaurantId: 'demo', name: resolvedParams.tableId, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date() });
        setMenuItems(DEMO_MENU_ITEMS);
        setContext('demo', resolvedParams.slug, 'demo-table');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [resolvedParams.slug, resolvedParams.tableId, setContext]);

  // Get unique categories
  const categories = [...new Set(menuItems.map(item => item.category))];
  
  // Filter items by selected category
  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.category === selectedCategory || item.categoryId === selectedCategory)
    : menuItems;

  const handleQuantityChange = (item: MenuDisplayItem, delta: number) => {
    const cartItem = getItemByItemId(item.id);
    const name = currentLang === 'fr' ? item.nameFr : item.nameAr;
    
    if (cartItem) {
      const newQuantity = cartItem.quantity + delta;
      if (newQuantity <= 0) {
        removeItem(item.id);
      } else {
        updateQuantity(item.id, newQuantity);
      }
    } else if (delta > 0) {
      addItem({
        itemId: item.id,
        name: name,
        price: parseFloat(item.price),
        quantity: 1,
      });
    }
  };

  const getCurrencySymbol = () => {
    if (restaurant?.currency === 'TND') return currentLang === 'fr' ? 'DT' : 'د.ت';
    if (restaurant?.currency === 'EUR') return '€';
    return currentLang === 'fr' ? 'DT' : 'د.ت';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] pb-20" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
        <nav className="sticky top-0 z-50 px-6 py-4 flex justify-center items-center bg-[#faf9f6]/90 backdrop-blur-xl border-b border-[#b48c68]/10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-[#2d2a26] rounded-xl flex items-center justify-center mb-1">
              <Loader2 className="w-5 h-5 text-[#b48c68] animate-spin" />
            </div>
          </div>
        </nav>
        <main className="max-w-xl mx-auto px-5 py-6">
          <ShimmerCard />
          <ShimmerCard />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center gap-4 p-8">
        <AlertTriangle className="w-16 h-16 text-amber-500" />
        <h1 className="font-serif text-2xl font-bold text-[#2d2a26] text-center">
          {error.includes('unavailable') ? 'Table non disponible' : 
           error.includes('payment') ? 'Paiement requis' : 'Erreur'}
        </h1>
        <p className="text-[#71717a] text-center max-w-md">{error}</p>
        <Link href="/" className="text-[#b48c68] font-semibold hover:underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  const showWatermark = restaurant?.plan === 'free' || restaurant?.watermarkEnabled === true;

  return (
    <WatermarkSpacer showWatermark={showWatermark}>
      <div 
        className="min-h-screen bg-[#faf9f6] pb-32"
        dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
        lang={currentLang}
      >
        {/* Glass Navigation */}
        <nav className="sticky top-0 z-50 px-6 py-4 flex justify-center items-center relative bg-[#faf9f6]/90 backdrop-blur-xl border-b border-[#b48c68]/10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-[#2d2a26] rounded-xl flex items-center justify-center mb-1 shadow-lg">
              <Coffee className="w-5 h-5 text-[#b48c68]" />
            </div>
            <div className="text-center">
              <h1 className="font-serif text-xl font-bold tracking-tight text-[#2d2a26]">
                {restaurant?.name || 'ZCOFFEE'}
              </h1>
              <p className="text-[7px] uppercase tracking-[0.3em] text-[#b48c68] font-bold">
                {uiStrings[currentLang].table} {table?.name}
              </p>
            </div>
          </div>
          <button 
            onClick={toggleLang}
            className="absolute right-6 bg-white text-[#b48c68] px-4 py-1.5 rounded-full font-bold text-[0.7rem] uppercase tracking-wider border border-[#b48c68]/20 shadow-sm hover:shadow-md transition-all"
          >
            {uiStrings[currentLang].toggle}
          </button>
        </nav>

        {/* Category Tabs */}
        <nav className="sticky top-[88px] z-40 bg-[#faf9f6]/90 backdrop-blur-xl overflow-x-auto flex items-center gap-3 px-5 py-4 border-b border-[#b48c68]/5">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
              selectedCategory === null
                ? 'bg-[#2d2a26] text-white'
                : 'bg-white text-[#2d2a26]/70 border border-[#b48c68]/10 hover:border-[#b48c68]/30'
            }`}
          >
            {currentLang === 'fr' ? 'Tout' : 'الكل'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-[#2d2a26] text-white'
                  : 'bg-white text-[#2d2a26]/70 border border-[#b48c68]/10 hover:border-[#b48c68]/30'
              }`}
            >
              {currentLang === 'fr' ? cat : menuItems.find(i => i.category === cat)?.categoryAr || cat}
            </button>
          ))}
        </nav>

        {/* Menu Cards */}
        <main className="max-w-xl mx-auto px-5 py-6">
          {/* Group by category if no category selected */}
          {selectedCategory === null ? (
            // Show all items grouped by category
            categories.map((cat, catIdx) => {
              const categoryItems = menuItems.filter(item => item.category === cat);
              const catName = currentLang === 'fr' ? cat : categoryItems[0]?.categoryAr || cat;
              
              return (
                <div key={cat} className="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-black/[0.03]">
                  <div className="flex items-center gap-4 mb-5">
                    <h2 className="font-serif italic text-[#b48c68] text-lg font-bold">{catName}</h2>
                    <div className="flex-1 h-px bg-gradient-to-r from-[#b48c68]/30 to-transparent" />
                  </div>
                  
                  <div className="divide-y divide-black/[0.03]">
                    {categoryItems.map((item, index) => {
                      const name = currentLang === 'fr' ? item.nameFr : item.nameAr;
                      const priceLabel = `${item.price} ${getCurrencySymbol()}`;
                      const cartItem = getItemByItemId(item.id);
                      const quantity = cartItem?.quantity || 0;

                      return (
                        <div key={item.id} className="flex justify-between items-center py-3 group">
                          <div className="flex-1">
                            <span className="font-semibold text-[0.95rem] text-[#2d2a26]/90 group-hover:text-[#b48c68] transition-colors">
                              {name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[#b48c68] font-extrabold text-[1.05rem]">
                              {priceLabel}
                            </span>
                            
                            {quantity > 0 ? (
                              <div className="flex items-center gap-1 bg-[#faf9f6] rounded-full px-1 py-1">
                                <button
                                  onClick={() => handleQuantityChange(item, -1)}
                                  className="w-7 h-7 rounded-full bg-white text-[#2d2a26] flex items-center justify-center shadow-sm hover:shadow transition-all"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="font-bold text-sm w-6 text-center text-[#2d2a26]">{quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item, 1)}
                                  className="w-7 h-7 rounded-full bg-[#b48c68] text-white flex items-center justify-center shadow-sm hover:shadow transition-all"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQuantityChange(item, 1)}
                                className="w-8 h-8 rounded-full bg-[#2d2a26] text-white flex items-center justify-center shadow-sm hover:shadow transition-all active:scale-95"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            // Show items for selected category
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-black/[0.03]">
              <div className="flex items-center gap-4 mb-5">
                <h2 className="font-serif italic text-[#b48c68] text-lg font-bold">
                  {currentLang === 'fr' ? selectedCategory : menuItems.find(i => i.category === selectedCategory)?.categoryAr || selectedCategory}
                </h2>
                <div className="flex-1 h-px bg-gradient-to-r from-[#b48c68]/30 to-transparent" />
              </div>
              
              <div className="divide-y divide-black/[0.03]">
                {filteredItems.map((item) => {
                  const name = currentLang === 'fr' ? item.nameFr : item.nameAr;
                  const priceLabel = `${item.price} ${getCurrencySymbol()}`;
                  const cartItem = getItemByItemId(item.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <div key={item.id} className="flex justify-between items-center py-3 group">
                      <div className="flex-1">
                        <span className="font-semibold text-[0.95rem] text-[#2d2a26]/90 group-hover:text-[#b48c68] transition-colors">
                          {name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[#b48c68] font-extrabold text-[1.05rem]">
                          {priceLabel}
                        </span>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center gap-1 bg-[#faf9f6] rounded-full px-1 py-1">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              className="w-7 h-7 rounded-full bg-white text-[#2d2a26] flex items-center justify-center shadow-sm"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-sm w-6 text-center text-[#2d2a26]">{quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              className="w-7 h-7 rounded-full bg-[#b48c68] text-white flex items-center justify-center shadow-sm"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuantityChange(item, 1)}
                            className="w-8 h-8 rounded-full bg-[#2d2a26] text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* Sticky Bottom Cart Bar */}
        {cartItemCount > 0 && (
          <Link
            href={`/r/${restaurant?.slug || 'demo'}/t/${table?.name || '1'}/review`}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center"
          >
            <div className="bg-[#2d2a26] text-white w-full max-w-md h-16 rounded-2xl shadow-2xl flex items-center justify-between px-6 active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-[#b48c68] flex items-center justify-center font-bold text-sm">
                  {cartItemCount}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold uppercase tracking-widest text-sm">
                    {uiStrings[currentLang].reviewOrder}
                  </span>
                  <span className="text-xs text-white/60">{cartItemCount} {uiStrings[currentLang].items}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{cartTotal.toFixed(2)} {getCurrencySymbol()}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </Link>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center px-6 opacity-40 pb-24">
          <p className="font-serif italic text-sm mb-1 text-[#2d2a26]">
            {uiStrings[currentLang].footer}
          </p>
        </footer>

        {/* Fonts */}
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Plus+Jakarta+Sans:wght@200..800&family=Noto+Sans+Arabic:wght@300..700&display=swap');
          
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            -webkit-tap-highlight-color: transparent;
          }
          
          html[lang="ar"] body,
          html[lang="ar"] {
            font-family: 'Noto Sans Arabic', sans-serif;
          }
          
          .font-serif {
            font-family: 'Playfair Display', serif;
          }
        `}</style>
      </div>
      <Watermark show={showWatermark} />
    </WatermarkSpacer>
  );
}
