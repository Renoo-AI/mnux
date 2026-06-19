import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/lib/db';

// Initialize Firebase Admin
function getAdminApp() {
  if (getApps().length > 0) return getApp();
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials');
  }
  
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

// SECURITY: Uses server-only environment variable (no NEXT_PUBLIC_ prefix)
const SUPERADMIN_UID = process.env.SUPERADMIN_UID || '';

async function verifyAuth(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(authHeader.substring(7));
    return { uid: decoded.uid };
  } catch {
    return null;
  }
}

async function hasRestaurantAccess(uid: string, restaurantId: string): Promise<boolean> {
  if (uid === SUPERADMIN_UID) return true;
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerUid: true, staffUids: true }
  });
  if (!restaurant) return false;
  const staffUids = restaurant.staffUids as Record<string, string> | null;
  return restaurant.ownerUid === uid || !!(staffUids && staffUids[uid] !== undefined);
}

// Sanitize string input
function sanitize(str: string | undefined, maxLength: number): string | undefined {
  if (!str) return undefined;
  return str.slice(0, maxLength).trim();
}

// Valid table statuses
const VALID_TABLE_STATUSES = ['EMPTY', 'NEW_ORDER', 'ACTIVE', 'AWAITING_PAYMENT', 'OFFLINE'] as const;

// GET tables
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    
    // Get single table by ID
    if (id) {
      const table = await db.table.findUnique({
        where: { id }
      });
      if (!table) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      return NextResponse.json(table);
    }
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }
    
    // Get by name
    if (name) {
      const table = await db.table.findFirst({
        where: {
          restaurantId,
          name: name.toUpperCase()
        }
      });
      
      if (!table) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      
      return NextResponse.json(table);
    }
    
    // List all tables for restaurant
    const tables = await db.table.findMany({
      where: { restaurantId },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ tables });
  } catch (error) {
    console.error('Error in GET /api/tables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create table
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const { restaurantId, name, label, seats = 2 } = body;
    
    if (!restaurantId || !name) {
      return NextResponse.json({ error: 'restaurantId and name are required' }, { status: 400 });
    }
    
    // Validate name format (e.g., T-01, B-01)
    const sanitizedName = sanitize(name, 10)?.toUpperCase();
    if (!sanitizedName || !/^[A-Z0-9-]+$/.test(sanitizedName)) {
      return NextResponse.json({ error: 'Invalid table name (use letters, numbers, hyphens only, max 10 chars)' }, { status: 400 });
    }
    
    if (!await hasRestaurantAccess(user.uid, restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if table name already exists for this restaurant
    const existingTable = await db.table.findFirst({
      where: {
        restaurantId,
        name: sanitizedName
      }
    });
    
    if (existingTable) {
      return NextResponse.json({ error: 'Table name already exists' }, { status: 400 });
    }
    
    // Get restaurant slug for QR URL
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { slug: true }
    });
    const slug = restaurant?.slug || restaurantId;
    
    const table = await db.table.create({
      data: {
        restaurantId,
        name: sanitizedName,
        label: sanitize(label, 50) || '',
        seats: Math.max(1, Math.min(20, parseInt(String(seats)) || 2)),
        status: 'EMPTY',
        qrCodeUrl: `/r/${slug}/t/${sanitizedName}`,
      }
    });
    
    return NextResponse.json({
      success: true,
      id: table.id,
      table,
    });
  } catch (error) {
    console.error('Error in POST /api/tables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update table
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const { id, name, label, seats, status, isActive } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 });
    }
    
    const table = await db.table.findUnique({
      where: { id }
    });
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    if (!await hasRestaurantAccess(user.uid, table.restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const updateData: any = {};
    
    if (name !== undefined) {
      const sanitizedName = sanitize(name, 10)?.toUpperCase();
      if (!sanitizedName || !/^[A-Z0-9-]+$/.test(sanitizedName)) {
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
      }
      
      // Check for duplicate name
      if (sanitizedName !== table.name) {
        const existingTable = await db.table.findFirst({
          where: {
            restaurantId: table.restaurantId,
            name: sanitizedName
          }
        });
        
        if (existingTable && existingTable.id !== id) {
          return NextResponse.json({ error: 'Table name already exists' }, { status: 400 });
        }
      }
      
      updateData.name = sanitizedName;
      // Update QR URL if name changes
      const restaurant = await db.restaurant.findUnique({
        where: { id: table.restaurantId },
        select: { slug: true }
      });
      const slug = restaurant?.slug || table.restaurantId;
      updateData.qrCodeUrl = `/r/${slug}/t/${sanitizedName}`;
    }
    
    if (label !== undefined) updateData.label = sanitize(label, 50) || '';
    if (seats !== undefined) updateData.seats = Math.max(1, Math.min(20, parseInt(String(seats)) || 2));
    if (status !== undefined) {
      if (!VALID_TABLE_STATUSES.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = status;
    }
    
    // Map legacy isActive parameter to OFFLINE status in Postgres
    if (isActive !== undefined) {
      if (isActive === false) {
        updateData.status = 'OFFLINE';
      } else if (isActive === true && (status === 'OFFLINE' || table.status === 'OFFLINE')) {
        updateData.status = 'EMPTY';
      }
    }
    
    await db.table.update({
      where: { id },
      data: updateData
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/tables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE table
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 });
    }
    
    const table = await db.table.findUnique({
      where: { id }
    });
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    if (!await hasRestaurantAccess(user.uid, table.restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if table has active order
    if (table.status === 'ACTIVE' || table.status === 'NEW_ORDER' || table.activeOrderId) {
      return NextResponse.json({ error: 'Cannot delete table with active order' }, { status: 400 });
    }
    
    await db.table.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/tables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
