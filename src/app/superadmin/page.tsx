'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/browser';
import type { User } from '@supabase/supabase-js';

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string;
  owner_id: string;
  created_at: string;
}

interface Stats {
  restaurantCount: number;
  ordersToday: number;
  staffCount: number;
}

export default function SuperadminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [stats, setStats] = useState<Stats>({ restaurantCount: 0, ordersToday: 0, staffCount: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { setLoading(false); return; }
      setUser(session.user);

      const token = session.access_token;
      const res = await fetch('/api/superadmin', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setAuthorized(true);
        const data = await res.json();
        setRestaurants(data.restaurants || []);
        setStats({
          restaurantCount: data.restaurants?.length || 0,
          ordersToday: data.ordersToday || 0,
          staffCount: data.staffCount || 0,
        });
      }
      setLoading(false);
    });
  }, []);

  const updateRestaurant = useCallback(async (id: string, updates: { status?: string; plan?: string }) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch('/api/superadmin', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ restaurantId: id, ...updates }),
    });

    setRestaurants(prev =>
      prev.map(r => (r.id === id ? { ...r, ...updates } : r))
    );
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    if (error) alert(error.message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#b48c68] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#2d2a26] rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-[#b48c68] font-bold text-xl">M</span>
            </div>
            <h1 className="text-xl font-bold text-[#2d2a26]">Superadmin</h1>
            <p className="text-xs text-[#b48c68] font-bold uppercase tracking-widest mt-1">Platform Control</p>
          </div>
          <input name="email" type="email" placeholder="Email" required className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-3 outline-none focus:border-[#b48c68] text-sm" />
          <input name="password" type="password" placeholder="Password" required className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 mb-6 outline-none focus:border-[#b48c68] text-sm" />
          <button type="submit" className="w-full bg-[#2d2a26] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg">
            Access Platform
          </button>
        </form>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold text-[#2d2a26] mb-2">Access Denied</h1>
          <p className="text-[#71717a] mb-4">You do not have superadmin privileges.</p>
          <button onClick={() => supabase.auth.signOut()} className="text-[#b48c68] font-bold text-sm hover:underline">
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2d2a26] rounded-xl flex items-center justify-center">
            <span className="text-[#b48c68] font-bold text-lg">M</span>
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-widest text-[#2d2a26]">Superadmin</h1>
            <p className="text-[9px] text-[#b48c68] font-bold">{user.email}</p>
          </div>
        </div>
        <button onClick={() => supabase.auth.signOut()} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
          Logout
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10">
        <h2 className="text-3xl font-bold tracking-tight mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
          Platform Overview
        </h2>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-black/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b48c68] mb-2">Restaurants</p>
            <p className="text-4xl font-bold text-[#2d2a26]">{stats.restaurantCount}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-black/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b48c68] mb-2">Orders Today</p>
            <p className="text-4xl font-bold text-[#2d2a26]">{stats.ordersToday}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-black/5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#b48c68] mb-2">Staff</p>
            <p className="text-4xl font-bold text-[#2d2a26]">{stats.staffCount}</p>
          </div>
        </div>

        {/* Restaurant List */}
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5">
            <h3 className="font-bold text-sm uppercase tracking-widest">Restaurants</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 bg-[#faf9f6]">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Name</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Slug</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Plan</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {restaurants.map((r) => (
                  <tr key={r.id} className="hover:bg-[#faf9f6] transition-colors">
                    <td className="px-6 py-4 font-bold text-[#2d2a26]">{r.name}</td>
                    <td className="px-6 py-4 text-[#71717a]">{r.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        r.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                        r.status === 'SUSPENDED' ? 'bg-red-50 text-red-600' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        r.plan === 'PRO' ? 'bg-[#b48c68]/10 text-[#b48c68]' : 'bg-gray-50 text-gray-500'
                      }`}>
                        {r.plan || 'FREE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {r.status === 'ACTIVE' ? (
                          <button onClick={() => updateRestaurant(r.id, { status: 'SUSPENDED' })} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all">
                            Suspend
                          </button>
                        ) : (
                          <button onClick={() => updateRestaurant(r.id, { status: 'ACTIVE' })} className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-[9px] font-bold uppercase tracking-wider hover:bg-green-100 transition-all">
                            Activate
                          </button>
                        )}
                        <button onClick={() => updateRestaurant(r.id, { plan: r.plan === 'PRO' ? 'FREE' : 'PRO' })} className="px-3 py-1.5 rounded-lg bg-[#b48c68]/10 text-[#b48c68] text-[9px] font-bold uppercase tracking-wider hover:bg-[#b48c68]/20 transition-all">
                          {r.plan === 'PRO' ? 'Downgrade' : 'Upgrade'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {restaurants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#71717a] text-xs font-bold uppercase tracking-widest">
                      No restaurants yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
