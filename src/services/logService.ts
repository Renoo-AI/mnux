import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  limit,
  DocumentSnapshot
} from 'firebase/firestore';
import type { ActivityLog } from '@/types';

const COLLECTION = 'activityLogs';

// Convert Firestore document to ActivityLog type
function documentToActivityLog(doc: DocumentSnapshot): ActivityLog | null {
  if (!doc.exists()) return null;
  
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: new Date(data.createdAt.seconds * 1000),
  } as ActivityLog;
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
    where('createdAt', '>=', today)
  );
  
  const snapshot = await getDocs(q);
  const logs = snapshot.docs.map(documentToActivityLog).filter(Boolean) as ActivityLog[];
  
  const orderLogs = logs.filter(l => l.type.startsWith('order_'));
  
  return {
    totalOrders: orderLogs.filter(l => l.type === 'order_created').length,
    completedOrders: orderLogs.filter(l => l.type === 'order_completed').length,
    cancelledOrders: orderLogs.filter(l => l.type === 'order_cancelled').length,
    revenue: 0, // This would be calculated from actual order data
  };
}

export const logService = {
  getActivityLogs,
  subscribeToActivityLogs,
  getDailySummary,
};
