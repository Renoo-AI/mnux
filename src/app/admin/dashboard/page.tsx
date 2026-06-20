'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase/browser';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
  store_id: string;
}

interface FormData {
  id: string;
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, staff, loading: authLoading, signOut } = useAuth('admin');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [form, setForm] = useState<FormData>({
    id: '', name: '', description: '', price: '', category: 'Boissons', available: true,
  });

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMenu = useCallback(async () => {
    if (!staff?.restaurantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/menu?restaurantId=${staff.restaurantId}`);
      const data = await res.json();
      setMenuItems(
        (data.items || []).map((i: Record<string, unknown>) => ({
          id: i.id as string,
          name: (i.name_fr || i.name) as string,
          description: (i.description_fr || i.description) as string || '',
          price: String(i.price || ''),
          category: (i.categories as Record<string, string>)?.name_fr || (i.category as string) || '',
          available: !!(i.is_available ?? i.available),
          store_id: staff.restaurantId,
        }))
      );
    } catch {
      showToast('error', 'Failed to load menu');
    }
    setLoading(false);
  }, [staff?.restaurantId]);

  useEffect(() => { if (staff) loadMenu(); }, [staff, loadMenu]);

  const openAdd = () => {
    setForm({ id: '', name: '', description: '', price: '', category: 'Boissons', available: true });
    setEditing(false);
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      id: item.id, name: item.name, description: item.description || '',
      price: item.price, category: item.category, available: item.available,
    });
    setEditing(true);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = {
        restaurantId: staff?.restaurantId,
        nameFr: form.name,
        nameAr: form.name,
        price: form.price,
        category: form.category,
        categoryAr: form.category,
        isAvailable: form.available,
      };

      if (editing && form.id) {
        await fetch('/api/menu', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: form.id, ...body }),
        });
        showToast('success', 'Item updated');
      } else {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        showToast('success', 'Item created');
      }
      setShowModal(false);
      loadMenu();
    } catch {
      showToast('error', 'Operation failed');
    }
  };

  const toggleAvailable = async (item: MenuItem) => {
    await fetch('/api/menu', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isAvailable: !item.available }),
    });
    loadMenu();
    showToast('success', item.available ? 'Item hidden' : 'Item visible');
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item permanently?')) return;
    await fetch(`/api/menu?id=${id}`, { method: 'DELETE' });
    loadMenu();
    showToast('success', 'Item deleted');
  };

  const groupedItems = menuItems.reduce((acc: Record<string, MenuItem[]>, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg,#faf9f6)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="shimmer w-16 h-16 rounded-2xl" />
          <div className="shimmer w-32 h-4 rounded" />
        </div>
      </div>
    );
  }

  if (!user || !staff) {
    return (
      <div className="min-h-screen bg-[var(--bg,#faf9f6)] flex items-center justify-center p-4">
        <form onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const { error } = await supabase.auth.signInWithPassword({
            email: fd.get('email') as string,
            password: fd.get('password') as string,
          });
          if (error) alert(error.message);
        }} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-xl font-black tracking-widest text-[#2d2a26]">MENUX ADMIN</h1>
            <p className="text-xs text-[#b48c68] font-bold mt-1">Restaurant Management</p>
          </div>
          <input name="email" type="email" placeholder="Email" required className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-3 outline-none focus:border-[#b48c68] text-sm" />
          <input name="password" type="password" placeholder="Password" required className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-6 outline-none focus:border-[#b48c68] text-sm" />
          <button type="submit" className="w-full bg-[#2d2a26] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg,#faf9f6)] text-[var(--text,#2d2a26)]">
      {/* Glass Navigation */}
      <nav className="glass-nav w-full h-[72px] fixed top-0 left-0 bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-8 z-50">
        <div className="text-xl font-black tracking-widest">MENUX ADMIN</div>
        <button onClick={signOut} className="text-sm font-bold opacity-60 hover:opacity-100">SIGN OUT</button>
      </nav>

      <main className="w-full max-w-5xl mx-auto mt-28 px-6 space-y-8 pb-12">
        {/* Store Header */}
        <section className="menu-card p-8 bg-white rounded-3xl border border-black/5 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                {staff.restaurantName || 'My Restaurant'}
              </h1>
              <p className="text-sm text-[#b48c68] font-medium mt-1">Manage your menu items</p>
            </div>
            <button
              onClick={openAdd}
              className="px-6 py-3 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#b48c68] shadow-lg transition-all"
            >
              + Add Item
            </button>
          </div>
        </section>

        {/* Menu Items Grouped by Category */}
        {loading ? (
          <section className="menu-card p-8 bg-white rounded-3xl border border-black/5">
            <div className="shimmer w-1/3 h-6 rounded mb-6" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between items-center py-4 border-b border-black/[0.03]">
                <div className="space-y-2">
                  <div className="shimmer w-40 h-4 rounded" />
                  <div className="shimmer w-20 h-3 rounded" />
                </div>
                <div className="shimmer w-16 h-4 rounded" />
              </div>
            ))}
          </section>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <section key={category} className="menu-card p-8 bg-white rounded-3xl border border-black/5 shadow-sm">
              <h2 className="text-lg font-black text-[#b48c68] uppercase tracking-widest mb-6">{category}</h2>
              <div className="divide-y divide-black/[0.03]">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-4 group">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-[15px]">{item.name}</h3>
                        <button
                          onClick={() => toggleAvailable(item)}
                          className={`w-9 h-5 rounded-full relative transition-colors ${item.available ? 'bg-[#b48c68]' : 'bg-gray-300'}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${item.available ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </div>
                      {item.description && (
                        <p className="text-xs text-[#71717a] mt-1">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-[#b48c68]">{item.price} DT</span>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-gray-50 hover:bg-black hover:text-white transition-all">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all">
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" /></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {!loading && menuItems.length === 0 && (
          <section className="menu-card p-12 bg-white rounded-3xl border border-black/5 text-center">
            <p className="text-sm opacity-40 font-bold uppercase tracking-widest">No menu items yet</p>
            <button onClick={openAdd} className="mt-4 text-[#b48c68] font-bold text-sm hover:underline">
              Add your first item
            </button>
          </section>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-slide-in-right ${
          toast.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-6">{editing ? 'Edit Item' : 'New Item'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Price (DT)</label>
                  <input type="text" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68] font-bold" required />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Category</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" />
                </div>
              </div>
              <label className="flex items-center gap-3 py-2">
                <input type="checkbox" checked={form.available} onChange={e => setForm({ ...form, available: e.target.checked })} className="w-4 h-4 text-[#b48c68]" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Available</span>
              </label>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg">
                {editing ? 'Save Changes' : 'Create Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
