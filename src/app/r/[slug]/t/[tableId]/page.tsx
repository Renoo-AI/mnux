'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Minus, ChevronRight, AlertTriangle, Loader2, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';

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
  // Cafés
  { id: '1', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Express / Demi / Allongé', nameAr: 'إكسبريسو / دمي / ألونجي', price: '2.5', categoryId: 'cat-1', available: true },
  { id: '2', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Cappuccino / Americano', nameAr: 'كابوتشينو / أمريكانو', price: '2.8', categoryId: 'cat-1', available: true },
  { id: '3', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Direct', nameAr: 'قهوة ديريكت', price: '3.2', categoryId: 'cat-1', available: true },
  { id: '4', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Spécial', nameAr: 'قهوة خاصة', price: '3.5', categoryId: 'cat-1', available: true },
  // Boissons Fraîches
  { id: '5', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Jus Frais', nameAr: 'عصير طازج', price: '4', categoryId: 'cat-2', available: true },
  { id: '6', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Citronnade', nameAr: 'ليموناضة', price: '3', categoryId: 'cat-2', available: true },
  { id: '7', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Citronnade Amande', nameAr: 'ليموناضة باللوز', price: '5', categoryId: 'cat-2', available: true },
  { id: '8', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Mojito', nameAr: 'موهيتو', price: '6', categoryId: 'cat-2', available: true },
  // Viennoiseries
  { id: '9', category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Snoopy / Croissant', nameAr: 'سنوبي / كرواسون', price: '2.5', categoryId: 'cat-3', available: true },
  { id: '10', category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Pâté', nameAr: 'باتي', price: '2', categoryId: 'cat-3', available: true },
  // Thé
  { id: '11', category: 'Thé', categoryAr: 'الشاي', nameFr: 'Thé', nameAr: 'شاي', price: '2', categoryId: 'cat-4', available: true },
  { id: '12', category: 'Thé', categoryAr: 'الشاي', nameFr: 'Thé Amande', nameAr: 'شاي باللوز', price: '4', categoryId: 'cat-4', available: true },
  // Chicha & Girac
  { id: '13', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Menthe', nameAr: 'شيشة نعناع', price: '4', categoryId: 'cat-5', available: true },
  { id: '14', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Cocktail', nameAr: 'شيشة كوكتيل', price: '4.5', categoryId: 'cat-5', available: true },
  { id: '15', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Vide', nameAr: 'شيشة فارغة', price: '3', categoryId: 'cat-5', available: true },
  { id: '16', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (M)', nameAr: 'جيراك (M)', price: '3.5', categoryId: 'cat-5', available: true },
  { id: '17', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (XL)', nameAr: 'جيراك (XL)', price: '4.5', categoryId: 'cat-5', available: true },
  { id: '18', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (XXL)', nameAr: 'جيراك (XXL)', price: '5.5', categoryId: 'cat-5', available: true },
  // Eaux & Soft
  { id: '19', category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات', nameFr: 'Eau 1.5 L', nameAr: 'ماء 1.5 ل', price: '2', categoryId: 'cat-6', available: true },
  { id: '20', category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات', nameFr: 'Eau 0.5 L', nameAr: 'ماء 0.5 ل', price: '1', categoryId: 'cat-6', available: true },
  { id: '21', category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات', nameFr: 'Canette', nameAr: 'كانات', price: '2.5', categoryId: 'cat-6', available: true },
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
    <div className="bg-white rounded-xl p-6 mb-6 shadow-[0px_10px_30px_rgba(58,50,45,0.05)]">
      <div className="h-5 w-1/3 bg-[#f2edeb] rounded-md mb-5 animate-pulse" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between items-center py-2">
            <div className="h-4 w-32 bg-[#f2edeb] rounded-md animate-pulse" />
            <div className="h-4 w-12 bg-[#f2edeb] rounded-md animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TableOrderingPage({ params }: { params: Promise<{ slug: string; tableId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<{ id: string; slug: string; name: string; currency: string; plan?: string; watermarkEnabled?: boolean } | null>(null);
  const [table, setTable] = useState<{ id: string; name: string; restaurantId: string } | null>(null);
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

        const res = await fetch(`/api/public/restaurant/${resolvedParams.slug}`);
        
        if (!res.ok) {
          setMenuItems(DEMO_MENU_ITEMS);
          setRestaurant({ id: 'demo', slug: resolvedParams.slug, name: 'ZCOFFEE', currency: 'TND' });
          setTable({ id: 'demo-table', name: resolvedParams.tableId, restaurantId: 'demo' });
          setContext('demo', resolvedParams.slug, 'demo-table');
          setLoading(false);
          return;
        }

        const data = await res.json();
        const { restaurant: rest, items: apiItems } = data;

        setRestaurant({ id: rest.id, slug: rest.slug, name: rest.name, currency: rest.currency || 'TND' });
        setTable({ id: 'demo-table', name: resolvedParams.tableId, restaurantId: rest.id });
        setContext(rest.id, rest.slug, 'demo-table');

        if (apiItems?.length) {
          const displayItems: MenuDisplayItem[] = apiItems.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            category: item.category as string || (item as Record<string, string>).nameFr || '',
            categoryAr: (item.categoryAr as string) || '',
            nameFr: (item.nameFr as string) || '',
            nameAr: (item.nameAr as string) || '',
            price: String(item.price || '0'),
            description: item.descriptionFr as string,
            categoryId: item.categoryId as string,
            available: true,
          }));
          setMenuItems(displayItems);
        } else {
          setMenuItems(DEMO_MENU_ITEMS);
        }
      } catch {
        setMenuItems(DEMO_MENU_ITEMS);
        setRestaurant({ id: 'demo', slug: resolvedParams.slug, name: 'ZCOFFEE', currency: 'TND' });
        setTable({ id: 'demo-table', name: resolvedParams.tableId, restaurantId: 'demo' });
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
      <div className="min-h-screen bg-[#FDF8F3] pb-20" dir={currentLang === 'ar' ? 'rtl' : 'ltr'}>
        <header className="sticky top-0 z-50 px-6 py-4 bg-[#FDF8F3] border-b border-[#E8E2DA]">
          <div className="flex items-center gap-2 max-w-xl mx-auto">
            <Loader2 className="w-5 h-5 text-[#D4A373] animate-spin" />
            <span className="text-[#7f756f] text-sm">Loading menu...</span>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-5 py-6">
          <ShimmerCard />
          <ShimmerCard />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-[#ffdad6] flex items-center justify-center mb-2">
          <AlertTriangle className="w-8 h-8 text-[#ba1a1a]" />
        </div>
        <h1 className="text-2xl font-bold text-[#3D2C1E] text-center" style={{ fontFamily: "'Playfair Display', serif" }}>
          {error.includes('unavailable') ? 'Table non disponible' : 
           error.includes('payment') ? 'Paiement requis' : 'Erreur'}
        </h1>
        <p className="text-[#7f756f] text-center max-w-md">{error}</p>
        <Link href="/" className="text-[#D4A373] font-semibold hover:underline mt-2">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  return (
    <div 
        className="min-h-screen bg-[#FDF8F3] pb-32"
        dir={currentLang === 'ar' ? 'rtl' : 'ltr'}
        lang={currentLang}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 px-6 py-4 bg-[#FDF8F3] border-b border-[#E8E2DA] shadow-[0px_10px_30px_rgba(58,50,45,0.05)]">
          <div className="flex justify-between items-center max-w-xl mx-auto">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7f756f] mb-1">
                {restaurant?.name || 'ZCOFFEE'}
              </p>
              <h1 className="text-[32px] font-bold text-[#3D2C1E] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {table?.name || 'T-01'}
              </h1>
            </div>
            <button 
              onClick={toggleLang}
              className="bg-white text-[#D4A373] px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wider border border-[#E8E2DA] shadow-sm hover:shadow-md transition-all"
            >
              {uiStrings[currentLang].toggle}
            </button>
          </div>
        </header>

        {/* Category Tabs */}
        <nav className="sticky top-[81px] z-40 bg-[#FDF8F3] overflow-x-auto flex items-center gap-2 px-5 py-3 border-b border-[#E8E2DA] shadow-[0px_10px_30px_rgba(58,50,45,0.02)]">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold tracking-wider uppercase transition-all ${
              selectedCategory === null
                ? 'bg-[#3D2C1E] text-white'
                : 'bg-[#f8f2f1] text-[#4d4540] hover:bg-[#ece7e6]'
            }`}
          >
            {currentLang === 'fr' ? 'Tout' : 'الكل'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-bold tracking-wider uppercase transition-all ${
                selectedCategory === cat
                  ? 'bg-[#3D2C1E] text-white'
                  : 'bg-[#f8f2f1] text-[#4d4540] hover:bg-[#ece7e6]'
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
                <div key={cat} className="bg-white rounded-xl p-6 mb-6 shadow-[0px_10px_30px_rgba(58,50,45,0.05)]">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#f2edeb]">
                    <h2 className="text-lg font-bold text-[#3D2C1E]" style={{ fontFamily: "'Playfair Display', serif" }}>{catName}</h2>
                  </div>
                   
                  <div className="divide-y divide-[#f2edeb]">
                    {categoryItems.map((item, index) => {
                      const name = currentLang === 'fr' ? item.nameFr : item.nameAr;
                      const priceLabel = `${item.price} ${getCurrencySymbol()}`;
                      const cartItem = getItemByItemId(item.id);
                      const quantity = cartItem?.quantity || 0;

                      return (
                        <div key={item.id} className="flex justify-between items-center py-3">
                          <div className="flex-1">
                            <span className="font-semibold text-[15px] text-[#3D2C1E]">
                              {name}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[#D4A373] font-bold text-base">
                              {priceLabel}
                            </span>
                            
                            {quantity > 0 ? (
                              <div className="flex items-center gap-1 bg-[#f2edeb] rounded-full px-1 py-1">
                                <button
                                  onClick={() => handleQuantityChange(item, -1)}
                                  className="w-6 h-6 rounded-full bg-white text-[#3D2C1E] flex items-center justify-center text-sm"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="font-bold text-sm w-5 text-center text-[#3D2C1E]">{quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item, 1)}
                                  className="w-6 h-6 rounded-full bg-[#D4A373] text-white flex items-center justify-center text-sm"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleQuantityChange(item, 1)}
                                className="w-8 h-8 rounded-full bg-[#3D2C1E] text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
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
            <div className="bg-white rounded-xl p-6 shadow-[0px_10px_30px_rgba(58,50,45,0.05)]">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#f2edeb]">
                <h2 className="text-lg font-bold text-[#3D2C1E]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {currentLang === 'fr' ? selectedCategory : menuItems.find(i => i.category === selectedCategory)?.categoryAr || selectedCategory}
                </h2>
              </div>
              
              <div className="divide-y divide-[#f2edeb]">
                {filteredItems.map((item) => {
                  const name = currentLang === 'fr' ? item.nameFr : item.nameAr;
                  const priceLabel = `${item.price} ${getCurrencySymbol()}`;
                  const cartItem = getItemByItemId(item.id);
                  const quantity = cartItem?.quantity || 0;

                  return (
                    <div key={item.id} className="flex justify-between items-center py-3">
                      <div className="flex-1">
                        <span className="font-semibold text-[15px] text-[#3D2C1E]">
                          {name}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[#D4A373] font-bold text-base">
                          {priceLabel}
                        </span>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center gap-1 bg-[#f2edeb] rounded-full px-1 py-1">
                            <button
                              onClick={() => handleQuantityChange(item, -1)}
                              className="w-6 h-6 rounded-full bg-white text-[#3D2C1E] flex items-center justify-center text-sm"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-sm w-5 text-center text-[#3D2C1E]">{quantity}</span>
                            <button
                              onClick={() => handleQuantityChange(item, 1)}
                              className="w-6 h-6 rounded-full bg-[#D4A373] text-white flex items-center justify-center text-sm"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleQuantityChange(item, 1)}
                            className="w-8 h-8 rounded-full bg-[#3D2C1E] text-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
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
            className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none"
          >
            <div className="bg-[#3D2C1E] text-white w-full max-w-md h-16 rounded-full shadow-2xl flex items-center justify-between px-6 active:scale-[0.98] transition-transform pointer-events-auto">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
                  {cartItemCount}
                </div>
                <span className="font-bold uppercase tracking-widest text-xs">
                  {uiStrings[currentLang].reviewOrder}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">{cartTotal.toFixed(2)} {getCurrencySymbol()}</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center px-6 pb-24">
          <p className="text-xs text-[#7f756f] opacity-60">
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
    </div>
  );
