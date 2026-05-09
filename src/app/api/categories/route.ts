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

// GET categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }
    
    const db = getFirestore(getAdminApp());
    const snapshot = await db.collection('categories')
      .where('restaurantId', '==', restaurantId)
      .orderBy('sortOrder', 'asc')
      .get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
    }));
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create category
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const { restaurantId, name, sortOrder = 0 } = body;
    
    if (!restaurantId || !name) {
      return NextResponse.json({ error: 'restaurantId and name are required' }, { status: 400 });
    }
    
    const db = getFirestore(getAdminApp());
    
    if (!await hasRestaurantAccess(db, user.uid, restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check plan limits
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    const restaurantData = restaurantDoc.data();
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    
    const categoryData = {
      restaurantId,
      name: sanitize(name, 50) || '',
      slug,
      sortOrder: Math.max(0, parseInt(String(sortOrder)) || 0),
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await db.collection('categories').add(categoryData);
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      category: { id: docRef.id, ...categoryData },
    });
  } catch (error) {
    console.error('Error in POST /api/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update category
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const { id, name, sortOrder, isActive } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    
    const db = getFirestore(getAdminApp());
    const doc = await db.collection('categories').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    const data = doc.data();
    if (!await hasRestaurantAccess(db, user.uid, data?.restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (name !== undefined) updateData.name = sanitize(name, 50);
    if (sortOrder !== undefined) updateData.sortOrder = Math.max(0, parseInt(String(sortOrder)) || 0);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    
    await db.collection('categories').doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }
    
    const db = getFirestore(getAdminApp());
    const doc = await db.collection('categories').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    
    const data = doc.data();
    if (!await hasRestaurantAccess(db, user.uid, data?.restaurantId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Delete all menu items in this category first
    const itemsSnapshot = await db.collection('menuItems')
      .where('categoryId', '==', id)
      .get();
    
    const batch = db.batch();
    itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(db.collection('categories').doc(id));
    await batch.commit();
    
    return NextResponse.json({ success: true, deletedItems: itemsSnapshot.size });
  } catch (error) {
    console.error('Error in DELETE /api/categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
