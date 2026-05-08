import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  DocumentSnapshot,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { 
  httpsCallable,
  getFunctions
} from 'firebase/functions';
import type { 
  Order, 
  OrderDocument, 
  OrderState, 
  CreateOrderRequest,
  CartItem 
} from '@/types';

const COLLECTION = 'orders';
const functions = getFunctions();

// Convert Firestore document to Order type
function documentToOrder(doc: DocumentSnapshot): Order | null {
  if (!doc.exists()) return null;
  
  const data = doc.data() as OrderDocument;
  return {
    id: doc.id,
    ...data,
    createdAt: new Date(data.createdAt.seconds * 1000),
    updatedAt: new Date(data.updatedAt.seconds * 1000),
    acceptedAt: data.acceptedAt ? new Date(data.acceptedAt.seconds * 1000) : undefined,
    completedAt: data.completedAt ? new Date(data.completedAt.seconds * 1000) : undefined,
    cancelledAt: data.cancelledAt ? new Date(data.cancelledAt.seconds * 1000) : undefined,
  };
}

// Get all orders for a restaurant
export async function getOrders(restaurantId: string): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToOrder)
    .filter((order): order is Order => order !== null);
}

// Get active orders (NEW or ACCEPTED)
export async function getActiveOrders(restaurantId: string): Promise<Order[]> {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    where('state', 'in', ['NEW', 'ACCEPTED']),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToOrder)
    .filter((order): order is Order => order !== null);
}

// Get a single order
export async function getOrderById(orderId: string): Promise<Order | null> {
  const docRef = doc(db, COLLECTION, orderId);
  const snapshot = await getDoc(docRef);
  return documentToOrder(snapshot);
}

// Subscribe to all orders changes (for dashboard)
export function subscribeToOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs
      .map(documentToOrder)
      .filter((order): order is Order => order !== null);
    callback(orders);
  });
}

// Subscribe to active orders (for real-time dashboard)
export function subscribeToActiveOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    where('state', 'in', ['NEW', 'ACCEPTED']),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs
      .map(documentToOrder)
      .filter((order): order is Order => order !== null);
    callback(orders);
  });
}

// Create order using Cloud Function
export async function createOrder(
  restaurantId: string,
  tableId: string,
  items: CartItem[]
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const createOrderFn = httpsCallable(functions, 'createOrder');
    const result = await createOrderFn({
      restaurantId,
      tableId,
      items: items.map(item => ({
        itemId: item.itemId,
        quantity: item.quantity,
        notes: item.notes,
      })),
    });
    
    return result.data as { success: boolean; orderId?: string; error?: string };
  } catch (error) {
    console.error('Error creating order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    };
  }
}

// Accept order using Cloud Function
export async function acceptOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const acceptOrderFn = httpsCallable(functions, 'acceptOrder');
    const result = await acceptOrderFn({ orderId });
    return result.data as { success: boolean; error?: string };
  } catch (error) {
    console.error('Error accepting order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to accept order' 
    };
  }
}

// Complete order using Cloud Function
export async function completeOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const completeOrderFn = httpsCallable(functions, 'completeOrder');
    const result = await completeOrderFn({ orderId });
    return result.data as { success: boolean; error?: string };
  } catch (error) {
    console.error('Error completing order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to complete order' 
    };
  }
}

// Cancel order using Cloud Function
export async function cancelOrder(
  orderId: string, 
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cancelOrderFn = httpsCallable(functions, 'cancelOrder');
    const result = await cancelOrderFn({ orderId, reason });
    return result.data as { success: boolean; error?: string };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to cancel order' 
    };
  }
}

export const orderService = {
  getOrders,
  getActiveOrders,
  getOrderById,
  subscribeToOrders,
  subscribeToActiveOrders,
  createOrder,
  acceptOrder,
  completeOrder,
  cancelOrder,
};
