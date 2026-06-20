'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/browser';
import type { User } from '@supabase/supabase-js';

interface MenuItem {
  id: string;
  category: string;
  categoryAr: string;
  nameFr: string;
  nameAr: string;
  price: string;
  available: boolean;
}

interface FormData {
  id: string;
  category: string;
  categoryAr: string;
  nameFr: string;
  nameAr: string;
  price: string;
}

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'demo-restaurant';

const DEFAULT_MENU: Omit<FormData, 'id'>[] = [
  { category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Express / Demi / Allongé', nameAr: 'إكسبريسو / دمي / ألونجي', price: '2.5' },
  { category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Cappuccino / Americano', nameAr: 'كابوتشينو / أمريكانو', price: '2.8' },
  { category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Direct', nameAr: 'قهوة ديريكت', price: '3.2' },
  { category: 'Cafés', categoryAr: 'القهوة', nameFr: 'Spécial', nameAr: 'قهوة خاصة', price: '3.5' },
  { category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Jus Frais', nameAr: 'عصير طازج', price: '4' },
  { category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Citronnade', nameAr: 'ليموناضة', price: '3' },
  { category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Citronnade Amande', nameAr: 'ليموناضة باللوز', price: '5' },
  { category: 'Boissons Fraîches', categoryAr: 'مشروبات باردة', nameFr: 'Mojito', nameAr: 'موهيتو', price: '6' },
  { category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Snoopy / Croissant', nameAr: 'سنوبي / كرواسون', price: '2.5' },
  { category: 'Viennoiseries', categoryAr: 'مخبوزات', nameFr: 'Pâté', nameAr: 'باتي', price: '2' },
  { category: 'Thé', categoryAr: 'الشاي', nameFr: 'Thé', nameAr: 'شاي', price: '2' },
  { category: 'Thé', categoryAr: 'الشاي', nameFr: 'Thé Amande', nameAr: 'شاي باللوز', price: '4' },
  { category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Menthe', nameAr: 'شيشة نعناع', price: '4' },
  { category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Cocktail', nameAr: 'شيشة كوكتيل', price: '4.5' },
  { category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Chicha Vide', nameAr: 'شيشة فارغة', price: '3' },
  { category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (M)', nameAr: 'جيراك (M)', price: '3.5' },
  { category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (XL)', nameAr: 'جيراك (XL)', price: '4.5' },
  { category: 'Chicha & Girac', categoryAr: 'شيشة وجيراك', nameFr: 'Girac (XXL)', nameAr: 'جيراك (XXL)', price: '5.5' },
  { category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات', nameFr: 'Eau 1.5 L', nameAr: 'ماء 1.5 ل', price: '2' },
  { category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات', nameFr: 'Eau 0.5 L', nameAr: 'ماء 0.5 ل', price: '1' },
  { category: 'Eaux & Soft', categoryAr: 'مياه ومشروبات', nameFr: 'Canette', nameAr: 'كانات', price: '2.5' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormData>({ id: '', category: '', categoryAr: '', nameFr: '', nameAr: '', price: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadMenu();
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadMenu();
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menu?restaurantId=${RESTAURANT_ID}`);
      const data = await res.json();
      if (data.items?.length) {
        setMenuItems(data.items.map((i: Record<string, unknown>) => ({
          id: i.id as string,
          category: (i.categories as Record<string, string>)?.name_fr || (i.category as string) || '',
          categoryAr: (i.categories as Record<string, string>)?.name_ar || (i.categoryAr as string) || '',
          nameFr: i.name_fr as string,
          nameAr: i.name_ar as string,
          price: String(i.price),
          available: Boolean(i.is_available ?? i.available),
        })));
      } else {
        setMenuItems([]);
      }
    } catch {
      setMenuItems([]);
    }
    setLoading(false);
  }, []);

  const openAddModal = () => {
    setForm({ id: '', category: '', categoryAr: '', nameFr: '', nameAr: '', price: '' });
    setEditing(false);
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setForm({ id: item.id, category: item.category, categoryAr: item.categoryAr, nameFr: item.nameFr, nameAr: item.nameAr, price: item.price });
    setEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body: Record<string, string> = {
        restaurantId: RESTAURANT_ID,
        nameFr: form.nameFr,
        nameAr: form.nameAr,
        price: form.price,
        category: form.category,
        categoryAr: form.categoryAr,
      };

      if (editing && form.id) {
        await fetch(`/api/menu`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: form.id, ...body }),
        });
      } else {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      setShowModal(false);
      loadMenu();
    } catch (err) {
      alert('Error saving: ' + (err as Error).message);
    }
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Supprimer cet article ?')) return;
    await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
    loadMenu();
  };

  const clearMenu = async () => {
    if (!confirm('ATTENTION : Cela va supprimer TOUT le menu. Continuer ?')) return;
    for (const item of menuItems) {
      await fetch(`/api/menu?id=${item.id}`, { method: 'DELETE' });
    }
    loadMenu();
  };

  const restoreDefaults = async () => {
    if (!confirm("Restaurer la liste d'origine ZCOFFEE ?")) return;
    for (const item of DEFAULT_MENU) {
      await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId: RESTAURANT_ID, ...item }),
      });
    }
    loadMenu();
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#2d2a26] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#b48c68] font-bold text-xl">Z</span>
            </div>
            <h1 className="text-xl font-bold text-[#2d2a26]">ZCOFFEE</h1>
            <p className="text-xs text-[#b48c68] font-bold uppercase tracking-widest mt-1">Administration</p>
          </div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-3 outline-none focus:border-[#b48c68] text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
            className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-6 outline-none focus:border-[#b48c68] text-sm"
          />
          <button
            type="submit"
            className="w-full bg-[#2d2a26] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg"
          >
            Connexion
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5 px-4 md:px-10 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2d2a26] rounded-xl flex items-center justify-center shadow-sm">
            <span className="text-[#b48c68] font-bold text-lg">Z</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold uppercase tracking-widest text-[#2d2a26]">ZCOFFEE</h1>
            <p className="text-[9px] text-[#b48c68] font-bold uppercase">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <a href={`/r/zcoffee`} target="_blank" className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/5 bg-white hover:bg-black hover:text-white transition-all text-xs font-bold uppercase tracking-widest">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Visualiser
          </a>
          <button onClick={() => supabase.auth.signOut()} className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
            Déconnexion
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Bonjour, Youssef
            </h2>
            <p className="text-sm text-[#b48c68] font-medium">Gérez votre menu et vos prix en temps réel.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={clearMenu} className="px-6 py-3 rounded-xl border border-red-200 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-all flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Vider
            </button>
            <button onClick={restoreDefaults} className="px-6 py-3 rounded-xl border border-black text-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Restaurer
            </button>
            <button onClick={openAddModal} className="px-8 py-3 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-[#b48c68] shadow-lg shadow-black/10 transition-all flex items-center gap-2">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" /></svg>
              Ajouter un article
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 opacity-20 font-bold uppercase tracking-widest text-xs">
            Chargement...
          </div>
        )}

        {/* Menu Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30 font-bold uppercase tracking-widest text-[10px]">
                Menu vide. Cliquez sur &quot;Restaurer Menu&quot; en haut.
              </div>
            ) : (
              menuItems.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-2xl flex flex-col justify-between gap-6 border border-black/5 hover:border-[#b48c68] hover:shadow-[0_15px_30px_rgba(180,140,104,0.1)] transition-all">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] bg-[#b48c68]/10 text-[#b48c68] px-3 py-1 rounded-md">
                        {item.category}
                      </span>
                      <span className="text-[8px] font-bold opacity-30 uppercase" dir="rtl">{item.categoryAr}</span>
                    </div>
                    <h4 className="font-bold text-base mb-1">{item.nameFr}</h4>
                    <p className="text-xs font-bold opacity-30" dir="rtl">{item.nameAr}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-black/5">
                    <div className="text-xl font-bold text-[#b48c68]">
                      {item.price}<span className="text-[9px] opacity-40 ml-1 uppercase">DT</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(item)} className="p-3 bg-gray-50 hover:bg-black hover:text-white rounded-xl transition-all">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="p-3 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Mobile FAB */}
        <div className="fixed bottom-8 right-6 md:hidden z-50 flex flex-col gap-3">
          <a href={`/r/zcoffee`} target="_blank" className="w-14 h-14 rounded-[18px] bg-[#b48c68] text-white flex items-center justify-center shadow-[0_10px_25px_rgba(180,140,104,0.4)] active:scale-90 transition-all">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          </a>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-10 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editing ? 'Modifier Article' : 'Nouvel Article'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 opacity-30 hover:opacity-100 transition-all">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Catégorie (FR)</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 focus:border-[#b48c68] outline-none" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 text-right">Catégorie (AR)</label>
                  <input type="text" value={form.categoryAr} onChange={e => setForm({ ...form, categoryAr: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 focus:border-[#b48c68] outline-none text-right font-bold" dir="rtl" required />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Nom du produit (FR)</label>
                <input type="text" value={form.nameFr} onChange={e => setForm({ ...form, nameFr: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 focus:border-[#b48c68] outline-none" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1 text-right">Nom du produit (AR)</label>
                <input type="text" value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 focus:border-[#b48c68] outline-none text-right font-bold" dir="rtl" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Prix (DT)</label>
                <input type="text" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 focus:border-[#b48c68] outline-none font-bold" required />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#2d2a26] text-white py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] mt-4 shadow-lg shadow-black/10 hover:bg-[#b48c68] transition-all">
                {saving ? 'Synchronisation...' : 'Enregistrer'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
