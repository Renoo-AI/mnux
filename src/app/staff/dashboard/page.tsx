'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { TableGrid } from '@/components/cashier/TableGrid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  LogOut,
  User,
  RefreshCw,
  AlertTriangle,
  Coffee,
  Wifi,
  WifiOff
} from 'lucide-react';
import type { Order, Table } from '@/types';
import { cashierService } from '@/services/cashierService';
import { orderService } from '@/services/orderService';
import { tableService } from '@/services/tableService';
import { restaurantService } from '@/services/restaurantService';

export default function StaffDashboardPage() {
  const router = useRouter();
  const { session, isStaffAuthenticated, isLoading: sessionLoading, logoutStaff } = useStaffSession();
  
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showReasonDialog, setShowReasonDialog] = useState(false);
  const [reasonAction, setReasonAction] = useState<{ action: string; table: Table } | null>(null);
  const [reason, setReason] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'demo' | 'offline'>('connected');

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !isStaffAuthenticated) {
      router.push('/staff/login');
    }
  }, [sessionLoading, isStaffAuthenticated, router]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!session) return;
    
    setIsLoading(true);
    
    // Subscribe to tables
    const unsubscribeTables = tableService.subscribeToTables(
      session.restaurantId,
      (tablesData) => {
        setTables(tablesData);
        // Check if using demo data
        setIsDemoMode(restaurantService.isDemoRestaurant(session.restaurantId));
        setConnectionStatus(tablesData.length > 0 && !restaurantService.isDemoRestaurant(session.restaurantId) ? 'connected' : 'demo');
      }
    );
    
    // Subscribe to active orders
    const unsubscribeOrders = orderService.subscribeToActiveOrders(
      session.restaurantId,
      (ordersData) => {
        setOrders(ordersData);
      }
    );
    
    setIsLoading(false);
    
    return () => {
      unsubscribeTables();
      unsubscribeOrders();
    };
  }, [session]);

  // Handle table action
  const handleAction = useCallback(async (action: 'accept' | 'reject' | 'paid' | 'close' | 'cancel', table: Table) => {
    if (!session || !table.activeOrderId) return;
    
    const order = orders.find(o => o.id === table.activeOrderId);
    if (!order) return;
    
    // Actions requiring reason
    if (action === 'reject' || action === 'cancel') {
      setReasonAction({ action, table });
      setShowReasonDialog(true);
      return;
    }
    
    setActionLoading(table.id);
    
    try {
      const params = {
        restaurantId: session.restaurantId,
        orderId: table.activeOrderId,
        tableId: table.id,
        actorId: session.staffId,
        actorName: session.staffName,
        actorRole: session.role,
      };
      
      let result;
      
      switch (action) {
        case 'accept':
          result = await cashierService.acceptOrder(params);
          break;
        case 'paid':
          result = await cashierService.markOrderPaid(params);
          break;
        case 'close':
          result = await cashierService.closeOrder(params);
          break;
      }
      
      if (result?.success) {
        // Real-time subscription will update the UI automatically
        // No need to manually update local state
      }
    } catch (error) {
      console.error(`Failed to ${action} order:`, error);
    } finally {
      setActionLoading(null);
    }
  }, [session, orders]);

  // Handle reason dialog submit
  const handleReasonSubmit = useCallback(async () => {
    if (!reasonAction || !reason.trim() || !session) return;
    
    const { action, table } = reasonAction;
    if (!table.activeOrderId) return;
    
    setActionLoading(table.id);
    setShowReasonDialog(false);
    
    try {
      const params = {
        restaurantId: session.restaurantId,
        orderId: table.activeOrderId,
        tableId: table.id,
        reason: reason.trim(),
        actorId: session.staffId,
        actorName: session.staffName,
        actorRole: session.role,
      };
      
      let result;
      
      if (action === 'reject') {
        result = await cashierService.rejectOrder(params);
      } else if (action === 'cancel') {
        result = await cashierService.cancelOrder(params);
      }
      
      if (result?.success) {
        // Real-time subscription will update the UI automatically
      }
    } catch (error) {
      console.error(`Failed to ${action} order:`, error);
    } finally {
      setActionLoading(null);
      setReasonAction(null);
      setReason('');
    }
  }, [reasonAction, reason, session]);

  // Handle logout
  const handleLogout = () => {
    logoutStaff();
    router.push('/staff/login');
  };

  if (sessionLoading || !isStaffAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3A322D]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFBF9]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#EFE4D8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Restaurant */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#3A322D] to-[#5A4A3D] flex items-center justify-center">
                <Coffee className="h-5 w-5 text-[#C9A07E]" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-[#3A322D]">{session?.restaurantName || 'MenuxPro'}</h1>
                <p className="text-xs text-[#5A4A3D]">Cashier Dashboard</p>
              </div>
            </div>
            
            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {connectionStatus === 'connected' ? (
                  <Badge className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    Live
                  </Badge>
                ) : connectionStatus === 'demo' ? (
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    Demo
                  </Badge>
                ) : (
                  <Badge className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </Badge>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
                className="text-[#5A4A3D] hover:text-[#3A322D]"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-[#3A322D] flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <span className="hidden sm:inline text-[#3A322D]">{session?.staffName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div>
                      <p className="font-medium">{session?.staffName}</p>
                      <p className="text-xs text-gray-500 capitalize">{session?.role}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#3A322D]" />
          </div>
        ) : (
          <TableGrid
            tables={tables}
            orders={orders}
            onAction={handleAction}
            isLoading={actionLoading !== null}
            loadingTableId={actionLoading}
          />
        )}
      </main>

      {/* Reason Dialog */}
      <Dialog open={showReasonDialog} onOpenChange={setShowReasonDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {reasonAction?.action === 'reject' ? 'Reject Order' : 'Cancel Order'}
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for this action. This is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReasonDialog(false);
              setReasonAction(null);
              setReason('');
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReasonSubmit}
              disabled={!reason.trim()}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
