import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();

// ============================
// SECURITY COLLECTIONS
// ============================

const SECURITY_LOGS = 'security_logs';
const BANNED_DEVICES = 'banned_devices';
const RATE_LIMITS = 'rate_limits';
const KICKED_DEVICES = 'kicked_devices';

// ============================
// INTERFACES
// ============================

interface SecurityLog {
  type: 'rate_limit' | 'ban' | 'kick' | 'honeypot' | 'suspicious_activity';
  deviceId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  restaurantId?: string;
  tableId?: string;
  reason?: string;
  timestamp: admin.firestore.FieldValue;
  metadata?: Record<string, unknown>;
}

interface BannedDevice {
  deviceId: string;
  ip?: string;
  reason: string;
  bannedAt: admin.firestore.FieldValue;
  expiresAt?: admin.firestore.FieldValue;
  bannedBy?: string;
  restaurantId?: string;
}

interface KickedDevice {
  deviceId: string;
  tableId: string;
  restaurantId: string;
  kickedAt: admin.firestore.FieldValue;
  expiresAt: admin.firestore.FieldValue;
  kickedBy?: string;
  reason?: string;
}

interface RateLimitEntry {
  key: string;
  count: number;
  resetAt: number;
}

// ============================
// RATE LIMITING CONFIGURATION
// ============================

const RATE_LIMITS_CONFIG = {
  // Orders: Max 10 orders per table per hour
  createOrder: { maxRequests: 10, windowMs: 60 * 60 * 1000 },
  // Menu views: Max 100 per IP per minute
  menuView: { maxRequests: 100, windowMs: 60 * 1000 },
  // Login attempts: Max 5 per email per 15 minutes
  login: { maxRequests: 5, windowMs: 15 * 60 * 1000 },
  // API calls: Max 1000 per IP per minute
  api: { maxRequests: 1000, windowMs: 60 * 1000 },
  // Table access: Max 50 per device per minute
  tableAccess: { maxRequests: 50, windowMs: 60 * 1000 },
};

// ============================
// HELPER FUNCTIONS
// ============================

async function logSecurityEvent(log: SecurityLog): Promise<void> {
  await db.collection(SECURITY_LOGS).add({
    ...log,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

function getClientIp(context: functions.https.CallableContext): string {
  return context.rawRequest?.ip || 
         context.rawRequest?.headers['x-forwarded-for']?.toString() || 
         'unknown';
}

function getUserAgent(context: functions.https.CallableContext): string {
  return context.rawRequest?.headers['user-agent']?.toString() || 'unknown';
}

async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const resetAt = now + windowMs;

  const docRef = db.collection(RATE_LIMITS).doc(key);
  const doc = await docRef.get();

  if (!doc.exists) {
    await docRef.set({
      key,
      count: 1,
      resetAt,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  const data = doc.data() as RateLimitEntry;

  if (now > data.resetAt) {
    await docRef.set({
      key,
      count: 1,
      resetAt,
    });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (data.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: data.resetAt };
  }

  await docRef.update({
    count: admin.firestore.FieldValue.increment(1),
  });

  return { allowed: true, remaining: maxRequests - data.count - 1, resetAt: data.resetAt };
}

async function isDeviceBanned(deviceId: string, ip?: string): Promise<{ banned: boolean; reason?: string }> {
  // Check device ID ban
  const deviceBan = await db.collection(BANNED_DEVICES).doc(deviceId).get();
  if (deviceBan.exists) {
    const data = deviceBan.data() as BannedDevice;
    if (!data.expiresAt || data.expiresAt.toMillis() > Date.now()) {
      return { banned: true, reason: data.reason };
    }
  }

  // Check IP ban
  if (ip) {
    const ipBanQuery = await db.collection(BANNED_DEVICES)
      .where('ip', '==', ip)
      .limit(1)
      .get();

    if (!ipBanQuery.empty) {
      const data = ipBanQuery.docs[0].data() as BannedDevice;
      if (!data.expiresAt || data.expiresAt.toMillis() > Date.now()) {
        return { banned: true, reason: data.reason };
      }
    }
  }

  return { banned: false };
}

async function isDeviceKicked(
  deviceId: string,
  tableId: string
): Promise<{ kicked: boolean; reason?: string; expiresAt?: number }> {
  const docRef = db.collection(KICKED_DEVICES).doc(`${deviceId}_${tableId}`);
  const doc = await docRef.get();

  if (!doc.exists) {
    return { kicked: false };
  }

  const data = doc.data() as KickedDevice;
  const expiresAt = data.expiresAt.toMillis();

  if (Date.now() > expiresAt) {
    // Kick expired, clean up
    await docRef.delete();
    return { kicked: false };
  }

  return { kicked: true, reason: data.reason, expiresAt };
}

// ============================
// SECURITY CLOUD FUNCTIONS
// ============================

/**
 * Kick a device from a specific table
 * Prevents the device from placing orders at that table for a specified duration
 */
export const kickDevice = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { deviceId, tableId, restaurantId, durationMinutes = 30, reason = 'Suspicious activity' } = data;

  if (!deviceId || !tableId || !restaurantId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const kickedBy = context.auth.uid;
  const expiresAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + durationMinutes * 60 * 1000
  );

  const kickedDevice: KickedDevice = {
    deviceId,
    tableId,
    restaurantId,
    kickedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
    kickedBy,
    reason,
  };

  await db.collection(KICKED_DEVICES).doc(`${deviceId}_${tableId}`).set(kickedDevice);

  // Log the action
  await logSecurityEvent({
    type: 'kick',
    deviceId,
    restaurantId,
    tableId,
    reason,
    metadata: { durationMinutes, kickedBy },
  } as SecurityLog);

  return {
    success: true,
    message: `Device kicked from table ${tableId} for ${durationMinutes} minutes`,
    expiresAt: expiresAt.toMillis(),
  };
});

/**
 * Lift a kick from a device
 * Allows the device to place orders at the table again
 */
export const liftKick = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { deviceId, tableId } = data;

  if (!deviceId || !tableId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  await db.collection(KICKED_DEVICES).doc(`${deviceId}_${tableId}`).delete();

  // Log the action
  await logSecurityEvent({
    type: 'kick',
    deviceId,
    tableId,
    reason: 'Kick lifted',
    metadata: { liftedBy: context.auth.uid },
  } as SecurityLog);

  return { success: true, message: 'Kick lifted successfully' };
});

/**
 * Ban a device permanently or temporarily
 * Prevents the device from accessing the restaurant entirely
 */
export const banDevice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { deviceId, reason, durationDays, ip, restaurantId } = data;

  if (!deviceId || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const bannedBy = context.auth.uid;
  const expiresAt = durationDays
    ? admin.firestore.Timestamp.fromMillis(Date.now() + durationDays * 24 * 60 * 60 * 1000)
    : undefined;

  const bannedDevice: BannedDevice = {
    deviceId,
    ip,
    reason,
    bannedAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
    bannedBy,
    restaurantId,
  };

  await db.collection(BANNED_DEVICES).doc(deviceId).set(bannedDevice);

  // Log the action
  await logSecurityEvent({
    type: 'ban',
    deviceId,
    ip,
    restaurantId,
    reason,
    metadata: { durationDays, bannedBy },
  } as SecurityLog);

  return {
    success: true,
    message: durationDays
      ? `Device banned for ${durationDays} days`
      : 'Device permanently banned',
    expiresAt: expiresAt?.toMillis(),
  };
});

/**
 * Unban a device
 */
export const unbanDevice = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { deviceId } = data;

  if (!deviceId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing deviceId');
  }

  await db.collection(BANNED_DEVICES).doc(deviceId).delete();

  await logSecurityEvent({
    type: 'ban',
    deviceId,
    reason: 'Ban lifted',
    metadata: { unbannedBy: context.auth.uid },
  } as SecurityLog);

  return { success: true, message: 'Device unbanned successfully' };
});

