# Open Ports and Exposure Audit

**Audit Date:** 2026-01-19
**Project:** MenuxPRO
**Status:** PRODUCTION SECURITY AUDIT

## Executive Summary

This audit identifies exposed services, development endpoints, and potential security risks in the MenuxPRO application deployment configuration.

---

## 1. PORTS AND NETWORK EXPOSURE

### Hosting Platform
- **Type:** Vercel/Firebase Hosting (Cloud)
- **Exposed Ports:** HTTP/HTTPS only (standard web hosting)
- **Risk Level:** ✅ LOW - No custom VPS ports exposed

### Firebase Emulator Configuration
```json
{
  "emulators": {
    "firestore": { "port": 8080 },
    "ui": { "enabled": false }
  }
}
```
- **Status:** ✅ SAFE - Emulator UI is disabled
- **Note:** Emulator ports are development-only and not exposed in production

---

## 2. SCRIPT EXPOSURE ANALYSIS

### package.json Scripts Review

| Script | Purpose | Production Risk |
|--------|---------|-----------------|
| `dev` | Development server | ✅ LOW - Dev only |
| `build` | Production build | ✅ SAFE |
| `start` | Production server | ✅ SAFE |
| `lint` | Code quality | ✅ SAFE |
| `db:push` | Database schema push | ⚠️ MEDIUM - Should be restricted |
| `db:generate` | Prisma client generation | ✅ SAFE |
| `db:migrate` | Database migration | ⚠️ MEDIUM - Should be restricted |
| `db:reset` | Database reset | 🔴 HIGH - Dangerous in production |
| `test:rules` | Firestore rules testing | ✅ SAFE - Uses emulator |
| `test:rules:local` | Local rules testing | ✅ SAFE |

### Recommendations:
1. Remove or protect `db:reset` script from production builds
2. Add environment check before destructive operations

---

## 3. PUBLIC FILES EXPOSURE

### /public Directory Contents
| File | Risk | Notes |
|------|------|-------|
| logo.svg | ✅ SAFE | Static asset |
| robots.txt | ✅ SAFE | SEO configuration |

**Status:** ✅ NO SENSITIVE FILES IN PUBLIC DIRECTORY

---

## 4. API ROUTES EXPOSURE

### Public Endpoints (No Auth Required)

| Route | Purpose | Risk Level |
|-------|---------|------------|
| `/api/restaurant` | Restaurant data | ✅ LOW - Read-only, validated |
| `/api/categories` | Menu categories | ✅ LOW - Read-only |
| `/api/menu-items` | Menu items | ✅ LOW - Read-only |
| `/api/tables` | Table data | ✅ LOW - Read-only |
| `/api/orders` (POST) | Create order | ⚠️ MEDIUM - Has rate limiting |
| `/api/staff/verify` | Staff PIN login | ⚠️ MEDIUM - Has rate limiting |

### Protected Endpoints (Auth Required)

| Route | Protection | Status |
|-------|------------|--------|
| `/api/admin/*` | SuperAdmin claims | ✅ Protected |
| `/api/admin/magic-link` | SuperAdmin only | ✅ Protected |
| `/api/admin/users` | SuperAdmin only | ✅ Protected |
| `/api/admin/security` | SuperAdmin only | ✅ Protected |

### Missing Endpoints (Should Be Created)
- `/api/table-requests` - For CALL_WAITER and REQUEST_BILL (needs implementation)
- `/api/reviews` - For customer reviews (needs implementation)

---

## 5. DEBUG AND ADMIN ROUTES

### Debug Routes Analysis
| Route | Status | Notes |
|-------|--------|-------|
| `/admin` | ⚠️ PROTECTED CLIENT-SIDE | Needs server-side validation |
| `/admin/login` | ✅ Public (login page) | Standard auth flow |
| `/staff/login` | ✅ Public (login page) | Standard auth flow |
| `/staff/dashboard` | ⚠️ PROTECTED CLIENT-SIDE | Needs middleware protection |
| `/staff/waiter` | ⚠️ PROTECTED CLIENT-SIDE | Needs middleware protection |

### Critical Issues Found:
1. **Admin page uses client-side auth check only** (`app/admin/page.tsx` line 112)
   - SuperAdmin UID is checked on client
   - Middleware doesn't enforce server-side session

2. **Staff dashboard routes** are protected by context but not middleware

