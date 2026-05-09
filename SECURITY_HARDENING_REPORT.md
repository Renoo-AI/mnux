# Security Hardening Report

**Project:** MenuxPRO
**Date:** 2026-01-19
**Status:** COMPLETED - Security Sprint

---

## Executive Summary

This report documents the security hardening measures implemented for MenuxPRO, a premium café/restaurant ordering system. The audit covered open ports, API exposure, rate limiting, honeypot systems, ban/kick mechanisms, security logging, and Firestore rules hardening.

---

## 1. FILES CHANGED

### New Files Created
| File | Purpose |
|------|---------|
| `src/app/api/table-requests/route.ts` | API for CALL_WAITER and REQUEST_BILL |
| `src/services/securityEventsService.ts` | Centralized security event logging |
| `OPEN_PORTS_AND_EXPOSURE_AUDIT.md` | Network and route exposure audit |
| `RATE_LIMITING_PLAN.md` | Rate limiting strategy documentation |

### Files Modified
| File | Changes |
|------|---------|
| `firestore.rules` | Added table_requests, reviews, securityBans, abuseCounters |
| `src/lib/rate-limit.ts` | Added configs for callWaiter, requestBill, reviews, adminLogin |

---

## 2. VULNERABILITIES FOUND

| ID | Vulnerability | Severity | Status |
|----|---------------|----------|--------|
| VULN-001 | SUPERADMIN_UID exposed to client | MEDIUM | ⚠️ PARTIAL FIX |
| VULN-002 | Admin routes use client-side auth only | HIGH | 🔴 NEEDS FIX |
| VULN-003 | Staff routes not protected by middleware | MEDIUM | ⚠️ PARTIAL FIX |
| VULN-004 | No rate limiting for table requests | HIGH | ✅ FIXED |
| VULN-005 | No security event logging | MEDIUM | ✅ FIXED |
| VULN-006 | Missing Firestore rules for new collections | HIGH | ✅ FIXED |

---

## 3. VULNERABILITIES FIXED

### 3.1 Rate Limiting for Table Requests
**Status:** ✅ FIXED

Implemented comprehensive rate limiting for:
- `CALL_WAITER`: 1 request per 2 minutes, max 5 per hour
- `REQUEST_BILL`: 1 request per 2 minutes, max 1 per order

### 3.2 Security Event Logging
**Status:** ✅ FIXED

Created `securityEventsService.ts` with functions for:
- `logRateLimitHit`
- `logHoneypotTrigger`
- `logStaffLoginFailed`
- `logStaffLockout`
- `logBanCreated`
- `logUnauthorizedAccess`
- `logInvalidStatusUpdate`
- `logPriceManipulation`

### 3.3 Firestore Rules Hardening
**Status:** ✅ FIXED

Added rules for:
- `table_requests` - Staff read, public create with validation
- `reviews` - Public read/create with validation
- `securityBans` - Owner/superadmin only
- `abuseCounters` - System only (no client access)

### 3.4 Honeypot System
**Status:** ✅ ALREADY EXISTS

The honeypot system was already implemented in `src/lib/security-defense.ts`:
- Fields: `website`, `url`, `email_confirm`, `fax`, `company`
- Auto-ban after 3 honeypot triggers
- Silent rejection (no obvious "bot detected" message)

---

## 4. RATE LIMITS IMPLEMENTED

### Customer Actions
| Action | Window | Max | Block Duration |
|--------|--------|-----|----------------|
| Create Order | 1 min | 10 | 5 min |
| Call Waiter | 2 min | 1 | 5 min |
| Request Bill | 2 min | 1 | 5 min |
| Table Requests (hourly) | 1 hour | 5 | 2 hours |
| Submit Review | 1 hour | 5 | 2 hours |

### Staff Actions
| Action | Window | Max | Block Duration |
|--------|--------|-----|----------------|
| Staff PIN Login | 15 min | 5 | 30 min |
| Admin Login | 15 min | 5 | 1 hour |
| Status Updates | 1 min | 30 | 5 min |

---

## 5. BAN/KICK SYSTEM

**Status:** ✅ IMPLEMENTED

### IP Bans
- Collection: `banned_ips`
- Fields: `ip`, `reason`, `autoBanned`, `bannedAt`, `expiresAt`
- Access: SuperAdmin only

### Device Bans
- Collection: `banned_devices`
- Access: SuperAdmin only

### Restaurant-Scoped Bans
- Collection: `restaurants/{restaurantId}/securityBans`
- Targets: `CUSTOMER_SESSION`, `TABLE`, `IP_HASH`, `FCM_TOKEN`, `STAFF_SESSION`
- Severity: `LOW`, `MEDIUM`, `HIGH`
- Actions: `THROTTLE`, `TEMP_BLOCK`, `KICK_SESSION`
- Access: Owner and SuperAdmin

