'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Minus, ChevronRight } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { useCartStore } from '@/stores/cartStore';
import { Watermark, WatermarkSpacer } from '@/components/Watermark';
import type { Restaurant } from '@/types';

// Demo data
const DEMO_RESTAURANT: Restaurant = {
  id: 'demo', slug: 'demo', name: 'ZCOFFEE', status: 'ACTIVE', currency: 'TND',
  plan: 'FREE', slugType: 'FREE_RANDOM', watermarkEnabled: false, maxMenuItems: 50,
  createdAt: new Date(), updatedAt: new Date(),
};

interface MenuItem {
  id: string;
  category: string;
  categoryAr: string;
  nameFr: string;
  nameAr: string;
  price: string;
}

const MENU: MenuItem[] = [
  { id: '1', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Express / Demi / Allongé', nameAr: 'إكسبريسو / دمي / ألونجي', price: '2.5' },
  { id: '2', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Cappuccino / Americano', nameAr: 'كابوتشينو / أمريكانو', price: '2.8' },
  { id: '3', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Direct', nameAr: 'قهوة ديريكت', price: '3.2' },
  { id: '4', category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Spécial', nameAr: 'قهوة خاصة', price: '3.5' },
  { id: '5', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Jus Frais', nameAr: 'عصير طازج', price: '4' },
  { id: '6', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Citronnade', nameAr: 'ليموناضة', price: '3' },
  { id: '7', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Citronnade Amande', nameAr: 'ليموناضة باللوز', price: '5' },
  { id: '8', category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Mojito', nameAr: 'موهيتو', price: '6' },
  { id: '9', category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Snoopy / Croissant', nameAr: 'سنوبي / كرواسون', price: '2.5' },
  { id: '10', category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Pâté', nameAr: 'باتي', price: '2' },
  { id: '11', category: 'Thé', categoryAr: 'الشاي', nameFr: 'Thé', nameAr: 'شاي', price: '2' },
  { id: '12', category: 'Thé', categoryAr: 'الشاي', nameFr: 'Thé Amande', nameAr: 'شاي باللوز', price: '4' },
  { id: '13', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Menthe', nameAr: 'شيشة نعناع', price: '4' },
  { id: '14', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Cocktail', nameAr: 'شيشة كوكتيل', price: '4.5' },
  { id: '15', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Vide', nameAr: 'شيشة فارغة', price: '3' },
  { id: '16', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (M)', nameAr: 'جيراك (M)', price: '3.5' },
  { id: '17', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (XL)', nameAr: 'جيراك (XL)', price: '4.5' },
  { id: '18', category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (XXL)', nameAr: 'جيراك (XXL)', price: '5.5' },
  { id: '19', category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات غازية', nameFr: 'Eau 1.5 L', nameAr: 'ماء 1.5 ل', price: '2' },
  { id: '20', category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات غازية', nameFr: 'Eau 0.5 L', nameAr: 'ماء 0.5 ل', price: '1' },
  { id: '21', category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات غازية', nameFr: 'Canette', nameAr: 'كانات', price: '2.5' },
];

const UI = {
  fr: { tag: 'EST. 2024', footer: 'Merci de votre visite', toggle: 'عربي', order: 'Commande' },
  ar: { tag: 'تأسست 2024', footer: 'شكراً لزيارتكم', toggle: 'Français', order: 'الطلب' }
};

export default function MenuPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
  const [mounted, setMounted] = useState(false);
  
  const { addItem, removeItem, getTotalItems, getTotalPrice, getItemByItemId } = useCartStore();
  const count = getTotalItems();
  const total = getTotalPrice();

  useEffect(() => {
    setMounted(true);
    (async () => {
      try {
        if (resolvedParams.slug === 'demo') {
          setRestaurant(DEMO_RESTAURANT);
        } else {
          const r = await restaurantService.getBySlug(resolvedParams.slug);
          setRestaurant(r || DEMO_RESTAURANT);
        }
      } catch {
        setRestaurant(DEMO_RESTAURANT);
      } finally {
        setLoading(false);
      }
    })();
  }, [resolvedParams.slug]);

  const categories = [...new Set(MENU.map(i => lang === 'fr' ? i.category : i.categoryAr))];
  const currency = lang === 'fr' ? 'DT' : 'د.ت';

  if (loading) {
    return (
      <div className="bg-[#FFFEF9] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-14 h-14 border-2 border-[#1a1a1a]/20 rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-28 bg-[#1a1a1a]/5 rounded-full shimmer" />
            <div className="h-2 w-20 bg-[#1a1a1a]/5 rounded-full shimmer mx-auto" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <WatermarkSpacer showWatermark={restaurant?.plan === 'FREE'}>
      <div className="bg-[#FFFEF9] min-h-screen pb-24" dir={lang === 'ar' ? 'rtl' : 'ltr'} lang={lang}>
        
        {/* HEADER */}
        <header className={`sticky top-0 z-50 bg-[#FFFEF9]/95 backdrop-blur-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="max-w-lg mx-auto px-6 py-6 flex flex-col items-center">
            {/* Logo Mark */}
            <div className="w-11 h-11 border-[1.5px] border-[#1a1a1a] rounded-full flex items-center justify-center mb-3 hover:scale-110 hover:rotate-12 transition-transform duration-300 cursor-pointer">
              <span className="font-serif text-lg font-semibold text-[#1a1a1a]">Z</span>
            </div>
            <h1 className="font-serif text-xl font-medium text-[#1a1a1a] tracking-wide">{restaurant?.name}</h1>
            <p className="text-[9px] uppercase tracking-[0.35em] text-[#1a1a1a]/40 mt-1 font-medium">{UI[lang].tag}</p>
          </div>
          
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="absolute top-6 right-5 text-[11px] font-medium text-[#1a1a1a]/50 hover:text-[#1a1a1a] transition-all duration-300 hover:scale-105 active:scale-95"
          >
            {UI[lang].toggle}
          </button>
          
          {/* Subtle Divider */}
          <div className="h-[1px] bg-gradient-to-r from-transparent via-[#1a1a1a]/10 to-transparent" />
        </header>

        {/* MENU */}
        <main className="max-w-lg mx-auto px-5 py-8 space-y-10">
          {categories.map((cat, catIdx) => {
            const items = MENU.filter(i => (lang === 'fr' ? i.category : i.categoryAr) === cat);
            return (
              <section 
                key={cat} 
                className={`relative transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${(catIdx + 1) * 100}ms` }}
              >
                {/* Category Title */}
                <div className="flex items-center gap-4 mb-5 px-1">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#1a1a1a]/30 font-medium">{String(catIdx + 1).padStart(2, '0')}</span>
                  <h2 className="font-serif text-lg text-[#1a1a1a]">{cat}</h2>
                </div>
                
                {/* Items */}
                <div className="space-y-0">
                  {items.map((item, idx) => {
                    const name = lang === 'fr' ? item.nameFr : item.nameAr;
                    const cart = getItemByItemId(item.id);
                    const qty = cart?.quantity || 0;
                    return (
                      <div
                        key={item.id}
                        className={`group flex items-center justify-between py-4 px-1 rounded-lg transition-all duration-500 hover:bg-[#1a1a1a]/[0.02] ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
                        style={{ transitionDelay: `${(catIdx + 1) * 100 + (idx + 1) * 50}ms` }}
                      >
                        {/* Name */}
                        <span className="text-[15px] text-[#1a1a1a]/80 font-medium flex-1 pr-4 group-hover:text-[#1a1a1a] transition-colors duration-300">{name}</span>
                        
                        {/* Right side: Price + Action */}
                        <div className="flex items-center gap-4">
                          <span className="text-[15px] text-[#1a1a1a] font-medium tabular-nums">{item.price} {currency}</span>
                          
                          {qty > 0 ? (
                            <div className="flex items-center gap-2 animate-scale-in">
                              <button 
                                onClick={() => removeItem(item.id)} 
                                className="w-8 h-8 rounded-full border border-[#1a1a1a]/20 text-[#1a1a1a]/60 flex items-center justify-center text-lg hover:border-[#1a1a1a]/40 hover:text-[#1a1a1a] hover:scale-110 transition-all duration-200 active:scale-90"
                              >
                                −
                              </button>
                              <span className="w-5 text-center font-semibold text-sm text-[#1a1a1a] tabular-nums">{qty}</span>
                              <button 
                                onClick={() => addItem({ itemId: item.id, name, price: parseFloat(item.price), quantity: 1 })} 
                                className="w-8 h-8 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center text-lg font-light hover:bg-[#1a1a1a]/90 hover:scale-110 transition-all duration-200 active:scale-90"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => addItem({ itemId: item.id, name, price: parseFloat(item.price), quantity: 1 })} 
                              className="w-8 h-8 rounded-full border border-[#1a1a1a]/20 text-[#1a1a1a]/40 flex items-center justify-center hover:border-[#1a1a1a] hover:text-[#1a1a1a] hover:bg-[#1a1a1a]/[0.03] hover:scale-110 transition-all duration-200 active:scale-90"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Subtle separator between categories */}
                {catIdx < categories.length - 1 && (
                  <div className="mt-10 h-[1px] bg-gradient-to-r from-transparent via-[#1a1a1a]/8 to-transparent" />
                )}
              </section>
            );
          })}
        </main>

        {/* FOOTER */}
        <footer className={`text-center py-8 pb-12 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="font-serif text-sm text-[#1a1a1a]/30">{UI[lang].footer}</p>
          <p className="text-[9px] uppercase tracking-[0.3em] text-[#1a1a1a]/20 mt-2">Oued Ellil · Tunis</p>
        </footer>

        {/* CART BUTTON */}
        <Link 
          href={`/r/${restaurant?.slug || 'demo'}/t/order`} 
          className={`fixed bottom-6 left-5 right-5 z-50 max-w-lg mx-auto transition-all duration-500 ${count > 0 ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'}`}
        >
          <div className="bg-[#1a1a1a] text-white h-[52px] rounded-full shadow-lg shadow-[#1a1a1a]/20 flex items-center justify-between px-5 hover:shadow-xl hover:shadow-[#1a1a1a]/25 transition-all duration-300 active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-semibold text-sm animate-pulse-subtle">{count}</span>
              <span className="font-medium text-sm uppercase tracking-wider">{UI[lang].order}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{total.toFixed(2)} {currency}</span>
              <ChevronRight className="w-4 h-4 opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* Styles */}
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=Noto+Sans+Arabic:wght@400;500;600&display=swap');
          
          body { 
            font-family: 'Inter', -apple-system, sans-serif; 
            -webkit-tap-highlight-color: transparent;
            -webkit-font-smoothing: antialiased;
          }
          
          html[lang="ar"] body { 
            font-family: 'Noto Sans Arabic', sans-serif; 
          }
          
          .font-serif { 
            font-family: 'Cormorant Garamond', Georgia, serif; 
          }
          
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .shimmer {
            background: linear-gradient(90deg, #1a1a1a/5 25%, #1a1a1a/10 50%, #1a1a1a/5 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite linear;
          }
          
          @keyframes scale-in {
            0% { transform: scale(0.8); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          
          .animate-scale-in {
            animation: scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          
          @keyframes pulse-subtle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          .animate-pulse-subtle {
            animation: pulse-subtle 2s ease-in-out infinite;
          }
        `}</style>
      </div>
      <Watermark show={restaurant?.plan === 'FREE'} />
    </WatermarkSpacer>
  );
}
