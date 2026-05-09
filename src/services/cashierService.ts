import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp, 
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import type { 
  Order, 
  OrderStatus,
  Table,
  TableStatus,
  AcceptOrderParams,
  RejectOrderParams,
  MarkPaidParams,
  CloseOrderParams,
  CancelOrderParams
} from '@/types';
import { logService } from './logService';

const ORDERS_COLLECTION = 'orders';
const TABLES_COLLECTION = 'tables';
const LOGS_COLLECTION = 'logs';

// ============ Helper Functions ============

type FirestoreTimestamp = { seconds: number; nanoseconds: number };

function documentToOrder(docSnap: DocumentSnapshot | QueryDocumentSnapshot): Order | null {
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data()!;
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
    id: docSnap.id,
    createdAt: new Date((data.createdAt as FirestoreTimestamp).seconds * 1000),
    updatedAt: new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000),
    acceptedAt: data.acceptedAt ? new Date((data.acceptedAt as FirestoreTimestamp).seconds * 1000) : undefined,
    paidAt: data.paidAt ? new Date((data.paidAt as FirestoreTimestamp).seconds * 1000) : undefined,
    closedAt: data.closedAt ? new Date((data.closedAt as FirestoreTimestamp).seconds * 1000) : undefined,
    cancelledAt: data.cancelledAt ? new Date((data.cancelledAt as FirestoreTimestamp).seconds * 1000) : undefined,
  };
}

function documentToTable(docSnap: DocumentSnapshot | QueryDocumentSnapshot): Table | null {
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data()!;
  return {
    restaurantId: data.restaurantId,
    name: data.name,
    label: data.label,
    seats: data.seats,
    status: data.status,
    qrCodeUrl: data.qrCodeUrl,
    activeOrderId: data.activeOrderId,
    id: docSnap.id,
    createdAt: new Date((data.createdAt as FirestoreTimestamp).seconds * 1000),
    updatedAt: new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000),
  };
}

function getOrderStatusForTable(status: OrderStatus): TableStatus {
  switch (status) {
    case 'CREATED':
      return 'NEW_ORDER';
    case 'ACCEPTED':
      return 'ACTIVE';
    case 'PAID':
      return 'AWAITING_PAYMENT';
    case 'CLOSED':
    case 'REJECTED':
    case 'CANCELLED':
      return 'EMPTY';
    default:
      return 'EMPTY';
  }
}

// ============ Order Status Validation ============

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'CREATED': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  'ACCEPTED': ['PAID', 'CANCELLED'],
  'REJECTED': [],
  'PAID': ['CLOSED'],
  'CLOSED': [],
  'CANCELLED': [],
};

function isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// ============ Order Actions ============

