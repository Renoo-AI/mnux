import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin
function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials');
  }
  
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID || '';

// Verify auth token from header
async function verifyAuth(request: NextRequest): Promise<{ uid: string; email: string } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email || '' };
  } catch {
    return null;
  }
}

// Check if user is superadmin
function isSuperadmin(uid: string): boolean {
  return uid === SUPERADMIN_UID;
}

// Check if user has access to restaurant
async function hasRestaurantAccess(db: ReturnType<typeof getFirestore>, uid: string, restaurantId: string): Promise<boolean> {
  if (isSuperadmin(uid)) return true;
  
  const doc = await db.collection('restaurants').doc(restaurantId).get();
  if (!doc.exists) return false;
  
  const data = doc.data();
  return data?.ownerUid === uid || data?.staffUids?.[uid] !== undefined;
}

// Generate random free slug
function generateFreeSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'free-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// GET - List restaurants
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    
    // Get by ID
    if (id) {
      const doc = await db.collection('restaurants').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }
      
      // Check access
      if (!isSuperadmin(user.uid)) {
        const data = doc.data();
        if (data?.ownerUid !== user.uid && !data?.staffUids?.[user.uid]) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }
      
      return NextResponse.json({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
      });
    }
    
    // Get by slug (public)
    if (slug) {
      const snapshot = await db.collection('restaurants')
        .where('slug', '==', slug)
        .where('status', '==', 'ACTIVE')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
      }
      
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      // Return public data only
      return NextResponse.json({
        id: doc.id,
        slug: data.slug,
        name: data.name,
        currency: data.currency,
        cuisineType: data.cuisineType,
        address: data.address,
        logoUrl: data.logoUrl,
        phone: data.phone,
        plan: data.plan,
        watermarkEnabled: data.watermarkEnabled,
        branding: data.branding,
        openingHours: data.openingHours,
      });
    }
    
    // List all restaurants for admin/owner
    if (isSuperadmin(user.uid)) {
      const snapshot = await db.collection('restaurants').get();
      const restaurants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
      }));
      return NextResponse.json({ restaurants });
    }
    
    // Get restaurants where user is owner or staff
    const ownerSnapshot = await db.collection('restaurants')
      .where('ownerUid', '==', user.uid)
      .get();
    
    const restaurants = ownerSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()?.createdAt?.toDate?.()?.toISOString(),
      updatedAt: doc.data()?.updatedAt?.toDate?.()?.toISOString(),
    }));
    
    return NextResponse.json({ restaurants });
  } catch (error) {
    console.error('Error in GET /api/restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create restaurant
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { name, slug, currency = 'EUR', plan = 'free' } = body;
    
    if (!name || typeof name !== 'string' || name.length > 100) {
      return NextResponse.json({ error: 'Valid name is required (max 100 chars)' }, { status: 400 });
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Determine slug
    let finalSlug = slug?.toLowerCase().trim();
    
    if (plan === 'free' || !finalSlug) {
      // Generate random slug for free plan
      finalSlug = generateFreeSlug();
    }
    
    // Check if slug already exists
    const existingSlug = await db.collection('restaurants')
      .where('slug', '==', finalSlug)
      .limit(1)
      .get();
    
    if (!existingSlug.empty) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    
    // Create restaurant
    const restaurantData = {
      slug: finalSlug,
      name,
      status: 'ACTIVE',
      currency,
      plan,
      slugType: plan === 'free' ? 'free-random' : 'custom',
      watermarkEnabled: plan === 'free',
      maxMenuItems: plan === 'free' ? 8 : 999,
      menuItemCount: 0, // Counter for Firestore rules enforcement
      ownerUid: user.uid,
      staffUids: { [user.uid]: 'owner' },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    const docRef = await db.collection('restaurants').add(restaurantData);
    
    return NextResponse.json({
      success: true,
      id: docRef.id,
      slug: finalSlug,
      restaurant: {
        id: docRef.id,
        ...restaurantData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error in POST /api/restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update restaurant
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, name, status, currency, cuisineType, address, phone, email, logoUrl, branding, openingHours } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Check ownership
    if (!await hasRestaurantAccess(db, user.uid, id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const docRef = db.collection('restaurants').doc(id);
    const doc = await docRef.get();
    const existingData = doc.data();
    
    // Prepare update data (only allowed fields)
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    };
    
    if (name && typeof name === 'string' && name.length <= 100) {
      updateData.name = name;
    }
    if (status && ['ACTIVE', 'OFFLINE'].includes(status)) {
      updateData.status = status;
    }
    if (currency && ['TND', 'QAR', 'EUR', 'USD'].includes(currency)) {
      updateData.currency = currency;
    }
    if (cuisineType !== undefined) updateData.cuisineType = cuisineType?.slice(0, 50);
    if (address !== undefined) updateData.address = address?.slice(0, 200);
    if (phone !== undefined) updateData.phone = phone?.slice(0, 20);
    if (email !== undefined) updateData.email = email?.slice(0, 100);
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    
    // Branding only for pro plan
    if (existingData?.plan === 'pro' && branding) {
      updateData.branding = branding;
    }
    
    if (openingHours) {
      updateData.openingHours = openingHours;
    }
    
    await docRef.update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete restaurant (superadmin only)
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!isSuperadmin(user.uid)) {
      return NextResponse.json({ error: 'Only superadmin can delete restaurants' }, { status: 403 });
    }
    
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    await db.collection('restaurants').doc(id).delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/restaurant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
