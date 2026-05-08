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
  const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID;
  
  if (!SUPERADMIN_UID) {
    console.error('SECURITY ERROR: SUPERADMIN_UID not configured');
    return null;
  }
  
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

// POST - Generate magic link (requires SuperAdmin auth)
// POST with { action: 'verify', token: '...' } - Verify magic link (public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, token, restaurantId, restaurantSlug, expiresInDays = 7 } = body;

    // VERIFY ACTION - Public endpoint for magic link verification
    // Uses POST instead of GET for CSRF protection
    if (action === 'verify') {
      if (!token) {
        return NextResponse.json({ error: 'Token is required' }, { status: 400 });
      }

      // Validate token format (UUID)
      const tokenRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!tokenRegex.test(token)) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 400 });
      }

      const app = getAdminApp();
      const db = getFirestore(app);

      const doc = await db.collection('magic_links').doc(token).get();
      
      if (!doc.exists) {
        return NextResponse.json({ error: 'Invalid magic link' }, { status: 404 });
      }

      const data = doc.data();

      if (!data) {
        return NextResponse.json({ error: 'Invalid magic link data' }, { status: 500 });
      }

      if (data.isUsed) {
        return NextResponse.json({ error: 'Magic link already used' }, { status: 410 });
      }

      if (data.expiresAt && data.expiresAt < Date.now()) {
        return NextResponse.json({ error: 'Magic link expired' }, { status: 410 });
      }

      // Mark as used (atomic operation to prevent race conditions)
      await doc.ref.update({ 
        isUsed: true, 
        usedAt: Date.now(),
        usedByIp: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      });

      // Log the claim
      await db.collection('system_logs').add({
        type: 'MAGIC_LINK_CLAIMED',
        message: `Magic link claimed for restaurant ${data.restaurantSlug}`,
        details: { 
          restaurantId: data.restaurantId, 
          restaurantSlug: data.restaurantSlug,
          claimedAt: Date.now()
        },
        timestamp: Date.now(),
      });

      return NextResponse.json({ 
        success: true, 
        restaurantId: data.restaurantId,
        restaurantSlug: data.restaurantSlug,
      });
    }

    // GENERATE ACTION - Requires SuperAdmin authentication
    const user = await verifySuperAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!restaurantId || !restaurantSlug) {
      return NextResponse.json({ error: 'Restaurant ID and slug are required' }, { status: 400 });
    }

    // Validate inputs
    const sanitizedRestaurantId = sanitizeText(restaurantId, 128);
    const sanitizedSlug = sanitizeText(restaurantSlug, 50).toLowerCase().replace(/[^a-z0-9-]/g, '');
    const validExpiresInDays = Math.max(1, Math.min(30, Number(expiresInDays) || 7));

    const app = getAdminApp();
    const db = getFirestore(app);

    // Generate secure token using crypto.randomUUID
    const newToken = randomUUID();
    const expiresAt = Date.now() + (validExpiresInDays * 24 * 60 * 60 * 1000);

    await db.collection('magic_links').doc(newToken).set({
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
        token: newToken.slice(0, 8) + '...', 
        restaurantId: sanitizedRestaurantId,
        expiresInDays: validExpiresInDays 
      },
      timestamp: Date.now(),
      adminUid: user.uid,
    });

    // Build the magic link URL
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const magicLink = `${protocol}://${host}/auth/magic?t=${newToken}`;

    return NextResponse.json({ 
      success: true, 
      magicLink,
      expiresAt,
      expiresInDays: validExpiresInDays,
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Returns method not allowed (use POST for security)
export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with action parameter.',
    hint: 'POST { action: "verify", token: "..." } to verify a magic link'
  }, { status: 405 });
}
