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
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import type { 
  Order, 
  OrderDocument, 
  CartItem,
  OrderStatus
} from '@/types';

const ORDERS_COLLECTION = 'orders';
const TABLES_COLLECTION = 'tables';

// Demo orders data for offline/fallback mode ONLY
const DEMO_ORDERS: Order[] = [
  {
    id: 'order-2',
    restaurantId: 'demo-restaurant-zcoffee',
    tableId: 'table-2',
    tableName: 'T-02',
    items: [
      { itemId: 'zc-1', name: 'Espresso', quantity: 2, price: 7.0, unitPrice: 3.5 },
      { itemId: 'zc-5', name: 'Croissant', quantity: 1, price: 3.0, unitPrice: 3.0 },
    ],
    subtotal: 10.0,
    totalAmount: 10.0,
    status: 'ACCEPTED',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10),
    acceptedAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: 'order-3',
    restaurantId: 'demo-restaurant-zcoffee',
    tableId: 'table-3',
    tableName: 'T-03',
    items: [
      { itemId: 'zc-2', name: 'Cappuccino', quantity: 3, price: 15.0, unitPrice: 5.0 },
      { itemId: 'zc-6', name: 'Cheesecake', quantity: 2, price: 13.0, unitPrice: 6.5 },
    ],
    subtotal: 28.0,
    totalAmount: 28.0,
    status: 'CREATED',
    createdAt: new Date(Date.now() - 1000 * 60 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 3),
  },
  {
    id: 'order-4',
    restaurantId: 'demo-restaurant-zcoffee',
    tableId: 'table-4',
    tableName: 'T-04',
    items: [
      { itemId: 'zc-3', name: 'Latte', quantity: 2, price: 11.0, unitPrice: 5.5 },
      { itemId: 'zc-4', name: 'Iced Coffee', quantity: 2, price: 9.0, unitPrice: 4.5 },
      { itemId: 'zc-5', name: 'Croissant', quantity: 3, price: 9.0, unitPrice: 3.0 },
    ],
    subtotal: 29.0,
    totalAmount: 29.0,
    status: 'PAID',
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5),
    acceptedAt: new Date(Date.now() - 1000 * 60 * 40),
    paidAt: new Date(Date.now() - 1000 * 60 * 5),
  },
];

// Check if Firebase is available
function isFirebaseAvailable(): boolean {
  try {
    return !!db && !!db.app;
  } catch {
    return false;
  }
}

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
    paidAt: data.paidAt ? new Date(data.paidAt.seconds * 1000) : undefined,
    closedAt: data.closedAt ? new Date(data.closedAt.seconds * 1000) : undefined,
    cancelledAt: data.cancelledAt ? new Date(data.cancelledAt.seconds * 1000) : undefined,
  };
}

// Get all orders for a restaurant - Firebase FIRST, demo fallback
export async function getOrders(restaurantId: string): Promise<Order[]> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs
        .map(documentToOrder)
        .filter((order): order is Order => order !== null);
      
      if (orders.length > 0) return orders;
    } catch (error) {
      console.warn('Firebase getOrders error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_ORDERS.filter(o => o.restaurantId === restaurantId);
}

// Get active orders (CREATED or ACCEPTED) - Firebase FIRST
export async function getActiveOrders(restaurantId: string): Promise<Order[]> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        where('status', 'in', ['CREATED', 'ACCEPTED', 'PAID']),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const orders = snapshot.docs
        .map(documentToOrder)
        .filter((order): order is Order => order !== null);
      
      if (orders.length > 0) return orders;
    } catch (error) {
      console.warn('Firebase getActiveOrders error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_ORDERS.filter(
    o => o.restaurantId === restaurantId && (o.status === 'CREATED' || o.status === 'ACCEPTED' || o.status === 'PAID')
  );
}

