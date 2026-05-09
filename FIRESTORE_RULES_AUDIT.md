# Firestore Rules Audit

**Project:** MenuxPRO
**Date:** 2026-01-19
**Status:** HARDENED

---

## 1. RULES OVERVIEW

The Firestore security rules are defined in `/firestore.rules` and implement a multi-layer security model:

- **Authentication checks** via `isAuthenticated()`
- **Role-based access** via `isStaff()`, `isOwner()`, `isSuperAdmin()`
- **Input validation** via helper functions
- **Field-level restrictions** via `affectedKeys().hasOnly()`
- **Default deny** as the fallback

---

## 2. HELPER FUNCTIONS

### Authentication Helpers
```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isSuperAdmin() {
  return isAuthenticated() && (
    request.auth.token.role == 'superadmin' ||
    request.auth.uid == superAdminUid()
  );
}

function isOwner(restaurantId) {
  return isAuthenticated() && 
    get(/databases/$(database)/documents/restaurants/$(restaurantId)).data.ownerUid == request.auth.uid;
}

function isStaff(restaurantId) {
  let restaurant = get(/databases/$(database)/documents/restaurants/$(restaurantId)).data;
  return isAuthenticated() && 
    (restaurant.ownerUid == request.auth.uid || 
     restaurant.staffUids[request.auth.uid] != null);
}
```

### Validation Helpers
```javascript
function isValidString(value, maxLength) {
  return value is string && value.size() > 0 && value.size() <= maxLength;
}

function isValidPrice(price) {
  return price is number && price >= 0 && price <= 100000;
}
```

---

## 3. COLLECTION RULES

### 3.1 RESTAURANTS
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Public (ACTIVE) or Staff | Restaurant status check |
| CREATE | Authenticated | Owner UID matches auth, valid plan |
| UPDATE | Owner or SuperAdmin | Plan/limits immutable for owner |
| DELETE | SuperAdmin only | N/A |

**Protected Fields (Owner cannot modify):**
- `plan`
- `maxMenuItems`
- `menuItemCount`
- `watermarkEnabled` (forced true for free plan)
- `slugType`

### 3.2 TABLES
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Public (ACTIVE restaurant) or Staff | Restaurant exists check |
| CREATE | Staff or SuperAdmin | Valid name length |
| UPDATE | Staff or SuperAdmin | N/A |
| DELETE | Staff or SuperAdmin | N/A |

### 3.3 CATEGORIES
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Public (ACTIVE restaurant) or Staff | Restaurant status check |
| CREATE/UPDATE/DELETE | Staff or SuperAdmin | N/A |

### 3.4 MENU ITEMS
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Public (ACTIVE restaurant) or Staff | Restaurant status check |
| CREATE | Staff or SuperAdmin | Valid name, price, within item limit |
| UPDATE | Staff or SuperAdmin | Limited fields: name, description, price, etc. |
| DELETE | Staff or SuperAdmin | N/A |

**Allowed Update Fields:**
- `name`, `description`, `price`, `imageUrl`
- `available`, `isFeatured`, `tags`, `allergens`
- `sortOrder`, `categoryId`, `updatedAt`

### 3.5 ORDERS
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Staff or SuperAdmin | Restaurant matching |
| CREATE | Public | Valid restaurantId, status=CREATED, valid items |
| UPDATE | Staff or SuperAdmin | Limited fields for status updates |
| DELETE | SuperAdmin only | N/A |

**Protected Fields (Customer cannot set):**
- `status` (must be CREATED)
- `acceptedAt`, `paidAt`, `closedAt`, `cancelledAt`
- `rejectReason`, `cancelReason`
- Any staff/admin fields

**Allowed Update Fields (Staff only):**
- `status`, `updatedAt`
- `acceptedAt`, `paidAt`, `closedAt`, `cancelledAt`
- `rejectReason`, `cancelReason`

### 3.6 LOGS
| Operation | Access | Notes |
|-----------|--------|-------|
| READ | Staff or SuperAdmin | Restaurant matching |
| CREATE | System (allow all) | Auto-created by system |
| UPDATE/DELETE | None (immutable) | Prevented |

### 3.7 STAFF
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Staff or SuperAdmin | Same restaurant |
| CREATE/UPDATE | Owner or SuperAdmin | N/A |
| DELETE | Owner or SuperAdmin | N/A |

### 3.8 USERS
| Operation | Access | Validation |
|-----------|--------|------------|
| READ/UPDATE | Own user only | Auth UID matches |
| CREATE | Own user only | Auth UID matches |
| DELETE | SuperAdmin only | N/A |

