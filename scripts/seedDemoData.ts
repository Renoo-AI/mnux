/**
 * MenuxPro Demo Data Seed Script
 * 
 * This script seeds the Firebase Firestore database with demo data for testing.
 * 
 * Demo Restaurant: Z Coffee
 * Demo Staff PIN: 1234 (cashier), 5678 (owner)
 * 
 * Usage:
 *   bun run scripts/seedDemoData.ts
 * 
 * Or with Firebase emulator:
 *   FIRESTORE_EMULATOR_HOST=localhost:8080 bun run scripts/seedDemoData.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  Timestamp,
  connectFirestoreEmulator
} from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'menuxtn.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'menuxtn',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'menuxtn.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'demo-sender-id',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to emulator if running locally
if (process.env.FIRESTORE_EMULATOR_HOST) {
  const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
  connectFirestoreEmulator(db, host, parseInt(port));
}

// Demo data IDs
const RESTAURANT_ID = 'demo-restaurant-zcoffee';
const STAFF_ID_CASHIER = 'demo-staff-001';
const STAFF_ID_OWNER = 'demo-staff-002';

async function seedDemoData() {
  console.log('🌱 Starting MenuxPro demo data seed...\n');

  try {
    // 1. Create Restaurant
    console.log('📍 Creating restaurant: Z Coffee');
    await setDoc(doc(db, 'restaurants', RESTAURANT_ID), {
      id: RESTAURANT_ID,
      slug: 'zcoffee',
      name: 'Z Coffee',
      status: 'ACTIVE',
      currency: 'TND',
      cuisineType: 'Coffee Shop',
      address: '123 Main Street, Tunis',
      phone: '+216 71 123 456',
      email: 'hello@zcoffee.tn',
      branding: {
        primaryColor: '#3A322D',
        accentColor: '#C9A07E',
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 2. Create Staff Members
    console.log('👥 Creating staff members...');
    
    // Cashier
    await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'staff', STAFF_ID_CASHIER), {
      id: STAFF_ID_CASHIER,
      restaurantId: RESTAURANT_ID,
      name: 'Cashier Demo',
      role: 'cashier',
      pin: '1234', // In production, this would be hashed
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Owner
    await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'staff', STAFF_ID_OWNER), {
      id: STAFF_ID_OWNER,
      restaurantId: RESTAURANT_ID,
      name: 'Owner Demo',
      role: 'owner',
      pin: '5678', // In production, this would be hashed
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 3. Create Menu Categories
    console.log('📂 Creating menu categories...');
    const categories = [
      { id: 'c1', name: 'Coffee', slug: 'coffee', sortOrder: 1 },
      { id: 'c2', name: 'Cold Drinks', slug: 'cold-drinks', sortOrder: 2 },
      { id: 'c3', name: 'Food', slug: 'food', sortOrder: 3 },
    ];

    for (const cat of categories) {
      await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menuCategories', cat.id), {
        id: cat.id,
        restaurantId: RESTAURANT_ID,
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // 4. Create Menu Items
    console.log('🍽️ Creating menu items...');
    const menuItems = [
      {
        id: 'm1',
        name: 'Espresso',
        description: 'Rich and bold single shot of espresso',
        price: 3.5,
        categoryId: 'c1',
        category: 'Coffee',
        available: true,
        isFeatured: true,
        tags: ['POPULAR'],
        sortOrder: 1,
      },
      {
        id: 'm2',
        name: 'Cappuccino',
        description: 'Espresso with steamed milk and foam',
        price: 4.5,
        categoryId: 'c1',
        category: 'Coffee',
        available: true,
        isFeatured: true,
        tags: ['BESTSELLER'],
        sortOrder: 2,
      },
      {
        id: 'm3',
        name: 'Latte',
        description: 'Smooth espresso with steamed milk',
        price: 5.0,
        categoryId: 'c1',
        category: 'Coffee',
        available: true,
        isFeatured: false,
        tags: [],
        sortOrder: 3,
      },
      {
        id: 'm4',
        name: 'Iced Coffee',
        description: 'Cold brew served over ice',
        price: 4.0,
        categoryId: 'c2',
        category: 'Cold Drinks',
        available: true,
        isFeatured: false,
        tags: ['REFRESHING'],
        sortOrder: 4,
      },
      {
        id: 'm5',
        name: 'Croissant',
        description: 'Buttery, flaky French pastry',
        price: 3.0,
        categoryId: 'c3',
        category: 'Food',
        available: true,
        isFeatured: false,
        tags: [],
        sortOrder: 5,
      },
      {
        id: 'm6',
        name: 'Cheesecake',
        description: 'Creamy New York style cheesecake',
        price: 6.5,
        categoryId: 'c3',
        category: 'Food',
        available: true,
        isFeatured: true,
        tags: ['SWEET'],
        sortOrder: 6,
      },
    ];

    for (const item of menuItems) {
      await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'menuItems', item.id), {
        id: item.id,
        restaurantId: RESTAURANT_ID,
        name: item.name,
        description: item.description,
        price: item.price,
        categoryId: item.categoryId,
        category: item.category,
        available: item.available,
        isFeatured: item.isFeatured,
        tags: item.tags,
        sortOrder: item.sortOrder,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    // 5. Create Tables
    console.log('🪑 Creating tables...');
    const tables = [
      { id: 't1', name: 'T-01', seats: 4 },
      { id: 't2', name: 'T-02', seats: 2 },
      { id: 't3', name: 'T-03', seats: 6 },
      { id: 't4', name: 'T-04', seats: 4 },
      { id: 't5', name: 'T-05', seats: 2 },
      { id: 't6', name: 'T-06', seats: 8 },
    ];

    for (const table of tables) {
      await setDoc(doc(db, 'restaurants', RESTAURANT_ID, 'tables', table.id), {
        id: table.id,
        restaurantId: RESTAURANT_ID,
        name: table.name,
        seats: table.seats,
        status: 'EMPTY',
        qrCodeUrl: `/r/zcoffee/t/${table.name}`,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }

    console.log('\n✅ Demo data seeded successfully!\n');
    console.log('📋 Demo Credentials:');
    console.log('   Restaurant Slug: zcoffee');
    console.log('   Cashier PIN: 1234');
    console.log('   Owner PIN: 5678');
    console.log('\n🌐 Demo URLs:');
    console.log('   Public Menu: /r/zcoffee');
    console.log('   Table QR: /r/zcoffee/t/T-01');
    console.log('   Staff Login: /staff/login');
    console.log('   Dashboard: /staff/dashboard');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDemoData().then(() => {
  console.log('\n🎉 Seed complete!');
  process.exit(0);
}).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
