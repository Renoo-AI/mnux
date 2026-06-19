import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';
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

// Fallback UID during migration
// SECURITY: Uses server-only environment variable (no NEXT_PUBLIC_ prefix)
const FALLBACK_SUPERADMIN_UID = process.env.SUPERADMIN_UID || '';

async function verifyAuth(request: NextRequest): Promise<{ uid: string; isSuperadmin: boolean } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  
  try {
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(authHeader.substring(7));
    
    // Check for superadmin via custom claim or fallback UID
    const isSuperadmin = decoded.role === 'superadmin' || decoded.uid === FALLBACK_SUPERADMIN_UID;
    
    return { uid: decoded.uid, isSuperadmin };
  } catch {
    return null;
  }
}

async function hasRestaurantAccess(db: ReturnType<typeof getFirestore>, uid: string, restaurantId: string, isSuperadmin: boolean): Promise<boolean> {
  if (isSuperadmin) return true;
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

// Validate price
function validatePrice(price: unknown): number | null {
  const num = parseFloat(String(price));
  if (isNaN(num) || num < 0 || num > 99999.99) return null;
  return Math.round(num * 100) / 100; // Round to 2 decimal places
}

// GET menu items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const categoryId = searchParams.get('categoryId');
    const id = searchParams.get('id');
    
    const db = getFirestore(getAdminApp());
    
    // Get single item by ID
    if (id) {
      const doc = await db.collection('menuItems').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
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
    
    // Build query
    let query = db.collection('menuItems')
      .where('restaurantId', '==', restaurantId);
    
    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }
    
    const snapshot = await query.orderBy('sortOrder', 'asc').get();
    
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
    }));
    
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error in GET /api/menu-items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create menu item
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const { restaurantId, categoryId, name, description, price, imageUrl, available = true, isFeatured = false, tags, allergens, sortOrder = 0 } = body;
    
    if (!restaurantId || !categoryId || !name || price === undefined) {
      return NextResponse.json({ error: 'restaurantId, categoryId, name, and price are required' }, { status: 400 });
    }
    
    const validatedPrice = validatePrice(price);
    if (validatedPrice === null) {
      return NextResponse.json({ error: 'Invalid price (must be 0-99999.99)' }, { status: 400 });
    }
    
    const db = getFirestore(getAdminApp());
    
    if (!await hasRestaurantAccess(db, user.uid, restaurantId, user.isSuperadmin)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Check plan limits
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    const restaurantData = restaurantDoc.data();
    
    if (restaurantData?.plan === 'free') {
      const existingItems = await db.collection('menuItems')
        .where('restaurantId', '==', restaurantId)
        .count()
        .get();
      
      const maxItems = restaurantData.maxMenuItems || 8;
      if (existingItems.data().count >= maxItems) {
        return NextResponse.json({ 
          error: `Free plan limited to ${maxItems} menu items. Upgrade to Pro for unlimited items.` 
        }, { status: 400 });
      }
    }
    
    // Verify category exists and belongs to restaurant
    const categoryDoc = await db.collection('categories').doc(categoryId).get();
    if (!categoryDoc.exists || categoryDoc.data()?.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }
    
    const itemData = {
      restaurantId,
      categoryId,
      name: sanitize(name, 100) || '',
      description: sanitize(description, 500),
      price: validatedPrice,
      imageUrl: sanitize(imageUrl, 500),
      available: Boolean(available),
      isFeatured: Boolean(isFeatured),
      tags: Array.isArray(tags) ? tags.slice(0, 10).map((t: string) => String(t).slice(0, 30)) : [],
      allergens: Array.isArray(allergens) ? allergens.slice(0, 10).map((a: string) => String(a).slice(0, 30)) : [],
      sortOrder: Math.max(0, parseInt(String(sortOrder)) || 0),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await db.collection('menuItems').add(itemData);
    
    // Increment menu item counter on restaurant document
    // This is used by Firestore rules to enforce free plan limits
    await db.collection('restaurants').doc(restaurantId).update({
      menuItemCount: admin.firestore.FieldValue.increment(1),
      updatedAt: Timestamp.now(),
    });
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      item: { id: docRef.id, ...itemData },
    });
  } catch (error) {
    console.error('Error in POST /api/menu-items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update menu item
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const body = await request.json();
    const { id, categoryId, name, description, price, imageUrl, available, isFeatured, tags, allergens, sortOrder } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
    }
    
    const db = getFirestore(getAdminApp());
    const doc = await db.collection('menuItems').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    const data = doc.data();
    if (!await hasRestaurantAccess(db, user.uid, data?.restaurantId, user.isSuperadmin)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const updateData: Record<string, unknown> = { updatedAt: Timestamp.now() };
    
    if (categoryId !== undefined) {
      // Verify new category belongs to same restaurant
      const catDoc = await db.collection('categories').doc(categoryId).get();
      if (!catDoc.exists || catDoc.data()?.restaurantId !== data?.restaurantId) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updateData.categoryId = categoryId;
    }
    if (name !== undefined) updateData.name = sanitize(name, 100);
    if (description !== undefined) updateData.description = sanitize(description, 500);
    if (price !== undefined) {
      const validatedPrice = validatePrice(price);
      if (validatedPrice === null) {
        return NextResponse.json({ error: 'Invalid price' }, { status: 400 });
      }
      updateData.price = validatedPrice;
    }
    if (imageUrl !== undefined) updateData.imageUrl = sanitize(imageUrl, 500);
    if (available !== undefined) updateData.available = Boolean(available);
    if (isFeatured !== undefined) updateData.isFeatured = Boolean(isFeatured);
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags.slice(0, 10).map((t: string) => String(t).slice(0, 30)) : [];
    if (allergens !== undefined) updateData.allergens = Array.isArray(allergens) ? allergens.slice(0, 10).map((a: string) => String(a).slice(0, 30)) : [];
    if (sortOrder !== undefined) updateData.sortOrder = Math.max(0, parseInt(String(sortOrder)) || 0);
    
    await db.collection('menuItems').doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/menu-items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE menu item
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Menu item ID is required' }, { status: 400 });
    }
    
    const db = getFirestore(getAdminApp());
    const doc = await db.collection('menuItems').doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Menu item not found' }, { status: 404 });
    }
    
    const data = doc.data();
    if (!await hasRestaurantAccess(db, user.uid, data?.restaurantId, user.isSuperadmin)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const restaurantId = data?.restaurantId;
    
    await db.collection('menuItems').doc(id).delete();
    
    // Decrement menu item counter on restaurant document
    // This is used by Firestore rules to enforce free plan limits
    if (restaurantId) {
      await db.collection('restaurants').doc(restaurantId).update({
        menuItemCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: Timestamp.now(),
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/menu-items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
