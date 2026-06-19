import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { verifySuperAdmin, getAdminApp as getSharedAdminApp } from '@/lib/admin-auth';

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

// Verify auth token from header
async function verifyAuth(request: NextRequest): Promise<{ uid: string; email: string; isSuperadmin: boolean } | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(token);
    
    // Check for superadmin via custom claim or fallback UID
    // SECURITY: Fallback uses server-only env var (no NEXT_PUBLIC_ prefix)
    const FALLBACK_UID = process.env.SUPERADMIN_UID || '';
    const isSuperadmin = decoded.role === 'superadmin' || decoded.uid === FALLBACK_UID;
    
    return { 
      uid: decoded.uid, 
      email: decoded.email || '',
      isSuperadmin,
    };
  } catch {
    return null;
  }
}

// Check if user has access to restaurant
async function hasRestaurantAccess(db: ReturnType<typeof getFirestore>, uid: string, restaurantId: string): Promise<boolean> {
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
      if (!user.isSuperadmin) {
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
    if (user.isSuperadmin) {
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
    
    // SECURITY: Only superadmin can create non-free plan restaurants
    if (plan !== 'free' && !user.isSuperadmin) {
      return NextResponse.json({ error: 'Only administrators can create Pro plan restaurants' }, { status: 403 });
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Determine slug
    let finalSlug = slug?.toLowerCase().trim();
    
    // SECURITY: Free plan MUST use auto-generated slug
    if (plan === 'free') {
      finalSlug = generateFreeSlug();
    } else if (!finalSlug) {
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
      plan, // Already validated above
      slugType: plan === 'free' ? 'free-random' : 'custom',
      watermarkEnabled: plan === 'free', // SECURITY: Free plan MUST have watermark
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
    // SECURITY: Explicitly reject restricted fields from owners
    const { 
      id, 
      name, 
      status, 
      currency, 
      cuisineType, 
      address, 
      phone, 
      email, 
      logoUrl, 
      branding, 
      openingHours,
      // These fields are NOT allowed for owners
      plan,
      maxMenuItems,
      menuItemCount,
      watermarkEnabled,
      slug,
      slugType,
    } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Check ownership
    if (!user.isSuperadmin && !await hasRestaurantAccess(db, user.uid, id)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const docRef = db.collection('restaurants').doc(id);
    const doc = await docRef.get();
    const existingData = doc.data();
    
    // SECURITY: Reject attempts to modify restricted fields (owners only)
    if (!user.isSuperadmin) {
      if (plan !== undefined) {
        return NextResponse.json({ error: 'Cannot modify plan. Contact support to upgrade.' }, { status: 403 });
      }
      if (maxMenuItems !== undefined) {
        return NextResponse.json({ error: 'Cannot modify menu item limit.' }, { status: 403 });
      }
      if (menuItemCount !== undefined) {
        return NextResponse.json({ error: 'Cannot modify menu item count.' }, { status: 403 });
      }
      if (slug !== undefined || slugType !== undefined) {
        return NextResponse.json({ error: 'Cannot modify slug. Contact support to change your URL.' }, { status: 403 });
      }
      if (watermarkEnabled !== undefined && existingData?.plan === 'free') {
        return NextResponse.json({ error: 'Free plan requires watermark. Upgrade to Pro to remove it.' }, { status: 403 });
      }
    }
    
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
    
    // SECURITY: Superadmin-only fields
    if (user.isSuperadmin) {
      if (plan && ['free', 'pro', 'business'].includes(plan)) {
        updateData.plan = plan;
        // Update related fields when plan changes
        if (plan === 'free') {
          updateData.watermarkEnabled = true;
          updateData.maxMenuItems = 8;
        } else {
          updateData.maxMenuItems = 999;
        }
      }
      if (watermarkEnabled !== undefined) {
        updateData.watermarkEnabled = Boolean(watermarkEnabled);
      }
      if (maxMenuItems !== undefined) {
        updateData.maxMenuItems = Math.max(1, Math.min(999, Number(maxMenuItems)));
      }
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
    
    if (!user.isSuperadmin) {
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
