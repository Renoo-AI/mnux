import { supabase } from '@/lib/supabaseClient';
import { auth } from '@/lib/firebase';
import type { 
  Order, 
  CartItem,
  OrderStatus
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
    throw new Error('Failed to fetch orders. Please check your connection.');
  }
}

// Get active orders (CREATED, ACCEPTED, or PAID)
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
    throw new Error('Failed to fetch active orders.');
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
    console.error('Error fetching order:', error);
    throw new Error('Failed to fetch order.');
  }
}

// Subscribe to all orders changes (for dashboard)
export function subscribeToOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  // 1. Fetch initial orders
  getOrders(restaurantId)
    .then(callback)
    .catch((err) => {
      if (onError) onError(err);
    });

  // 2. Setup Realtime subscription
  const channel = supabase
    .channel(`orders_restaurant_${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Order',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      async () => {
        try {
          const freshOrders = await getOrders(restaurantId);
          callback(freshOrders);
        } catch (err) {
          if (onError && err instanceof Error) {
            onError(err);
          }
        }
      }
    )
    .subscribe();

  // Return unsubscribe cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to active orders (for real-time dashboard)
export function subscribeToActiveOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  // 1. Fetch initial active orders
  getActiveOrders(restaurantId)
    .then(callback)
    .catch((err) => {
      if (onError) onError(err);
    });

  // 2. Setup Realtime subscription
  const channel = supabase
    .channel(`active_orders_restaurant_${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Order',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      async () => {
        try {
          const freshOrders = await getActiveOrders(restaurantId);
          callback(freshOrders);
        } catch (err) {
          if (onError && err instanceof Error) {
            onError(err);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to a single order (for customer status page)
export function subscribeToOrder(
  orderId: string,
  callback: (order: Order | null) => void,
  onError?: (error: Error) => void
): () => void {
  // 1. Fetch initial order
  getOrderById(orderId)
    .then(callback)
    .catch((err) => {
      if (onError) onError(err);
    });

  // 2. Setup Realtime subscription
  const channel = supabase
    .channel(`order_id_${orderId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Order',
        filter: `id=eq.${orderId}`,
      },
      async () => {
        try {
          const freshOrder = await getOrderById(orderId);
          callback(freshOrder);
        } catch (err) {
          if (onError && err instanceof Error) {
            onError(err);
          }
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Create order
export async function createOrder(
  restaurantId: string,
  tableId: string,
  tableName: string,
  items: CartItem[]
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        restaurantId,
        tableId,
        tableName,
        items,
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to create order' };
    }
    
    return { success: true, orderId: data.orderId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return { success: false, error: errorMessage };
  }
}

// Accept order
export async function acceptOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'ACCEPTED',
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to accept order' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to accept order' };
  }
}

// Mark order as paid
export async function markOrderPaid(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'PAID',
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to mark order as paid' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to mark order as paid' };
  }
}

// Close order
export async function closeOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'CLOSED',
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to close order' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to close order' };
  }
}

// Cancel order
export async function cancelOrder(
  orderId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
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
      }),
    });
    
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Failed to cancel order' };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to cancel order' };
  }
}

export const orderService = {
  getOrders,
  getActiveOrders,
  getOrderById,
  subscribeToOrders,
  subscribeToActiveOrders,
  subscribeToOrder,
  createOrder,
  acceptOrder,
  markOrderPaid,
  closeOrder,
  cancelOrder,
};
