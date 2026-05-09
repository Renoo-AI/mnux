/**
 * Security Events Service
 * 
 * Centralized logging for security-related events.
 * All events are written to Firestore for audit trail and analysis.
 */

import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';

// Security event types
export type SecurityEventType =
  | 'RATE_LIMIT_HIT'
  | 'HONEYPOT_TRIGGERED'
  | 'BAN_CREATED'
  | 'BAN_EXPIRED'
  | 'STAFF_LOGIN_SUCCESS'
  | 'STAFF_LOGIN_FAILED'
  | 'STAFF_LOCKOUT'
  | 'ORDER_SPAM_BLOCKED'
  | 'TABLE_REQUEST_SPAM_BLOCKED'
  | 'REVIEW_SPAM_BLOCKED'
  | 'INVALID_STATUS_UPDATE_ATTEMPT'
  | 'UNAUTHORIZED_ADMIN_ROUTE_ATTEMPT'
  | 'UNAUTHORIZED_STAFF_ROUTE_ATTEMPT'
  | 'APP_CHECK_MISSING_OR_INVALID'
  | 'SUSPICIOUS_PATTERN_DETECTED'
  | 'PRICE_MANIPULATION_ATTEMPT'
  | 'INVALID_FIELD_SUBMISSION';

// Severity levels
export type SecurityEventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Actor types
export type SecurityActorType = 'CUSTOMER' | 'STAFF' | 'OWNER' | 'ADMIN' | 'SYSTEM' | 'UNKNOWN';

// Security event interface
export interface SecurityEvent {
  id?: string;
  restaurantId?: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  actorType: SecurityActorType;
  actorId?: string;
  tableId?: string;
  orderId?: string;
  ipAddress?: string;
  userAgent?: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

// Get Firebase Admin app
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

/**
 * Log a security event to Firestore
 */
export async function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'createdAt'>): Promise<string> {
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    
    const eventRef = db.collection('security_events').doc();
    
    const fullEvent: SecurityEvent = {
      ...event,
      id: eventRef.id,
      createdAt: Timestamp.now(),
    };
    
    await eventRef.set(fullEvent);
    
    // Also log to console for monitoring
    const logLevel = event.severity === 'CRITICAL' ? 'error' : 
                     event.severity === 'HIGH' ? 'warn' : 'info';
    console[logLevel](`[SECURITY] ${event.eventType}: ${event.message}`, {
      restaurantId: event.restaurantId,
      actorType: event.actorType,
      actorId: event.actorId,
      ipAddress: event.ipAddress,
    });
    
    return eventRef.id;
  } catch (error) {
    console.error('Error logging security event:', error);
    // Don't throw - security logging should not break the app
    return '';
  }
}

/**
 * Log rate limit hit
 */
export async function logRateLimitHit(params: {
  restaurantId?: string;
  tableId?: string;
  ipAddress: string;
  action: string;
  retryAfter: number;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'RATE_LIMIT_HIT',
    severity: 'LOW',
    actorType: 'UNKNOWN',
    ipAddress: params.ipAddress,
    restaurantId: params.restaurantId,
    tableId: params.tableId,
    message: `Rate limit hit for action: ${params.action}`,
    metadata: {
      action: params.action,
      retryAfter: params.retryAfter,
    },
  });
}

/**
 * Log honeypot trigger
 */
export async function logHoneypotTrigger(params: {
  restaurantId?: string;
  tableId?: string;
  ipAddress: string;
  fieldName: string;
  userAgent?: string;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'HONEYPOT_TRIGGERED',
    severity: 'HIGH',
    actorType: 'UNKNOWN',
    ipAddress: params.ipAddress,
    restaurantId: params.restaurantId,
    tableId: params.tableId,
    message: `Honeypot field '${params.fieldName}' was filled`,
    metadata: {
      fieldName: params.fieldName,
      userAgent: params.userAgent,
    },
  });
}

/**
 * Log staff login failure
 */
export async function logStaffLoginFailed(params: {
  restaurantId: string;
  ipAddress: string;
  restaurantSlug: string;
  reason: string;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'STAFF_LOGIN_FAILED',
    severity: 'MEDIUM',
    actorType: 'UNKNOWN',
    ipAddress: params.ipAddress,
    restaurantId: params.restaurantId,
    message: `Staff login failed: ${params.reason}`,
    metadata: {
      restaurantSlug: params.restaurantSlug,
      reason: params.reason,
    },
  });
}

/**
 * Log staff lockout
 */
export async function logStaffLockout(params: {
  restaurantId: string;
  ipAddress: string;
  attemptsCount: number;
  lockoutDuration: number;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'STAFF_LOCKOUT',
    severity: 'HIGH',
    actorType: 'UNKNOWN',
    ipAddress: params.ipAddress,
    restaurantId: params.restaurantId,
    message: `Staff lockout triggered after ${params.attemptsCount} failed attempts`,
    metadata: {
      attemptsCount: params.attemptsCount,
      lockoutDuration: params.lockoutDuration,
    },
  });
}

/**
 * Log ban creation
 */
