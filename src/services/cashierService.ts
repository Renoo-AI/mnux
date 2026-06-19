import { supabase } from '@/lib/supabaseClient';
import { auth } from '@/lib/firebase';
import type { 
  Order, 
  Table,
  AcceptOrderParams,
  RejectOrderParams,
  MarkPaidParams,
  CloseOrderParams,
  CancelOrderParams
} from '@/types';

// Helper to get authorization headers
async function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ============ Order Actions ============

// Accept an order
export async function acceptOrder(params: AcceptOrderParams): Promise<{ success: boolean; error?: string }> {
  const { orderId, actorId, actorName, actorRole } = params;
  
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'ACCEPTED',
        actorId,
        actorName,
        actorRole,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to accept order' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting order:', error);
    return { success: false, error: 'Failed to accept order' };
  }
}

// Reject an order
export async function rejectOrder(params: RejectOrderParams): Promise<{ success: boolean; error?: string }> {
  const { orderId, reason, actorId, actorName, actorRole } = params;
  
  if (!reason || reason.trim() === '') {
    return { success: false, error: 'Reason is required for rejection' };
  }
  
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'REJECTED',
        reason,
        actorId,
        actorName,
        actorRole,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to reject order' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting order:', error);
    return { success: false, error: 'Failed to reject order' };
  }
}

// Mark order as paid
export async function markOrderPaid(params: MarkPaidParams): Promise<{ success: boolean; error?: string }> {
  const { orderId, actorId, actorName, actorRole } = params;
  
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'PAID',
        actorId,
        actorName,
        actorRole,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to mark order as paid' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error marking order as paid:', error);
    return { success: false, error: 'Failed to mark order as paid' };
  }
}

// Close an order
export async function closeOrder(params: CloseOrderParams): Promise<{ success: boolean; error?: string }> {
  const { orderId, actorId, actorName, actorRole } = params;
  
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'CLOSED',
        actorId,
        actorName,
        actorRole,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to close order' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error closing order:', error);
    return { success: false, error: 'Failed to close order' };
  }
}

// Cancel an order
export async function cancelOrder(params: CancelOrderParams): Promise<{ success: boolean; error?: string }> {
  const { orderId, reason, actorId, actorName, actorRole } = params;
  
  if (!reason || reason.trim() === '') {
    return { success: false, error: 'Reason is required for cancellation' };
  }
  
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'CANCELLED',
        reason,
        actorId,
        actorName,
        actorRole,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to cancel order' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: 'Failed to cancel order' };
  }
}

// ============ Data Retrieval ============

// Get all orders for a restaurant
export async function getOrders(restaurantId: string): Promise<Order[]> {
  try {
    const res = await fetch(`/api/orders?restaurantId=${restaurantId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch orders');
    }
    const data = await res.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Get active orders (CREATED or ACCEPTED or PAID)
export async function getActiveOrders(restaurantId: string): Promise<Order[]> {
  try {
    const res = await fetch(`/api/orders?restaurantId=${restaurantId}&active=true`);
    if (!res.ok) {
      throw new Error('Failed to fetch active orders');
    }
    const data = await res.json();
    return data.orders || [];
  } catch (error) {
    console.error('Error fetching active orders:', error);
    return [];
  }
}

// Get a single order
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const res = await fetch(`/api/orders?id=${orderId}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error('Failed to fetch order');
    }
    return await res.json();
  } catch (error) {
    console.error('Error fetching order by ID:', error);
    return null;
  }
}

// Get all tables for a restaurant
export async function getTables(restaurantId: string): Promise<Table[]> {
  try {
    const res = await fetch(`/api/tables?restaurantId=${restaurantId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch tables');
    }
    const data = await res.json();
    return data.tables || [];
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
}

// Subscribe to orders changes
export function subscribeToOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
  // Initial fetch
  getOrders(restaurantId).then(callback);
  
  // Realtime subscription
  const channel = supabase
    .channel(`cashier_orders_${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Order',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      async () => {
        const freshOrders = await getOrders(restaurantId);
        callback(freshOrders);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to active orders
export function subscribeToActiveOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
  // Initial fetch
  getActiveOrders(restaurantId).then(callback);
  
  // Realtime subscription
  const channel = supabase
    .channel(`cashier_active_orders_${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Order',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      async () => {
        const freshOrders = await getActiveOrders(restaurantId);
        callback(freshOrders);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to tables changes
export function subscribeToTables(
  restaurantId: string,
  callback: (tables: Table[]) => void
): () => void {
  // Initial fetch
  getTables(restaurantId).then(callback);
  
  // Realtime subscription
  const channel = supabase
    .channel(`cashier_tables_${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Table',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      async () => {
        const freshTables = await getTables(restaurantId);
        callback(freshTables);
      }
    )
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
}

export const cashierService = {
  acceptOrder,
  rejectOrder,
  markOrderPaid,
  closeOrder,
  cancelOrder,
  getOrders,
  getActiveOrders,
  getOrderById,
  getTables,
  subscribeToOrders,
  subscribeToActiveOrders,
  subscribeToTables,
};
