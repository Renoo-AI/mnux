'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Payments, 
  CleaningServices, 
  DoneAll,
  Restaurant,
  EventSeat,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { orderService } from '@/services/orderService';
import { tableService } from '@/services/tableService';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import type { Order, Table, OrderState } from '@/types';

// Demo restaurant ID for development
const DEMO_RESTAURANT_ID = 'demo-restaurant';

export default function CashierDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoadingState] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState((authUser) => {
      setUser(authUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubOrders = orderService.subscribeToActiveOrders(DEMO_RESTAURANT_ID, (data) => {
      setOrders(data);
      setLoadingState(false);
    });

    const unsubTables = tableService.subscribeToTables(DEMO_RESTAURANT_ID, (data) => {
      setTables(data);
    });

    return () => {
      unsubOrders();
      unsubTables();
    };
  }, [isAuthenticated]);

  const handleAcceptOrder = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-accept');
    await orderService.acceptOrder(orderId);
    setActionLoading(null);
  }, []);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-complete');
    await orderService.completeOrder(orderId);
    setSelectedOrder(null);
    setActionLoading(null);
  }, []);

  const handleCancelOrder = useCallback(async (orderId: string, reason: string) => {
    setActionLoading(orderId + '-cancel');
    await orderService.cancelOrder(orderId, reason);
    setSelectedOrder(null);
    setActionLoading(null);
  }, []);

  const getStateColor = (state: OrderState) => {
    switch (state) {
      case 'NEW':
        return 'bg-secondary-fixed text-on-secondary-fixed-variant';
      case 'ACCEPTED':
        return 'bg-surface-container-high text-on-surface-variant';
      case 'COMPLETED':
        return 'bg-primary-fixed text-on-primary-fixed-variant';
      case 'CANCELLED':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  const getStateLabel = (state: OrderState) => {
    switch (state) {
      case 'NEW':
        return 'NEW ORDER';
      case 'ACCEPTED':
        return 'ACCEPTED';
      case 'COMPLETED':
        return 'PAID';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return state;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group orders by state for display
  const newOrders = orders.filter(o => o.state === 'NEW');
  const acceptedOrders = orders.filter(o => o.state === 'ACCEPTED');
  const activeTableIds = orders.filter(o => ['NEW', 'ACCEPTED'].includes(o.state)).map(o => o.tableId);

  return (
    <DashboardLayout>
      <TopAppBar
        title="Active Tables"
        subtitle={`${orders.length} busy`}
        showSearch={false}
        user={{
          name: user?.staffProfile?.name || 'Staff',
          role: user?.role || 'staff',
        }}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Grid Area */}
        <section className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
          {/* New Orders (Pulsing) */}
          {newOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="pulse-border bg-white rounded-3xl p-6 shadow-card active:scale-95 transition-transform cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-title-sm text-primary">{order.tableName}</h3>
                  <p className="text-on-surface-variant font-label-caps text-label-caps">
                    {order.items.length} ITEMS
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-label-caps text-label-caps ${getStateColor(order.state)}`}>
                  {getStateLabel(order.state)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-on-surface-variant font-medium text-sm">
                  {formatTimeAgo(order.createdAt)}
                </span>
              </div>
              <div className="border-t border-surface-container pt-4">
                <p className="text-primary font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ))}
          
          {/* Accepted Orders */}
          {acceptedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-card active:scale-95 transition-transform cursor-pointer ring-2 ring-primary"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-title-sm text-primary">{order.tableName}</h3>
                  <p className="text-on-surface-variant font-label-caps text-label-caps">
                    {order.items.length} ITEMS
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-label-caps text-label-caps ${getStateColor(order.state)}`}>
                  {getStateLabel(order.state)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Restaurant className="w-4 h-4 text-outline" />
                <span className="text-on-surface-variant font-medium text-sm">
                  {formatTimeAgo(order.createdAt)}
                </span>
              </div>
              <div className="border-t border-surface-container pt-4">
                <p className="text-primary font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ))}
          
          {/* Available Tables */}
          {tables
            .filter(t => !activeTableIds.includes(t.id) && t.state !== 'OFFLINE')
            .map((table) => (
              <div
                key={table.id}
                className="bg-surface-container-low border border-dashed border-outline-variant rounded-3xl p-6 opacity-70"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-title-sm text-on-surface-variant">{table.name}</h3>
                    <p className="text-on-surface-variant font-label-caps text-label-caps">
                      {table.seats} SEATS
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-surface-dim text-on-surface-variant rounded-full font-label-caps text-label-caps">
                    EMPTY
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <EventSeat className="w-4 h-4 text-outline-variant" />
                  <span className="text-on-surface-variant font-medium text-sm">Available</span>
                </div>
              </div>
            ))}
        </section>

        {/* Right Side Detail Panel */}
        {selectedOrder && (
          <aside className="w-[400px] bg-white border-l border-outline-variant flex flex-col h-full shadow-2xl z-40">
            <div className="p-6 border-b border-surface-container">
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-display text-title-sm text-primary">{selectedOrder.tableName} Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-on-surface-variant hover:bg-surface-container-low rounded-full p-1 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-on-surface-variant font-label-caps text-label-caps">
                {selectedOrder.items.length} items • {formatTimeAgo(selectedOrder.createdAt)}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <span className="font-bold text-primary">{item.quantity}x</span>
                    <div>
                      <p className="text-primary font-semibold">{item.name}</p>
                      {item.notes && (
                        <p className="text-on-surface-variant text-sm">{item.notes}</p>
                      )}
                    </div>
                  </div>
                  <p className="text-primary">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <div className="mt-6 pt-6 border-t border-surface-container">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-on-surface-variant">Subtotal</p>
                  <p className="text-on-surface-variant">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="font-display text-title-sm text-primary">Total</p>
                  <p className="font-display text-title-sm text-primary">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="p-6 bg-surface-container-lowest grid grid-cols-2 gap-4 border-t border-outline-variant">
              {selectedOrder.state === 'NEW' && (
                <>
                  <Button
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-accept'}
                    className="col-span-2 bg-secondary-container text-on-secondary-container rounded-full py-4 hover:opacity-90"
                  >
                    {actionLoading === selectedOrder.id + '-accept' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <DoneAll className="w-5 h-5 mr-2" />
                        Accept Order
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleCancelOrder(selectedOrder.id, 'Customer request')}
                    disabled={actionLoading === selectedOrder.id + '-cancel'}
                    variant="outline"
                    className="col-span-2 border border-error text-error rounded-full py-4 hover:bg-error-container/20"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancel Order
                  </Button>
                </>
              )}
              
              {selectedOrder.state === 'ACCEPTED' && (
                <>
                  <Button
                    onClick={() => handleCompleteOrder(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-complete'}
                    className="col-span-2 bg-primary text-on-primary rounded-full py-4 hover:opacity-90"
                  >
                    {actionLoading === selectedOrder.id + '-complete' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Payments className="w-5 h-5 mr-2" />
                        Mark Paid
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="py-4 bg-surface-container-high text-primary rounded-full hover:opacity-90"
                  >
                    <CleaningServices className="w-5 h-5 mr-2" />
                    Close Table
                  </Button>
                  <Button
                    onClick={() => handleCancelOrder(selectedOrder.id, 'Customer request')}
                    disabled={actionLoading === selectedOrder.id + '-cancel'}
                    variant="outline"
                    className="py-4 border border-error text-error rounded-full hover:bg-error-container/20"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </aside>
        )}
      </div>
    </DashboardLayout>
  );
}