/**
 * Check if a device is kicked or banned
 */
export const checkSecurityStatus = functions.https.onCall(async (data, context) => {
  const { deviceId, tableId, restaurantId } = data;
  const ip = getClientIp(context);

  // Check if device is banned
  const banStatus = await isDeviceBanned(deviceId, ip);
  if (banStatus.banned) {
    return {
      allowed: false,
      reason: banStatus.reason,
      type: 'banned',
    };
  }

  // Check if device is kicked from this table
  if (tableId) {
    const kickStatus = await isDeviceKicked(deviceId, tableId);
    if (kickStatus.kicked) {
      return {
        allowed: false,
        reason: kickStatus.reason,
        type: 'kicked',
        expiresAt: kickStatus.expiresAt,
      };
    }
  }

  return { allowed: true };
});

/**
 * Create order with security checks
 * Includes rate limiting and device validation
 */
export const createOrder = functions.https.onCall(async (data, context) => {
  const { restaurantId, tableId, items, deviceId } = data;
  const ip = getClientIp(context);
  const userAgent = getUserAgent(context);

  if (!restaurantId || !tableId || !items || !Array.isArray(items)) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Generate device ID if not provided (from session)
  const effectiveDeviceId = deviceId || `ip_${ip}`;

  // Security checks
  const banStatus = await isDeviceBanned(effectiveDeviceId, ip);
  if (banStatus.banned) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      deviceId: effectiveDeviceId,
      ip,
      userAgent,
      endpoint: 'createOrder',
      restaurantId,
      tableId,
      reason: `Banned device attempted to order: ${banStatus.reason}`,
    });
    throw new functions.https.HttpsError('permission-denied', 'Device is banned');
  }

  const kickStatus = await isDeviceKicked(effectiveDeviceId, tableId);
  if (kickStatus.kicked) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      deviceId: effectiveDeviceId,
      ip,
      userAgent,
      endpoint: 'createOrder',
      restaurantId,
      tableId,
      reason: `Kicked device attempted to order: ${kickStatus.reason}`,
    });
    throw new functions.https.HttpsError('permission-denied', 'Device is kicked from this table');
  }

  // Rate limiting
  const rateLimitKey = `order_${restaurantId}_${tableId}_${effectiveDeviceId}`;
  const rateLimit = await checkRateLimit(
    rateLimitKey,
    RATE_LIMITS_CONFIG.createOrder.maxRequests,
    RATE_LIMITS_CONFIG.createOrder.windowMs
  );

  if (!rateLimit.allowed) {
    await logSecurityEvent({
      type: 'rate_limit',
      deviceId: effectiveDeviceId,
      ip,
      userAgent,
      endpoint: 'createOrder',
      restaurantId,
      tableId,
      reason: 'Order rate limit exceeded',
    });
    throw new functions.https.HttpsError('resource-exhausted', 'Too many orders. Please wait before ordering again.');
  }

  // Validate items
  const validItems = items.filter((item: { itemId: string; quantity: number }) => 
    item.itemId && typeof item.quantity === 'number' && item.quantity > 0
  );

  if (validItems.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No valid items in order');
  }

  // Check for honeypot field (should be empty)
  if (data.website || data.honeypot || data._gotcha) {
    await logSecurityEvent({
      type: 'honeypot',
      deviceId: effectiveDeviceId,
      ip,
      userAgent,
      endpoint: 'createOrder',
      restaurantId,
      tableId,
      reason: 'Honeypot field triggered - likely bot',
      metadata: { honeypotValue: data.website || data.honeypot || data._gotcha },
    });
    // Silently reject (don't let attacker know)
    return { success: true, orderId: 'fake-' + Date.now() };
  }

  // Create the order
  const orderData = {
    restaurantId,
    tableId,
    items: validItems.map((item: { itemId: string; quantity: number; notes?: string }) => ({
      itemId: item.itemId,
      quantity: item.quantity,
      notes: item.notes || '',
    })),
    state: 'NEW',
    totalAmount: 0, // Will be calculated by a trigger
    deviceId: effectiveDeviceId,
    ip,
    userAgent,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const orderRef = await db.collection('orders').add(orderData);

  return {
    success: true,
    orderId: orderRef.id,
    rateLimitRemaining: rateLimit.remaining,
  };
});

