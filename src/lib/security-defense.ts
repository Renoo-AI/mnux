/**
 * Security Defense Module
 * 
 * Implements honeypot detection, IP banning, request timing validation,
 * and suspicious activity detection.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Types
export interface HoneypotValidation {
  isValid: boolean;
  reason?: string;
}

export interface BanCheck {
  isBanned: boolean;
  reason?: string;
  expiresAt?: number;
  type?: 'ip' | 'device' | 'user';
}

export interface SuspiciousActivity {
  type: 'rapid_requests' | 'honeypot_triggered' | 'invalid_timing' | 'suspicious_pattern';
  identifier: string;
  details: Record<string, unknown>;
  timestamp: number;
}

// In-memory stores for rate limiting and tracking
const requestTimestamps = new Map<string, number[]>();
const suspiciousScores = new Map<string, number>();
const honeypotTriggers = new Map<string, number>();

// Configuration
const SECURITY_CONFIG = {
  // Minimum time to fill a form (ms) - faster = bot
  minFormFillTime: 1500, // 1.5 seconds
  
  // Maximum time to fill a form (ms) - slower = suspicious
  maxFormFillTime: 30 * 60 * 1000, // 30 minutes
  
  // Clock skew tolerance for form timing (ms)
  clockSkewTolerance: 5000, // ±5 seconds
  
  // Suspicious score threshold
  suspiciousThreshold: 10,
  
  // Honeypot field names (these should be invisible to humans)
  // Mix of obvious and less-obvious names to catch different bot types
  honeypotFields: ['website', 'url', 'email_confirm', 'fax', 'company', 'app_name', 'account_type', 'contact_number'],
  
  // Ban check cache duration (ms) - reduced for faster enforcement
  // SECURITY: Lower value means faster ban propagation but more Firestore reads
  // Previous: 60s - too slow for security-sensitive operations
  // Now: 10s - balance between security and performance
  banCacheDuration: 10 * 1000, // 10 seconds
  
  // Auto-ban thresholds
  autoBanThresholds: {
    honeypotTriggers: 3, // Ban after 3 honeypot triggers
    suspiciousScore: 20, // Ban when suspicious score reaches 20
  },
};

// Ban cache to avoid hitting Firestore on every request
const banCache = new Map<string, { isBanned: boolean; expiresAt: number; checkedAt: number }>();

// Get Firebase Admin app
function getAdminApp() {
  if (getApps().length > 0) return getApp();
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId || !clientEmail || !privateKey) {
    return initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'menuxtn',
    });
  }
  
  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

/**
 * Validate honeypot fields
 * Should be called on form submissions
 */
