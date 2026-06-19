import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { verifySuperAdmin, getAdminApp } from '@/lib/admin-auth';

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

    if (!['pro', 'business', 'BASIC', 'PRO', 'MAX'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan. Use "pro", "business", "BASIC", "PRO", or "MAX"' }, { status: 400 });
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
