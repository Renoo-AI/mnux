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
import type { Table, TableDocument, TableState } from '@/types';

const COLLECTION = 'tables';

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

// Get all tables for a restaurant
export async function getTables(restaurantId: string): Promise<Table[]> {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('name', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToTable)
    .filter((table): table is Table => table !== null);
}

// Get a single table by ID
export async function getTableById(tableId: string): Promise<Table | null> {
  const docRef = doc(db, COLLECTION, tableId);
  const snapshot = await getDoc(docRef);
  return documentToTable(snapshot);
}

// Get table by name (for QR code lookup)
export async function getTableByName(
  restaurantId: string, 
  tableName: string
): Promise<Table | null> {
  const q = query(
    collection(db, COLLECTION),
    where('restaurantId', '==', restaurantId),
    where('name', '==', tableName)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return documentToTable(snapshot.docs[0]);
}

// Subscribe to all tables changes
export function subscribeToTables(
  restaurantId: string,
  callback: (tables: Table[]) => void
): () => void {
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
  });
}

// Subscribe to a single table changes
export function subscribeToTable(
  tableId: string,
  callback: (table: Table | null) => void
): () => void {
  const docRef = doc(db, COLLECTION, tableId);
  
  return onSnapshot(docRef, (snapshot) => {
    callback(documentToTable(snapshot));
  });
}

// Update table state (for dashboard use)
export async function updateTableState(
  tableId: string, 
  state: TableState
): Promise<void> {
  const docRef = doc(db, COLLECTION, tableId);
  await updateDoc(docRef, {
    state,
    updatedAt: Timestamp.now(),
  });
}

// Generate QR code URL for a table
export function generateQRCodeUrl(
  restaurantSlug: string, 
  tableName: string
): string {
  // In production, this would be the actual domain
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://menux.app';
  return `${baseUrl}/r/${restaurantSlug}/t/${tableName}`;
}

export const tableService = {
  getTables,
  getTableById,
  getTableByName,
  subscribeToTables,
  subscribeToTable,
  updateTableState,
  generateQRCodeUrl,
};
