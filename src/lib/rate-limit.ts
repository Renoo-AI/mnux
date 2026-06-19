/**
 * Simple in-memory rate limiting for API routes
 * 
 * This is a basic MVP implementation using in-memory storage.
 * For production with multiple instances, consider using Redis or Firestore.
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
  blockedUntil: number;
}

// In-memory store for rate limits
// Key format: `${type}:${identifier}`
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now && !entry.blocked) {
        rateLimitStore.delete(key);
      } else if (entry.blocked && entry.blockedUntil < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  /** Window size in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  maxRequests: number;
  /** Block duration after limit exceeded (in ms) */
  blockDurationMs: number;
  /** Type of rate limit (for logging/key prefix) */
  type: string;
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Staff PIN verification - strict limits (brute-force protection)
  staffPin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes per restaurant+IP
    blockDurationMs: 30 * 60 * 1000, // 30 minute block
    type: 'staff_pin',
  },
  // Order creation - moderate limits
  orders: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 orders per minute per restaurant+table
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
    type: 'orders',
  },
  // Magic link generation - strict limits (superadmin only)
  magicLink: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20, // 20 magic links per hour per UID
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hour block
    type: 'magic_link',
  },
  // Call waiter - strict limits (anti-spam)
  callWaiter: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    maxRequests: 1, // 1 request per 2 minutes
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
    type: 'call_waiter',
  },
  // Request bill - strict limits
  requestBill: {
    windowMs: 2 * 60 * 1000, // 2 minutes
    maxRequests: 1, // 1 request per 2 minutes
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
    type: 'request_bill',
  },
  // Table requests hourly limit
  tableRequestsHourly: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 requests per hour per table
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hour block
    type: 'table_requests_hourly',
  },
  // Reviews - moderate limits
  reviews: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 reviews per hour per session
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hour block
    type: 'reviews',
  },
  // Admin login - strict limits
  adminLogin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
    type: 'admin_login',
  },
  // Admin users endpoint - prevent enumeration abuse
  adminUsers: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 requests per minute per admin UID
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
    type: 'admin_users',
  },
} as const;

/**
 * Extract client IP from request
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback for development
  return 'unknown';
}

/**
 * Check and update rate limit for an identifier
 * Returns null if allowed, or an object with limit info if blocked
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; retryAfter: number; remaining: number } {
  const now = Date.now();
  const key = `${config.type}:${identifier}`;
  
  const entry = rateLimitStore.get(key);
  
  // Check if currently blocked
  if (entry?.blocked && entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
      remaining: 0,
    };
  }
  
  // Check if window has expired, reset if so
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
      blockedUntil: 0,
    });
    return { allowed: true };
  }
  
  // Increment count
  const newCount = entry.count + 1;
  
  if (newCount > config.maxRequests) {
    // Block the identifier
    const blockedUntil = now + config.blockDurationMs;
    rateLimitStore.set(key, {
      count: newCount,
      resetTime: entry.resetTime,
      blocked: true,
      blockedUntil,
    });
    
    return {
      allowed: false,
      retryAfter: Math.ceil((blockedUntil - now) / 1000),
      remaining: 0,
    };
  }
  
  // Update count
  rateLimitStore.set(key, {
    ...entry,
    count: newCount,
  });
  
  return { allowed: true };
}

/**
 * Create a rate limit response
 */
export function rateLimitResponse(retryAfter: number): NextResponse {
  return NextResponse.json(
    { 
      error: 'Too many requests. Please try again later.',
      retryAfter,
    },
    { 
      status: 429,
      headers: {
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

/**
 * Higher-order function to wrap API handlers with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  getIdentifier: (request: NextRequest) => string,
  config: RateLimitConfig
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const identifier = getIdentifier(request);
    const result = checkRateLimit(identifier, config);
    
    if (!result.allowed) {
      return rateLimitResponse(result.retryAfter);
    }
    
    return handler(request);
  };
}