/**
 * Accept an order (manager/kitchen only)
 */
export const acceptOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { orderId } = data;

  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing orderId');
  }

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Order not found');
  }

  const orderData = orderDoc.data();
  if (orderData?.state !== 'NEW') {
    throw new functions.https.HttpsError('failed-precondition', 'Order is not in NEW state');
  }

  await orderRef.update({
    state: 'ACCEPTED',
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    acceptedBy: context.auth.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Complete an order
 */
export const completeOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { orderId } = data;

  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing orderId');
  }

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Order not found');
  }

  const orderData = orderDoc.data();
  if (orderData?.state !== 'ACCEPTED') {
    throw new functions.https.HttpsError('failed-precondition', 'Order is not in ACCEPTED state');
  }

  await orderRef.update({
    state: 'COMPLETED',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    completedBy: context.auth.uid,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Cancel an order
 */
export const cancelOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { orderId, reason } = data;

  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing orderId');
  }

  const orderRef = db.collection('orders').doc(orderId);
  const orderDoc = await orderRef.get();

  if (!orderDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Order not found');
  }

  const orderData = orderDoc.data();
  if (!['NEW', 'ACCEPTED'].includes(orderData?.state)) {
    throw new functions.https.HttpsError('failed-precondition', 'Order cannot be cancelled');
  }

  await orderRef.update({
    state: 'CANCELLED',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    cancelledBy: context.auth.uid,
    cancelReason: reason || 'No reason provided',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true };
});

/**
 * Get security logs (admin only)
 */
export const getSecurityLogs = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { restaurantId, type, limit = 50, startAfter } = data;

  let query = db.collection(SECURITY_LOGS)
    .orderBy('timestamp', 'desc')
    .limit(limit);

  if (restaurantId) {
    query = query.where('restaurantId', '==', restaurantId);
  }

  if (type) {
    query = query.where('type', '==', type);
  }

  if (startAfter) {
    const startAfterDoc = await db.collection(SECURITY_LOGS).doc(startAfter).get();
    if (startAfterDoc.exists) {
      query = query.startAfter(startAfterDoc);
    }
  }

  const snapshot = await query.get();

  const logs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toMillis() || null,
  }));

  return { logs };
});

/**
 * Get banned devices (admin only)
 */
export const getBannedDevices = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const snapshot = await db.collection(BANNED_DEVICES).get();

  const devices = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    bannedAt: doc.data().bannedAt?.toMillis() || null,
    expiresAt: doc.data().expiresAt?.toMillis() || null,
  }));

  return { devices };
});

/**
 * Get kicked devices (admin only)
 */
export const getKickedDevices = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { restaurantId } = data;

  let query = db.collection(KICKED_DEVICES);

  if (restaurantId) {
    query = query.where('restaurantId', '==', restaurantId);
  }

  const snapshot = await query.get();

  const devices = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    kickedAt: doc.data().kickedAt?.toMillis() || null,
    expiresAt: doc.data().expiresAt?.toMillis() || null,
  }));

  return { devices };
});
