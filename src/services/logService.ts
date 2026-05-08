import { db } from '@/lib/firebase';
import { 
  collection, 
  doc,
  addDoc,
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import type { ActivityLog, LogAction, StaffRole } from '@/types';

const COLLECTION = 'logs';

type FirestoreTimestamp = { seconds: number; nanoseconds: number };

// Convert Firestore document to ActivityLog type
function documentToActivityLog(docSnap: DocumentSnapshot | QueryDocumentSnapshot): ActivityLog | null {
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data()!;
  return {
    restaurantId: data.restaurantId,
    actorId: data.actorId,
    actorName: data.actorName,
    actorRole: data.actorRole,
    action: data.action,
    targetType: data.targetType,
    targetId: data.targetId,
    before: data.before,
    after: data.after,
    reason: data.reason,
    message: data.message,
    metadata: data.metadata,
    userId: data.userId,
    userName: data.userName,
    tableId: data.tableId,
    orderId: data.orderId,
    id: docSnap.id,
    createdAt: new Date((data.createdAt as FirestoreTimestamp).seconds * 1000),
  };
}

// Create a new activity log
export async function createLog(params: {
  restaurantId: string;
  actorId?: string;
  actorName?: string;
  actorRole?: StaffRole | 'customer' | 'system';
  action: LogAction;
  targetType: 'order' | 'table' | 'menuItem' | 'staff' | 'restaurant';
  targetId: string;
  before?: unknown;
  after?: unknown;
  reason?: string;
}): Promise<string> {
  const logData = {
    restaurantId: params.restaurantId,
    actorId: params.actorId || 'system',
    actorName: params.actorName || 'System',
    actorRole: params.actorRole || 'system',
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    before: params.before || null,
    after: params.after || null,
    reason: params.reason || null,
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, COLLECTION), logData);
  return docRef.id;
}

// Get recent activity logs for a restaurant
export async function getActivityLogs(
  restaurantId: string, 
  limitCount: number = 50
): Promise<ActivityLog[]> {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToActivityLog)
    .filter((log): log is ActivityLog => log !== null);
}

// Subscribe to activity logs changes
export function subscribeToActivityLogs(
  restaurantId: string,
  callback: (logs: ActivityLog[]) => void,
  limitCount: number = 50
): () => void {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs
      .map(documentToActivityLog)
      .filter((log): log is ActivityLog => log !== null);
    callback(logs);
  });
}

// Get today's summary statistics
export async function getDailySummary(restaurantId: string): Promise<{
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  
  const snapshot = await getDocs(q);
  const logs = snapshot.docs
    .map(documentToActivityLog)
    .filter((log): log is ActivityLog => log !== null)
    .filter(log => {
      const logDate = new Date(log.createdAt);
      return logDate >= today;
    });
  
  const orderLogs = logs.filter(l => l.action.startsWith('ORDER_'));
  
  return {
    totalOrders: orderLogs.filter(l => l.action === 'ORDER_CREATED').length,
    completedOrders: orderLogs.filter(l => l.action === 'ORDER_CLOSED').length,
    cancelledOrders: orderLogs.filter(l => l.action === 'ORDER_CANCELLED' || l.action === 'ORDER_REJECTED').length,
    revenue: 0, // This would be calculated from actual order data
  };
}

export const logService = {
  createLog,
  getActivityLogs,
  subscribeToActivityLogs,
  getDailySummary,
};
