'use client';

import { useState } from 'react';
import { ShoppingBag, Payments, Cancel, History, ExpandMore, TrendingUp } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import type { ActivityLog } from '@/types';

// Demo data
const demoLogs: ActivityLog[] = [
  { id: '1', restaurantId: 'demo', type: 'order_cancelled', message: 'Cancelled by Ahmed, reason: client left', tableId: 't12', createdAt: new Date(Date.now() - 5 * 60000) },
  { id: '2', restaurantId: 'demo', type: 'order_completed', message: 'Marked paid by Sami', tableId: 't4', userName: 'Sami', createdAt: new Date(Date.now() - 11 * 60000) },
  { id: '3', restaurantId: 'demo', type: 'order_accepted', message: 'Accepted by Ahmed', tableId: 't7', orderId: '8834', userName: 'Ahmed', createdAt: new Date(Date.now() - 17 * 60000) },
  { id: '4', restaurantId: 'demo', type: 'order_created', message: 'T7 order created', tableId: 't7', createdAt: new Date(Date.now() - 18 * 60000) },
];

const getTypeStyle = (type: ActivityLog['type']) => {
  switch (type) {
    case 'order_cancelled':
      return { bg: 'bg-error-container', text: 'text-on-error-container', dot: 'bg-secondary', label: 'Cancellation' };
    case 'order_completed':
      return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-primary-container', label: 'Payment' };
    case 'order_accepted':
      return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-secondary-container', label: 'Staff Action' };
    default:
      return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-outline-variant', label: 'System Init' };
  }
};

export default function ActivityLogPage() {
  const [logs] = useState<ActivityLog[]>(demoLogs);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <DashboardLayout>
      <TopAppBar
        title="Activity Log"
        showSearch={false}
        user={{ name: 'Manager', role: 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
        {/* Summary Header */}
        <section>
          <h3 className="font-display text-title-sm text-primary mb-6">Daily Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-card border border-outline-variant/20">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary bg-secondary-fixed p-2 rounded-lg">shopping_cart</span>
                <span className="text-label-caps font-label-caps text-secondary">+12% vs yesterday</span>
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Total Orders</p>
              <h4 className="font-display text-headline-md mt-2">48</h4>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-card border border-outline-variant/20">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-on-secondary bg-primary p-2 rounded-lg">payments</span>
                <span className="text-label-caps font-label-caps text-on-surface-variant">42 / 48 Completed</span>
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Paid Orders</p>
              <h4 className="font-display text-headline-md mt-2">42</h4>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-card border border-outline-variant/20">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-error bg-error-container p-2 rounded-lg">cancel</span>
                <span className="text-label-caps font-label-caps text-error">Critical Action</span>
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Cancelled Orders</p>
              <h4 className="font-display text-headline-md mt-2">6</h4>
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 bg-surface-container-low border-b border-outline-variant/30 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-display text-title-sm">Operational Timeline</h3>
            </div>
            <button className="font-label-caps text-label-caps text-primary flex items-center gap-1 hover:opacity-70">
              Today
              <ExpandMore className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-soft-beige" />

              {/* Timeline Items */}
              {logs.map((log, index) => {
                const style = getTypeStyle(log.type);
                return (
                  <div key={log.id} className={`relative flex gap-8 ${index < logs.length - 1 ? 'pb-6' : ''}`}>
                    <div className={`z-10 w-6 h-6 rounded-full border-4 border-white flex-shrink-0 mt-1 ${
                      log.type === 'order_cancelled' ? 'bg-secondary' :
                      log.type === 'order_completed' ? 'bg-primary-container' :
                      log.type === 'order_accepted' ? 'bg-secondary-container' : 'bg-outline-variant'
                    }`} />
                    
                    <div className={`flex-1 ${index < logs.length - 1 ? 'pb-4 border-b border-soft-beige' : ''}`}>
                      <div className="flex justify-between items-center mb-1">
                        <h5 className="font-display text-title-sm text-primary">
                          {formatTime(log.createdAt)} — {log.message}
                        </h5>
                        <span className={`font-label-caps text-label-caps px-4 py-1 ${style.bg} ${style.text} rounded-full`}>
                          {style.label}
                        </span>
                      </div>
                      <p className="font-body text-on-surface-variant text-sm">
                        Table {log.tableId?.replace('t', '')} session{log.type === 'order_cancelled' ? ' terminated prematurely.' : '.'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-4 bg-surface-container-low/50 flex justify-center">
            <button className="font-label-caps text-label-caps text-primary font-bold hover:underline transition-all">
              View Full History
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
