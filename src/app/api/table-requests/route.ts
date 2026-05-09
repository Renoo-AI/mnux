import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { checkRateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit';
import { 
  validateFormSubmission, 
  checkBanned, 
  trackSuspiciousActivity,
  createHoneypotField 
} from '@/lib/security-defense';

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

// Rate limit configurations for table requests
const TABLE_REQUEST_LIMITS = {
  CALL_WAITER: {
    windowMs: 2 * 60 * 1000,         // 2 minutes
    maxRequests: 1,                   // 1 request per 2 minutes
    blockDurationMs: 5 * 60 * 1000,  // 5 minute block
    type: 'call_waiter',
  },
  REQUEST_BILL: {
    windowMs: 2 * 60 * 1000,         // 2 minutes
    maxRequests: 1,                   // 1 request per 2 minutes
    blockDurationMs: 5 * 60 * 1000,  // 5 minute block
    type: 'request_bill',
  },
  // Hourly limits
  HOURLY: {
    windowMs: 60 * 60 * 1000,        // 1 hour
    maxRequests: 5,                   // 5 requests per hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hour block
    type: 'table_requests_hourly',
  },
};

// Validation constants
const MAX_CUSTOMER_NAME_LENGTH = 50;
const MAX_NOTES_LENGTH = 200;

// POST - Create a table request (CALL_WAITER or REQUEST_BILL)
export async function POST(request: NextRequest) {
  try {
    // Check if IP is banned first
    const banCheck = await checkBanned(request);
    if (banCheck.isBanned) {
      return NextResponse.json(
        { 
          error: 'access_denied',
          message: 'لا يمكن تنفيذ هذا الطلب حالياً. حاول لاحقاً.',
          messageFr: 'Impossible de traiter cette demande pour le moment. Veuillez réessayer plus tard.'
        },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { 
      restaurantId, 
      tableId, 
      type, 
      orderId,
      customerName,
      notes 
    } = body;
    
    // Validate honeypot fields (bot detection)
    const clientIp = getClientIp(request);
    const formValidation = validateFormSubmission(request, body, `table_request:${clientIp}`);
    
    if (!formValidation.isValid) {
      // Track suspicious activity
      trackSuspiciousActivity(request, {
        type: 'honeypot_triggered',
        identifier: `table_request:${clientIp}`,
        details: { reason: formValidation.reason, restaurantId, type },
        timestamp: Date.now(),
      });
      
      // Return generic error (don't reveal honeypot detection)
      return NextResponse.json(
        { error: 'invalid_request', message: 'Invalid request' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!restaurantId || !tableId || !type) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'restaurantId, tableId, and type are required' },
        { status: 400 }
      );
    }
    
    // Validate type
    if (!['CALL_WAITER', 'REQUEST_BILL'].includes(type)) {
      return NextResponse.json(
        { error: 'invalid_type', message: 'type must be CALL_WAITER or REQUEST_BILL' },
        { status: 400 }
      );
    }
    
    // Rate limit by restaurant + table + type
    const rateLimitKey = `${restaurantId}:${tableId}:${type}`;
    const rateLimitConfig = TABLE_REQUEST_LIMITS[type as keyof typeof TABLE_REQUEST_LIMITS];
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfig);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'rate_limit_exceeded',
          message: 'يرجى الانتظار قليلاً قبل إعادة المحاولة',
          messageFr: 'Veuillez patienter avant de réessayer.',
          retryAfter: rateLimitResult.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 120),
          }
        }
      );
    }
    
    // Check hourly limit
    const hourlyKey = `${restaurantId}:${tableId}:hourly`;
    const hourlyResult = checkRateLimit(hourlyKey, TABLE_REQUEST_LIMITS.HOURLY);
    
    if (!hourlyResult.allowed) {
      return NextResponse.json(
        { 
          error: 'rate_limit_exceeded',
          message: 'تم تجاوز الحد المسموح من الطلبات لهذه الساعة',
          messageFr: 'Limite de demandes dépassée pour cette heure.',
          retryAfter: hourlyResult.retryAfter 
        },
        { status: 429 }
      );
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Verify restaurant exists and is active
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'Restaurant not found' },
        { status: 404 }
      );
    }
    
    const restaurantData = restaurantDoc.data();
    if (restaurantData?.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'restaurant_inactive', message: 'المطعم غير متاح حالياً' },
        { status: 400 }
      );
    }
    
    // Verify table exists and belongs to restaurant
    const tableDoc = await db.collection('tables').doc(tableId).get();
    if (!tableDoc.exists) {
      return NextResponse.json(
        { error: 'not_found', message: 'Table not found' },
        { status: 404 }
      );
    }
    
    const tableData = tableDoc.data();
    if (tableData?.restaurantId !== restaurantId) {
      return NextResponse.json(
        { error: 'invalid_table', message: 'Invalid table for this restaurant' },
        { status: 400 }
      );
    }
    
    // Check for existing pending request of same type
    const existingRequestQuery = await db.collection('table_requests')
      .where('restaurantId', '==', restaurantId)
      .where('tableId', '==', tableId)
      .where('type', '==', type)
      .where('status', 'in', ['PENDING', 'ACKNOWLEDGED'])
      .limit(1)
      .get();
    
    if (!existingRequestQuery.empty) {
      const existingRequest = existingRequestQuery.docs[0].data();
      
      // Return existing request info
      return NextResponse.json({
        success: false,
        error: 'request_already_exists',
        message: type === 'CALL_WAITER' 
          ? 'طلبك مازال قيد المعالجة' 
          : 'تم بالفعل طلب الفاتورة',
        messageFr: type === 'CALL_WAITER'
          ? 'Votre demande est en cours de traitement'
          : 'L\'addition a déjà été demandée',
        requestId: existingRequestQuery.docs[0].id,
        status: existingRequest.status,
      });
    }
    
    // For REQUEST_BILL, validate order status
    if (type === 'REQUEST_BILL') {
      if (!orderId && !tableData?.activeOrderId) {
        return NextResponse.json(
          { error: 'no_active_order', message: 'لا يوجد طلب نشط لطلب الفاتورة' },
          { status: 400 }
        );
      }
      
      const effectiveOrderId = orderId || tableData?.activeOrderId;
      if (effectiveOrderId) {
        const orderDoc = await db.collection('orders').doc(effectiveOrderId).get();
        if (orderDoc.exists) {
          const orderData = orderDoc.data();
          // Cannot request bill if order is cancelled/closed/paid
          if (['CANCELLED', 'CLOSED', 'PAID'].includes(orderData?.status)) {
            return NextResponse.json(
              { error: 'invalid_order_status', message: 'لا يمكن طلب الفاتورة لهذا الطلب' },
              { status: 400 }
            );
          }
        }
      }
    }
    
    // Sanitize inputs
    const sanitizedCustomerName = customerName 
      ? customerName.slice(0, MAX_CUSTOMER_NAME_LENGTH).trim() 
      : null;
    const sanitizedNotes = notes 
      ? notes.slice(0, MAX_NOTES_LENGTH).trim() 
      : null;
    
    // Create the request
    const requestRef = db.collection('table_requests').doc();
    
    const requestData = {
      id: requestRef.id,
      restaurantId,
      tableId,
      tableName: tableData?.name || tableId,
      type,
      status: 'PENDING',
      orderId: orderId || tableData?.activeOrderId || null,
      customerName: sanitizedCustomerName,
      notes: sanitizedNotes,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      sourceIp: clientIp,
    };
    
    await requestRef.set(requestData);
    
    // Log the request creation
    await db.collection('logs').add({
      restaurantId,
      action: 'TABLE_REQUEST_CREATED',
      targetType: 'table_request',
      targetId: requestRef.id,
      tableId,
      metadata: {
        type,
        tableName: tableData?.name,
      },
      createdAt: Timestamp.now(),
    });
    
    return NextResponse.json({
      success: true,
      requestId: requestRef.id,
      message: type === 'CALL_WAITER' 
        ? 'تم إرسال طلبك، سيأتي النادل قريباً' 
        : 'تم طلب الفاتورة، سيتم إحضارها قريباً',
      messageFr: type === 'CALL_WAITER'
        ? 'Demande envoyée, un serveur arrivera bientôt'
        : 'Addition demandée, elle sera apportée bientôt',
    });
    
  } catch (error) {
    console.error('Error creating table request:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'حدث خطأ. حاول مرة أخرى.' },
      { status: 500 }
    );
  }
}

// GET - Retrieve table requests (for staff)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status'); // PENDING, ACKNOWLEDGED, etc.
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'missing_restaurant_id', message: 'restaurantId is required' },
        { status: 400 }
      );
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    let query = db.collection('table_requests')
      .where('restaurantId', '==', restaurantId);
    
    if (status) {
      query = query.where('status', '==', status);
    } else {
      // Default: show pending and acknowledged
      query = query.where('status', 'in', ['PENDING', 'ACKNOWLEDGED']);
    }
    
    query = query.orderBy('createdAt', 'asc');
    
    const snapshot = await query.get();
    
    const requests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });
    
    return NextResponse.json({
      success: true,
      requests,
    });
    
  } catch (error) {
    console.error('Error fetching table requests:', error);
    return NextResponse.json(
      { error: 'internal_error', message: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