---

## 6. HARDCODED CREDENTIALS CHECK

### Files Checked:
- ✅ No hardcoded Firebase API keys (using env vars)
- ✅ No hardcoded admin UIDs (using env var)
- ⚠️ SUPERADMIN_UID is exposed to client via `NEXT_PUBLIC_` prefix
  - **Risk:** MEDIUM - UID could be used for targeted attacks
  - **Recommendation:** Use custom claims instead of UID comparison

### Demo Credentials:
- ✅ Demo mode removed from production
- ✅ Only enabled when `NEXT_PUBLIC_ENABLE_DEMO_MODE=true`

---

## 7. ENVIRONMENT VARIABLES EXPOSURE

### Variables Exposed to Client (NEXT_PUBLIC_*):
| Variable | Risk | Notes |
|----------|------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ LOW | Intended for client |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ LOW | Intended for client |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ LOW | Intended for client |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ LOW | Intended for client |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ LOW | Intended for client |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ LOW | Intended for client |
| `NEXT_PUBLIC_SUPERADMIN_UID` | ⚠️ MEDIUM | Should be server-only |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | ✅ LOW | Feature flag |

### Server-Only Variables (Properly Protected):
- `FIREBASE_CLIENT_EMAIL` ✅
- `FIREBASE_PRIVATE_KEY` ✅

---

## 8. SOURCE MAP EXPOSURE

**Status:** ✅ LOW RISK
- Next.js does not expose source maps by default in production
- `next.config.ts` has no `productionBrowserSourceMaps: true`

---

## 9. SEED AND TEST SCRIPTS

### Seed Script Location
- `scripts/seedDemoData.ts` - Creates demo data

**Risk Assessment:**
- ⚠️ MEDIUM - Could be accidentally run in production
- **Recommendation:** Add environment check to prevent running on production

### Test Files
- `tests/firestore.rules.test.ts` - Firestore rules tests
- Uses Firebase emulator - ✅ SAFE

---

## 10. EXTERNAL SERVICE EXPOSURE

### Firebase Services
| Service | Status | Notes |
|---------|--------|-------|
| Firestore | ✅ Protected | Has security rules |
| Authentication | ✅ Protected | Uses Firebase Auth |
| Functions | ⚠️ Not deployed | Security functions missing |
| Storage | ⚠️ Not configured | If used, needs rules |

### Third-Party Services
| Service | Purpose | Status |
|---------|---------|--------|
| Google Fonts | Typography | ✅ SAFE |
| Unsplash/Picsum | Images | ✅ SAFE |

---

## 11. ACTION ITEMS

### Critical (Fix Immediately)
1. **Add server-side session validation for admin routes**
   - Implement session cookies or server-side token validation
   - Do not rely solely on client-side auth state

2. **Remove SUPERADMIN_UID from client bundle**
   - Use custom claims exclusively
   - Remove `NEXT_PUBLIC_` prefix

### High Priority (Fix Within 1 Week)
1. **Add middleware protection for staff routes**
   - `/staff/dashboard`
   - `/staff/waiter`
   - `/dashboard/*` routes

2. **Create rate-limited endpoints for table requests**
   - CALL_WAITER
   - REQUEST_BILL

3. **Add environment check to seed scripts**
   - Prevent accidental production data wipe

### Medium Priority (Fix Within 1 Month)
1. **Implement App Check**
   - Reduce automated abuse from non-app clients

2. **Deploy Cloud Functions for sensitive operations**
   - Order validation
   - Status transitions
   - Rate limit enforcement

---

## 12. SUMMARY

| Category | Status | Risk Level |
|----------|--------|------------|
| Network Exposure | ✅ Good | LOW |
| Public Files | ✅ Good | LOW |
| API Routes | ⚠️ Needs improvement | MEDIUM |
| Debug Routes | ⚠️ Client-side only | MEDIUM |
| Credentials | ⚠️ UID exposed | MEDIUM |
| Environment Variables | ⚠️ One exposed | MEDIUM |
| Source Maps | ✅ Good | LOW |
| Seed Scripts | ⚠️ Unprotected | MEDIUM |

**Overall Assessment:** MEDIUM RISK

The application has reasonable security measures in place, but several critical issues need to be addressed before production deployment, particularly around admin route protection and removing the exposed SuperAdmin UID.
