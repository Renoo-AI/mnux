import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import type { 
  Order, 
  CartItem,
  OrderStatus
} from '@/types';

const ORDERS_COLLECTION = 'orders';
const TABLES_COLLECTION = 'tables';

type FirestoreTimestamp = { seconds: number; nanoseconds: number };

// Convert Firestore document to Order type
function documentToOrder(doc: DocumentSnapshot | QueryDocumentSnapshot): Order | null {
  if (!doc.exists()) return null;
  
  const data = doc.data()!;
  return {
    restaurantId: data.restaurantId,
    tableId: data.tableId,
    tableName: data.tableName,
    items: data.items,
    subtotal: data.subtotal,
    totalAmount: data.totalAmount,
    status: data.status,
    notes: data.notes,
    customerNote: data.customerNote,
    rejectReason: data.rejectReason,
    cancelReason: data.cancelReason,
    id: doc.id,
    createdAt: data.createdAt ? new Date((data.createdAt as FirestoreTimestamp).seconds * 1000) : new Date(),
    updatedAt: data.updatedAt ? new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000) : new Date(),
    acceptedAt: data.acceptedAt ? new Date((data.acceptedAt as FirestoreTimestamp).seconds * 1000) : undefined,
    paidAt: data.paidAt ? new Date((data.paidAt as FirestoreTimestamp).seconds * 1000) : undefined,
    closedAt: data.closedAt ? new Date((data.closedAt as FirestoreTimestamp).seconds * 1000) : undefined,
    cancelledAt: data.cancelledAt ? new Date((data.cancelledAt as FirestoreTimestamp).seconds * 1000) : undefined,
  };
}

// Get all orders for a restaurant
export async function getOrders(restaurantId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(documentToOrder)
      .filter((order): order is Order => order !== null);
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders. Please check your connection.');
  }
}

// Get active orders (CREATED, ACCEPTED, or PAID)
export async function getActiveOrders(restaurantId: string): Promise<Order[]> {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('status', 'in', ['CREATED', 'ACCEPTED', 'PAID']),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(documentToOrder)
      .filter((order): order is Order => order !== null);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    throw new Error('Failed to fetch active orders.');
  }
}

// Get a single order
export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const snapshot = await getDoc(docRef);
    return documentToOrder(snapshot);
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
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs
        .map(documentToOrder)
        .filter((order): order is Order => order !== null);
      callback(orders);
    }, (error) => {
      console.error('Error subscribing to orders:', error);
      if (onError) {
        onError(new Error('Failed to sync orders.'));
      }
    });
  } catch (error) {
    console.error('Error setting up orders subscription:', error);
    if (onError) {
      onError(new Error('Failed to subscribe to orders.'));
    }
    return () => {};
  }
}

// Subscribe to active orders (for real-time dashboard)
export function subscribeToActiveOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('status', 'in', ['CREATED', 'ACCEPTED', 'PAID']),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs
        .map(documentToOrder)
        .filter((order): order is Order => order !== null);
      callback(orders);
    }, (error) => {
      console.error('Error subscribing to active orders:', error);
      if (onError) {
        onError(new Error('Failed to sync active orders.'));
      }
    });
  } catch (error) {
    console.error('Error setting up active orders subscription:', error);
    if (onError) {
      onError(new Error('Failed to subscribe to active orders.'));
    }
    return () => {};
  }
}

// Create order - REAL Firebase write with table status update
export async function createOrder(
  restaurantId: string,
  tableId: string,
  tableName: string,
  items: CartItem[]
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  // Validate inputs
  if (!restaurantId || !tableId || !items || items.length === 0) {
    return { success: false, error: 'Invalid order data' };
  }

  // Validate prices are positive
  for (const item of items) {
    if (item.price < 0 || item.quantity <= 0) {
      return { success: false, error: 'Invalid item price or quantity' };
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    // Use transaction to ensure atomicity
    const orderRef = doc(collection(db, ORDERS_COLLECTION));
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    
    await runTransaction(db, async (transaction) => {
      // Check table status
      const tableDoc = await transaction.get(tableRef);
      
      if (tableDoc.exists()) {
        const tableData = tableDoc.data();
        // Prevent ordering at OFFLINE tables
        if (tableData.status === 'OFFLINE') {
          throw new Error('Table is currently unavailable.');
        }
      }
      
      // Create the order
      const orderData = {
        restaurantId,
        tableId,
        tableName,
        items: items.map(item => ({
          itemId: item.itemId,
          name: item.name,
          quantity: item.quantity,
          price: item.price * item.quantity,
          unitPrice: item.price,
          notes: item.notes,
        })),
        subtotal: totalAmount,
        totalAmount,
        status: 'CREATED' as OrderStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      transaction.set(orderRef, orderData);
      
      // Update table status to NEW_ORDER and link the order
      if (tableDoc.exists()) {
        transaction.update(tableRef, {
          status: 'NEW_ORDER',
          activeOrderId: orderRef.id,
          updatedAt: serverTimestamp(),
        });
      }
    });
    
    return { success: true, orderId: orderRef.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
    return { success: false, error: errorMessage };
  }
}

// Accept order
export async function acceptOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }
    
    const order = documentToOrder(orderSnap);
    if (!order) {
      return { success: false, error: 'Invalid order data' };
    }
    
    // Validate status transition
    if (order.status !== 'CREATED') {
      return { success: false, error: `Cannot accept order with status ${order.status}` };
    }
    
    await updateDoc(orderRef, {
      status: 'ACCEPTED',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, order.tableId);
    await updateDoc(tableRef, {
      status: 'ACTIVE',
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to accept order' };
  }
}

// Mark order as paid
export async function markOrderPaid(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }
    
    const order = documentToOrder(orderSnap);
    if (!order) {
      return { success: false, error: 'Invalid order data' };
    }
    
    if (order.status !== 'ACCEPTED') {
      return { success: false, error: `Cannot mark order as paid with status ${order.status}` };
    }
    
    await updateDoc(orderRef, {
      status: 'PAID',
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, order.tableId);
    await updateDoc(tableRef, {
      status: 'AWAITING_PAYMENT',
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to mark order as paid' };
  }
}

// Close order
export async function closeOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }
    
    const order = documentToOrder(orderSnap);
    if (!order) {
      return { success: false, error: 'Invalid order data' };
    }
    
    if (order.status !== 'PAID') {
      return { success: false, error: `Cannot close order with status ${order.status}` };
    }
    
    await updateDoc(orderRef, {
      status: 'CLOSED',
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, order.tableId);
    await updateDoc(tableRef, {
      status: 'EMPTY',
      activeOrderId: null,
      updatedAt: serverTimestamp(),
    });
    
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
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return { success: false, error: 'Order not found' };
    }
    
    const order = documentToOrder(orderSnap);
    if (!order) {
      return { success: false, error: 'Invalid order data' };
    }
    
    if (!['CREATED', 'ACCEPTED'].includes(order.status)) {
      return { success: false, error: `Cannot cancel order with status ${order.status}` };
    }
    
    await updateDoc(orderRef, {
      status: 'CANCELLED',
      cancelReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, order.tableId);
    await updateDoc(tableRef, {
      status: 'EMPTY',
      activeOrderId: null,
      updatedAt: serverTimestamp(),
    });
    
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
  createOrder,
  acceptOrder,
  markOrderPaid,
  closeOrder,
  cancelOrder,
};