export async function logBanCreated(params: {
  restaurantId?: string;
  targetType: 'CUSTOMER_SESSION' | 'TABLE' | 'IP_HASH' | 'FCM_TOKEN' | 'STAFF_SESSION';
  targetId: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  expiresAt?: number;
  createdBy: string;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'BAN_CREATED',
    severity: params.severity === 'HIGH' ? 'HIGH' : 'MEDIUM',
    actorType: createdBy === 'system' ? 'SYSTEM' : 'OWNER',
    actorId: createdBy !== 'system' ? createdBy : undefined,
    restaurantId: params.restaurantId,
    message: `Ban created for ${params.targetType}: ${params.reason}`,
    metadata: {
      targetType: params.targetType,
      targetId: params.targetId,
      reason: params.reason,
      expiresAt: params.expiresAt,
    },
  });
}

/**
 * Log unauthorized route access attempt
 */
export async function logUnauthorizedAccess(params: {
  route: string;
  ipAddress: string;
  userAgent?: string;
  requiredRole: string;
  actualRole?: string;
  userId?: string;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'UNAUTHORIZED_ADMIN_ROUTE_ATTEMPT',
    severity: 'HIGH',
    actorType: params.userId ? 'STAFF' : 'UNKNOWN',
    actorId: params.userId,
    ipAddress: params.ipAddress,
    message: `Unauthorized access attempt to ${params.route}`,
    metadata: {
      route: params.route,
      requiredRole: params.requiredRole,
      actualRole: params.actualRole,
      userAgent: params.userAgent,
    },
  });
}

/**
 * Log invalid status update attempt
 */
export async function logInvalidStatusUpdate(params: {
  restaurantId: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  actorId?: string;
  actorType?: SecurityActorType;
  ipAddress?: string;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'INVALID_STATUS_UPDATE_ATTEMPT',
    severity: 'MEDIUM',
    actorType: params.actorType || 'UNKNOWN',
    actorId: params.actorId,
    restaurantId: params.restaurantId,
    orderId: params.orderId,
    ipAddress: params.ipAddress,
    message: `Invalid status transition: ${params.fromStatus} -> ${params.toStatus}`,
    metadata: {
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
    },
  });
}

/**
 * Log price manipulation attempt
 */
export async function logPriceManipulation(params: {
  restaurantId: string;
  tableId?: string;
  orderId?: string;
  itemId: string;
  clientPrice: number;
  serverPrice: number;
  ipAddress: string;
}): Promise<string> {
  return logSecurityEvent({
    eventType: 'PRICE_MANIPULATION_ATTEMPT',
    severity: 'CRITICAL',
    actorType: 'CUSTOMER',
    restaurantId: params.restaurantId,
    tableId: params.tableId,
    orderId: params.orderId,
    ipAddress: params.ipAddress,
    message: `Price manipulation attempt: client sent ${params.clientPrice}, server has ${params.serverPrice}`,
    metadata: {
      itemId: params.itemId,
      clientPrice: params.clientPrice,
      serverPrice: params.serverPrice,
    },
  });
}

/**
 * Query security events for a restaurant
 */
export async function getSecurityEvents(params: {
  restaurantId: string;
  eventType?: SecurityEventType;
  severity?: SecurityEventSeverity;
  limit?: number;
  startAfter?: string;
}): Promise<SecurityEvent[]> {
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    
    let query = db.collection('security_events')
      .where('restaurantId', '==', params.restaurantId)
      .orderBy('createdAt', 'desc');
    
    if (params.eventType) {
      query = query.where('eventType', '==', params.eventType);
    }
    
    if (params.severity) {
      query = query.where('severity', '==', params.severity);
    }
    
    query = query.limit(params.limit || 50);
    
    if (params.startAfter) {
      const startAfterDoc = await db.collection('security_events').doc(params.startAfter).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }
    
    const snapshot = await query.get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt,
      } as SecurityEvent;
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return [];
  }
}

/**
 * Get security event counts for dashboard
 */
export async function getSecurityEventCounts(params: {
  restaurantId: string;
  since: Date;
}): Promise<{
  total: number;
  bySeverity: Record<SecurityEventSeverity, number>;
  byType: Record<string, number>;
}> {
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    
    const snapshot = await db.collection('security_events')
      .where('restaurantId', '==', params.restaurantId)
      .where('createdAt', '>=', Timestamp.fromDate(params.since))
      .get();
    
    const counts = {
      total: snapshot.size,
      bySeverity: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0,
      } as Record<SecurityEventSeverity, number>,
      byType: {} as Record<string, number>,
    };
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      
      // Count by severity
      if (data.severity && counts.bySeverity[data.severity] !== undefined) {
        counts.bySeverity[data.severity]++;
      }
      
      // Count by type
      if (data.eventType) {
        counts.byType[data.eventType] = (counts.byType[data.eventType] || 0) + 1;
      }
    });
    
    return counts;
  } catch (error) {
    console.error('Error getting security event counts:', error);
    return {
      total: 0,
      bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 },
      byType: {},
    };
  }
}

export const securityEventsService = {
  logSecurityEvent,
  logRateLimitHit,
  logHoneypotTrigger,
  logStaffLoginFailed,
  logStaffLockout,
  logBanCreated,
  logUnauthorizedAccess,
  logInvalidStatusUpdate,
  logPriceManipulation,
  getSecurityEvents,
  getSecurityEventCounts,
};
