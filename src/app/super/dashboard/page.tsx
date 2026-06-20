'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/browser';
import { useAuth } from '@/lib/useAuth';

interface Store {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string;
  owner_id: string;
}

interface AdminUser {
  id: string;
  user_id: string;
  display_name: string;
  role: string;
  restaurant_id: string;
  restaurant_name: string;
}

interface BannedIp {
  id: string;
  ip: string;
  level: string;
  banned_until: string;
  reason: string;
}

type Tab = 'stores' | 'admins' | 'banned';

export default function SuperDashboard() {
  const router = useRouter();
  const { user, staff, loading: authLoading, signOut } = useAuth('super_admin');
  const [activeTab, setActiveTab] = useState<Tab>('stores');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg,#faf9f6)] flex items-center justify-center">
        <div className="shimmer w-16 h-16 rounded-2xl" />
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
            <h1 className="text-xl font-black tracking-widest text-[#2d2a26]">MENUX SUPER</h1>
            <p className="text-xs text-[#b48c68] font-bold mt-1">Platform Control</p>
          </div>
          <input name="email" type="email" placeholder="Email" required className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-3 outline-none focus:border-[#b48c68] text-sm" />
          <input name="password" type="password" placeholder="Password" required className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-6 outline-none focus:border-[#b48c68] text-sm" />
          <button type="submit" className="w-full bg-[#2d2a26] text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg">
            Access Platform
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg,#faf9f6)] text-[var(--text,#2d2a26)]">
      <nav className="glass-nav w-full h-[72px] fixed top-0 left-0 bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-8 z-50">
        <div className="text-xl font-black tracking-widest">MENUX SUPER</div>
        <button onClick={signOut} className="text-sm font-bold opacity-60 hover:opacity-100">SIGN OUT</button>
      </nav>

      <main className="w-full max-w-6xl mx-auto mt-28 px-6 space-y-8 pb-12">
        {/* Tabs */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 border border-black/5 w-fit">
          {(['stores', 'admins', 'banned'] as Tab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab ? 'bg-black text-white' : 'text-[#71717a] hover:text-[#2d2a26]'
              }`}
            >
              {tab === 'stores' ? 'Stores' : tab === 'admins' ? 'Admins' : 'Banned IPs'}
            </button>
          ))}
        </div>

        {activeTab === 'stores' && <StoresTab showToast={showToast} />}
        {activeTab === 'admins' && <AdminsTab showToast={showToast} />}
        {activeTab === 'banned' && <BannedTab showToast={showToast} />}
      </main>

      {toast && (
        <div className={`fixed bottom-6 right-6 z-[200] px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl animate-slide-in-right ${
          toast.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function StoresTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ slug: '', name: '', description: '' });

  const loadStores = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('restaurants').select('*').order('created_at', { ascending: false });
    setStores(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadStores(); }, [loadStores]);

  const createStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('restaurants').insert({
      slug: form.slug,
      name: form.name,
      status: 'ACTIVE',
      plan: 'FREE',
      owner_id: 'system',
    });
    if (error) { showToast('error', error.message); return; }
    showToast('success', 'Store created');
    setShowCreate(false);
    setForm({ slug: '', name: '', description: '' });
    loadStores();
  };

  if (loading) return <div className="menu-card p-8 bg-white rounded-3xl border border-black/5"><div className="shimmer w-full h-40 rounded-xl" /></div>;

  return (
    <section className="menu-card p-8 bg-white rounded-3xl border border-black/5 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black uppercase tracking-widest">All Stores</h2>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#b48c68] transition-all">
          + New Store
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5">
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Name</th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Slug</th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Status</th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Plan</th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.03]">
            {stores.map(s => (
              <tr key={s.id} className="hover:bg-[#faf9f6]">
                <td className="py-3 px-4 font-bold">{s.name}</td>
                <td className="py-3 px-4 text-[#71717a]">{s.slug}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    s.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  }`}>{s.status}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#b48c68]/10 text-[#b48c68]">{s.plan || 'FREE'}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await supabase.from('restaurants').update({ status: s.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' }).eq('id', s.id);
                      loadStores();
                    }} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider hover:bg-red-100">
                      {s.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-6">Create Store</h3>
            <form onSubmit={createStore} className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Slug (URL)</label>
                <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="cafe-marsa" className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg">
                Create Store
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function AdminsTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', displayName: '', restaurantId: '' });
  const [restaurants, setRestaurants] = useState<Store[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: staff } = await supabase.from('staff').select('*, restaurants!inner(id, name)').eq('role', 'admin');
    const { data: stores } = await supabase.from('restaurants').select('id, name').eq('status', 'ACTIVE');
    setAdmins((staff || []).map((s: Record<string, unknown>) => ({
      id: s.id as string,
      user_id: s.user_id as string,
      display_name: s.display_name as string,
      role: s.role as string,
      restaurant_id: s.restaurant_id as string,
      restaurant_name: ((s.restaurants as Record<string, string>)?.name) || '',
    })));
    setRestaurants((stores || []) as Store[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });
    if (authErr) { showToast('error', authErr.message); return; }

    if (authData.user) {
      await supabase.from('staff').insert({
        user_id: authData.user.id,
        restaurant_id: form.restaurantId,
        display_name: form.displayName,
        role: 'admin',
        is_active: true,
      });
      showToast('success', 'Admin created. They must verify email.');
      setShowCreate(false);
      load();
    }
  };

  if (loading) return <div className="menu-card p-8 bg-white rounded-3xl border border-black/5"><div className="shimmer w-full h-40 rounded-xl" /></div>;

  return (
    <section className="menu-card p-8 bg-white rounded-3xl border border-black/5 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black uppercase tracking-widest">Admin Users</h2>
        <button onClick={() => setShowCreate(true)} className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#b48c68] transition-all">
          + Create Admin
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/5">
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Name</th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">User ID</th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Store</th>
              <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/[0.03]">
            {admins.map(a => (
              <tr key={a.id} className="hover:bg-[#faf9f6]">
                <td className="py-3 px-4 font-bold">{a.display_name || '—'}</td>
                <td className="py-3 px-4 text-[#71717a] text-xs">{a.user_id?.slice(0, 12)}...</td>
                <td className="py-3 px-4 text-[#b48c68] font-bold">{a.restaurant_name}</td>
                <td className="py-3 px-4">
                  <button onClick={async () => {
                    if (!confirm('Revoke this admin?')) return;
                    await supabase.from('staff').update({ is_active: false }).eq('id', a.id);
                    load();
                    showToast('success', 'Admin revoked');
                  }} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-wider hover:bg-red-100">
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black mb-6">Create Admin</h3>
            <form onSubmit={createAdmin} className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Display Name</label>
                <input type="text" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Assign to Store</label>
                <select value={form.restaurantId} onChange={e => setForm({ ...form, restaurantId: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required>
                  <option value="">Select store...</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg">
                Create Admin Account
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function BannedTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [banned, setBanned] = useState<BannedIp[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('banned_ips').select('*').order('banned_until', { ascending: false });
    setBanned((data || []) as BannedIp[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unban = async (id: string) => {
    await supabase.from('banned_ips').delete().eq('id', id);
    load();
    showToast('success', 'IP unbanned');
  };

  if (loading) return <div className="menu-card p-8 bg-white rounded-3xl border border-black/5"><div className="shimmer w-full h-40 rounded-xl" /></div>;

  return (
    <section className="menu-card p-8 bg-white rounded-3xl border border-black/5 shadow-sm">
      <h2 className="text-lg font-black uppercase tracking-widest mb-6">Banned IPs</h2>

      {banned.length === 0 ? (
        <p className="text-sm opacity-40 font-bold uppercase tracking-widest text-center py-12">No banned IPs</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5">
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">IP Address</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Level</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Until</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Reason</th>
                <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-[#71717a]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {banned.map(b => (
                <tr key={b.id} className="hover:bg-[#faf9f6]">
                  <td className="py-3 px-4 font-mono text-xs">{b.ip}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider ${
                      b.level === 'permanent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                    }`}>{b.level}</span>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#71717a]">
                    {b.banned_until ? new Date(b.banned_until).toLocaleString() : 'Permanent'}
                  </td>
                  <td className="py-3 px-4 text-xs text-[#71717a]">{b.reason || '—'}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => unban(b.id)} className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-wider hover:bg-green-100">
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
