'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  CheckCheck,
  Utensils,
  Loader2,
  Bell,
  Volume2,
  VolumeX,
  AlertCircle,
  AlertTriangle,
  Armchair,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/browser';
import { useSoundNotification } from '@/hooks/use-sound-notification';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Order, OrderStatus } from '@/types';
import {
  subscribeToActiveOrders,
  acceptOrder,
  closeOrder,
  cancelOrder,
  markOrderPaid,
} from '@/services/orderService';
import { subscribeToTables as subscribeToTablesService } from '@/services/tableService';

const STATUS_STYLES: Record<OrderStatus, string> = {
  CREATED: 'bg-amber-50 text-amber-700 border border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PAID: 'bg-blue-50 text-blue-700 border border-blue-200',
  CLOSED: 'bg-gray-100 text-gray-500',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  REJECTED: 'bg-red-50 text-red-700',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: 'NEW',
  ACCEPTED: 'ACCEPTED',
  PAID: 'PAID',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
};

const STATUS_DOT: Record<OrderStatus, string> = {
  CREATED: 'bg-amber-500',
  ACCEPTED: 'bg-emerald-500',
  PAID: 'bg-blue-500',
  CLOSED: 'bg-gray-400',
  CANCELLED: 'bg-red-500',
  REJECTED: 'bg-red-500',
};

