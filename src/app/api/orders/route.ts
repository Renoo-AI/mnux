import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { db } from '@/lib/db';
import { checkRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { validateFormSubmission, checkBanned, trackSuspiciousActivity, getClientIp } from '@/lib/security-defense';

// Initialize Firebase Admin (still needed to validate Firestore menu items and tokens)
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

// Constants
const MAX_NOTES_LENGTH = 200;
const MAX_CUSTOMER_NAME_LENGTH = 50;
const MAX_ITEMS_PER_ORDER = 50;

// Sanitize string
function sanitize(str: string | undefined, maxLength: number): string {
  if (!str) return '';
  return str.replace(/<[^>]*>/g, '').slice(0, maxLength).trim();
}

// GET - Retrieve orders (either a single order by ID or list of orders for a restaurant)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const restaurantId = searchParams.get('restaurantId');
    const activeOnly = searchParams.get('active') === 'true';

    // Get single order by ID
    if (id) {
      const order = await db.order.findUnique({
        where: { id },
        include: { items: true }
      });
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      return NextResponse.json(order);
    }

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId is required' }, { status: 400 });
    }

    // List orders for a restaurant
    const whereClause: any = { restaurantId };
    if (activeOnly) {
      whereClause.status = { in: ['CREATED', 'ACCEPTED', 'PAID'] };
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create secure order with server-side validation
export async function POST(request: NextRequest) {
  try {
    // Check if IP is banned first
    const banCheck = await checkBanned(request);
    if (banCheck.isBanned) {
      return NextResponse.json(
        { error: 'Access denied', message: 'Your access has been restricted.' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { restaurantId, tableId, items, customerName, notes } = body;
    
    // Validate honeypot fields (bot detection)
    const clientIp = getClientIp(request);
    const formValidation = validateFormSubmission(request, body, `order:${clientIp}`);
    
    if (!formValidation.isValid) {
      // Track suspicious activity
      trackSuspiciousActivity(request, {
        type: 'honeypot_triggered',
        identifier: `order:${clientIp}`,
        details: { reason: formValidation.reason, restaurantId },
        timestamp: Date.now(),
      });
      
      // Return generic error (don't reveal honeypot detection)
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
    
    // Rate limit by restaurant + table (prevent order spam)
    if (restaurantId && tableId) {
      const rateLimitKey = `${restaurantId}:${tableId}`;
      const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.orders);
      
      if (!rateLimitResult.allowed) {
        return rateLimitResponse(rateLimitResult.retryAfter);
      }
    }
    
    // Validate required fields
    if (!restaurantId || !tableId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'restaurantId, tableId, and items are required' }, { status: 400 });
    }
    
    // Validate items count
    if (items.length > MAX_ITEMS_PER_ORDER) {
      return NextResponse.json({ error: `Maximum ${MAX_ITEMS_PER_ORDER} items per order` }, { status: 400 });
    }
    
    // Sanitize inputs
    const sanitizedCustomerName = sanitize(customerName, MAX_CUSTOMER_NAME_LENGTH);
    const sanitizedNotes = sanitize(notes, MAX_NOTES_LENGTH);
    
    // Verify restaurant exists and is active using Prisma
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    });
    
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    if (restaurant.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Restaurant is not active' }, { status: 400 });
    }
    
    // Verify table exists and belongs to restaurant using Prisma
    const table = await db.table.findUnique({
      where: { id: tableId },
    });
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    if (table.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Table does not belong to this restaurant' }, { status: 400 });
    }
    if (table.status === 'OFFLINE') {
      return NextResponse.json({ error: 'Table is currently unavailable' }, { status: 400 });
    }
    
    // Validate and recalculate prices from menu items in Firestore
    const app = getAdminApp();
    const firestoreDb = getFirestore(app);
    
    const validatedItems: Array<{
      itemId: string;
      name: string;
      quantity: number;
      unitPrice: number;
      price: number;
      notes?: string;
    }> = [];
    
    let calculatedTotal = 0;
    
    for (const item of items) {
      // Validate item structure
      if (!item.itemId || typeof item.itemId !== 'string') {
        return NextResponse.json({ error: 'Invalid item: missing itemId' }, { status: 400 });
      }
      
      if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1 || item.quantity > 99) {
        return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
      }
      
      // Fetch the actual menu item from Firestore
      const menuItemDoc = await firestoreDb.collection('menuItems').doc(item.itemId).get();
      
      if (!menuItemDoc.exists) {
        return NextResponse.json({ error: `Menu item not found: ${item.itemId}` }, { status: 400 });
      }
      
      const menuItemData = menuItemDoc.data();
      
      // Verify menu item belongs to the restaurant
      if (menuItemData?.restaurantId !== restaurantId) {
        return NextResponse.json({ error: 'Invalid menu item for this restaurant' }, { status: 400 });
      }
      
      // Check if item is available
      if (menuItemData?.available === false) {
        return NextResponse.json({ error: `Item not available: ${menuItemData.name}` }, { status: 400 });
      }
      
      // Use SERVER-SIDE price
      const unitPrice = menuItemData?.price;
      if (typeof unitPrice !== 'number' || unitPrice < 0) {
        return NextResponse.json({ error: 'Invalid item price in database' }, { status: 500 });
      }
      
      const itemTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      calculatedTotal += itemTotal;
      
      validatedItems.push({
        itemId: item.itemId,
        name: menuItemData?.name || 'Unknown Item',
        quantity: item.quantity,
        unitPrice,
        price: itemTotal,
        notes: sanitize(item.notes, MAX_NOTES_LENGTH) || undefined,
      });
    }
    
    calculatedTotal = Math.round(calculatedTotal * 100) / 100;
    
    // Create order, update table status, and log activity in a PostgreSQL transaction
    const newOrder = await db.$transaction(async (tx) => {
      // Create the order
      const order = await tx.order.create({
        data: {
          restaurantId,
          tableId,
          tableName: table.name,
          subtotal: calculatedTotal,
          totalAmount: calculatedTotal,
          status: 'CREATED',
          customerName: sanitizedCustomerName || null,
          customerNote: sanitizedNotes || null,
          notes: sanitizedNotes || null,
          items: {
            create: validatedItems.map(item => ({
              itemId: item.itemId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              price: item.price,
              notes: item.notes || null,
            }))
          }
        }
      });
      
      // Update table status
      await tx.table.update({
        where: { id: tableId },
        data: {
          status: 'NEW_ORDER',
          activeOrderId: order.id,
        }
      });
      
      // Log activity
      await tx.activityLog.create({
        data: {
          restaurantId,
          action: 'ORDER_CREATED',
          targetType: 'order',
          targetId: order.id,
          orderId: order.id,
          tableId,
          actorId: 'customer',
          actorName: sanitizedCustomerName || 'Customer',
          actorRole: 'customer',
          metadata: {
            itemCount: validatedItems.length,
            total: calculatedTotal,
          }
        }
      });
      
      return order;
    });
    
    return NextResponse.json({
      success: true,
      orderId: newOrder.id,
      total: calculatedTotal,
      itemCount: validatedItems.length,
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
