'use client';

import { useState } from 'react';
import { Plus, PhotoCamera, Edit, QrCode, MoreVert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';

// Demo staff data
const demoStaff = [
  { id: '1', name: 'Elena Aris', email: 'elena.a@menuxpro.com', role: 'MANAGER', status: 'ACTIVE' },
  { id: '2', name: 'Marcus Wade', email: 'marcus.w@menuxpro.com', role: 'WAITER', status: 'ACTIVE' },
];

export default function SettingsPage() {
  const [restaurantName, setRestaurantName] = useState('The Gilded Bean');
  const [cuisineType, setCuisineType] = useState('Modern European & Artisan Coffee');
  const [address, setAddress] = useState('124 Savile Row, Mayfair, London, W1S 3PR, United Kingdom');

  return (
    <DashboardLayout>
      <TopAppBar
        title="Settings"
        showSearch={false}
        user={{ name: 'Elena Aris', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        {/* Restaurant Profile */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Restaurant Profile</h3>
            <p className="text-on-surface-variant mt-2">Update your public information and branding assets.</p>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6 border-b border-outline-variant pb-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full object-cover border-4 border-surface-container-high bg-surface-container-low flex items-center justify-center">
                  <span className="material-symbols-outlined text-outline text-4xl">restaurant</span>
                </div>
                <button className="absolute bottom-0 right-0 bg-primary text-on-primary p-1 rounded-full shadow-lg border-2 border-surface">
                  <PhotoCamera className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">RESTAURANT NAME</label>
                  <Input
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full p-4 border border-outline-variant rounded-full bg-surface-container-low"
                  />
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">CUISINE TYPE</label>
                  <Input
                    value={cuisineType}
                    onChange={(e) => setCuisineType(e.target.value)}
                    className="w-full p-4 border border-outline-variant rounded-full bg-surface-container-low"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="font-label-caps text-label-caps text-on-surface-variant block mb-1">ADDRESS</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full p-4 border border-outline-variant rounded-xl bg-surface-container-low focus:border-secondary-fixed-dim outline-none"
              />
            </div>
          </div>
        </section>

        {/* Operational Hours */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Operational Hours</h3>
            <p className="text-on-surface-variant mt-2">Manage when your kitchen and bar are open for business.</p>
          </div>
          
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-card">
            <div className="space-y-4">
              {[
                { label: 'Weekdays', hours: '08:00 AM — 11:00 PM', highlighted: false },
                { label: 'Weekends', hours: '10:00 AM — 01:00 AM', highlighted: true },
                { label: 'Public Holidays', hours: 'Closed', highlighted: false },
              ].map((item, i) => (
                <div key={i} className={`flex items-center justify-between p-4 bg-surface-container-low rounded-xl ${item.highlighted ? 'border border-secondary-fixed' : ''}`}>
                  <span className="font-display text-title-sm font-bold">{item.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-body">{item.hours}</span>
                    <button className="text-secondary font-label-caps text-label-caps hover:underline">EDIT</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Table Management */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Table Management</h3>
            <p className="text-on-surface-variant mt-2">Organize your floor plan and manage digital menu QR codes.</p>
            <Button className="mt-4 bg-primary text-on-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Table
            </Button>
          </div>
          
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'T-01', label: 'Window Side', seats: 4 },
              { name: 'T-02', label: 'Main Hall', seats: 2 },
              { name: 'B-01', label: 'Bar Stool', seats: 1 },
            ].map((table, i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-card flex items-center justify-between hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary-container text-on-secondary-container rounded-lg flex items-center justify-center font-bold">
                    {table.name}
                  </div>
                  <div>
                    <h4 className="font-display text-title-sm font-bold">{table.label}</h4>
                    <p className="font-label-caps text-[10px] text-on-surface-variant">{table.seats} SEATS</p>
                  </div>
                </div>
                <button className="p-2 hover:text-secondary">
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            <button className="bg-white p-4 rounded-xl shadow-card flex items-center justify-center border-2 border-dashed border-outline-variant hover:border-secondary transition-all">
              <div className="flex items-center gap-4 opacity-60">
                <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="font-body font-bold">Add Custom Table</span>
              </div>
            </button>
          </div>
        </section>

        {/* Staff Management */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Staff Management</h3>
            <p className="text-on-surface-variant mt-2">Manage roles, permissions, and staff login access.</p>
          </div>
          
          <div className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">STAFF MEMBER</th>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">ROLE</th>
                  <th className="p-4 font-label-caps text-label-caps text-on-surface-variant">STATUS</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {demoStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center font-bold text-on-secondary-fixed">
                          {staff.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-body font-bold">{staff.name}</p>
                          <p className="text-[12px] text-on-surface-variant">{staff.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`font-label-caps text-[10px] px-3 py-1 rounded-full ${
                        staff.role === 'MANAGER' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-surface-container-highest text-on-surface-variant'
                      }`}>
                        {staff.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-label-caps text-[10px]">{staff.status}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                        <MoreVert className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 text-center bg-surface-container-low">
              <button className="text-secondary font-label-caps text-label-caps hover:underline">VIEW ALL STAFF</button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Actions */}
      <footer className="p-10 border-t border-outline-variant flex justify-end gap-4">
        <Button variant="outline" className="px-10 py-4 border border-primary text-primary rounded-full">
          Discard Changes
        </Button>
        <Button className="px-10 py-4 bg-primary text-on-primary rounded-full shadow-lg">
          Save Settings
        </Button>
      </footer>
    </DashboardLayout>
  );
}