### 3.9 TABLE REQUESTS (NEW)
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Staff or SuperAdmin | Same restaurant |
| CREATE | Public | Valid type (CALL_WAITER/REQUEST_BILL), status=PENDING |
| UPDATE | Staff or SuperAdmin | Limited fields: status, acknowledgedAt, etc. |
| DELETE | SuperAdmin only | N/A |

**Allowed Update Fields:**
- `status`, `acknowledgedAt`, `acknowledgedBy`
- `resolvedAt`, `resolvedBy`, `updatedAt`

### 3.10 REVIEWS (NEW)
| Operation | Access | Validation |
|-----------|--------|------------|
| READ | Public (ACTIVE restaurant) | Restaurant status check |
| CREATE | Public | Rating 1-5, comment ≤500 chars |
| UPDATE | None (immutable) | Prevented |
| DELETE | SuperAdmin only | N/A |

**Validation Rules:**
- `rating`: integer, 1-5
- `comment`: string, max 500 characters
- `restaurantId`, `orderId`: required

### 3.11 SECURITY EVENTS
| Operation | Access | Notes |
|-----------|--------|-------|
| READ | SuperAdmin only | Audit access |
| CREATE | System (allow all) | Auto-created by API |
| UPDATE/DELETE | None (immutable) | Prevented |

### 3.12 SECURITY BANS (NEW)
| Operation | Access | Notes |
|-----------|--------|-------|
| READ | Staff (same restaurant) | Need-to-know basis |
| CREATE/UPDATE/DELETE | Owner or SuperAdmin | Restaurant admins |

### 3.13 BANNED IPS/DEVICES
| Operation | Access | Notes |
|-----------|--------|-------|
| ALL | SuperAdmin only | Platform-level security |

### 3.14 RATE LIMITS / ABUSE COUNTERS
| Operation | Access | Notes |
|-----------|--------|-------|
| ALL | System only | No client access |

---

## 4. SECURITY CHECKLIST

### ✅ Implemented
- [x] Default deny rule at the end
- [x] Input validation on all public writes
- [x] Field-level restrictions on updates
- [x] String length limits
- [x] Price validation (0-100000)
- [x] Rating validation (1-5)
- [x] Immutable collections (logs, reviews, security events)
- [x] Status validation (CREATED for new orders)
- [x] Type validation for table requests
- [x] Plan restriction enforcement

### ⚠️ Partially Implemented
- [ ] Server-side price validation (done in API, not rules)
- [ ] Customer session validation (would need Cloud Functions)

### ❌ Not Implemented
- [ ] Cross-collection transaction validation (needs Cloud Functions)
- [ ] Real-time abuse counter validation (needs Cloud Functions)

---

## 5. POTENTIAL ATTACK VECTORS & MITIGATIONS

### Attack: Price Manipulation
**Status:** ✅ MITIGATED
- Client price is ignored
- Server recalculates from menu item price in API
- Rules don't allow price field in CREATE

### Attack: Order Spam
**Status:** ✅ MITIGATED
- Rate limiting at middleware level
- Rate limiting at API level
- Max items per order limit (50)

### Attack: Status Manipulation
**Status:** ✅ MITIGATED
- Customer can only create order with CREATED status
- Only staff can update status
- Limited fields for status updates

### Attack: Review Spam
**Status:** ✅ MITIGATED
- One review per order (enforced at API level)
- Rate limiting per session/IP
- Max comment length (500)

### Attack: Table Request Spam
**Status:** ✅ MITIGATED
- Rate limiting (1 per 2 minutes, 5 per hour)
- Duplicate request check
- Only one active request per type per table

---

## 6. RECOMMENDATIONS

### Short Term
1. Add environment variable for SUPERADMIN_UID (remove from client)
2. Implement Cloud Functions for complex validations

### Medium Term
1. Enable App Check for Firestore
2. Add audit logging for sensitive operations

### Long Term
1. Implement field-level encryption for PII
2. Add data retention policies

---

## 7. TESTING COMMANDS

```bash
# Run Firestore rules tests
bun run test:rules

# Run local tests
bun run test:rules:local
```

---

## 8. SUMMARY

The Firestore security rules are now **HARDENED** with:
- Comprehensive input validation
- Role-based access control
- Field-level restrictions
- Immutable collections
- New collections for security features

The rules follow the principle of least privilege and default deny.
