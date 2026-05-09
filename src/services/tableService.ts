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
  Timestamp
} from 'firebase/firestore';
import type { Table, TableStatus } from '@/types';

const COLLECTION = 'tables';

type FirestoreTimestamp = { seconds: number; nanoseconds: number };

// Convert Firestore document to Table type
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
    createdAt: data.createdAt ? new Date((data.createdAt as FirestoreTimestamp).seconds * 1000) : new Date(),
    updatedAt: data.updatedAt ? new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000) : new Date(),
  };
}

// Get all tables for a restaurant
export async function getTables(restaurantId: string): Promise<Table[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('restaurantId', '==', restaurantId),
      orderBy('name', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(documentToTable)
      .filter((table): table is Table => table !== null);
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw new Error('Failed to fetch tables.');
  }
}

// Get a single table by ID
export async function getTableById(tableId: string): Promise<Table | null> {
  try {
    const docRef = doc(db, COLLECTION, tableId);
    const snapshot = await getDoc(docRef);
    return documentToTable(snapshot);
  } catch (error) {
    console.error('Error fetching table:', error);
    throw new Error('Failed to fetch table.');
  }
}

// Get table by name (for QR code lookup)
export async function getTableByName(
  restaurantId: string, 
  tableName: string
): Promise<Table | null> {
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
    return null;
  } catch (error) {
    console.error('Error fetching table by name:', error);
    throw new Error('Failed to fetch table.');
  }
}

// Subscribe to all tables changes
export function subscribeToTables(
  restaurantId: string,
  callback: (tables: Table[]) => void,
  onError?: (error: Error) => void
): () => void {
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
      callback(tables);
    }, (error) => {
      console.error('Error subscribing to tables:', error);
      if (onError) {
        onError(new Error('Failed to sync tables.'));
      }
    });
  } catch (error) {
    console.error('Error setting up tables subscription:', error);
    if (onError) {
      onError(new Error('Failed to subscribe to tables.'));
    }
    return () => {};
  }
}

// Subscribe to a single table changes
export function subscribeToTable(
  tableId: string,
  callback: (table: Table | null) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const docRef = doc(db, COLLECTION, tableId);
    
    return onSnapshot(docRef, (snapshot) => {
      const table = documentToTable(snapshot);
      callback(table);
    }, (error) => {
      console.error('Error subscribing to table:', error);
      if (onError) {
        onError(new Error('Failed to sync table data.'));
      }
    });
  } catch (error) {
    console.error('Error setting up table subscription:', error);
    if (onError) {
      onError(new Error('Failed to subscribe to table.'));
    }
    return () => {};
  }
}

// Update table status (for dashboard use)
export async function updateTableStatus(
  tableId: string, 
  status: TableStatus
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION, tableId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating table status:', error);
    throw new Error('Failed to update table status.');
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
};