// Accept an order
export async function acceptOrder(params: AcceptOrderParams): Promise<{ success: boolean; error?: string }> {
  const { restaurantId, orderId, tableId, actorId, actorName, actorRole } = params;
  
  try {
    // Get current order
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
    if (!isValidTransition(order.status, 'ACCEPTED')) {
      return { success: false, error: `Cannot accept order with status ${order.status}` };
    }
    
    // Update order status
    await updateDoc(orderRef, {
      status: 'ACCEPTED',
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await updateDoc(tableRef, {
      status: 'ACTIVE',
      updatedAt: serverTimestamp(),
    });
    
    // Create activity log
    await logService.createLog({
      restaurantId,
      actorId,
      actorName,
      actorRole,
      action: 'ORDER_ACCEPTED',
      targetType: 'order',
      targetId: orderId,
      before: { status: order.status },
      after: { status: 'ACCEPTED' },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error accepting order:', error);
    return { success: false, error: 'Failed to accept order' };
  }
}

// Reject an order
export async function rejectOrder(params: RejectOrderParams): Promise<{ success: boolean; error?: string }> {
  const { restaurantId, orderId, tableId, reason, actorId, actorName, actorRole } = params;
  
  if (!reason || reason.trim() === '') {
    return { success: false, error: 'Reason is required for rejection' };
  }
  
  try {
    // Get current order
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
    if (!isValidTransition(order.status, 'REJECTED')) {
      return { success: false, error: `Cannot reject order with status ${order.status}` };
    }
    
    // Update order status
    await updateDoc(orderRef, {
      status: 'REJECTED',
      rejectReason: reason,
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await updateDoc(tableRef, {
      status: 'EMPTY',
      activeOrderId: null,
      updatedAt: serverTimestamp(),
    });
    
    // Create activity log
    await logService.createLog({
      restaurantId,
      actorId,
      actorName,
      actorRole,
      action: 'ORDER_REJECTED',
      targetType: 'order',
      targetId: orderId,
      before: { status: order.status },
      after: { status: 'REJECTED' },
      reason,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error rejecting order:', error);
    return { success: false, error: 'Failed to reject order' };
  }
}

// Mark order as paid
export async function markOrderPaid(params: MarkPaidParams): Promise<{ success: boolean; error?: string }> {
  const { restaurantId, orderId, tableId, actorId, actorName, actorRole } = params;
  
  try {
    // Get current order
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
    if (!isValidTransition(order.status, 'PAID')) {
      return { success: false, error: `Cannot mark order as paid with status ${order.status}` };
    }
    
    // Update order status
    await updateDoc(orderRef, {
      status: 'PAID',
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await updateDoc(tableRef, {
      status: 'AWAITING_PAYMENT',
      updatedAt: serverTimestamp(),
    });
    
    // Create activity log
    await logService.createLog({
      restaurantId,
      actorId,
      actorName,
      actorRole,
      action: 'ORDER_PAID',
      targetType: 'order',
      targetId: orderId,
      before: { status: order.status },
      after: { status: 'PAID' },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking order as paid:', error);
    return { success: false, error: 'Failed to mark order as paid' };
  }
}

// Close an order
export async function closeOrder(params: CloseOrderParams): Promise<{ success: boolean; error?: string }> {
  const { restaurantId, orderId, tableId, actorId, actorName, actorRole } = params;
  
  try {
    // Get current order
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
    if (!isValidTransition(order.status, 'CLOSED')) {
      return { success: false, error: `Cannot close order with status ${order.status}` };
    }
    
    // Update order status
    await updateDoc(orderRef, {
      status: 'CLOSED',
      closedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await updateDoc(tableRef, {
      status: 'EMPTY',
      activeOrderId: null,
      updatedAt: serverTimestamp(),
    });
    
    // Create activity log
    await logService.createLog({
      restaurantId,
      actorId,
      actorName,
      actorRole,
      action: 'ORDER_CLOSED',
      targetType: 'order',
      targetId: orderId,
      before: { status: order.status },
      after: { status: 'CLOSED' },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error closing order:', error);
    return { success: false, error: 'Failed to close order' };
  }
}

// Cancel an order
export async function cancelOrder(params: CancelOrderParams): Promise<{ success: boolean; error?: string }> {
  const { restaurantId, orderId, tableId, reason, actorId, actorName, actorRole } = params;
  
  if (!reason || reason.trim() === '') {
    return { success: false, error: 'Reason is required for cancellation' };
  }
  
  try {
    // Get current order
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
    if (!isValidTransition(order.status, 'CANCELLED')) {
      return { success: false, error: `Cannot cancel order with status ${order.status}` };
    }
    
    // Update order status
    await updateDoc(orderRef, {
      status: 'CANCELLED',
      cancelReason: reason,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    // Update table status
    const tableRef = doc(db, TABLES_COLLECTION, tableId);
    await updateDoc(tableRef, {
      status: 'EMPTY',
      activeOrderId: null,
      updatedAt: serverTimestamp(),
    });
    
    // Create activity log
    await logService.createLog({
      restaurantId,
      actorId,
      actorName,
      actorRole,
      action: 'ORDER_CANCELLED',
      targetType: 'order',
      targetId: orderId,
      before: { status: order.status },
      after: { status: 'CANCELLED' },
      reason,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error cancelling order:', error);
    return { success: false, error: 'Failed to cancel order' };
  }
}

// ============ Data Retrieval ============

// Get all orders for a restaurant
export async function getOrders(restaurantId: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToOrder)
    .filter((order): order is Order => order !== null);
}

// Get active orders (CREATED or ACCEPTED)
export async function getActiveOrders(restaurantId: string): Promise<Order[]> {
  const q = query(
    collection(db, ORDERS_COLLECTION),
    where('restaurantId', '==', restaurantId),
    where('status', 'in', ['CREATED', 'ACCEPTED']),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToOrder)
    .filter((order): order is Order => order !== null);
}

// Subscribe to orders changes
export function subscribeToOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
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
  });
}

// Subscribe to active orders
export function subscribeToActiveOrders(
  restaurantId: string,
  callback: (orders: Order[]) => void
): () => void {
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
  });
}

// Get a single order
export async function getOrderById(orderId: string): Promise<Order | null> {
  const docRef = doc(db, ORDERS_COLLECTION, orderId);
  const snapshot = await getDoc(docRef);
  return documentToOrder(snapshot);
}

// Get all tables for a restaurant
export async function getTables(restaurantId: string): Promise<Table[]> {
  const q = query(
    collection(db, TABLES_COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('name')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToTable)
    .filter((table): table is Table => table !== null);
}

// Subscribe to tables changes
export function subscribeToTables(
  restaurantId: string,
  callback: (tables: Table[]) => void
): () => void {
  const q = query(
    collection(db, TABLES_COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('name')
  );
  
  return onSnapshot(q, (snapshot) => {
    const tables = snapshot.docs
      .map(documentToTable)
      .filter((table): table is Table => table !== null);
    callback(tables);
  });
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
