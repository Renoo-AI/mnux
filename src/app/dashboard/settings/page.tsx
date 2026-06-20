'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-[#b48c68] font-bold text-sm">&larr; Dashboard</Link>
          <h1 className="text-sm font-bold uppercase tracking-widest text-[#2d2a26]">Settings</h1>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <section className="bg-white rounded-2xl p-8 border border-black/5 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Restaurant Settings</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Restaurant Name</label>
              <input type="text" defaultValue="ZCOFFEE" className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#b48c68]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Slug</label>
              <input type="text" defaultValue="zcoffee" className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#b48c68]" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">Currency</label>
              <select defaultValue="TND" className="w-full bg-[#faf9f6] border border-black/5 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#b48c68]">
                <option value="TND">TND (DT)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>

            <button onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}
              className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#b48c68] transition-all mt-4">
              {saved ? 'Saved!' : 'Save Settings'}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