export default function CashierPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email?: string; id?: string } | null>(null);
  const [session, setSession] = useState<{ restaurantId?: string; restaurantName?: string } | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        setUser({ email: s.user.email, id: s.user.id });
        const { data: staff } = await supabase.from('staff').select('*, restaurants(name)').eq('user_id', s.user.id).eq('is_active', true).maybeSingle();
        if (staff) {
          setSession({ restaurantId: staff.restaurant_id, restaurantName: (staff.restaurants as Record<string,string>)?.name });
        }
      }
      setSessionLoading(false);
    });
  }, []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const previousNewOrdersCount = useRef(0);
  const { playSound, isMuted, toggleMute } = useSoundNotification({ enabled: true, volume: 0.4 });
  const { toast } = useToast();

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const restaurantId = session?.restaurantId;
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    const unsubOrders = subscribeToActiveOrders(restaurantId, (newOrders) => {
      setOrders(newOrders);
      setIsLoading(false);
    });

    const unsubTables = subscribeToTablesService(restaurantId, (newTables) => {
      setTables(newTables);
    });

    return () => {
      unsubOrders();
      unsubTables();
    };
  }, [session?.restaurantId]);

  useEffect(() => {
    const currentNewOrders = orders.filter((o) => o.status === 'CREATED').length;
    if (currentNewOrders > previousNewOrdersCount.current && previousNewOrdersCount.current >= 0) {
      playSound('urgent');
      requestAnimationFrame(() => {
        setShowNewOrderAlert(true);
        setTimeout(() => setShowNewOrderAlert(false), 3000);
      });
    }
    previousNewOrdersCount.current = currentNewOrders;
  }, [orders, playSound]);

  const handleAccept = useCallback(
    async (orderId: string) => {
      setActionLoading(orderId + '-accept');
      try {
        const result = await acceptOrder(orderId);
        if (result.success) {
          toast({ title: 'Order Accepted', description: 'Order is now being prepared.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to accept.' });
        }
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to accept order.' });
      } finally {
        setActionLoading(null);
      }
    },
    [toast],
  );

  const handleComplete = useCallback(
    async (orderId: string) => {
      setActionLoading(orderId + '-complete');
      try {
        const paidResult = await markOrderPaid(orderId);
        if (!paidResult.success) {
          toast({ variant: 'destructive', title: 'Error', description: paidResult.error || 'Failed.' });
          setActionLoading(null);
          return;
        }
        const closeResult = await closeOrder(orderId);
        if (closeResult.success) {
          setSelectedOrder(null);
          toast({ title: 'Order Completed', description: 'Order has been completed.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: closeResult.error || 'Failed to close.' });
        }
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete order.' });
      } finally {
        setActionLoading(null);
      }
    },
    [toast],
  );

  const handleMarkPaid = useCallback(
    async (orderId: string) => {
      setActionLoading(orderId + '-paid');
      try {
        const result = await markOrderPaid(orderId);
        if (result.success) {
          toast({ title: 'Order Paid', description: 'Order has been marked as paid.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed.' });
        }
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to mark as paid.' });
      } finally {
        setActionLoading(null);
      }
    },
    [toast],
  );

  const handleClose = useCallback(
    async (orderId: string) => {
      setActionLoading(orderId + '-close');
      try {
        const result = await closeOrder(orderId);
        if (result.success) {
          setSelectedOrder(null);
          toast({ title: 'Order Closed', description: 'Order has been closed.' });
        } else {
          toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed.' });
        }
      } catch {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to close order.' });
      } finally {
        setActionLoading(null);
      }
    },
    [toast],
  );

  const handleCancelClick = useCallback((order: Order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setShowCancelDialog(true);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!orderToCancel) return;
    setActionLoading(orderToCancel.id + '-cancel');
    setShowCancelDialog(false);
    try {
      const reason = cancelReason.trim() || 'Cancelled by staff';
      const result = await cancelOrder(orderToCancel.id, reason);
      if (result.success) {
        setSelectedOrder(null);
        toast({ title: 'Order Cancelled', description: `Order from ${orderToCancel.tableLabel} cancelled.` });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to cancel order.' });
    } finally {
      setActionLoading(null);
      setOrderToCancel(null);
    }
  }, [orderToCancel, cancelReason, toast]);

  const formatTimeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  const newOrders = orders.filter((o) => o.status === 'CREATED');
  const acceptedOrders = orders.filter((o) => o.status === 'ACCEPTED');
  const paidOrders = orders.filter((o) => o.status === 'PAID');
  const activeTableIds = orders
    .filter((o) => ['CREATED', 'ACCEPTED', 'PAID'].includes(o.status))
    .map((o) => o.tableId);

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4A373] mx-auto mb-4" />
          <p className="text-[#4d4540]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-[#4d4540] mb-4">{loadError}</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!session?.restaurantId) {
    return (
      <div className="min-h-screen bg-[#FDF8F3] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#4d4540] mx-auto mb-4" />
          <p className="text-[#4d4540] mb-4">No restaurant session found.</p>
          <Button onClick={() => router.push('/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col">
      {/* Header */}
      <header className="bg-[#FDF8F3] border-b border-[#E8E2DA] px-6 py-4 sticky top-0 z-50 shadow-[0px_10px_30px_rgba(58,50,45,0.05)]">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-bold text-[32px] text-[#3D2C1E] tracking-tight font-[Playfair_Display]">
              Active Tables
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-3 py-1 bg-[#FFF1E0] text-[#D4A373] rounded-full text-xs font-bold uppercase tracking-wider">
                {orders.length} BUSY
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="p-2.5 hover:bg-white rounded-full transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-[#7f756f]" />
              ) : (
                <Volume2 className="w-5 h-5 text-[#D4A373]" />
              )}
            </button>
            <button className="p-2.5 hover:bg-white rounded-full transition-colors">
              <Bell className="w-5 h-5 text-[#3D2C1E]" />
            </button>
            <div className="w-9 h-9 bg-[#3D2C1E] text-white rounded-full flex items-center justify-center text-sm font-bold">
              {user?.staffProfile?.name?.[0] || session?.staffName?.[0] || 'S'}
            </div>
          </div>
        </div>
      </header>

      {/* New Order Alert */}
      {showNewOrderAlert && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div className="bg-[#D4A373] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <Bell className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm">New Order Received!</span>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        <section className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Empty State */}
            {orders.length === 0 && (
              <div className="col-span-full bg-white rounded-[20px] p-12 shadow-[0px_10px_30px_rgba(58,50,45,0.05)] text-center">
                <Utensils className="w-16 h-16 text-[#d1c4bd] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#3D2C1E] mb-2">No Active Orders</h3>
                <p className="text-[#7f756f]">
                  Orders will appear here in real-time as customers place them.
                </p>
              </div>
            )}

            {/* NEW Orders */}
            {newOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-[20px] p-6 shadow-[0px_10px_30px_rgba(58,50,45,0.05)] cursor-pointer active:scale-[0.98] transition-transform hover:shadow-lg border-2 border-amber-300 animate-[pulse-border_2s_infinite] group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[32px] font-bold text-[#3D2C1E] leading-tight font-[Playfair_Display]">
                      {order.tableLabel}
                    </h3>
                    <p className="text-[#7f756f] text-xs font-bold uppercase tracking-wider">
                      {order.items.length} ITEMS
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    NEW
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-[#D4A373]" />
                  <span className="text-[#7f756f] text-sm font-medium">
                    {formatTimeAgo(order.createdAt)}
                  </span>
                </div>
                <div className="border-t border-[#f2edeb] pt-4">
                  <p className="text-[#3D2C1E] font-bold text-lg">
                    {order.total.toFixed(3)} {order.currency || 'TND'}
                  </p>
                </div>
              </div>
            ))}

            {/* ACCEPTED Orders */}
            {acceptedOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-[20px] p-6 shadow-[0px_10px_30px_rgba(58,50,45,0.05)] cursor-pointer active:scale-[0.98] transition-transform hover:shadow-lg ring-2 ring-[#3D2C1E] group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[32px] font-bold text-[#3D2C1E] leading-tight font-[Playfair_Display]">
                      {order.tableLabel}
                    </h3>
                    <p className="text-[#7f756f] text-xs font-bold uppercase tracking-wider">
                      {order.items.length} ITEMS
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ACCEPTED
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Utensils className="w-4 h-4 text-[#7f756f]" />
                  <span className="text-[#7f756f] text-sm font-medium">
                    {formatTimeAgo(order.createdAt)}
                  </span>
                </div>
                <div className="border-t border-[#f2edeb] pt-4">
                  <p className="text-[#3D2C1E] font-bold text-lg">
                    {order.total.toFixed(3)} {order.currency || 'TND'}
                  </p>
                </div>
              </div>
            ))}

            {/* PAID Orders */}
            {paidOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="bg-white rounded-[20px] p-6 shadow-[0px_10px_30px_rgba(58,50,45,0.05)] cursor-pointer active:scale-[0.98] transition-transform hover:shadow-lg ring-2 ring-blue-400 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-[32px] font-bold text-[#3D2C1E] leading-tight font-[Playfair_Display]">
                      {order.tableLabel}
                    </h3>
                    <p className="text-[#7f756f] text-xs font-bold uppercase tracking-wider">
                      {order.items.length} ITEMS
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    PAID
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-[#7f756f] text-sm font-medium">Ready to Clear</span>
                </div>
                <div className="border-t border-[#f2edeb] pt-4">
                  <p className="text-[#3D2C1E] font-bold text-lg">
                    {order.total.toFixed(3)} {order.currency || 'TND'}
                  </p>
                </div>
              </div>
            ))}

            {/* Available Tables */}
            {tables
              .filter(
                (t: Record<string, unknown>) =>
                  !activeTableIds.includes(t.id as string) && t.status !== 'OFFLINE',
              )
              .slice(0, 8)
              .map((table: Record<string, unknown>) => (
                <div
                  key={table.id as string}
                  className="bg-[#f8f2f1] border border-dashed border-[#d1c4bd] rounded-[20px] p-6 opacity-70 hover:opacity-90 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[32px] font-bold text-[#7f756f] leading-tight font-[Playfair_Display]">
                        {table.label as string}
                      </h3>
                      <p className="text-[#a49b90] text-xs font-bold uppercase tracking-wider">
                        {table.seats as number} SEATS
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#e6e1e0] text-[#7f756f]">
                      EMPTY
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Armchair className="w-4 h-4 text-[#d1c4bd]" />
                    <span className="text-[#7f756f] text-sm font-medium">Available</span>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Detail Panel */}
        {selectedOrder && (
          <aside className="w-[400px] bg-white border-l border-[#E8E2DA] flex flex-col h-full shadow-2xl z-40">
            <div className="p-6 border-b border-[#f2edeb]">
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-xl font-bold text-[#3D2C1E] font-[Playfair_Display]">
                  {selectedOrder.tableLabel} Details
                </h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-[#7f756f] hover:bg-[#f8f2f1] rounded-full p-1 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <p className="text-[#7f756f] text-xs font-bold uppercase tracking-wider">
                {selectedOrder.items.length} items &middot; {formatTimeAgo(selectedOrder.createdAt)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3">
              {selectedOrder.items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-start p-3 rounded-xl bg-[#f8f2f1]/50 hover:bg-[#f8f2f1] transition-colors"
                >
                  <div className="flex gap-4">
                    <span className="font-bold text-[#3D2C1E] bg-[#FFF1E0] w-8 h-8 rounded-full flex items-center justify-center text-sm">
                      {item.quantity}x
                    </span>
                    <div>
                      <p className="text-[#3D2C1E] font-semibold">{item.nameFr || item.name}</p>
                      {item.note && (
                        <p className="text-[#7f756f] text-sm mt-1 italic">&quot;{item.note}&quot;</p>
                      )}
                    </div>
                  </div>
                  <p className="text-[#3D2C1E] font-semibold">
                    {(item.price * item.quantity).toFixed(3)} {selectedOrder.currency || 'TND'}
                  </p>
                </div>
              ))}

              <div className="mt-4 pt-4 border-t border-[#f2edeb]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-[#7f756f]">Subtotal</p>
                  <p className="text-[#7f756f]">{selectedOrder.total.toFixed(3)} {selectedOrder.currency || 'TND'}</p>
                </div>
                <div className="flex justify-between items-center mt-3 p-4 bg-[#FFF1E0] rounded-xl">
                  <p className="text-lg font-bold text-[#3D2C1E] font-[Playfair_Display]">Total</p>
                  <p className="text-2xl font-bold text-[#3D2C1E] font-[Playfair_Display]">
                    {selectedOrder.total.toFixed(3)} {selectedOrder.currency || 'TND'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-6 bg-[#f8f2f1] grid grid-cols-2 gap-3 border-t border-[#E8E2DA]">
              {selectedOrder.status === 'CREATED' && (
                <>
                  <button
                    onClick={() => handleAccept(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-accept'}
                    className="col-span-2 py-3.5 bg-[#D4A373] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {actionLoading === selectedOrder.id + '-accept' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCheck className="w-5 h-5" /> Accept Order
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleCancelClick(selectedOrder)}
                    disabled={actionLoading === selectedOrder.id + '-cancel'}
                    className="col-span-2 py-3.5 border-2 border-red-400 text-red-500 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 active:scale-[0.98] transition-all"
                  >
                    <XCircle className="w-5 h-5" /> Cancel Order
                  </button>
                </>
              )}

              {selectedOrder.status === 'ACCEPTED' && (
                <>
                  <button
                    onClick={() => handleMarkPaid(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-paid'}
                    className="py-3.5 bg-[#3D2C1E] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <CreditCard className="w-5 h-5" /> Mark Paid
                  </button>
                  <button
                    onClick={() => handleClose(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-close'}
                    className="py-3.5 bg-[#f2edeb] text-[#3D2C1E] rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-[#e6e1e0] active:scale-[0.98] transition-all"
                  >
                    <CheckCircle className="w-5 h-5" /> Close
                  </button>
                  <button
                    onClick={() => handleCancelClick(selectedOrder)}
                    disabled={actionLoading === selectedOrder.id + '-cancel'}
                    className="col-span-2 py-3.5 border-2 border-red-400 text-red-500 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-50 active:scale-[0.98] transition-all"
                  >
                    <XCircle className="w-5 h-5" /> Cancel
                  </button>
                </>
              )}

              {selectedOrder.status === 'PAID' && (
                <button
                  onClick={() => handleClose(selectedOrder.id)}
                  disabled={actionLoading === selectedOrder.id + '-close'}
                  className="col-span-2 py-3.5 bg-emerald-600 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <CheckCircle className="w-5 h-5" /> Close Order
                </button>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-[#3D2C1E] font-[Playfair_Display]">
                Cancel Order?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[#7f756f]">
              Cancel the order from <strong className="text-[#3D2C1E]">{orderToCancel?.tableLabel}</strong>?
              <br />
              <input
                className="mt-3 w-full p-3 border border-[#d1c4bd] rounded-full text-sm bg-[#fdf8f3] focus:border-[#D4A373] outline-none"
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-full border border-[#d1c4bd] px-6">
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-red-500 text-white rounded-full px-6 hover:bg-red-600"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
