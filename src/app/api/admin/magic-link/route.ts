import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { randomUUID } from 'crypto';

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

// POST - Generate magic link
export async function POST(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { restaurantId, restaurantSlug, expiresInDays = 7 } = body;

    if (!restaurantId || !restaurantSlug) {
      return NextResponse.json({ error: 'Restaurant ID and slug are required' }, { status: 400 });
    }

    // Validate inputs
    const sanitizedRestaurantId = sanitizeText(restaurantId, 128);
    const sanitizedSlug = sanitizeText(restaurantSlug, 50).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const validExpiresInDays = Math.max(1, Math.min(30, Number(expiresInDays) || 7));

    const app = getAdminApp();
    const db = getFirestore(app);

    // Generate secure token
    const token = randomUUID();
    const expiresAt = Date.now() + (validExpiresInDays * 24 * 60 * 60 * 1000);

    await db.collection('magic_links').doc(token).set({
      restaurantId: sanitizedRestaurantId,
      restaurantSlug: sanitizedSlug,
      createdAt: Date.now(),
      expiresAt,
      isUsed: false,
      createdBy: user.uid,
    });

    // Log the action
    await db.collection('system_logs').add({
      type: 'MAGIC_LINK_CREATED',
      message: `Magic link created for restaurant ${sanitizedSlug}`,
      details: { 
        token: token.slice(0, 8) + '...', 
        restaurantId: sanitizedRestaurantId,
        expiresInDays: validExpiresInDays 
      },
      timestamp: Date.now(),
      adminUid: user.uid,
    });

    // Build the magic link URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const magicLink = `${protocol}://${host}/auth/magic?t=${token}`;

    return NextResponse.json({ 
      success: true, 
      magicLink,
      expiresAt,
      expiresInDays: validExpiresInDays,
    });
  } catch (error) {
    console.error('Magic link generation error:', error);
    return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 });
  }
}

// GET - Verify magic link (public endpoint, no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('t');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    const doc = await db.collection('magic_links').doc(token).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: 'Invalid magic link' }, { status: 404 });
    }

    const data = doc.data();

    if (data?.isUsed) {
      return NextResponse.json({ error: 'Magic link already used' }, { status: 410 });
    }

    if (data?.expiresAt && data.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Magic link expired' }, { status: 410 });
    }

    // Mark as used
    await doc.ref.update({ isUsed: true, usedAt: Date.now() });

    // Log the claim
    await db.collection('system_logs').add({
      type: 'MAGIC_LINK_CLAIMED',
      message: `Magic link claimed for restaurant ${data.restaurantSlug}`,
      details: { restaurantId: data.restaurantId, restaurantSlug: data.restaurantSlug },
      timestamp: Date.now(),
    });

    return NextResponse.json({ 
      success: true, 
      restaurantId: data.restaurantId,
      restaurantSlug: data.restaurantSlug,
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json({ error: 'Failed to verify magic link' }, { status: 500 });
  }
}
