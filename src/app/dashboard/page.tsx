'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Sparkles, 
  CheckCheck,
  Utensils,
  Armchair,
  Loader2,
  Bell,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useAuthStore } from '@/stores/authStore';
import type { Order, Table, OrderState } from '@/types';

// Demo data for development/preview mode
const demoOrders: Order[] = [
  {
    id: '1',
    restaurantId: 'demo',
    tableId: 't1',
    tableName: 'Table 01',
    items: [
      { itemId: '1', name: 'Signature Latte', quantity: 2, unitPrice: 5.50, notes: 'Extra hot' },
      { itemId: '2', name: 'Almond Croissant', quantity: 1, unitPrice: 4.50 },
    ],
    totalAmount: 15.50,
    state: 'NEW',
    createdAt: new Date(Date.now() - 2 * 60000),
    updatedAt: new Date(),
  },
  {
    id: '2',
    restaurantId: 'demo',
    tableId: 't2',
    tableName: 'Table 03',
    items: [
      { itemId: '3', name: 'Cappuccino', quantity: 2, unitPrice: 4.50 },
      { itemId: '4', name: 'Avocado Toast', quantity: 1, unitPrice: 12.00 },
      { itemId: '5', name: 'Fresh Juice', quantity: 2, unitPrice: 6.00 },
    ],
    totalAmount: 33.00,
    state: 'NEW',
    createdAt: new Date(Date.now() - 5 * 60000),
    updatedAt: new Date(),
  },
  {
    id: '3',
    restaurantId: 'demo',
    tableId: 't3',
    tableName: 'Table 12',
    items: [
      { itemId: '6', name: 'Truffle Tagliatelle', quantity: 1, unitPrice: 28.00, notes: 'Extra Parmesan' },
      { itemId: '7', name: 'Burrata Salad', quantity: 1, unitPrice: 14.00 },
    ],
    totalAmount: 42.00,
    state: 'ACCEPTED',
    createdAt: new Date(Date.now() - 18 * 60000),
    updatedAt: new Date(),
  },
  {
    id: '4',
    restaurantId: 'demo',
    tableId: 't4',
    tableName: 'Table 08',
    items: [
      { itemId: '8', name: 'Wagyu Burger', quantity: 2, unitPrice: 32.00 },
      { itemId: '9', name: 'Wine Selection', quantity: 1, unitPrice: 48.00 },
    ],
    totalAmount: 112.00,
    state: 'ACCEPTED',
    createdAt: new Date(Date.now() - 35 * 60000),
    updatedAt: new Date(),
  },
];

const demoTables: Table[] = [
  { id: 't1', restaurantId: 'demo', name: 'Table 01', label: 'Window Side', seats: 4, state: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-01', createdAt: new Date(), updatedAt: new Date() },
  { id: 't2', restaurantId: 'demo', name: 'Table 03', label: 'Main Hall', seats: 2, state: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-03', createdAt: new Date(), updatedAt: new Date() },
  { id: 't3', restaurantId: 'demo', name: 'Table 12', label: 'Patio', seats: 4, state: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-12', createdAt: new Date(), updatedAt: new Date() },
  { id: 't4', restaurantId: 'demo', name: 'Table 08', label: 'Corner', seats: 6, state: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-08', createdAt: new Date(), updatedAt: new Date() },
  { id: 't5', restaurantId: 'demo', name: 'Table 02', label: 'Window Side', seats: 2, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/T-02', createdAt: new Date(), updatedAt: new Date() },
  { id: 't6', restaurantId: 'demo', name: 'Table 04', label: 'Main Hall', seats: 4, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/T-04', createdAt: new Date(), updatedAt: new Date() },
  { id: 't7', restaurantId: 'demo', name: 'Table 05', label: 'Bar Area', seats: 2, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/T-05', createdAt: new Date(), updatedAt: new Date() },
  { id: 't8', restaurantId: 'demo', name: 'B-01', label: 'Bar Stool', seats: 1, state: 'AVAILABLE', qrCodeUrl: '/r/demo/t/B-01', createdAt: new Date(), updatedAt: new Date() },
];

export default function CashierDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, setUser, setLoading } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>(demoOrders);
  const [tables, setTables] = useState<Table[]>(demoTables);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoadingState] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Simulate real-time updates in demo mode
  useEffect(() => {
    const timer = setInterval(() => {
      // Randomly update order times to simulate real-time
      setOrders(prev => prev.map(order => ({
        ...order,
        createdAt: order.createdAt,
      })));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleAcceptOrder = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-accept');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, state: 'ACCEPTED' as OrderState } : o
    ));
    setActionLoading(null);
  }, []);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-complete');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setOrders(prev => prev.filter(o => o.id !== orderId));
    setSelectedOrder(null);
    setActionLoading(null);
  }, []);

  const handleCancelOrder = useCallback(async (orderId: string, reason: string) => {
    setActionLoading(orderId + '-cancel');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setOrders(prev => prev.filter(o => o.id !== orderId));
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

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
          name: user?.staffProfile?.name || 'Demo Manager',
          role: user?.role || 'manager',
        }}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Grid Area */}
        <section className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
          {/* Stats Summary */}
          <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-secondary mb-2">
                <Bell className="w-5 h-5" />
                <span className="font-label-caps text-label-caps">NEW ORDERS</span>
              </div>
              <p className="font-display text-headline-md text-primary">{newOrders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Utensils className="w-5 h-5" />
                <span className="font-label-caps text-label-caps">IN PROGRESS</span>
              </div>
              <p className="font-display text-headline-md text-primary">{acceptedOrders.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                <Armchair className="w-5 h-5" />
                <span className="font-label-caps text-label-caps">AVAILABLE</span>
              </div>
              <p className="font-display text-headline-md text-primary">
                {tables.filter(t => !activeTableIds.includes(t.id) && t.state !== 'OFFLINE').length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-card">
              <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-label-caps text-label-caps">CURRENT TIME</span>
              </div>
              <p className="font-display text-headline-md text-primary">{formatTime(currentTime)}</p>
            </div>
          </div>

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
                <Utensils className="w-4 h-4 text-outline" />
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
                  <Armchair className="w-4 h-4 text-outline-variant" />
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
                        <CheckCheck className="w-5 h-5 mr-2" />
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
                        <CreditCard className="w-5 h-5 mr-2" />
                        Mark Paid
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="py-4 bg-surface-container-high text-primary rounded-full hover:opacity-90"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
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
