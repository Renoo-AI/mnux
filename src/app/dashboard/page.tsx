'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  Volume2,
  VolumeX,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Coffee,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useAuthStore } from '@/stores/authStore';
import { useSoundNotification } from '@/hooks/use-sound-notification';
import { useToast } from '@/hooks/use-toast';
import { useStaffSession } from '@/contexts/StaffSessionContext';
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
import type { Order, Table, OrderStatus } from '@/types';
import { 
  subscribeToActiveOrders, 
  acceptOrder, 
  closeOrder, 
  cancelOrder,
  markOrderPaid 
} from '@/services/orderService';
import { subscribeToTables as subscribeToTablesService } from '@/services/tableService';

export default function CashierDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { session, isLoading: sessionLoading } = useStaffSession();
  
  // State for real data
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNewOrderAlert, setShowNewOrderAlert] = useState(false);
  const previousNewOrdersCount = useRef(0);
  const { playSound, isMuted, toggleMute } = useSoundNotification({ enabled: true, volume: 0.4 });
  const { toast } = useToast();
  
  // Cancel order dialog state
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Subscribe to real-time orders and tables from Firebase
  useEffect(() => {
    const restaurantId = session?.restaurantId;
    if (!restaurantId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    // Subscribe to active orders
    const unsubscribeOrders = subscribeToActiveOrders(restaurantId, (newOrders) => {
      setOrders(newOrders);
      setIsLoading(false);
    });

    // Subscribe to tables
    const unsubscribeTables = subscribeToTablesService(restaurantId, (newTables) => {
      setTables(newTables);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeTables();
    };
  }, [session?.restaurantId]);

  // Sound notification for new orders
  useEffect(() => {
    const currentNewOrdersCount = orders.filter(o => o.status === 'CREATED').length;
    
    // Check if new orders increased
    if (currentNewOrdersCount > previousNewOrdersCount.current && previousNewOrdersCount.current >= 0) {
      playSound('urgent');
      // Use requestAnimationFrame to defer state update and avoid cascading renders
      requestAnimationFrame(() => {
        setShowNewOrderAlert(true);
        // Auto-hide alert after 3 seconds
        setTimeout(() => setShowNewOrderAlert(false), 3000);
      });
    }
    
    previousNewOrdersCount.current = currentNewOrdersCount;
  }, [orders, playSound]);

  const handleAcceptOrder = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-accept');
    
    try {
      const result = await acceptOrder(orderId);
      
      if (result.success) {
        const order = orders.find(o => o.id === orderId);
        toast({
          title: 'Order Accepted',
          description: `Order from ${order?.tableName || 'Unknown'} has been accepted and is now being prepared.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to accept order. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to accept order. Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  }, [orders, toast]);

  const handleCompleteOrder = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-complete');
    
    try {
      // First mark as paid, then close
      const paidResult = await markOrderPaid(orderId);
      
      if (!paidResult.success) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: paidResult.error || 'Failed to mark order as paid.',
        });
        setActionLoading(null);
        return;
      }
      
      const closeResult = await closeOrder(orderId);
      
      if (closeResult.success) {
        const order = orders.find(o => o.id === orderId);
        setSelectedOrder(null);
        toast({
          title: 'Order Completed',
          description: `Order from ${order?.tableName || 'Unknown'} has been marked as paid and completed.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: closeResult.error || 'Failed to close order. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete order. Please try again.',
      });
    } finally {
      setActionLoading(null);
    }
  }, [orders, toast]);

  const handleMarkPaid = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-paid');
    
    try {
      const result = await markOrderPaid(orderId);
      
      if (result.success) {
        const order = orders.find(o => o.id === orderId);
        toast({
          title: 'Order Paid',
          description: `Order from ${order?.tableName || 'Unknown'} has been marked as paid.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to mark order as paid.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to mark order as paid.',
      });
    } finally {
      setActionLoading(null);
    }
  }, [orders, toast]);

  const handleCloseOrder = useCallback(async (orderId: string) => {
    setActionLoading(orderId + '-close');
    
    try {
      const result = await closeOrder(orderId);
      
      if (result.success) {
        const order = orders.find(o => o.id === orderId);
        setSelectedOrder(null);
        toast({
          title: 'Order Closed',
          description: `Order from ${order?.tableName || 'Unknown'} has been closed.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to close order.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to close order.',
      });
    } finally {
      setActionLoading(null);
    }
  }, [orders, toast]);

  const handleCancelOrderClick = useCallback((order: Order) => {
    setOrderToCancel(order);
    setCancelReason('');
    setShowCancelDialog(true);
  }, []);

  const handleConfirmCancelOrder = useCallback(async () => {
    if (!orderToCancel) return;
    
    setActionLoading(orderToCancel.id + '-cancel');
    setShowCancelDialog(false);
    
    try {
      const reason = cancelReason.trim() || 'Cancelled by staff';
      const result = await cancelOrder(orderToCancel.id, reason);
      
      if (result.success) {
        setSelectedOrder(null);
        toast({
          title: 'Order Cancelled',
          description: `Order from ${orderToCancel.tableName} has been cancelled.`,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error || 'Failed to cancel order. Please try again.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel order. Please try again.',
      });
    } finally {
      setActionLoading(null);
      setOrderToCancel(null);
    }
  }, [orderToCancel, cancelReason, toast]);

  const getStateColor = (status: OrderStatus) => {
    switch (status) {
      case 'CREATED':
        return 'bg-secondary-fixed text-on-secondary-fixed-variant';
      case 'ACCEPTED':
        return 'bg-surface-container-high text-on-surface-variant';
      case 'PAID':
        return 'bg-primary-fixed text-on-primary-fixed-variant';
      case 'CANCELLED':
        return 'bg-error-container text-on-error-container';
      default:
        return 'bg-surface-container-high text-on-surface-variant';
    }
  };

  const getStateLabel = (status: OrderStatus) => {
    switch (status) {
      case 'CREATED':
        return 'NEW ORDER';
      case 'ACCEPTED':
        return 'ACCEPTED';
      case 'PAID':
        return 'PAID';
      case 'CLOSED':
        return 'CLOSED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'REJECTED':
        return 'REJECTED';
      default:
        return status;
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

  // Group orders by status for display
  const newOrders = orders.filter(o => o.status === 'CREATED');
  const acceptedOrders = orders.filter(o => o.status === 'ACCEPTED');
  const paidOrders = orders.filter(o => o.status === 'PAID');
  const activeTableIds = orders.filter(o => ['CREATED', 'ACCEPTED', 'PAID'].includes(o.status)).map(o => o.tableId);
  
  // Calculate live stats
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Show loading state
  if (sessionLoading || isLoading) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Active Tables"
          subtitle="Loading..."
          showSearch={false}
          user={{
            name: user?.staffProfile?.name || session?.staffName || 'User',
            role: user?.role || session?.role || 'cashier',
          }}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-secondary mx-auto mb-4" />
            <p className="text-on-surface-variant">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Active Tables"
          subtitle="Error"
          showSearch={false}
          user={{
            name: user?.staffProfile?.name || session?.staffName || 'User',
            role: user?.role || session?.role || 'cashier',
          }}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-error mx-auto mb-4" />
            <p className="text-on-surface-variant mb-4">{loadError}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show no session state
  if (!session?.restaurantId) {
    return (
      <DashboardLayout>
        <TopAppBar
          title="Active Tables"
          subtitle="No Session"
          showSearch={false}
          user={{
            name: user?.staffProfile?.name || 'User',
            role: user?.role || 'cashier',
          }}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-on-surface-variant mx-auto mb-4" />
            <p className="text-on-surface-variant mb-4">No restaurant session found.</p>
            <Button onClick={() => router.push('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <TopAppBar
        title="Active Tables"
        subtitle={`${orders.length} busy`}
        showSearch={false}
        user={{
          name: user?.staffProfile?.name || session?.staffName || 'Demo Manager',
          role: user?.role || session?.role || 'manager',
        }}
      />
      
      {/* New Order Alert Banner */}
      {showNewOrderAlert && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-secondary text-on-secondary px-6 py-4 rounded-xl shadow-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 animate-pulse" />
            <span className="font-display text-title-sm">New Order Received!</span>
          </div>
        </div>
      )}
      
      {/* Sound Toggle Button */}
      <button
        onClick={toggleMute}
        className="fixed top-4 right-4 z-40 bg-white p-3 rounded-full shadow-card hover:shadow-lg transition-all duration-300 hover:scale-105"
        title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-on-surface-variant" />
        ) : (
          <Volume2 className="w-5 h-5 text-secondary" />
        )}
      </button>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Grid Area */}
        <section className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
          
          {/* Analytics Summary Cards */}
          <div className="col-span-full grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-secondary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 text-secondary mb-2">
                  <Bell className="w-5 h-5 animate-bounce-subtle" />
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">NEW ORDERS</span>
                </div>
                <p className="font-display text-4xl text-primary">{newOrders.length}</p>
                <p className="text-on-surface-variant text-xs mt-1">Requires attention</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Utensils className="w-5 h-5" />
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">IN PROGRESS</span>
                </div>
                <p className="font-display text-4xl text-primary">{acceptedOrders.length}</p>
                <p className="text-on-surface-variant text-xs mt-1">Being prepared</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                  <Armchair className="w-5 h-5" />
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">AVAILABLE</span>
                </div>
                <p className="font-display text-4xl text-primary">
                  {tables.filter(t => !activeTableIds.includes(t.id) && t.status !== 'OFFLINE').length}
                </p>
                <p className="text-on-surface-variant text-xs mt-1">Ready to seat</p>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-5 shadow-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500" />
              <div className="relative">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="font-label-caps text-label-caps uppercase tracking-wider">REVENUE</span>
                </div>
                <p className="font-display text-4xl text-primary">${totalRevenue.toFixed(0)}</p>
                <p className="text-on-surface-variant text-xs mt-1">Active orders</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-2xl p-5 border border-secondary/20 hover:border-secondary/40 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Active Revenue</p>
                  <p className="font-display text-2xl text-primary mt-1">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 border border-primary/10 hover:border-primary/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-caps text-xs text-on-surface-variant uppercase tracking-wider">Avg Order Value</p>
                  <p className="font-display text-2xl text-primary mt-1">${avgOrderValue.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="w-8 h-8 text-accent" />
                </div>
              </div>
              <p className="text-xs text-on-surface-variant mt-2">
                {orders.length} active orders • {tables.length} tables
              </p>
            </div>
          </div>

          {/* Empty State for Orders */}
          {orders.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl p-12 shadow-card text-center">
              <Utensils className="w-16 h-16 text-on-surface-variant mx-auto mb-4 opacity-50" />
              <h3 className="font-display text-title-md text-primary mb-2">No Active Orders</h3>
              <p className="text-on-surface-variant mb-4">
                Orders will appear here in real-time as customers place them.
              </p>
              <p className="text-sm text-on-surface-variant opacity-70">
                Restaurant: {session?.restaurantName || 'Unknown'}
              </p>
            </div>
          )}

          {/* New Orders (Pulsing) */}
          {newOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="pulse-border bg-white rounded-3xl p-6 shadow-card active:scale-95 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-secondary animate-pulse" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-title-sm text-primary group-hover:text-secondary transition-colors">{order.tableName}</h3>
                  <p className="text-on-surface-variant font-label-caps text-label-caps">
                    {order.items.length} ITEMS
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-label-caps text-label-caps animate-pulse-subtle ${getStateColor(order.status)}`}>
                  {getStateLabel(order.status)}
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
              className="bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-card active:scale-95 transition-all duration-300 cursor-pointer ring-2 ring-primary hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-primary" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-title-sm text-primary group-hover:text-secondary transition-colors">{order.tableName}</h3>
                  <p className="text-on-surface-variant font-label-caps text-label-caps">
                    {order.items.length} ITEMS
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-label-caps text-label-caps ${getStateColor(order.status)}`}>
                  {getStateLabel(order.status)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="w-4 h-4 text-outline group-hover:text-secondary transition-colors" />
                <span className="text-on-surface-variant font-medium text-sm">
                  {formatTimeAgo(order.createdAt)}
                </span>
              </div>
              <div className="border-t border-surface-container pt-4">
                <p className="text-primary font-bold text-lg">${order.totalAmount.toFixed(2)}</p>
              </div>
            </div>
          ))}

          {/* Paid Orders (Awaiting Close) */}
          {paidOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white border border-green-200 rounded-3xl p-6 shadow-card active:scale-95 transition-all duration-300 cursor-pointer ring-2 ring-green-500 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-green-500" />
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-display text-title-sm text-primary group-hover:text-green-600 transition-colors">{order.tableName}</h3>
                  <p className="text-on-surface-variant font-label-caps text-label-caps">
                    {order.items.length} ITEMS
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full font-label-caps text-label-caps ${getStateColor(order.status)}`}>
                  {getStateLabel(order.status)}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-4 h-4 text-green-500" />
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
            .filter(t => !activeTableIds.includes(t.id) && t.status !== 'OFFLINE')
            .map((table) => (
              <div
                key={table.id}
                className="bg-surface-container-low border border-dashed border-outline-variant rounded-3xl p-6 opacity-70 hover:opacity-90 transition-all duration-300 hover:border-secondary hover:shadow-md group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-display text-title-sm text-on-surface-variant group-hover:text-primary transition-colors">{table.name}</h3>
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
            <div className="p-6 border-b border-surface-container relative">
              <div className={`absolute top-0 left-0 w-full h-1 ${
                selectedOrder.status === 'CREATED' ? 'bg-secondary' : 
                selectedOrder.status === 'PAID' ? 'bg-green-500' : 'bg-primary'
              }`} />
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
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar">
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start p-3 rounded-xl bg-surface-container-low/50 hover:bg-surface-container-low transition-colors">
                  <div className="flex gap-4">
                    <span className="font-bold text-primary bg-secondary-fixed/30 w-8 h-8 rounded-full flex items-center justify-center text-sm">{item.quantity}x</span>
                    <div>
                      <p className="text-primary font-semibold">{item.name}</p>
                      {item.notes && (
                        <p className="text-on-surface-variant text-sm mt-1 italic">&quot;{item.notes}&quot;</p>
                      )}
                    </div>
                  </div>
                  <p className="text-primary font-semibold">${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </div>
              ))}
              
              <div className="mt-6 pt-6 border-t border-surface-container">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-on-surface-variant">Subtotal</p>
                  <p className="text-on-surface-variant">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center mt-4 p-4 bg-secondary-fixed/20 rounded-xl">
                  <p className="font-display text-title-sm text-primary">Total</p>
                  <p className="font-display text-2xl text-primary">${selectedOrder.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="p-6 bg-surface-container-lowest grid grid-cols-2 gap-4 border-t border-outline-variant">
              {selectedOrder.status === 'CREATED' && (
                <>
                  <Button
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-accept'}
                    className="col-span-2 bg-secondary-container text-on-secondary-container rounded-full py-4 hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {actionLoading === selectedOrder.id + '-accept' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCheck className="w-5 h-5 mr-2" />
                        Accept Order
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleCancelOrderClick(selectedOrder)}
                    disabled={actionLoading === selectedOrder.id + '-cancel'}
                    variant="outline"
                    className="col-span-2 border border-error text-error rounded-full py-4 hover:bg-error-container/20"
                  >
                    {actionLoading === selectedOrder.id + '-cancel' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 mr-2" />
                        Cancel Order
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {selectedOrder.status === 'ACCEPTED' && (
                <>
                  <Button
                    onClick={() => handleCompleteOrder(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-complete'}
                    className="col-span-2 bg-primary text-on-primary rounded-full py-4 hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {actionLoading === selectedOrder.id + '-complete' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Mark as Paid & Complete
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleCancelOrderClick(selectedOrder)}
                    disabled={actionLoading === selectedOrder.id + '-cancel'}
                    variant="outline"
                    className="col-span-2 py-4 border border-error text-error rounded-full hover:bg-error-container/20"
                  >
                    {actionLoading === selectedOrder.id + '-cancel' ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 mr-2" />
                        Cancel
                      </>
                    )}
                  </Button>
                </>
              )}

              {selectedOrder.status === 'PAID' && (
                <>
                  <Button
                    onClick={() => handleCloseOrder(selectedOrder.id)}
                    disabled={actionLoading === selectedOrder.id + '-close'}
                    className="col-span-2 bg-green-600 text-white rounded-full py-4 hover:opacity-90 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    {actionLoading === selectedOrder.id + '-close' ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Closing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Close Order
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-surface rounded-2xl max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-error-container rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <AlertDialogTitle className="font-display text-title-md text-primary">
                Cancel Order?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-on-surface-variant">
              Are you sure you want to cancel the order from <strong className="text-primary">{orderToCancel?.tableName}</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-full border border-outline-variant px-6">
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmCancelOrder}
              className="bg-error text-on-error rounded-full px-6 hover:bg-error/90"
            >
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
