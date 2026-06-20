'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/browser';

interface TableData {
  id: string;
  label: string;
  number: number;
  zone: string;
  seats: number;
  qr_token: string;
  is_active: boolean;
  ordering_enabled: boolean;
}

const RESTAURANT_ID = process.env.NEXT_PUBLIC_RESTAURANT_ID || 'demo-restaurant';
const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

export default function TablesPage() {
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ label: '', number: '0', zone: '', seats: '2' });

  const loadTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tables?restaurantId=${RESTAURANT_ID}`);
      const data = await res.json();
      setTables(data.tables || []);
    } catch { /* empty */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadTables(); }, [loadTables]);

  const addTable = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantId: RESTAURANT_ID,
        label: form.label,
        number: parseInt(form.number) || 0,
        zone: form.zone,
        seats: parseInt(form.seats) || 2,
      }),
    });
    setShowModal(false);
    setForm({ label: '', number: '0', zone: '', seats: '2' });
    loadTables();
  };

  const toggleTable = async (id: string, field: 'is_active' | 'ordering_enabled', value: boolean) => {
    await fetch('/api/tables', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, [field === 'is_active' ? 'isActive' : 'orderingEnabled']: value }),
    });
    loadTables();
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    await fetch(`/api/tables?id=${id}`, { method: 'DELETE' });
    loadTables();
  };

  const qrUrl = (token: string) => `${BASE_URL}/r/zcoffee/t/${token}`;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[#b48c68] font-bold text-sm hover:underline">&larr; Dashboard</Link>
          <h1 className="text-sm font-bold uppercase tracking-widest text-[#2d2a26]">Table Management</h1>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-[#b48c68] transition-all">
          + Add Table
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20 text-xs opacity-30 uppercase tracking-widest">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div key={table.id} className="bg-white rounded-2xl p-6 border border-black/5 hover:border-[#b48c68] hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[#2d2a26]" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {table.label}
                    </h3>
                    <p className="text-xs text-[#b48c68] font-bold">{table.seats} seats</p>
                  </div>
                  <div className="flex gap-1">
                    {table.is_active ? (
                      <span className="px-2 py-1 rounded-md bg-green-50 text-green-600 text-[8px] font-bold uppercase tracking-wider">Active</span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[8px] font-bold uppercase tracking-wider">Off</span>
                    )}
                  </div>
                </div>

                <div className="bg-[#faf9f6] rounded-xl p-4 mb-4 flex items-center justify-center">
                  <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center border border-black/5" title={qrUrl(table.qr_token)}>
                    <span className="text-[10px] text-[#b48c68] font-bold text-center">QR Code<br/>{table.label}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#71717a]">Ordering</span>
                    <button
                      onClick={() => toggleTable(table.id, 'ordering_enabled', !table.ordering_enabled)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${table.ordering_enabled ? 'bg-[#b48c68]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${table.ordering_enabled ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <button
                    onClick={() => deleteTable(table.id)}
                    className="w-full py-2 rounded-lg bg-red-50 text-red-500 text-[9px] font-bold uppercase tracking-wider hover:bg-red-100 transition-all mt-2"
                  >
                    Delete Table
                  </button>
                </div>
              </div>
            ))}

            {tables.length === 0 && (
              <div className="col-span-full text-center py-20 text-xs opacity-30 uppercase tracking-widest">
                No tables. Click &quot;+ Add Table&quot; to create your first table.
              </div>
            )}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-6">New Table</h3>
            <form onSubmit={addTable} className="space-y-4 text-sm">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Table Label</label>
                <input type="text" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="T-01" className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Number</label>
                  <input type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Seats</label>
                  <input type="number" value={form.seats} onChange={e => setForm({ ...form, seats: e.target.value })} className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Zone</label>
                <input type="text" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} placeholder="Terrace / Indoor" className="w-full bg-gray-50 border border-black/5 rounded-lg px-4 py-3 outline-none focus:border-[#b48c68]" />
              </div>
              <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all shadow-lg">
                Create Table
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
