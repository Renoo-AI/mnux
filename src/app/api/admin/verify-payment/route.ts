import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

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

// POST - Verify payment and upgrade plan
export async function POST(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { restaurantId, plan = 'pro' } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 });
    }

    if (!['pro', 'business'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Use "pro" or "business"' }, { status: 400 });
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    // Get restaurant data
    const doc = await db.collection('restaurants').doc(restaurantId).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const previousData = doc.data();

    // Update plan
    await doc.ref.update({
      plan,
      paymentVerifiedAt: Date.now(),
      paymentVerifiedBy: user.uid,
      updatedAt: Date.now(),
    });

    // Log the action
    await db.collection('system_logs').add({
      type: 'PAYMENT_VERIFIED',
      message: `Payment verified for restaurant ${previousData?.name || restaurantId}`,
      details: { 
        restaurantId, 
        previousPlan: previousData?.plan,
        newPlan: plan,
      },
      timestamp: Date.now(),
      adminUid: user.uid,
    });

    return NextResponse.json({ 
      success: true, 
      restaurantId,
      newPlan: plan,
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
