# Rate Limiting Plan

**Project:** MenuxPRO
**Version:** 1.0
**Date:** 2026-01-19

## Overview

This document defines the rate limiting strategy for MenuxPRO to prevent abuse while maintaining good user experience.

---

## 1. RATE LIMIT ARCHITECTURE

### Layers of Protection

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE / GATEWAY                      │
│              (Future: DDoS protection)                       │
├─────────────────────────────────────────────────────────────┤
│                    NEXT.JS MIDDLEWARE                        │
│         IP-based rate limiting, ban checking                 │
├─────────────────────────────────────────────────────────────┤
│                    API ROUTES                                │
│         Action-specific rate limiting, honeypot              │
├─────────────────────────────────────────────────────────────┤
│                    FIRESTORE RULES                           │
│         Data validation, write restrictions                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. CUSTOMER/PUBLIC RATE LIMITS

### Order Creation (`/api/orders` POST)

| Limit Type | Window | Max | Block Duration | Key |
|------------|--------|-----|----------------|-----|
| Per Table | 30 sec | 1 order | 5 min | `restaurantId:tableId` |
| Per Table | 10 min | 3 orders | 30 min | `restaurantId:tableId` |
| Per Session | 10 min | 5 orders | 1 hour | `customerSessionId` |
| Per IP | 1 min | 10 orders | 5 min | `clientIp` |

**Additional Rules:**
- Block if table already has active unpaid order (unless add-on orders supported)
- Validate cart hash to prevent duplicate submissions

### Call Waiter (`/api/table-requests` POST - CALL_WAITER)

| Limit Type | Window | Max | Block Duration | Key |
|------------|--------|-----|----------------|-----|
| Per Table | 2 min | 1 request | 5 min | `restaurantId:tableId:CALL_WAITER` |
| Per Table | 1 hour | 5 requests | 2 hours | `restaurantId:tableId:CALL_WAITER` |
| Per IP | 10 min | 10 requests | 1 hour | `clientIp` |

**Additional Rules:**
- Cannot create new CALL_WAITER if one is PENDING or ACKNOWLEDGED
- UX shows: "طلبك مازال قيد المعالجة" / "Your request is being processed"

### Request Bill (`/api/table-requests` POST - REQUEST_BILL)

| Limit Type | Window | Max | Block Duration | Key |
|------------|--------|-----|----------------|-----|
| Per Table | 2 min | 1 request | 5 min | `restaurantId:tableId:REQUEST_BILL` |
| Per Order | Forever | 1 request | N/A | `orderId:REQUEST_BILL` |

**Additional Rules:**
- Only one active REQUEST_BILL per table/order
- Cannot request bill if order status is CANCELLED/CLOSED/PAID

### Review Submission (`/api/reviews` POST - Future)

| Limit Type | Window | Max | Block Duration | Key |
|------------|--------|-----|----------------|-----|
| Per Order | Forever | 1 review | N/A | `orderId` |
| Per Session | 1 hour | 5 reviews | 2 hours | `customerSessionId` |
| Per IP | 1 hour | 10 reviews | 2 hours | `clientIp` |

**Validation:**
- Rating must be 1-5
- Comment max 500 characters
- Order must exist and be PAID or CLOSED

---

## 3. STAFF/ADMIN RATE LIMITS

### Staff PIN Login (`/api/staff/verify` POST)

| Limit Type | Window | Max | Block Duration | Key |
|------------|--------|-----|----------------|-----|
| Per Restaurant + IP | 15 min | 5 attempts | 30 min | `restaurantSlug:clientIp` |
| Per Restaurant | 10 min | 10 attempts | 1 hour | `restaurantSlug` |
| Per IP | 1 hour | 20 attempts | 2 hours | `clientIp` |

**After Block:**
- Log the event as STAFF_LOCKOUT
- Show: "بيانات الدخول غير صحيحة أو تم القفل مؤقتاً"
- Do NOT reveal whether PIN or staff name is wrong

### Admin/SuperAdmin Login

| Limit Type | Window | Max | Block Duration | Key |
|------------|--------|-----|----------------|-----|
| Per Email | 15 min | 5 attempts | 1 hour | `email` |
| Per IP | 1 hour | 10 attempts | 2 hours | `clientIp` |

### Status Updates (Cashier Actions)

| Limit Type | Window | Max | Block Duration | Key |
|------------|--------|-----|----------------|-----|
| Per Staff | 1 min | 30 updates | 5 min | `staffId:status_updates` |
| Per Restaurant | 1 min | 100 updates | 5 min | `restaurantId:status_updates` |

---

## 4. IMPLEMENTATION DETAILS

### Rate Limit Store Structure

```typescript
interface RateLimitEntry {
  key: string;           // Unique identifier
  action: string;        // Action type
  count: number;         // Request count in window
  windowStart: number;   // Window start timestamp (ms)
  expiresAt: number;     // When this entry expires
  lastAttemptAt: number; // Last request timestamp
  blockedUntil: number;  // If blocked, when it ends
}
```

