import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  DocumentSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import type { MenuItem, MenuCategory, MenuItemDocument, MenuCategoryDocument } from '@/types';

const MENU_ITEMS_COLLECTION = 'menuItems';
const CATEGORIES_COLLECTION = 'categories';

// Demo data for offline/fallback mode ONLY
const DEMO_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', restaurantId: 'demo-restaurant-id', name: 'Signature Coffee', slug: 'signature-coffee', sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-2', restaurantId: 'demo-restaurant-id', name: 'Artisan Pastries', slug: 'artisan-pastries', sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-3', restaurantId: 'demo-restaurant-id', name: 'Light Meals', slug: 'light-meals', sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-4', restaurantId: 'demo-restaurant-zcoffee', name: 'Coffee', slug: 'coffee', sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-5', restaurantId: 'demo-restaurant-zcoffee', name: 'Cold Drinks', slug: 'cold-drinks', sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  { id: 'cat-6', restaurantId: 'demo-restaurant-zcoffee', name: 'Food', slug: 'food', sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
];

const DEMO_MENU_ITEMS: MenuItem[] = [
  // Café Élégance items
  {
    id: 'item-1',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-1',
    name: 'Ethiopian Yirgacheffe',
    description: 'Single-origin pour-over with bright citrus notes and a floral finish.',
    price: 5.50,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
    available: true,
    isFeatured: true,
    tags: ['BESTSELLER'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-2',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-1',
    name: 'Colombian Supremo',
    description: 'Rich and full-bodied with caramel sweetness and a hint of dark chocolate.',
    price: 4.50,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
    available: true,
    isFeatured: false,
    tags: [],
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-3',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-2',
    name: 'Croissant aux Amandes',
    description: 'Buttery croissant filled with frangipane and topped with sliced almonds.',
    price: 4.80,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop',
    available: true,
    isFeatured: false,
    tags: [],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-4',
    restaurantId: 'demo-restaurant-id',
    categoryId: 'cat-3',
    name: 'Avocado Toast',
    description: 'Sourdough topped with smashed avocado, cherry tomatoes, and microgreens.',
    price: 12.50,
    imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400&h=300&fit=crop',
    available: true,
    isFeatured: true,
    tags: ['VEGAN'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  // Z Coffee items
  {
    id: 'zc-1',
    restaurantId: 'demo-restaurant-zcoffee',
    categoryId: 'cat-4',
    name: 'Espresso',
    description: 'Rich and bold single shot of espresso.',
    price: 3.500,
    imageUrl: 'https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&h=300&fit=crop',
    available: true,
    isFeatured: true,
    tags: ['BESTSELLER'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'zc-2',
    restaurantId: 'demo-restaurant-zcoffee',
    categoryId: 'cat-4',
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam.',
    price: 5.000,
    imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop',
    available: true,
    isFeatured: true,
    tags: ['POPULAR'],
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'zc-3',
    restaurantId: 'demo-restaurant-zcoffee',
    categoryId: 'cat-4',
    name: 'Latte',
    description: 'Smooth espresso with steamed milk.',
    price: 5.500,
    imageUrl: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&h=300&fit=crop',
    available: true,
    isFeatured: false,
    tags: [],
    sortOrder: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'zc-4',
    restaurantId: 'demo-restaurant-zcoffee',
    categoryId: 'cat-5',
    name: 'Iced Coffee',
    description: 'Cold brew served over ice.',
    price: 4.500,
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
    available: true,
    isFeatured: true,
    tags: ['POPULAR'],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'zc-5',
    restaurantId: 'demo-restaurant-zcoffee',
    categoryId: 'cat-6',
    name: 'Croissant',
    description: 'Freshly baked butter croissant.',
    price: 3.000,
    imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop',
    available: true,
    isFeatured: false,
    tags: [],
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'zc-6',
    restaurantId: 'demo-restaurant-zcoffee',
    categoryId: 'cat-6',
    name: 'Cheesecake',
    description: 'Creamy New York style cheesecake.',
    price: 6.500,
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop',
    available: true,
    isFeatured: true,
    tags: ['BESTSELLER'],
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Check if Firebase is available
function isFirebaseAvailable(): boolean {
  try {
    return !!db && !!db.app;
  } catch {
    return false;
  }
}

// Convert Firestore document to MenuItem type
function documentToMenuItem(doc: DocumentSnapshot): MenuItem | null {
  if (!doc.exists()) return null;
  
  const data = doc.data() as MenuItemDocument;
  return {
    id: doc.id,
    ...data,
    createdAt: new Date(data.createdAt.seconds * 1000),
    updatedAt: new Date(data.updatedAt.seconds * 1000),
  };
}

// Convert Firestore document to MenuCategory type
function documentToCategory(doc: DocumentSnapshot): MenuCategory | null {
  if (!doc.exists()) return null;
  
  const data = doc.data() as MenuCategoryDocument;
  return {
    id: doc.id,
    ...data,
    createdAt: new Date(data.createdAt.seconds * 1000),
    updatedAt: new Date(data.updatedAt.seconds * 1000),
  };
}

// Get all categories for a restaurant - Firebase FIRST, demo fallback
export async function getCategories(restaurantId: string): Promise<MenuCategory[]> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, CATEGORIES_COLLECTION),
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const categories = snapshot.docs
        .map(documentToCategory)
        .filter((cat): cat is MenuCategory => cat !== null);
      
      if (categories.length > 0) return categories;
    } catch (error) {
      console.warn('Firebase getCategories error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_CATEGORIES.filter(c => c.restaurantId === restaurantId);
}

// Get all menu items for a restaurant - Firebase FIRST, demo fallback
export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, MENU_ITEMS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        orderBy('sortOrder', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs
        .map(documentToMenuItem)
        .filter((item): item is MenuItem => item !== null);
      
      if (items.length > 0) return items;
    } catch (error) {
      console.warn('Firebase getMenuItems error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_MENU_ITEMS.filter(i => i.restaurantId === restaurantId);
}

// Get menu items by category
export async function getMenuItemsByCategory(
  restaurantId: string, 
  categoryId: string
): Promise<MenuItem[]> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, MENU_ITEMS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        where('categoryId', '==', categoryId),
        orderBy('sortOrder', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs
        .map(documentToMenuItem)
        .filter((item): item is MenuItem => item !== null);
      
      if (items.length > 0) return items;
    } catch (error) {
      console.warn('Firebase getMenuItemsByCategory error:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_MENU_ITEMS.filter(i => i.restaurantId === restaurantId && i.categoryId === categoryId);
}

// Get featured items
export async function getFeaturedItems(restaurantId: string): Promise<MenuItem[]> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, MENU_ITEMS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        where('isFeatured', '==', true),
        where('available', '==', true)
      );
      
      const snapshot = await getDocs(q);
      const items = snapshot.docs
        .map(documentToMenuItem)
        .filter((item): item is MenuItem => item !== null);
      
      if (items.length > 0) return items;
    } catch (error) {
      console.warn('Firebase getFeaturedItems error:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_MENU_ITEMS.filter(i => i.restaurantId === restaurantId && i.isFeatured && i.available);
}

// Get a single menu item
export async function getMenuItem(itemId: string): Promise<MenuItem | null> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId);
      const snapshot = await getDoc(docRef);
      const item = documentToMenuItem(snapshot);
      if (item) return item;
    } catch (error) {
      console.warn('Firebase getMenuItem error:', error);
    }
  }
  
  // Fallback to demo data
  return DEMO_MENU_ITEMS.find(i => i.id === itemId) || null;
}

// Subscribe to menu items changes - Firebase FIRST
export function subscribeToMenuItems(
  restaurantId: string,
  callback: (items: MenuItem[]) => void
): () => void {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, MENU_ITEMS_COLLECTION),
        where('restaurantId', '==', restaurantId),
        orderBy('sortOrder', 'asc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs
          .map(documentToMenuItem)
          .filter((item): item is MenuItem => item !== null);
        
        if (items.length > 0) {
          callback(items);
        } else {
          callback(DEMO_MENU_ITEMS.filter(i => i.restaurantId === restaurantId));
        }
      }, (error) => {
        console.warn('Firebase subscribeToMenuItems error:', error);
        callback(DEMO_MENU_ITEMS.filter(i => i.restaurantId === restaurantId));
      });
    } catch (error) {
      console.warn('Firebase subscribeToMenuItems error:', error);
    }
  }
  
  // Fallback to demo data
  callback(DEMO_MENU_ITEMS.filter(i => i.restaurantId === restaurantId));
  return () => {};
}

