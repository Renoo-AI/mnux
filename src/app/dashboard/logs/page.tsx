'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, XCircle, History, ChevronDown, Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { logService } from '@/services/logService';
import type { ActivityLog, LogAction } from '@/types';

const getActionStyle = (action: LogAction) => {
  switch (action) {
    case 'ORDER_CANCELLED':
    case 'ORDER_REJECTED':
      return { bg: 'bg-error-container', text: 'text-on-error-container', dot: 'bg-secondary', label: 'Cancellation' };
    case 'ORDER_CLOSED':
    case 'ORDER_PAID':
      return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-primary-container', label: 'Payment' };
    case 'ORDER_ACCEPTED':
      return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-secondary-container', label: 'Staff Action' };
    default:
      return { bg: 'bg-surface-container-high', text: 'text-primary', dot: 'bg-outline-variant', label: 'System Init' };
  }
};

export default function ActivityLogPage() {
  const { session } = useStaffSession();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch activity logs from Firebase
  useEffect(() => {
    if (!session?.restaurantId) {
      return;
    }

    const unsubscribe = logService.subscribeToActivityLogs(
      session.restaurantId,
      (fetchedLogs) => {
        setLogs(fetchedLogs);
        setIsLoading(false);
      },
      50
    );

    return () => unsubscribe();
  }, [session?.restaurantId]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  // Calculate daily summary from logs
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayLogs = logs.filter(log => new Date(log.createdAt) >= today);
  
  const summary = {
    totalOrders: todayLogs.filter(l => l.action === 'ORDER_CREATED').length,
    completedOrders: todayLogs.filter(l => l.action === 'ORDER_CLOSED').length,
    cancelledOrders: todayLogs.filter(l => l.action === 'ORDER_CANCELLED' || l.action === 'ORDER_REJECTED').length,
  };

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Activity Log"
          showSearch={false}
          user={{ name: session?.staffName || 'Manager', role: session?.role || 'manager' }}
        />
        <div className="p-6 md:p-10 max-w-6xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-secondary" />
            <p className="text-on-surface-variant">Loading activity logs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopAppBar
        title="Activity Log"
        showSearch={false}
        user={{ name: session?.staffName || 'Manager', role: session?.role || 'manager' }}
      />

      <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-10">
        {/* Summary Header */}
        <section>
          <h3 className="font-display text-title-sm text-primary mb-6">Daily Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-card border border-outline-variant/20">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary bg-secondary-fixed p-2 rounded-lg">shopping_cart</span>
                <span className="text-label-caps font-label-caps text-on-surface-variant">Today</span>
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Total Orders</p>
              <h4 className="font-display text-headline-md mt-2">{summary.totalOrders}</h4>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-card border border-outline-variant/20">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-on-secondary bg-primary p-2 rounded-lg">payments</span>
                <span className="text-label-caps font-label-caps text-on-surface-variant">{summary.completedOrders} / {summary.totalOrders} Completed</span>
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Paid Orders</p>
              <h4 className="font-display text-headline-md mt-2">{summary.completedOrders}</h4>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-card border border-outline-variant/20">
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-error bg-error-container p-2 rounded-lg">cancel</span>
                <span className="text-label-caps font-label-caps text-error">Critical Action</span>
              </div>
              <p className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">Cancelled Orders</p>
              <h4 className="font-display text-headline-md mt-2">{summary.cancelledOrders}</h4>
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
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6">
            {!session?.restaurantId ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h3 className="font-display text-title-sm text-primary mb-2">No restaurant selected</h3>
                <p className="text-on-surface-variant">Please log in to view activity logs</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                  <History className="w-8 h-8 text-on-surface-variant" />
                </div>
                <h3 className="font-display text-title-sm text-primary mb-2">No activity logs yet</h3>
                <p className="text-on-surface-variant">Activity will appear here as orders are placed and processed</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-soft-beige" />

                {/* Timeline Items */}
                {logs.map((log, index) => {
                  const style = getActionStyle(log.action);
                  return (
                    <div key={log.id} className={`relative flex gap-8 ${index < logs.length - 1 ? 'pb-6' : ''}`}>
                      <div className={`z-10 w-6 h-6 rounded-full border-4 border-white flex-shrink-0 mt-1 ${
                        log.action === 'ORDER_CANCELLED' || log.action === 'ORDER_REJECTED' ? 'bg-secondary' :
                        log.action === 'ORDER_CLOSED' || log.action === 'ORDER_PAID' ? 'bg-primary-container' :
                        log.action === 'ORDER_ACCEPTED' ? 'bg-secondary-container' : 'bg-outline-variant'
                      }`} />
                      
                      <div className={`flex-1 ${index < logs.length - 1 ? 'pb-4 border-b border-soft-beige' : ''}`}>
                        <div className="flex justify-between items-center mb-1">
                          <h5 className="font-display text-title-sm text-primary">
                            {formatTime(log.createdAt)} — {log.message || log.action.replace(/_/g, ' ').toLowerCase()}
                          </h5>
                          <span className={`font-label-caps text-label-caps px-4 py-1 ${style.bg} ${style.text} rounded-full`}>
                            {style.label}
                          </span>
                        </div>
                        <p className="font-body text-on-surface-variant text-sm">
                          {log.actorName ? `By ${log.actorName}` : 'System'}{log.tableId ? ` • Table ${log.tableId.replace('t', '')}` : ''}{log.reason ? ` • ${log.reason}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {logs.length > 0 && (
            <div className="px-6 py-4 bg-surface-container-low/50 flex justify-center">
              <button className="font-label-caps text-label-caps text-primary font-bold hover:underline transition-all">
                View Full History
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
