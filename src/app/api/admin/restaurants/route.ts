import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }
  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'menuxtn',
  });
  return adminApp;
}

async function verifySuperAdmin(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const idToken = authHeader.substring(7);
  const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID || 'rjAbnlO0deNZRavuHgfBsxRZTVY2';
  
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.uid !== SUPERADMIN_UID) return null;
    return { uid: decodedToken.uid };
  } catch {
    return null;
  }
}

function sanitizeText(text: string, maxLength: number = 200): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').slice(0, maxLength);
}

// GET - Fetch all restaurants
export async function GET(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    const snap = await db.collection('restaurants').get();
    const restaurants = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, restaurants });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch restaurants' }, { status: 500 });
  }
}

// POST - Create new restaurant
export async function POST(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, ownerUid, plan = 'free' } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    const app = getAdminApp();
    const db = getFirestore(app);
    
    const sanitizedData = {
      name: sanitizeText(name, 100),
      slug: sanitizeText(slug, 50).toLowerCase().replace(/[^a-z0-9-]/g, ''),
      ownerUid: ownerUid ? sanitizeText(ownerUid, 128) : 'unassigned',
      plan: ['free', 'pro', 'business'].includes(plan) ? plan : 'free',
      status: 'active',
      createdAt: Date.now(),
      createdBy: user.uid,
    };

    const docRef = await db.collection('restaurants').add(sanitizedData);

    // Log the action
    await db.collection('system_logs').add({
      type: 'RESTAURANT_CREATED',
      message: `Restaurant "${sanitizedData.name}" created`,
      details: { restaurantId: docRef.id, data: sanitizedData },
      timestamp: Date.now(),
      adminUid: user.uid,
    });

    return NextResponse.json({ 
      success: true, 
      restaurant: { id: docRef.id, ...sanitizedData } 
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    return NextResponse.json({ error: 'Failed to create restaurant' }, { status: 500 });
  }
}

// PUT - Update restaurant
export async function PUT(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    // Sanitize updates
    const sanitizedUpdates: Record<string, any> = {};
    if (updates.name) sanitizedUpdates.name = sanitizeText(updates.name, 100);
    if (updates.slug) sanitizedUpdates.slug = sanitizeText(updates.slug, 50).toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (updates.plan && ['free', 'pro', 'business'].includes(updates.plan)) {
      sanitizedUpdates.plan = updates.plan;
    }
    if (updates.status && ['active', 'inactive', 'offline'].includes(updates.status)) {
      sanitizedUpdates.status = updates.status;
    }
    if (updates.ownerUid) sanitizedUpdates.ownerUid = sanitizeText(updates.ownerUid, 128);
    sanitizedUpdates.updatedAt = Date.now();
    sanitizedUpdates.updatedBy = user.uid;

    await db.collection('restaurants').doc(id).update(sanitizedUpdates);

    // Log the action
    await db.collection('system_logs').add({
      type: 'RESTAURANT_UPDATED',
      message: `Restaurant ${id} updated`,
      details: { updates: sanitizedUpdates },
      timestamp: Date.now(),
      adminUid: user.uid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update restaurant error:', error);
    return NextResponse.json({ error: 'Failed to update restaurant' }, { status: 500 });
  }
}

// DELETE - Delete restaurant
export async function DELETE(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    // Get restaurant data before deletion for logging
    const doc = await db.collection('restaurants').doc(id).get();
    const restaurantData = doc.data();

    await db.collection('restaurants').doc(id).delete();

    // Log the action
    await db.collection('system_logs').add({
      type: 'RESTAURANT_DELETED',
      message: `Restaurant "${restaurantData?.name || id}" deleted`,
      details: { restaurantId: id, previousData: restaurantData },
      timestamp: Date.now(),
      adminUid: user.uid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    return NextResponse.json({ error: 'Failed to delete restaurant' }, { status: 500 });
  }
}
