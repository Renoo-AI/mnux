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
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import type { Table, TableDocument, TableStatus } from '@/types';

const COLLECTION = 'tables';

// Demo tables data for offline/fallback mode ONLY
const DEMO_TABLES: Table[] = [
  // Z Coffee tables
  { id: 'table-1', restaurantId: 'demo-restaurant-zcoffee', name: 'T-01', label: 'Window Side', seats: 4, status: 'EMPTY', qrCodeUrl: '/r/zcoffee/t/T-01', createdAt: new Date(), updatedAt: new Date() },
  { id: 'table-2', restaurantId: 'demo-restaurant-zcoffee', name: 'T-02', label: 'Bar Stool', seats: 2, status: 'ACTIVE', qrCodeUrl: '/r/zcoffee/t/T-02', activeOrderId: 'order-2', createdAt: new Date(), updatedAt: new Date() },
  { id: 'table-3', restaurantId: 'demo-restaurant-zcoffee', name: 'T-03', label: 'Corner', seats: 4, status: 'NEW_ORDER', qrCodeUrl: '/r/zcoffee/t/T-03', activeOrderId: 'order-3', createdAt: new Date(), updatedAt: new Date() },
  { id: 'table-4', restaurantId: 'demo-restaurant-zcoffee', name: 'T-04', label: 'Patio', seats: 6, status: 'AWAITING_PAYMENT', qrCodeUrl: '/r/zcoffee/t/T-04', activeOrderId: 'order-4', createdAt: new Date(), updatedAt: new Date() },
  { id: 'table-5', restaurantId: 'demo-restaurant-zcoffee', name: 'T-05', label: 'Private', seats: 8, status: 'EMPTY', qrCodeUrl: '/r/zcoffee/t/T-05', createdAt: new Date(), updatedAt: new Date() },
  { id: 'table-6', restaurantId: 'demo-restaurant-zcoffee', name: 'T-06', label: 'Garden', seats: 4, status: 'OFFLINE', qrCodeUrl: '/r/zcoffee/t/T-06', createdAt: new Date(), updatedAt: new Date() },
  // Demo restaurant tables
  { id: 'table-d1', restaurantId: 'demo-restaurant-id', name: 'T-01', seats: 4, status: 'EMPTY', qrCodeUrl: '/r/demo/t/T-01', createdAt: new Date(), updatedAt: new Date() },
  { id: 'table-d2', restaurantId: 'demo-restaurant-id', name: 'T-02', seats: 2, status: 'ACTIVE', qrCodeUrl: '/r/demo/t/T-02', activeOrderId: 'order-d2', createdAt: new Date(), updatedAt: new Date() },
  { id: 'table-d3', restaurantId: 'demo-restaurant-id', name: 'T-03', seats: 4, status: 'EMPTY', qrCodeUrl: '/r/demo/t/T-03', createdAt: new Date(), updatedAt: new Date() },
];

// Check if Firebase is available
function isFirebaseAvailable(): boolean {
  try {
    return !!db && !!db.app;
  } catch {
    return false;
  }
}

// Convert Firestore document to Table type
function documentToTable(doc: DocumentSnapshot): Table | null {
  if (!doc.exists()) return null;
  
  const data = doc.data() as TableDocument;
  return {
    id: doc.id,
    ...data,
    createdAt: new Date(data.createdAt.seconds * 1000),
    updatedAt: new Date(data.updatedAt.seconds * 1000),
  };
}

// Get all tables for a restaurant - Firebase FIRST, demo fallback
export async function getTables(restaurantId: string): Promise<Table[]> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('restaurantId', '==', restaurantId),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const tables = snapshot.docs
        .map(documentToTable)
        .filter((table): table is Table => table !== null);
      
      if (tables.length > 0) return tables;
    } catch (error) {
      console.warn('Firebase getTables error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_TABLES.filter(t => t.restaurantId === restaurantId);
}

// Get a single table by ID - Firebase FIRST
export async function getTableById(tableId: string): Promise<Table | null> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const docRef = doc(db, COLLECTION, tableId);
      const snapshot = await getDoc(docRef);
      const table = documentToTable(snapshot);
      if (table) return table;
    } catch (error) {
      console.warn('Firebase getTableById error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_TABLES.find(t => t.id === tableId) || null;
}

// Get table by name (for QR code lookup) - Firebase FIRST
export async function getTableByName(
  restaurantId: string, 
  tableName: string
): Promise<Table | null> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('restaurantId', '==', restaurantId),
        where('name', '==', tableName)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return documentToTable(snapshot.docs[0]);
      }
    } catch (error) {
      console.warn('Firebase getTableByName error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_TABLES.find(t => t.restaurantId === restaurantId && t.name === tableName) || null;
}

// Subscribe to all tables changes - Firebase FIRST
export function subscribeToTables(
  restaurantId: string,
  callback: (tables: Table[]) => void
): () => void {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('restaurantId', '==', restaurantId),
        orderBy('name', 'asc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const tables = snapshot.docs
          .map(documentToTable)
          .filter((table): table is Table => table !== null);
        
        if (tables.length > 0) {
          callback(tables);
        } else {
          callback(DEMO_TABLES.filter(t => t.restaurantId === restaurantId));
        }
      }, (error) => {
        console.warn('Firebase subscribeToTables error, falling back to demo:', error);
        callback(DEMO_TABLES.filter(t => t.restaurantId === restaurantId));
      });
    } catch (error) {
      console.warn('Firebase subscribeToTables error:', error);
    }
  }
  
  // Fallback to demo data
  callback(DEMO_TABLES.filter(t => t.restaurantId === restaurantId));
  return () => {};
}

// Subscribe to a single table changes
export function subscribeToTable(
  tableId: string,
  callback: (table: Table | null) => void
): () => void {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const docRef = doc(db, COLLECTION, tableId);
      
      return onSnapshot(docRef, (snapshot) => {
        const table = documentToTable(snapshot);
        if (table) {
          callback(table);
        } else {
          callback(DEMO_TABLES.find(t => t.id === tableId) || null);
        }
      }, (error) => {
        console.warn('Firebase subscribeToTable error, falling back to demo:', error);
        callback(DEMO_TABLES.find(t => t.id === tableId) || null);
      });
    } catch (error) {
      console.warn('Firebase subscribeToTable error:', error);
    }
  }
  
  // Fallback to demo data
  callback(DEMO_TABLES.find(t => t.id === tableId) || null);
  return () => {};
}

// Update table status (for dashboard use)
export async function updateTableStatus(
  tableId: string, 
  status: TableStatus
): Promise<void> {
  if (!isFirebaseAvailable()) {
    console.warn('Firebase not available, cannot update table status');
    return;
  }
  
  try {
    const docRef = doc(db, COLLECTION, tableId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.warn('Firebase updateTableStatus error:', error);
    throw error;
  }
}

// Legacy alias for backwards compatibility
export const updateTableState = updateTableStatus;

// Generate QR code URL for a table
export function generateQRCodeUrl(
  restaurantSlug: string, 
  tableName: string
): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://menux.app';
  return `${baseUrl}/r/${restaurantSlug}/t/${tableName}`;
}

export const tableService = {
  getTables,
  getTableById,
  getTableByName,
  subscribeToTables,
  subscribeToTable,
  updateTableStatus,
  updateTableState,
  generateQRCodeUrl,
  DEMO_TABLES,
};