---

## 6. APP CHECK STATUS

**Status:** ⚠️ NOT CONFIGURED

Firebase App Check is not currently configured. This is recommended for production but not critical for MVP.

### Firebase Console Steps Required:
1. Go to Firebase Console → App Check
2. Enable App Check for Web apps
3. Choose reCAPTCHA v3 or reCAPTCHA Enterprise
4. Add the site key to your app configuration
5. Enable enforcement for Firestore and Functions

---

## 7. OPEN EXPOSURE STATUS

### Critical Findings:
1. **Admin Page Auth** - Uses client-side UID check only
2. **SUPERADMIN_UID** - Exposed via `NEXT_PUBLIC_` prefix
3. **Staff Routes** - Protected by context, not middleware

### Recommended Fixes:
1. Move `SUPERADMIN_UID` to server-only environment variable
2. Implement server-side session validation for admin routes
3. Add middleware protection for `/staff/*` and `/dashboard/*`

---

## 8. FIRESTORE RULES CHANGES

### New Collections Added:

```javascript
// Table Requests - CALL_WAITER, REQUEST_BILL
match /table_requests/{requestId} {
  allow read: if isAuthenticated() && isStaff(restaurantId);
  allow create: if validPublicRequest();
  allow update: if isStaff(restaurantId) && allowedFieldsOnly();
}

// Reviews
match /reviews/{reviewId} {
  allow read: if publicOrStaff();
  allow create: if validRatingAndComment();
  allow update: if false; // Immutable
}

// Restaurant Security Bans
match /restaurants/{restaurantId}/securityBans/{banId} {
  allow read: if isStaff(restaurantId);
  allow write: if isOwner(restaurantId);
}

// Abuse Counters
match /restaurants/{restaurantId}/abuseCounters/{counterId} {
  allow read, write: if false; // System only
}
```

---

## 9. TEST RESULTS

| Test | Status |
|------|--------|
| `bun run lint` | ✅ PASS (1 warning) |
| TypeScript | ✅ PASS |
| Build | ✅ PASS |

### Manual Tests Required:
- [ ] Submit 10 orders quickly from same table
- [ ] Call waiter multiple times quickly
- [ ] Request bill multiple times
- [ ] Try wrong staff PIN many times
- [ ] Fill honeypot field and submit
- [ ] Try accessing admin route while logged out
- [ ] Test banned customerSessionId

---

## 10. REMAINING RISKS

### High Priority
| Risk | Mitigation |
|------|------------|
| Client-side admin auth | Implement server-side session validation |
| SUPERADMIN_UID exposed | Remove NEXT_PUBLIC_ prefix, use custom claims |

### Medium Priority
| Risk | Mitigation |
|------|------------|
| No App Check | Configure reCAPTCHA for web |
| No Cloud Functions | Deploy server-side validation functions |

### Low Priority
| Risk | Mitigation |
|------|------------|
| Source maps in production | Disable if needed |
| Seed script unprotected | Add environment check |

---

## 11. EXACT FIREBASE CONSOLE STEPS

### For App Check:
1. Navigate to Firebase Console
2. Select project `menuxtn`
3. Go to **Build** → **App Check**
4. Click **Get Started**
5. Select **Web** platform
6. Choose **reCAPTCHA v3** provider
7. Register your domain(s)
8. Copy site key to `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
9. Enable enforcement for **Firestore**
10. Monitor attestation metrics

### For Custom Claims:
1. Go to **Authentication** → **Users**
2. Select the superadmin user
3. Add custom claim: `{ "role": "superadmin" }`
4. User must re-authenticate for claim to take effect

---

## 12. SUMMARY

| Category | Status | Notes |
|----------|--------|-------|
| Open Ports | ✅ Safe | Cloud hosting only |
| Rate Limiting | ✅ Implemented | Customer + Staff actions |
| Honeypot | ✅ Implemented | Auto-ban after 3 triggers |
| Ban System | ✅ Implemented | IP, device, session bans |
| Security Logging | ✅ Implemented | Full audit trail |
| Firestore Rules | ✅ Hardened | New collections secured |
| Route Protection | ⚠️ Partial | Needs middleware update |
| App Check | ⚠️ Not configured | Recommended for production |
| Admin Auth | ⚠️ Client-side | Needs server-side validation |

**Overall Security Posture:** IMPROVED - Ready for controlled production deployment with monitoring.

---

## 13. NEXT STEPS

1. **Immediate:** Remove `NEXT_PUBLIC_` from SUPERADMIN_UID
2. **This Week:** Implement server-side session validation
3. **This Month:** Configure App Check for web
4. **Ongoing:** Monitor security events dashboard