### Key Generation Patterns

```typescript
// Customer actions
`orders:${restaurantId}:${tableId}`
`orders:session:${customerSessionId}`
`orders:ip:${clientIp}`

// Table requests
`table_requests:${restaurantId}:${tableId}:${type}`
`table_requests:ip:${clientIp}`

// Staff actions
`staff_pin:${restaurantSlug}:${clientIp}`
`staff_pin:restaurant:${restaurantSlug}`

// Admin actions
`admin_login:${email}`
`admin_login:ip:${clientIp}`
```

### Response Headers

```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1705651200
Retry-After: 120
```

### Error Response

```json
{
  "error": "rate_limit_exceeded",
  "message": "يرجى الانتظار قليلاً قبل إعادة المحاولة",
  "retryAfter": 120
}
```

---

## 5. CURRENT IMPLEMENTATION STATUS

### Already Implemented ✅

| Component | Status | Location |
|-----------|--------|----------|
| Middleware rate limiting | ✅ | `src/middleware.ts` |
| Order rate limiting | ✅ | `src/app/api/orders/route.ts` |
| Staff PIN rate limiting | ✅ | `src/app/api/staff/verify/route.ts` |
| Magic link rate limiting | ✅ | `src/lib/rate-limit.ts` |
| IP ban checking | ✅ | `src/lib/security-defense.ts` |
| Honeypot validation | ✅ | `src/lib/security-defense.ts` |

### Needs Implementation ⚠️

| Component | Priority | Notes |
|-----------|----------|-------|
| Table requests rate limiting | HIGH | CALL_WAITER, REQUEST_BILL |
| Reviews rate limiting | MEDIUM | Future feature |
| Customer session tracking | MEDIUM | For session-based limits |
| Firestore counters | LOW | Alternative to in-memory |

---

## 6. ABUSE COUNTERS (FIRESTORE)

### Collection Structure

```
restaurants/{restaurantId}/abuseCounters/{counterId}
```

```typescript
interface AbuseCounter {
  id: string;
  restaurantId: string;
  targetType: 'TABLE' | 'SESSION' | 'IP_HASH';
  targetId: string;
  action: 'ORDER' | 'CALL_WAITER' | 'REQUEST_BILL' | 'REVIEW';
  count: number;
  windowStart: Timestamp;
  expiresAt: Timestamp;
  lastAttemptAt: Timestamp;
  blockedUntil: Timestamp | null;
}
```

---

## 7. CONFIGURATION VALUES

```typescript
export const RATE_LIMIT_CONFIGS = {
  // Customer actions
  orders: {
    windowMs: 60 * 1000,           // 1 minute
    maxRequests: 10,                // 10 orders per minute per table
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
    type: 'orders',
  },
  
  callWaiter: {
    windowMs: 2 * 60 * 1000,        // 2 minutes
    maxRequests: 1,                  // 1 request per 2 minutes
    blockDurationMs: 5 * 60 * 1000,  // 5 minute block
    type: 'call_waiter',
  },
  
  requestBill: {
    windowMs: 2 * 60 * 1000,        // 2 minutes
    maxRequests: 1,                  // 1 request per 2 minutes
    blockDurationMs: 5 * 60 * 1000,  // 5 minute block
    type: 'request_bill',
  },
  
  // Staff actions
  staffPin: {
    windowMs: 15 * 60 * 1000,       // 15 minutes
    maxRequests: 5,                  // 5 attempts
    blockDurationMs: 30 * 60 * 1000, // 30 minute block
    type: 'staff_pin',
  },
  
  // Admin actions
  adminLogin: {
    windowMs: 15 * 60 * 1000,       // 15 minutes
    maxRequests: 5,                  // 5 attempts
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
    type: 'admin_login',
  },
};
```

---

## 8. MONITORING AND ALERTING

### Metrics to Track

1. **Rate limit hits** per endpoint per hour
2. **Blocked requests** by IP/restaurant
3. **Honeypot triggers**
4. **Failed staff login attempts**
5. **Auto-bans created**

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Rate limit hits per IP | > 100/hour | Log warning |
| Failed staff logins per restaurant | > 20/hour | Alert owner |
| Honeypot triggers per IP | > 3 | Auto-ban IP |
| Total blocked requests | > 1000/hour | Alert admin |

---

## 9. TESTING CHECKLIST

- [ ] Submit 10 orders quickly from same table
- [ ] Submit duplicate cart repeatedly
- [ ] Call waiter multiple times quickly
- [ ] Request bill multiple times
- [ ] Submit review twice for same order
- [ ] Try wrong staff PIN many times
- [ ] Fill honeypot field and submit
- [ ] Test blocked customer session
- [ ] Test expired ban
- [ ] Verify rate limit headers in response
