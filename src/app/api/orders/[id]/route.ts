import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { db } from '@/lib/db';

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

// SECURITY: Uses server-only environment variable (no NEXT_PUBLIC_ prefix)
const SUPERADMIN_UID = process.env.SUPERADMIN_UID || '';

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

async function hasRestaurantAccess(uid: string, restaurantId: string): Promise<boolean> {
  if (uid === SUPERADMIN_UID) return true;
  const restaurant = await db.restaurant.findUnique({
    where: { id: restaurantId },
    select: { ownerUid: true, staffUids: true }
  });
  if (!restaurant) return false;
  const staffUids = restaurant.staffUids as Record<string, string> | null;
  return restaurant.ownerUid === uid || !!(staffUids && staffUids[uid] !== undefined);
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  'CREATED': ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  'ACCEPTED': ['PREPARING', 'SERVED', 'PAID', 'CANCELLED'],
  'PREPARING': ['SERVED', 'PAID', 'CANCELLED'],
  'SERVED': ['BILL_REQUESTED', 'PAID', 'CANCELLED'],
  'BILL_REQUESTED': ['PAID', 'CANCELLED'],
  'PAID': ['CLOSED'],
  'REJECTED': [],
  'CLOSED': [],
  'CANCELLED': [],
};

function getTableStatusForOrderStatus(status: string): string {
  switch (status) {
    case 'CREATED':
      return 'NEW_ORDER';
    case 'ACCEPTED':
    case 'PREPARING':
    case 'SERVED':
      return 'ACTIVE';
    case 'BILL_REQUESTED':
    case 'PAID':
      return 'AWAITING_PAYMENT';
    case 'CLOSED':
    case 'REJECTED':
    case 'CANCELLED':
      return 'EMPTY';
    default:
      return 'EMPTY';
  }
}

// PUT /api/orders/[id] - Perform secure status transition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    const body = await request.json();
    const { status, reason, actorId, actorName, actorRole } = body;
    
    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }
    
    // Fetch current order state
    const order = await db.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Validate state transition
    const allowedNextStatuses = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid transition: cannot change order status from ${order.status} to ${status}` 
      }, { status: 400 });
    }
    
    // Check authentication. 
    // Customer cancellation is allowed without cashier auth if the order is still in 'CREATED' status.
    const isCustomerCancel = status === 'CANCELLED' && order.status === 'CREATED';
    let userUid = '';
    
    if (!isCustomerCancel) {
      const authenticatedUser = await verifyAuth(request);
      if (!authenticatedUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userUid = authenticatedUser.uid;
      
      // Verify user has access to the restaurant
      const access = await hasRestaurantAccess(userUid, order.restaurantId);
      if (!access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // Execute status transition and side effects in a PostgreSQL transaction
    await db.$transaction(async (tx) => {
      const orderUpdateData: any = {
        status,
        updatedAt: new Date()
      };
      
      // Map transition timestamps
      if (status === 'ACCEPTED') {
        orderUpdateData.acceptedAt = new Date();
      } else if (status === 'PAID') {
        orderUpdateData.paidAt = new Date();
      } else if (status === 'CLOSED') {
        orderUpdateData.closedAt = new Date();
      } else if (status === 'CANCELLED') {
        orderUpdateData.cancelledAt = new Date();
        orderUpdateData.cancelReason = reason || 'Cancelled by staff';
      } else if (status === 'REJECTED') {
        orderUpdateData.rejectReason = reason || 'Rejected by staff';
      }
      
      // 1. Update order
      await tx.order.update({
        where: { id: orderId },
        data: orderUpdateData
      });
      
      // 2. Update table status and activeOrderId
      const tableStatus = getTableStatusForOrderStatus(status);
      const tableUpdateData: any = {
        status: tableStatus,
        updatedAt: new Date()
      };
      
      // Clear activeOrderId if the order is finalized (closed, rejected, or cancelled)
      if (['CLOSED', 'REJECTED', 'CANCELLED'].includes(status)) {
        tableUpdateData.activeOrderId = null;
      }
      
      await tx.table.update({
        where: { id: order.tableId },
        data: tableUpdateData
      });
      
      // 3. Create activity log
      await tx.activityLog.create({
        data: {
          restaurantId: order.restaurantId,
          actorId: actorId || (isCustomerCancel ? 'customer' : userUid),
          actorName: actorName || (isCustomerCancel ? 'Customer' : 'Staff'),
          actorRole: actorRole || (isCustomerCancel ? 'customer' : 'cashier'),
          action: `ORDER_${status}` as any, // ORDER_ACCEPTED, ORDER_PAID, ORDER_CLOSED, ORDER_CANCELLED, ORDER_REJECTED
          targetType: 'order',
          targetId: orderId,
          before: { status: order.status },
          after: { status },
          reason: reason || null,
          orderId: orderId,
          tableId: order.tableId
        }
      });
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