// Get a single order
export async function getOrderById(orderId: string): Promise<Order | null> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const docRef = doc(db, ORDERS_COLLECTION, orderId);
      const snapshot = await getDoc(docRef);
      const order = documentToOrder(snapshot);
      if (order) return order;
    } catch (error) {
      console.warn('Firebase getOrderById error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_ORDERS.find(o => o.id === orderId) || null;
}

// Subscribe to all orders changes (for dashboard)
export function subscribeToOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
  // Try Firebase first
  if (isFirebaseAvailable()) {
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
        
        if (orders.length > 0) {
          callback(orders);
        } else {
          // No Firebase data, use demo
          callback(DEMO_ORDERS.filter(o => o.restaurantId === restaurantId));
        }
      }, (error) => {
        console.warn('Firebase subscribeToOrders error, falling back to demo:', error);
        callback(DEMO_ORDERS.filter(o => o.restaurantId === restaurantId));
      });
    } catch (error) {
      console.warn('Firebase subscribeToOrders error:', error);
    }
  }
  
  // Fallback to demo data
  callback(DEMO_ORDERS.filter(o => o.restaurantId === restaurantId));
  return () => {};
}

// Subscribe to active orders (for real-time dashboard)
export function subscribeToActiveOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
  // Try Firebase first
  if (isFirebaseAvailable()) {
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
        
        if (orders.length > 0) {
          callback(orders);
        } else {
          callback(DEMO_ORDERS.filter(
            o => o.restaurantId === restaurantId && ['CREATED', 'ACCEPTED', 'PAID'].includes(o.status)
          ));
        }
      }, (error) => {
        console.warn('Firebase subscribeToActiveOrders error, falling back to demo:', error);
        callback(DEMO_ORDERS.filter(
          o => o.restaurantId === restaurantId && ['CREATED', 'ACCEPTED', 'PAID'].includes(o.status)
        ));
      });
    } catch (error) {
      console.warn('Firebase subscribeToActiveOrders error:', error);
    }
  }
  
  // Fallback to demo data
  callback(DEMO_ORDERS.filter(
    o => o.restaurantId === restaurantId && ['CREATED', 'ACCEPTED', 'PAID'].includes(o.status)
  ));
  return () => {};
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

  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      // Use transaction to ensure atomicity
      const orderRef = doc(collection(db, ORDERS_COLLECTION));
      const tableRef = doc(db, TABLES_COLLECTION, tableId);
      
      await runTransaction(db, async (transaction) => {
        // Check table status
        const tableDoc = await transaction.get(tableRef);
        
        if (tableDoc.exists()) {
          const tableData = tableDoc.data();
          // Allow ordering at EMPTY or NEW_ORDER tables
          // If table is ACTIVE, allow adding to existing order
          if (tableData.status === 'OFFLINE') {
            throw new Error('Table is offline');
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
      console.error('Error creating order in Firebase:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create order';
      return { success: false, error: errorMessage };
    }
  }
  
  // Demo mode fallback - simulate successful order creation
  const demoOrderId = `demo-order-${Date.now()}`;
  console.log('Demo mode: Created order', demoOrderId, { restaurantId, tableId, items, totalAmount });
  return { success: true, orderId: demoOrderId };
}

// Accept order
export async function acceptOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseAvailable()) {
    console.log('Demo mode: Accepted order', orderId);
    return { success: true };
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
    
    // Validate status transition
    if (order.status !== 'CREATED') {
      return { success: false, error: `Cannot accept order with status ${order.status}` };
    }
    
    // Update order
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
    console.error('Error accepting order:', error);
    return { success: false, error: 'Failed to accept order' };
  }
}

// Mark order as paid
export async function markOrderPaid(orderId: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseAvailable()) {
    console.log('Demo mode: Marked order paid', orderId);
    return { success: true };
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
    console.error('Error marking order paid:', error);
    return { success: false, error: 'Failed to mark order as paid' };
  }
}

// Close order
export async function closeOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseAvailable()) {
    console.log('Demo mode: Closed order', orderId);
    return { success: true };
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
    console.error('Error closing order:', error);
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
  
  if (!isFirebaseAvailable()) {
    console.log('Demo mode: Cancelled order', orderId, reason);
    return { success: true };
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
    console.error('Error cancelling order:', error);
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
  DEMO_ORDERS,
};
