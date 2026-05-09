import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

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

const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID || '';

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

async function hasRestaurantAccess(db: ReturnType<typeof getFirestore>, uid: string, restaurantId: string): Promise<boolean> {
  if (uid === SUPERADMIN_UID) return true;
  const doc = await db.collection('restaurants').doc(restaurantId).get();
  if (!doc.exists) return false;
  const data = doc.data();
  return data?.ownerUid === uid || data?.staffUids?.[uid] !== undefined;
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
    
    const db = getFirestore(getAdminApp());
    
    // Get single table by ID
    if (id) {
      const doc = await db.collection('tables').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      return NextResponse.json({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
      });
    }
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }
    
    // Get by name
    if (name) {
      const snapshot = await db.collection('tables')
        .where('restaurantId', '==', restaurantId)
        .where('name', '==', name)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return NextResponse.json({ error: 'Table not found' }, { status: 404 });
      }
      
      const doc = snapshot.docs[0];
      return NextResponse.json({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
      });
    }
    
    // List all tables for restaurant
    const snapshot = await db.collection('tables')
      .where('restaurantId', '==', restaurantId)
      .orderBy('name', 'asc')
      .get();
    
    const tables = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
    }));
    
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
    
    const db = getFirestore(getAdminApp());
    
    if (!await hasRestaurantAccess(db, user.uid, restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if table name already exists for this restaurant
    const existingTable = await db.collection('tables')
      .where('restaurantId', '==', restaurantId)
      .where('name', '==', sanitizedName)
      .limit(1)
      .get();
    
    if (!existingTable.empty) {
      return NextResponse.json({ error: 'Table name already exists' }, { status: 400 });
    }
    
    // Get restaurant slug for QR URL
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    const restaurantData = restaurantDoc.data();
    const slug = restaurantData?.slug || restaurantId;
    
    const tableData = {
      restaurantId,
      name: sanitizedName,
      label: sanitize(label, 50) || '',
      seats: Math.max(1, Math.min(20, parseInt(String(seats)) || 2)),
      status: 'EMPTY',
      qrCodeUrl: `/r/${slug}/t/${sanitizedName}`,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await db.collection('tables').add(tableData);
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      table: { id: docRef.id, ...tableData },
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
    
    const db = getFirestore(getAdminApp());
    const doc = await db.collection('tables').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    const data = doc.data();
    if (!await hasRestaurantAccess(db, user.uid, data?.restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
    
    if (name !== undefined) {
      const sanitizedName = sanitize(name, 10)?.toUpperCase();
      if (!sanitizedName || !/^[A-Z0-9-]+$/.test(sanitizedName)) {
        return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
      }
      
      // Check for duplicate name
      if (sanitizedName !== data?.name) {
        const existingTable = await db.collection('tables')
          .where('restaurantId', '==', data?.restaurantId)
          .where('name', '==', sanitizedName)
          .limit(1)
          .get();
        
        if (!existingTable.empty && existingTable.docs[0].id !== id) {
          return NextResponse.json({ error: 'Table name already exists' }, { status: 400 });
        }
      }
      
      updateData.name = sanitizedName;
      // Update QR URL if name changes
      const restaurantDoc = await db.collection('restaurants').doc(data?.restaurantId).get();
      const slug = restaurantDoc.data()?.slug || data?.restaurantId;
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
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    
    await db.collection('tables').doc(id).update(updateData);
    
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
    
    const db = getFirestore(getAdminApp());
    const doc = await db.collection('tables').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    const data = doc.data();
    if (!await hasRestaurantAccess(db, user.uid, data?.restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check if table has active order
    if (data?.status === 'ACTIVE' || data?.status === 'NEW_ORDER' || data?.activeOrderId) {
      return NextResponse.json({ error: 'Cannot delete table with active order' }, { status: 400 });
    }
    
    await db.collection('tables').doc(id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/tables:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