// Subscribe to categories changes - Firebase FIRST
export function subscribeToCategories(
  restaurantId: string,
  callback: (categories: MenuCategory[]) => void
): () => void {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, CATEGORIES_COLLECTION),
        where('restaurantId', '==', restaurantId),
        where('isActive', '==', true),
        orderBy('sortOrder', 'asc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const categories = snapshot.docs
          .map(documentToCategory)
          .filter((cat): cat is MenuCategory => cat !== null);
        
        if (categories.length > 0) {
          callback(categories);
        } else {
          callback(DEMO_CATEGORIES.filter(c => c.restaurantId === restaurantId));
        }
      }, (error) => {
        console.warn('Firebase subscribeToCategories error:', error);
        callback(DEMO_CATEGORIES.filter(c => c.restaurantId === restaurantId));
      });
    } catch (error) {
      console.warn('Firebase subscribeToCategories error:', error);
    }
  }
  
  // Fallback to demo data
  callback(DEMO_CATEGORIES.filter(c => c.restaurantId === restaurantId));
  return () => {};
}

export const menuService = {
  getCategories,
  getMenuItems,
  getMenuItemsByCategory,
  getFeaturedItems,
  getMenuItem,
  subscribeToMenuItems,
  subscribeToCategories,
  DEMO_CATEGORIES,
  DEMO_MENU_ITEMS,
};