export function validateHoneypot(body: Record<string, unknown>): HoneypotValidation {
  for (const field of SECURITY_CONFIG.honeypotFields) {
    if (body[field] !== undefined && body[field] !== '') {
      // Honeypot triggered!
      return {
        isValid: false,
        reason: `Honeypot field '${field}' was filled`,
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Validate request timing
 * Track when form page was loaded vs submitted
 */
export function validateTiming(identifier: string, submittedAt: number): { isValid: boolean; elapsed: number } {
  const timestamps = requestTimestamps.get(identifier) || [];
  const now = Date.now();
  
  // Find the most recent page load time
  const pageLoadTime = timestamps.find(t => t > 0 && t < submittedAt);
  
  if (!pageLoadTime) {
    // No tracked page load - allow but flag
    return { isValid: true, elapsed: 0 };
  }
  
  const elapsed = submittedAt - pageLoadTime;
  
  // Too fast = likely a bot
  if (elapsed < SECURITY_CONFIG.minFormFillTime) {
    return { isValid: false, elapsed };
  }
  
  // Too slow = session expired or automated
  if (elapsed > SECURITY_CONFIG.maxFormFillTime) {
    return { isValid: false, elapsed };
  }
  
  return { isValid: true, elapsed };
}

/**
 * Record a form page load for timing validation
 */
export function recordFormLoad(identifier: string): void {
  const timestamps = requestTimestamps.get(identifier) || [];
  timestamps.push(Date.now());
  
  // Keep only last 10 timestamps
  if (timestamps.length > 10) {
    timestamps.shift();
  }
  
  requestTimestamps.set(identifier, timestamps);
}

/**
 * Track suspicious activity
 */
export function trackSuspiciousActivity(
  request: NextRequest,
  activity: SuspiciousActivity
): void {
  const ip = getClientIp(request);
  const key = `${activity.type}:${ip}`;
  
  // Increment suspicious score
  const currentScore = suspiciousScores.get(key) || 0;
  const newScore = currentScore + 1;
  suspiciousScores.set(key, newScore);
  
  // Track honeypot triggers specifically
  if (activity.type === 'honeypot_triggered') {
    const honeypotKey = `honeypot:${ip}`;
    const triggers = honeypotTriggers.get(honeypotKey) || 0;
    honeypotTriggers.set(honeypotKey, triggers + 1);
    
    // Auto-ban after threshold
    if (triggers + 1 >= SECURITY_CONFIG.autoBanThresholds.honeypotTriggers) {
      autoBanIp(ip, 'Repeated honeypot triggers');
    }
  }
  
  // Auto-ban if suspicious score too high
  if (newScore >= SECURITY_CONFIG.autoBanThresholds.suspiciousScore) {
    autoBanIp(ip, `High suspicious activity score: ${newScore}`);
  }
  
  // Log to Firestore
  logSuspiciousActivity(activity, ip);
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

/**
 * Check if an IP or device is banned
 */
export async function checkBanned(
  request: NextRequest,
  deviceId?: string
): Promise<BanCheck> {
  const ip = getClientIp(request);
  const now = Date.now();
  
  // Check cache first
  const cacheKey = deviceId ? `${ip}:${deviceId}` : ip;
  const cached = banCache.get(cacheKey);
  
  if (cached && (now - cached.checkedAt) < SECURITY_CONFIG.banCacheDuration) {
    if (cached.isBanned && cached.expiresAt && cached.expiresAt > now) {
      return {
        isBanned: true,
        reason: 'IP or device is banned',
        expiresAt: cached.expiresAt,
        type: cached.expiresAt === Infinity ? 'ip' : 'device',
      };
    }
    return { isBanned: false };
  }
  
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Check IP ban
    const ipBanDoc = await db.collection('banned_ips').doc(ip.replace(/[:.]/g, '_')).get();
    
    if (ipBanDoc.exists) {
      const data = ipBanDoc.data();
      const expiresAt = data?.expiresAt || Infinity;
      
      if (expiresAt > now) {
        // Update cache
        banCache.set(cacheKey, { isBanned: true, expiresAt, checkedAt: now });
        
        return {
          isBanned: true,
          reason: data?.reason || 'IP is banned',
          expiresAt,
          type: 'ip',
        };
      }
    }
    
    // Check device ban if device ID provided
    if (deviceId) {
      const deviceBanDoc = await db.collection('banned_devices').doc(deviceId).get();
      
      if (deviceBanDoc.exists) {
        const data = deviceBanDoc.data();
        const expiresAt = data?.expiresAt || Infinity;
        
        if (expiresAt > now) {
          banCache.set(cacheKey, { isBanned: true, expiresAt, checkedAt: now });
          
          return {
            isBanned: true,
            reason: data?.reason || 'Device is banned',
            expiresAt,
            type: 'device',
          };
        }
      }
    }
    
    // Not banned - update cache
    banCache.set(cacheKey, { isBanned: false, expiresAt: 0, checkedAt: now });
    
    return { isBanned: false };
  } catch (error) {
    console.error('Error checking ban status:', error);
    // Fail open for availability
    return { isBanned: false };
  }
}

/**
 * Auto-ban an IP address
 */
async function autoBanIp(ip: string, reason: string): Promise<void> {
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hour ban
    
    await db.collection('banned_ips').doc(ip.replace(/[:.]/g, '_')).set({
      ip,
      reason: `Auto-ban: ${reason}`,
      autoBanned: true,
      bannedAt: Date.now(),
      expiresAt,
    });
    
    // Log the auto-ban
    await db.collection('system_logs').add({
      type: 'AUTO_BAN',
      message: `Auto-banned IP: ${ip}`,
      details: { ip, reason },
      timestamp: Date.now(),
    });
    
    console.warn(`Auto-banned IP ${ip}: ${reason}`);
  } catch (error) {
    console.error('Error auto-banning IP:', error);
  }
}

/**
 * Log suspicious activity to Firestore
 */
async function logSuspiciousActivity(activity: SuspiciousActivity, ip: string): Promise<void> {
  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    
    await db.collection('security_events').add({
      ...activity,
      ip,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Error logging suspicious activity:', error);
  }
}

/**
 * Create honeypot field HTML
 * Use this in forms to add hidden honeypot fields
 */
export function createHoneypotField(fieldName?: string): { 
  fieldName: string; 
  style: string; 
  tabIndex: number;
  autoComplete: string;
} {
  const name = fieldName || SECURITY_CONFIG.honeypotFields[Math.floor(Math.random() * SECURITY_CONFIG.honeypotFields.length)];
  
  return {
    fieldName: name,
    style: 'position: absolute; left: -9999px; opacity: 0; pointer-events: none; height: 0; width: 0;',
    tabIndex: -1,
    autoComplete: 'off',
  };
}

/**
 * Get form load timestamp for timing validation
 */
export function getFormLoadTimestamp(identifier: string): number {
  const timestamps = requestTimestamps.get(identifier) || [];
  return timestamps[timestamps.length - 1] || 0;
}

/**
 * Cleanup old entries periodically
 */
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    
    // Clean up old timestamps
    for (const [key, timestamps] of requestTimestamps.entries()) {
      const filtered = timestamps.filter(t => now - t < SECURITY_CONFIG.maxFormFillTime);
      if (filtered.length === 0) {
        requestTimestamps.delete(key);
      } else {
        requestTimestamps.set(key, filtered);
      }
    }
    
    // Clean up old suspicious scores
    suspiciousScores.clear();
    
    // Clean up old honeypot triggers
    honeypotTriggers.clear();
    
  }, 5 * 60 * 1000); // Every 5 minutes
}

/**
 * Create a banned response
 */
export function bannedResponse(reason: string, retryAfter?: number): NextResponse {
  return NextResponse.json(
    {
      error: 'Access denied',
      message: 'Your access has been restricted. Please contact support if you believe this is an error.',
      reason: process.env.NODE_ENV === 'development' ? reason : undefined,
    },
    {
      status: 403,
      headers: retryAfter ? { 'Retry-After': String(retryAfter) } : {},
    }
  );
}

/**
 * Validate a form submission for bot activity
 * Combines honeypot and timing validation
 */
export function validateFormSubmission(
  request: NextRequest,
  body: Record<string, unknown>,
  identifier: string
): { isValid: boolean; reason?: string } {
  // 1. Check honeypot fields
  const honeypotResult = validateHoneypot(body);
  if (!honeypotResult.isValid) {
    trackSuspiciousActivity(request, {
      type: 'honeypot_triggered',
      identifier,
      details: { reason: honeypotResult.reason },
      timestamp: Date.now(),
    });
    return { isValid: false, reason: honeypotResult.reason };
  }
  
  // 2. Check timing if provided
  const submittedAt = body._timestamp as number;
  if (submittedAt) {
    const timingResult = validateTiming(identifier, submittedAt);
    if (!timingResult.isValid) {
      trackSuspiciousActivity(request, {
        type: 'invalid_timing',
        identifier,
        details: { elapsed: timingResult.elapsed },
        timestamp: Date.now(),
      });
      return { isValid: false, reason: 'Invalid submission timing' };
    }
  }
  
  return { isValid: true };
}
