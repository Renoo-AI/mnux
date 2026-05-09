import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkBanned, getClientIp, bannedResponse } from '@/lib/security-defense';

// Rate limiting store (in-memory for development, use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  // Global API limit: 100 requests per minute
  global: { windowMs: 60 * 1000, max: 100 },
  // Auth endpoints: 5 requests per minute
  auth: { windowMs: 60 * 1000, max: 5 },
  // Admin endpoints: 20 requests per minute
  admin: { windowMs: 60 * 1000, max: 20 },
  // Order endpoints: 10 requests per minute
  orders: { windowMs: 60 * 1000, max: 10 },
  // Staff verification: 3 requests per 15 minutes (very strict)
  staffVerify: { windowMs: 15 * 60 * 1000, max: 3 },
};

function getRateLimitKey(request: NextRequest, type: keyof typeof RATE_LIMITS): string {
  const ip = getClientIp(request);
  return `${type}:${ip}`;
}

function checkRateLimit(request: NextRequest, type: keyof typeof RATE_LIMITS): { allowed: boolean; remaining: number; resetTime: number } {
  const config = RATE_LIMITS[type];
  const key = getRateLimitKey(request, type);
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    // Create new record
    const newRecord = { count: 1, resetTime: now + config.windowMs };
    rateLimitStore.set(key, newRecord);
    return { allowed: true, remaining: config.max - 1, resetTime: newRecord.resetTime };
  }
  
  if (record.count >= config.max) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // Increment count
  record.count++;
  return { allowed: true, remaining: config.max - record.count, resetTime: record.resetTime };
}

// Security headers middleware
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Remove server information
  response.headers.delete('X-Powered-By');
  
  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get client IP for ban checking
  const clientIp = getClientIp(request);
  
  // Check if IP is banned (for all requests)
  const banCheck = await checkBanned(request);
  if (banCheck.isBanned) {
    console.warn(`Blocked banned IP: ${clientIp} - ${banCheck.reason}`);
    return bannedResponse(banCheck.reason || 'Access denied');
  }
  
  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    // Determine rate limit type
    let rateLimitType: keyof typeof RATE_LIMITS = 'global';
    
    if (pathname.includes('/staff/verify')) {
      rateLimitType = 'staffVerify';
    } else if (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/magic-link')) {
      rateLimitType = 'auth';
    } else if (pathname.startsWith('/api/admin/')) {
      rateLimitType = 'admin';
    } else if (pathname.includes('/orders') && request.method === 'POST') {
      rateLimitType = 'orders';
    }
    
    const { allowed, remaining, resetTime } = checkRateLimit(request, rateLimitType);
    
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
            'X-RateLimit-Limit': String(RATE_LIMITS[rateLimitType].max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
          }
        }
      );
    }
    
    // Continue with request and add rate limit headers
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMITS[rateLimitType].max));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));
    response.headers.set('X-Request-Id', crypto.randomUUID());
    
    return addSecurityHeaders(response);
  }
  
  // Continue for non-API routes
  const response = NextResponse.next();
  response.headers.set('X-Request-Id', crypto.randomUUID());
  return addSecurityHeaders(response);
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to admin pages
    '/admin/:path*',
    // Apply to auth routes
    '/auth/:path*',
    // Apply to staff routes
    '/staff/:path*',
    // Apply to public ordering routes
    '/r/:slug/t/:tableId/:path*',
  ],
};
