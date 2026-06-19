import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkBanned, getClientIp, bannedResponse } from '@/lib/security-defense';
import { PROTECTED_ROUTES, getProtectedRouteType } from '@/config/protected-routes';

/**
 * RATE LIMITING - PRODUCTION WARNING
 * 
 * Current implementation uses in-memory Map() which is NOT suitable for production:
 * - Rate limits reset on every server restart/redeploy
 * - Horizontal scaling (multiple instances) have independent stores
 * - No persistence across deployments
 * 
 * BEFORE PRODUCTION DEPLOYMENT:
 * Replace with Redis, Upstash, or a shared KV store.
 * See: docs/security/RATE_LIMIT_PRODUCTION_NOTE.md
 */
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

/**
 * Check for authentication session
 * Since Firebase tokens can't be verified in Edge runtime, we check for session cookie presence
 * Actual token verification happens server-side in the page/API route
 */
function hasAuthSession(request: NextRequest, cookieName: string): boolean {
  const sessionCookie = request.cookies.get(cookieName);
  // Also check Authorization header for API requests
  const authHeader = request.headers.get('Authorization');
  return !!(sessionCookie?.value || (authHeader && authHeader.startsWith('Bearer ')));
}

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
  
  // Check for protected routes (non-API routes only - API routes handle their own auth)
  if (!pathname.startsWith('/api/')) {
    const protectedRoute = getProtectedRouteType(pathname);
    
    if (protectedRoute) {
      const { config, type } = protectedRoute;
      
      // Skip login pages themselves
      if (pathname === config.loginPath) {
        const response = NextResponse.next();
        response.headers.set('X-Request-Id', crypto.randomUUID());
        return addSecurityHeaders(response);
      }
      
      // Check for authentication session
      // Note: This is a preliminary check. Full token verification happens server-side.
      // We check for the presence of auth cookies/headers to prevent obvious unauthorized access.
      const hasSession = hasAuthSession(request, config.sessionCookie);
      
      if (!hasSession) {
        // For admin routes, also check for Firebase ID token in localStorage (via cookie)
        // Since Firebase stores tokens in memory/localStorage, we set a session cookie on login
        const idTokenCookie = request.cookies.get('firebase-id-token');
        const staffSessionCookie = request.cookies.get('staff-session-token');
        
        const hasAnyAuth = !!(idTokenCookie?.value || staffSessionCookie?.value);
        
        if (!hasAnyAuth) {
          // No session found - redirect to login
          console.log(`[Middleware] No auth session for ${type} route: ${pathname}`);
          const loginUrl = new URL(config.loginPath, request.url);
          // Add redirect URL for post-login redirect
          loginUrl.searchParams.set('redirect', pathname);
          return NextResponse.redirect(loginUrl);
        }
      }
      
      // Log access to protected routes for audit
      console.log(`[Middleware] Authenticated access to ${type} route: ${pathname} from IP: ${clientIp}`);
    }
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
    // Apply to admin pages (superadmin panel)
    '/admin/:path*',
    // Apply to auth routes
    '/auth/:path*',
    // Apply to staff routes
    '/staff/:path*',
    // Apply to dashboard routes
    '/dashboard/:path*',
    // Apply to public ordering routes
    '/r/:slug/t/:tableId/:path*',
  ],
};
