'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface MenuItem {
  id: string;
  name_fr: string;
  name_ar: string;
  price: number;
  category: string;
  categoryAr: string;
  is_available: boolean;
}

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || '';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu?restaurantId=${RESTAURANT_ID}`);
      const data = await res.json();
      setItems(data.items || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped: Record<string, MenuItem[]> = {};
  items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[#b48c68] font-bold text-sm">&larr; Dashboard</Link>
          <h1 className="text-sm font-bold uppercase tracking-widest text-[#2d2a26]">Menu Management</h1>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-xs opacity-30 uppercase tracking-widest">Loading...</div>
        ) : Object.entries(grouped).length === 0 ? (
          <div className="text-center py-20 text-xs opacity-30 uppercase tracking-widest">No menu items</div>
        ) : (
          Object.entries(grouped).map(([cat, catItems]) => (
            <section key={cat} className="bg-white rounded-2xl p-6 mb-6 border border-black/5 shadow-sm">
              <h2 className="text-lg font-bold text-[#b48c68] uppercase tracking-widest mb-4">{cat}</h2>
              <div className="divide-y divide-black/[0.03]">
                {catItems.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-3">
                    <div>
                      <p className="font-bold text-[15px]">{item.name_fr}</p>
                      <p className="text-xs text-[#71717a]">{item.name_ar}</p>
                    </div>
                    <span className="font-bold text-[#b48c68]">{item.price} DT</span>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
