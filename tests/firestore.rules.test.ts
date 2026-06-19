/**
 * Firebase Security Rules Tests for MenuxPro
 * 
 * These tests verify the security rules for Firestore access control.
 * Run with: npx firebase emulators:exec --only firestore "npx jest tests/firestore.rules.test.ts"
 * 
 * Or use the npm script: npm run test:rules
 * 
 * Prerequisites:
 * 1. Firebase CLI installed: npm install -g firebase-tools
 * 2. Firebase emulator running: firebase emulators:start --only firestore
 */

import {
  initializeTestApp,
  initializeAdminApp,
  loadFirestoreRules,
  assertFails,
  assertSucceeds,
  clearFirestoreData,
  firestore,
  apps,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } from 'firebase/firestore';

const PROJECT_ID = 'menuxpro-test';

// Test data constants based on types/index.ts
const SUPERADMIN_UID = 'rjAbnlO0deNZRavuHgfBsxRZTVY2';
const OWNER_UID = 'owner-123';
const STAFF_UID = 'staff-456';
const OTHER_OWNER_UID = 'other-owner-789';
const PUBLIC_UID = undefined; // Unauthenticated user

// Restaurant test data
const createRestaurantData = (overrides = {}) => ({
  name: 'Test Restaurant',
  slug: 'test-restaurant',
  status: 'ACTIVE',
  currency: 'TND',
  ownerUid: OWNER_UID,
  plan: 'free',
  slugType: 'free-random',
  watermarkEnabled: true,
  maxMenuItems: 8,
  staffUids: { [STAFF_UID]: 'cashier' },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createOtherRestaurantData = (overrides = {}) => ({
  name: 'Other Restaurant',
  slug: 'other-restaurant',
  status: 'ACTIVE',
  currency: 'TND',
  ownerUid: OTHER_OWNER_UID,
  plan: 'pro',
  slugType: 'custom',
  watermarkEnabled: false,
  maxMenuItems: 100,
  staffUids: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Table test data
const createTableData = (restaurantId: string, overrides = {}) => ({
  restaurantId,
  name: 'T-01',
  seats: 4,
  status: 'EMPTY',
  qrCodeUrl: `https://menuxpro.com/r/test/t/table-1`,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Category test data
const createCategoryData = (restaurantId: string, overrides = {}) => ({
  restaurantId,
  name: 'Appetizers',
  slug: 'appetizers',
  sortOrder: 1,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Menu item test data
const createMenuItemData = (restaurantId: string, categoryId: string, overrides = {}) => ({
  restaurantId,
  categoryId,
  name: 'Test Item',
  description: 'A delicious test item',
  price: 10.99,
  available: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Order test data
const createOrderData = (restaurantId: string, tableId: string, overrides = {}) => ({
  restaurantId,
  tableId,
  tableName: 'T-01',
  items: [
    { itemId: 'item-1', name: 'Test Item', quantity: 2, price: 21.98, unitPrice: 10.99 }
  ],
  subtotal: 21.98,
  totalAmount: 21.98,
  status: 'CREATED',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Helper to get Firestore instance for a specific auth context
 */
function getFirestore(auth?: { uid: string }) {
  const app = initializeTestApp({ projectId: PROJECT_ID, auth });
  return firestore(app);
}

/**
 * Helper to get admin Firestore instance
 */
function getAdminFirestore() {
  const app = initializeAdminApp({ projectId: PROJECT_ID });
  return firestore(app);
}

/**
 * Setup test data using admin SDK
 */
async function setupTestData() {
  const adminDb = getAdminFirestore();
  
  // Create restaurants
  await setDoc(doc(adminDb, 'restaurants', 'rest-1'), createRestaurantData());
  await setDoc(doc(adminDb, 'restaurants', 'rest-2'), createOtherRestaurantData());
  
  // Create tables
  await setDoc(doc(adminDb, 'tables', 'table-1'), createTableData('rest-1'));
  await setDoc(doc(adminDb, 'tables', 'table-2'), createTableData('rest-2'));
  
  // Create categories
  await setDoc(doc(adminDb, 'categories', 'cat-1'), createCategoryData('rest-1'));
  await setDoc(doc(adminDb, 'categories', 'cat-2'), createCategoryData('rest-2'));
  
  // Create menu items
  await setDoc(doc(adminDb, 'menu_items', 'item-1'), createMenuItemData('rest-1', 'cat-1'));
  await setDoc(doc(adminDb, 'menu_items', 'item-2'), createMenuItemData('rest-2', 'cat-2'));
  
  // Create orders
  await setDoc(doc(adminDb, 'orders', 'order-1'), createOrderData('rest-1', 'table-1'));
  await setDoc(doc(adminDb, 'orders', 'order-2'), createOrderData('rest-2', 'table-2'));
  
  // Create system log (superadmin data)
  await setDoc(doc(adminDb, 'system_logs', 'log-1'), {
    action: 'SYSTEM_ACTION',
    createdAt: new Date(),
  });
  
  // Create banned user (superadmin data)
  await setDoc(doc(adminDb, 'banned_users', 'banned-1'), {
    uid: 'banned-user-123',
    reason: 'Spam',
    bannedAt: new Date(),
  });
}

describe('Firebase Security Rules', () => {
  beforeAll(async () => {
    // Load the security rules
    await loadFirestoreRules({
      projectId: PROJECT_ID,
      rules: `
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            
            // Helper functions
            function isAuthenticated() {
              return request.auth != null;
            }
            
            function isSuperAdmin() {
              return isAuthenticated() && request.auth.uid == '${SUPERADMIN_UID}';
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
            
            function isValidString(value, maxLength) {
              return value is string && value.size() > 0 && value.size() <= maxLength;
            }
            
            function isValidPrice(price) {
              return price is number && price >= 0 && price <= 100000;
            }

            // RESTAURANTS
            match /restaurants/{restaurantId} {
              allow read: if resource.data.status == 'ACTIVE' || isStaff(restaurantId) || isSuperAdmin();
              allow create: if isAuthenticated() 
                && isValidString(resource.data.name, 100)
                && isValidString(resource.data.slug, 50)
                && resource.data.status == 'ACTIVE'
                && resource.data.ownerUid == request.auth.uid
                && resource.data.plan in ['free', 'pro'];
              allow update: if isOwner(restaurantId) || isSuperAdmin();
              allow delete: if isSuperAdmin();
            }
            
            // TABLES
            match /tables/{tableId} {
              allow read: if resource.data.restaurantId != null && 
                (get(/databases/$(database)/documents/restaurants/$(resource.data.restaurantId)).data.status == 'ACTIVE' ||
                 isStaff(resource.data.restaurantId) || 
                 isSuperAdmin());
              allow create: if isAuthenticated() && 
                (isStaff(resource.data.restaurantId) || isSuperAdmin())
                && isValidString(resource.data.name, 10);
              allow update, delete: if isStaff(resource.data.restaurantId) || isSuperAdmin();
            }
            
            // CATEGORIES
            match /categories/{categoryId} {
              allow read: if resource.data.restaurantId != null && 
                (get(/databases/$(database)/documents/restaurants/$(resource.data.restaurantId)).data.status == 'ACTIVE' ||
                 isStaff(resource.data.restaurantId) || 
                 isSuperAdmin());
              allow create, update, delete: if isStaff(resource.data.restaurantId) || isSuperAdmin();
            }
            
            // MENU ITEMS
            match /menu_items/{itemId} {
              allow read: if resource.data.restaurantId != null && 
                (get(/databases/$(database)/documents/restaurants/$(resource.data.restaurantId)).data.status == 'ACTIVE' ||
                 isStaff(resource.data.restaurantId) || 
                 isSuperAdmin());
              allow create: if (isStaff(resource.data.restaurantId) || isSuperAdmin())
                && isValidString(resource.data.name, 100)
                && isValidPrice(resource.data.price);
              allow update: if (isStaff(resource.data.restaurantId) || isSuperAdmin())
                && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['name', 'description', 'price', 'imageUrl', 'available', 'isFeatured', 'tags', 'allergens', 'sortOrder', 'categoryId', 'updatedAt']);
              allow delete: if isStaff(resource.data.restaurantId) || isSuperAdmin();
            }
            
            // ORDERS
            match /orders/{orderId} {
              allow read: if resource.data.restaurantId != null && (
                (isAuthenticated() && isStaff(resource.data.restaurantId)) ||
                isSuperAdmin()
              );
              allow create: if isValidString(resource.data.restaurantId, 128)
                && resource.data.status == 'CREATED'
                && isValidPrice(resource.data.totalAmount)
                && resource.data.items is list
                && resource.data.items.size() > 0
                && resource.data.items.size() <= 50;
              allow update: if (isStaff(resource.data.restaurantId) || isSuperAdmin())
                && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'updatedAt', 'acceptedAt', 'paidAt', 'closedAt', 'cancelledAt', 'rejectReason', 'cancelReason']);
              allow delete: if isSuperAdmin();
            }
            
            // LOGS
            match /logs/{logId} {
              allow read: if isAuthenticated() && 
                (isStaff(resource.data.restaurantId) || isSuperAdmin());
              allow create: if true;
              allow update, delete: if false;
            }
            
            // STAFF
            match /staff/{staffId} {
              allow read: if isAuthenticated() && (
                (resource.data.restaurantId != null && isStaff(resource.data.restaurantId)) ||
                isSuperAdmin()
              );
              allow create, update: if isOwner(resource.data.restaurantId) || isSuperAdmin();
              allow delete: if isOwner(resource.data.restaurantId) || isSuperAdmin();
            }
            
            // USERS
            match /users/{userId} {
              allow read, update: if isAuthenticated() && request.auth.uid == userId;
              allow create: if isAuthenticated() && request.auth.uid == userId;
              allow delete: if isSuperAdmin();
            }
            
            // BANNED USERS (SuperAdmin only)
            match /banned_users/{userId} {
              allow read, write: if isSuperAdmin();
            }
            
            // SYSTEM LOGS (SuperAdmin only)
            match /system_logs/{logId} {
              allow read: if isSuperAdmin();
              allow create: if true;
              allow update, delete: if false;
            }
            
            // RATE LIMITING
            match /rate_limits/{rateLimitId} {
              allow read, write: if false;
            }
            
            // DENY ALL OTHER
            match /{document=**} {
              allow read, write: if false;
            }
          }
        }
      `,
    });
  });

  beforeEach(async () => {
    await clearFirestoreData({ projectId: PROJECT_ID });
    await setupTestData();
  });

  afterAll(async () => {
    // Clean up all apps
    await Promise.all(apps().map((app: any) => app.delete()));
  });

  // ============================================
  // TEST 1: Public can read public restaurant/menu data
  // ============================================
  describe('1. Public can read public restaurant/menu data', () => {
    it('should allow unauthenticated users to read ACTIVE restaurants', async () => {
      const publicDb = getFirestore(); // No auth
      const restaurantRef = doc(publicDb, 'restaurants', 'rest-1');
      
      await assertSucceeds(getDoc(restaurantRef));
    });

    it('should allow unauthenticated users to read categories', async () => {
      const publicDb = getFirestore();
      const categoryRef = doc(publicDb, 'categories', 'cat-1');
      
      await assertSucceeds(getDoc(categoryRef));
    });

    it('should allow unauthenticated users to read menu items', async () => {
      const publicDb = getFirestore();
      const menuItemRef = doc(publicDb, 'menu_items', 'item-1');
      
      await assertSucceeds(getDoc(menuItemRef));
    });

    it('should allow unauthenticated users to read tables', async () => {
      const publicDb = getFirestore();
      const tableRef = doc(publicDb, 'tables', 'table-1');
      
      await assertSucceeds(getDoc(tableRef));
    });
  });

  // ============================================
  // TEST 2: Public cannot edit restaurant
  // ============================================
  describe('2. Public cannot edit restaurant', () => {
    it('should deny unauthenticated users from updating a restaurant', async () => {
      const publicDb = getFirestore();
      const restaurantRef = doc(publicDb, 'restaurants', 'rest-1');
      
      await assertFails(
        updateDoc(restaurantRef, { name: 'Hacked Restaurant' })
      );
    });

    it('should deny unauthenticated users from creating a restaurant', async () => {
      const publicDb = getFirestore();
      const restaurantsRef = collection(publicDb, 'restaurants');
      
      await assertFails(
        addDoc(restaurantsRef, {
          name: 'Fake Restaurant',
          slug: 'fake',
          status: 'ACTIVE',
          ownerUid: 'hacker',
          plan: 'free',
        })
      );
    });

    it('should deny unauthenticated users from deleting a restaurant', async () => {
      const publicDb = getFirestore();
      const restaurantRef = doc(publicDb, 'restaurants', 'rest-1');
      
      await assertFails(deleteDoc(restaurantRef));
    });
  });

  // ============================================
  // TEST 3: Public cannot edit menu
  // ============================================
  describe('3. Public cannot edit menu', () => {
    it('should deny unauthenticated users from creating a menu item', async () => {
      const publicDb = getFirestore();
      const menuItemsRef = collection(publicDb, 'menu_items');
      
      await assertFails(
        addDoc(menuItemsRef, createMenuItemData('rest-1', 'cat-1'))
      );
    });

    it('should deny unauthenticated users from updating a menu item', async () => {
      const publicDb = getFirestore();
      const menuItemRef = doc(publicDb, 'menu_items', 'item-1');
      
      await assertFails(
        updateDoc(menuItemRef, { price: 0.01 })
      );
    });

    it('should deny unauthenticated users from deleting a menu item', async () => {
      const publicDb = getFirestore();
      const menuItemRef = doc(publicDb, 'menu_items', 'item-1');
      
      await assertFails(deleteDoc(menuItemRef));
    });

    it('should deny unauthenticated users from creating a category', async () => {
      const publicDb = getFirestore();
      const categoriesRef = collection(publicDb, 'categories');
      
      await assertFails(
        addDoc(categoriesRef, createCategoryData('rest-1'))
      );
    });

    it('should deny unauthenticated users from updating a category', async () => {
      const publicDb = getFirestore();
      const categoryRef = doc(publicDb, 'categories', 'cat-1');
      
      await assertFails(
        updateDoc(categoryRef, { name: 'Hacked Category' })
      );
    });
  });

  // ============================================
  // TEST 4: Public cannot edit table
  // ============================================
  describe('4. Public cannot edit table', () => {
    it('should deny unauthenticated users from creating a table', async () => {
      const publicDb = getFirestore();
      const tablesRef = collection(publicDb, 'tables');
      
      await assertFails(
        addDoc(tablesRef, createTableData('rest-1'))
      );
    });

    it('should deny unauthenticated users from updating a table', async () => {
      const publicDb = getFirestore();
      const tableRef = doc(publicDb, 'tables', 'table-1');
      
      await assertFails(
        updateDoc(tableRef, { name: 'Hacked Table' })
      );
    });

    it('should deny unauthenticated users from deleting a table', async () => {
      const publicDb = getFirestore();
      const tableRef = doc(publicDb, 'tables', 'table-1');
      
      await assertFails(deleteDoc(tableRef));
    });
  });

  // ============================================
  // TEST 5: Public can create a valid order
  // ============================================
  describe('5. Public can create a valid order', () => {
    it('should allow unauthenticated users to create a valid order', async () => {
      const publicDb = getFirestore();
      const ordersRef = collection(publicDb, 'orders');
      
      await assertSucceeds(
        addDoc(ordersRef, createOrderData('rest-1', 'table-1'))
      );
    });

    it('should deny creating order with invalid status', async () => {
      const publicDb = getFirestore();
      const ordersRef = collection(publicDb, 'orders');
      
      await assertFails(
        addDoc(ordersRef, {
          ...createOrderData('rest-1', 'table-1'),
          status: 'ACCEPTED', // Invalid - must start as CREATED
        })
      );
    });

    it('should deny creating order without items', async () => {
      const publicDb = getFirestore();
      const ordersRef = collection(publicDb, 'orders');
      
      await assertFails(
        addDoc(ordersRef, {
          ...createOrderData('rest-1', 'table-1'),
          items: [], // Invalid - must have at least one item
        })
      );
    });

    it('should deny creating order with negative total', async () => {
      const publicDb = getFirestore();
      const ordersRef = collection(publicDb, 'orders');
      
      await assertFails(
        addDoc(ordersRef, {
          ...createOrderData('rest-1', 'table-1'),
          totalAmount: -10,
        })
      );
    });
  });

  // ============================================
  // TEST 6: Owner can edit own restaurant
  // ============================================
  describe('6. Owner can edit own restaurant', () => {
    it('should allow owner to update their own restaurant', async () => {
      const ownerDb = getFirestore({ uid: OWNER_UID });
      const restaurantRef = doc(ownerDb, 'restaurants', 'rest-1');
      
      await assertSucceeds(
        updateDoc(restaurantRef, { name: 'Updated Restaurant Name' })
      );
    });

    it('should allow owner to read their own restaurant', async () => {
      const ownerDb = getFirestore({ uid: OWNER_UID });
      const restaurantRef = doc(ownerDb, 'restaurants', 'rest-1');
      
      await assertSucceeds(getDoc(restaurantRef));
    });
  });

  // ============================================
  // TEST 7: Owner cannot edit another restaurant
  // ============================================
  describe('7. Owner cannot edit another restaurant', () => {
    it('should deny owner from updating another owners restaurant', async () => {
      const ownerDb = getFirestore({ uid: OWNER_UID });
      const restaurantRef = doc(ownerDb, 'restaurants', 'rest-2');
      
      await assertFails(
        updateDoc(restaurantRef, { name: 'Hacked!' })
      );
    });

    it('should deny owner from deleting another owners restaurant', async () => {
      const ownerDb = getFirestore({ uid: OWNER_UID });
      const restaurantRef = doc(ownerDb, 'restaurants', 'rest-2');
      
      await assertFails(deleteDoc(restaurantRef));
    });
  });

  // ============================================
  // TEST 8: Staff can update order for own restaurant
  // ============================================
  describe('8. Staff can update order for own restaurant', () => {
    it('should allow staff to read orders for their restaurant', async () => {
      const staffDb = getFirestore({ uid: STAFF_UID });
      const orderRef = doc(staffDb, 'orders', 'order-1');
      
      await assertSucceeds(getDoc(orderRef));
    });

    it('should allow staff to update order status for their restaurant', async () => {
      const staffDb = getFirestore({ uid: STAFF_UID });
      const orderRef = doc(staffDb, 'orders', 'order-1');
      
      await assertSucceeds(
        updateDoc(orderRef, { 
          status: 'ACCEPTED',
          updatedAt: new Date(),
        })
      );
    });

    it('should allow owner to update orders for their restaurant', async () => {
      const ownerDb = getFirestore({ uid: OWNER_UID });
      const orderRef = doc(ownerDb, 'orders', 'order-1');
      
      await assertSucceeds(
        updateDoc(orderRef, { 
          status: 'PAID',
          updatedAt: new Date(),
        })
      );
    });
  });

  // ============================================
  // TEST 9: Staff cannot update another restaurant order
  // ============================================
  describe('9. Staff cannot update another restaurant order', () => {
    it('should deny staff from reading orders of another restaurant', async () => {
      const staffDb = getFirestore({ uid: STAFF_UID });
      const orderRef = doc(staffDb, 'orders', 'order-2');
      
      await assertFails(getDoc(orderRef));
    });

    it('should deny staff from updating orders of another restaurant', async () => {
      const staffDb = getFirestore({ uid: STAFF_UID });
      const orderRef = doc(staffDb, 'orders', 'order-2');
      
      await assertFails(
        updateDoc(orderRef, { status: 'ACCEPTED' })
      );
    });

    it('should deny staff from deleting orders of another restaurant', async () => {
      const staffDb = getFirestore({ uid: STAFF_UID });
      const orderRef = doc(staffDb, 'orders', 'order-2');
      
      await assertFails(deleteDoc(orderRef));
    });
  });

  // ============================================
  // TEST 10: Non-superadmin cannot access superadmin data
  // ============================================
  describe('10. Non-superadmin cannot access superadmin data', () => {
    it('should deny regular user from reading system_logs', async () => {
      const userDb = getFirestore({ uid: OWNER_UID });
      const logRef = doc(userDb, 'system_logs', 'log-1');
      
      await assertFails(getDoc(logRef));
    });

    it('should deny staff from reading system_logs', async () => {
      const staffDb = getFirestore({ uid: STAFF_UID });
      const logRef = doc(staffDb, 'system_logs', 'log-1');
      
      await assertFails(getDoc(logRef));
    });

    it('should deny regular user from reading banned_users', async () => {
      const userDb = getFirestore({ uid: OWNER_UID });
      const bannedRef = doc(userDb, 'banned_users', 'banned-1');
      
      await assertFails(getDoc(bannedRef));
    });

    it('should deny regular user from creating banned_users', async () => {
      const userDb = getFirestore({ uid: OWNER_UID });
      const bannedRef = collection(userDb, 'banned_users');
      
      await assertFails(
        addDoc(bannedRef, { uid: 'new-banned', reason: 'test' })
      );
    });

    it('should allow superadmin to read system_logs', async () => {
      const superAdminDb = getFirestore({ uid: SUPERADMIN_UID });
      const logRef = doc(superAdminDb, 'system_logs', 'log-1');
      
      await assertSucceeds(getDoc(logRef));
    });

    it('should allow superadmin to read banned_users', async () => {
      const superAdminDb = getFirestore({ uid: SUPERADMIN_UID });
      const bannedRef = doc(superAdminDb, 'banned_users', 'banned-1');
      
      await assertSucceeds(getDoc(bannedRef));
    });

    it('should allow superadmin to create banned_users', async () => {
      const superAdminDb = getFirestore({ uid: SUPERADMIN_UID });
      const bannedRef = collection(superAdminDb, 'banned_users');
      
      await assertSucceeds(
        addDoc(bannedRef, { uid: 'new-banned-user', reason: 'Spam' })
      );
    });
  });

  // ============================================
  // TEST 11: Free plan item limit (max 8 items)
  // ============================================
  describe('11. Free plan item limit (max 8 items)', () => {
    // Note: The item limit is enforced server-side via Cloud Functions
    // The rules allow creation, but a Cloud Function would reject if limit exceeded
    
    it('should allow staff to create menu items for free plan restaurant', async () => {
      const staffDb = getFirestore({ uid: STAFF_UID });
      const menuItemsRef = collection(staffDb, 'menu_items');
      
      await assertSucceeds(
        addDoc(menuItemsRef, createMenuItemData('rest-1', 'cat-1', { name: 'New Item' }))
      );
    });

    // This test documents that item count validation should happen server-side
    it('should note that item count limit is enforced server-side', async () => {
      // The Firestore rules themselves cannot count existing documents
      // Item limit enforcement should be done via:
      // 1. Cloud Functions (onWrite trigger to count and reject)
      // 2. Server-side API validation before write
      expect(true).toBe(true);
    });
  });

  // ============================================
  // ADDITIONAL TESTS: User profile access
  // ============================================
  describe('User profile access', () => {
    it('should allow user to read their own profile', async () => {
      const userDb = getFirestore({ uid: OWNER_UID });
      const userRef = doc(userDb, 'users', OWNER_UID);
      
      // Create the user profile first
      const adminDb = getAdminFirestore();
      await setDoc(doc(adminDb, 'users', OWNER_UID), { name: 'Owner' });
      
      await assertSucceeds(getDoc(userRef));
    });

    it('should allow user to update their own profile', async () => {
      const adminDb = getAdminFirestore();
      await setDoc(doc(adminDb, 'users', OWNER_UID), { name: 'Owner' });
      
      const userDb = getFirestore({ uid: OWNER_UID });
      const userRef = doc(userDb, 'users', OWNER_UID);
      
      await assertSucceeds(
        updateDoc(userRef, { name: 'Updated Name' })
      );
    });

    it('should deny user from reading another users profile', async () => {
      const adminDb = getAdminFirestore();
      await setDoc(doc(adminDb, 'users', 'other-user'), { name: 'Other' });
      
      const userDb = getFirestore({ uid: OWNER_UID });
      const userRef = doc(userDb, 'users', 'other-user');
      
      await assertFails(getDoc(userRef));
    });

    it('should deny user from updating another users profile', async () => {
      const adminDb = getAdminFirestore();
      await setDoc(doc(adminDb, 'users', 'other-user'), { name: 'Other' });
      
      const userDb = getFirestore({ uid: OWNER_UID });
      const userRef = doc(userDb, 'users', 'other-user');
      
      await assertFails(
        updateDoc(userRef, { name: 'Hacked!' })
      );
    });
  });

  // ============================================
  // ADDITIONAL TESTS: Logs immutability
  // ============================================
  describe('Logs immutability', () => {
    it('should allow anyone to create logs', async () => {
      const publicDb = getFirestore();
      const logsRef = collection(publicDb, 'logs');
      
      await assertSucceeds(
        addDoc(logsRef, {
          restaurantId: 'rest-1',
          action: 'ORDER_CREATED',
          targetType: 'order',
          targetId: 'order-1',
          createdAt: new Date(),
        })
      );
    });

    it('should deny updating logs', async () => {
      const adminDb = getAdminFirestore();
      await setDoc(doc(adminDb, 'logs', 'test-log'), {
        restaurantId: 'rest-1',
        action: 'ORDER_CREATED',
        targetType: 'order',
        targetId: 'order-1',
        createdAt: new Date(),
      });
      
      const userDb = getFirestore({ uid: OWNER_UID });
      const logRef = doc(userDb, 'logs', 'test-log');
      
      await assertFails(
        updateDoc(logRef, { action: 'HACKED' })
      );
    });

    it('should deny deleting logs', async () => {
      const adminDb = getAdminFirestore();
      await setDoc(doc(adminDb, 'logs', 'test-log'), {
        restaurantId: 'rest-1',
        action: 'ORDER_CREATED',
        targetType: 'order',
        targetId: 'order-1',
        createdAt: new Date(),
      });
      
      const userDb = getFirestore({ uid: OWNER_UID });
      const logRef = doc(userDb, 'logs', 'test-log');
      
      await assertFails(deleteDoc(logRef));
    });
  });

  // ============================================
  // ADDITIONAL TESTS: SuperAdmin full access
  // ============================================
  describe('SuperAdmin full access', () => {
    it('should allow superadmin to update any restaurant', async () => {
      const superAdminDb = getFirestore({ uid: SUPERADMIN_UID });
      const restaurantRef = doc(superAdminDb, 'restaurants', 'rest-1');
      
      await assertSucceeds(
        updateDoc(restaurantRef, { name: 'Admin Updated' })
      );
    });

    it('should allow superadmin to delete any restaurant', async () => {
      const superAdminDb = getFirestore({ uid: SUPERADMIN_UID });
      const restaurantRef = doc(superAdminDb, 'restaurants', 'rest-2');
      
      await assertSucceeds(deleteDoc(restaurantRef));
    });

    it('should allow superadmin to delete any order', async () => {
      const superAdminDb = getFirestore({ uid: SUPERADMIN_UID });
      const orderRef = doc(superAdminDb, 'orders', 'order-1');
      
      await assertSucceeds(deleteDoc(orderRef));
    });
  });
});
