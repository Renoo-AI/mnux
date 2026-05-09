import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { checkRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';
import { validateFormSubmission, checkBanned, trackSuspiciousActivity, getClientIp } from '@/lib/security-defense';

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

// Constants
const MAX_NOTES_LENGTH = 200;
const MAX_CUSTOMER_NAME_LENGTH = 50;
const MAX_ITEMS_PER_ORDER = 50;

// Sanitize string
function sanitize(str: string | undefined, maxLength: number): string {
  if (!str) return '';
  // Remove any HTML/script tags
  return str.replace(/<[^>]*>/g, '').slice(0, maxLength).trim();
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
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Verify restaurant exists and is active
    const restaurantDoc = await db.collection('restaurants').doc(restaurantId).get();
    if (!restaurantDoc.exists) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    
    const restaurantData = restaurantDoc.data();
    if (restaurantData?.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Restaurant is not active' }, { status: 400 });
    }
    
    // Verify table exists and belongs to restaurant
    const tableDoc = await db.collection('tables').doc(tableId).get();
    if (!tableDoc.exists) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    const tableData = tableDoc.data();
    if (tableData?.restaurantId !== restaurantId) {
      return NextResponse.json({ error: 'Table does not belong to this restaurant' }, { status: 400 });
    }
    
    // Check if table is offline
    if (tableData?.status === 'OFFLINE' || tableData?.isActive === false) {
      return NextResponse.json({ error: 'Table is currently unavailable' }, { status: 400 });
    }
    
    // Validate and recalculate prices from menu items
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
      
      // Fetch the actual menu item from database
      const menuItemDoc = await db.collection('menuItems').doc(item.itemId).get();
      
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
      
      // Use SERVER-SIDE price (never trust client price!)
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
    
    // Round total to 2 decimal places
    calculatedTotal = Math.round(calculatedTotal * 100) / 100;
    
    // Create order using transaction
    const orderRef = db.collection('orders').doc();
    const tableRef = db.collection('tables').doc(tableId);
    
    await db.runTransaction(async (transaction) => {
      // Create the order
      const orderData = {
        restaurantId,
        tableId,
        tableName: tableData?.name || tableId,
        items: validatedItems,
        subtotal: calculatedTotal,
        totalAmount: calculatedTotal,
        status: 'CREATED',
        customerName: sanitizedCustomerName || null,
        notes: sanitizedNotes || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Track source IP for security
        sourceIp: clientIp,
      };
      
      transaction.set(orderRef, orderData);
      
      // Update table status
      transaction.update(tableRef, {
        status: 'NEW_ORDER',
        activeOrderId: orderRef.id,
        updatedAt: Timestamp.now(),
      });
      
      // Log activity
      const logRef = db.collection('logs').doc();
      transaction.set(logRef, {
        restaurantId,
        action: 'ORDER_CREATED',
        targetType: 'order',
        targetId: orderRef.id,
        orderId: orderRef.id,
        tableId,
        metadata: {
          itemCount: validatedItems.length,
          total: calculatedTotal,
        },
        createdAt: Timestamp.now(),
      });
    });
    
    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      total: calculatedTotal,
      itemCount: validatedItems.length,
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
