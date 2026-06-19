import { supabase } from '@/lib/supabaseClient';
import { auth } from '@/lib/firebase';
import type { Table, TableStatus } from '@/types';

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

// Get all tables for a restaurant
export async function getTables(restaurantId: string): Promise<Table[]> {
  try {
    const res = await fetch(`/api/tables?restaurantId=${restaurantId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch tables.');
    }
    const data = await res.json();
    return data.tables || [];
  } catch (error) {
    console.error('Error fetching tables:', error);
    throw new Error('Failed to fetch tables.');
  }
}

// Get a single table by ID
export async function getTableById(tableId: string): Promise<Table | null> {
  try {
    const res = await fetch(`/api/tables?id=${tableId}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error('Failed to fetch table.');
    }
    return await res.json();
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
    const res = await fetch(`/api/tables?restaurantId=${restaurantId}&name=${encodeURIComponent(tableName)}`);
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error('Failed to fetch table.');
    }
    return await res.json();
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
  // 1. Fetch initial tables
  getTables(restaurantId)
    .then(callback)
    .catch((err) => {
      if (onError) onError(err);
    });

  // 2. Setup Realtime subscription
  const channel = supabase
    .channel(`tables_restaurant_${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Table',
        filter: `restaurantId=eq.${restaurantId}`,
      },
      async () => {
        try {
          const freshTables = await getTables(restaurantId);
          callback(freshTables);
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

// Subscribe to a single table changes
export function subscribeToTable(
  tableId: string,
  callback: (table: Table | null) => void,
  onError?: (error: Error) => void
): () => void {
  // 1. Fetch initial table data
  getTableById(tableId)
    .then(callback)
    .catch((err) => {
      if (onError) onError(err);
    });

  // 2. Setup Realtime subscription
  const channel = supabase
    .channel(`table_id_${tableId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'Table',
        filter: `id=eq.${tableId}`,
      },
      async () => {
        try {
          const freshTable = await getTableById(tableId);
          callback(freshTable);
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

// Update table status (for dashboard use)
export async function updateTableStatus(
  tableId: string, 
  status: TableStatus
): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/tables', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        id: tableId,
        status,
      }),
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to update table status.');
    }
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
