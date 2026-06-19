import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  orderBy,
  DocumentSnapshot,
  QueryDocumentSnapshot,
  doc,
  getDoc
} from 'firebase/firestore';
import type { MenuItem, MenuCategory } from '@/types';

const MENU_ITEMS_COLLECTION = 'menuItems';
const CATEGORIES_COLLECTION = 'categories';

type FirestoreTimestamp = { seconds: number; nanoseconds: number };

// Convert Firestore document to MenuItem type
function documentToMenuItem(docSnap: DocumentSnapshot | QueryDocumentSnapshot): MenuItem | null {
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data()!;
  return {
    restaurantId: data.restaurantId,
    categoryId: data.categoryId,
    name: data.name,
    description: data.description,
    price: data.price,
    imageUrl: data.imageUrl,
    available: data.available,
    isFeatured: data.isFeatured,
    tags: data.tags,
    allergens: data.allergens,
    sortOrder: data.sortOrder,
    id: docSnap.id,
    createdAt: data.createdAt ? new Date((data.createdAt as FirestoreTimestamp).seconds * 1000) : new Date(),
    updatedAt: data.updatedAt ? new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000) : new Date(),
  };
}

// Convert Firestore document to MenuCategory type
function documentToCategory(docSnap: DocumentSnapshot | QueryDocumentSnapshot): MenuCategory | null {
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data()!;
  return {
    restaurantId: data.restaurantId,
    name: data.name,
    slug: data.slug,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    id: docSnap.id,
    createdAt: data.createdAt ? new Date((data.createdAt as FirestoreTimestamp).seconds * 1000) : new Date(),
    updatedAt: data.updatedAt ? new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000) : new Date(),
  };
}

// Get all categories for a restaurant
export async function getCategories(restaurantId: string): Promise<MenuCategory[]> {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(documentToCategory)
      .filter((cat): cat is MenuCategory => cat !== null);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories.');
  }
}

// Get all menu items for a restaurant
export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  try {
    const q = query(
      collection(db, MENU_ITEMS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      orderBy('sortOrder', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(documentToMenuItem)
      .filter((item): item is MenuItem => item !== null);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw new Error('Failed to fetch menu items.');
  }
}

// Get menu items by category
export async function getMenuItemsByCategory(
  restaurantId: string, 
  categoryId: string
): Promise<MenuItem[]> {
  try {
    const q = query(
      collection(db, MENU_ITEMS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('categoryId', '==', categoryId),
      orderBy('sortOrder', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(documentToMenuItem)
      .filter((item): item is MenuItem => item !== null);
  } catch (error) {
    console.error('Error fetching menu items by category:', error);
    throw new Error('Failed to fetch menu items.');
  }
}

// Get featured items
export async function getFeaturedItems(restaurantId: string): Promise<MenuItem[]> {
  try {
    const q = query(
      collection(db, MENU_ITEMS_COLLECTION),
      where('restaurantId', '==', restaurantId),
      where('isFeatured', '==', true),
      where('available', '==', true)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(documentToMenuItem)
      .filter((item): item is MenuItem => item !== null);
  } catch (error) {
    console.error('Error fetching featured items:', error);
    throw new Error('Failed to fetch featured items.');
  }
}

// Get a single menu item
export async function getMenuItem(itemId: string): Promise<MenuItem | null> {
  try {
    const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId);
    const snapshot = await getDoc(docRef);
    return documentToMenuItem(snapshot);
  } catch (error) {
    console.error('Error fetching menu item:', error);
    throw new Error('Failed to fetch menu item.');
  }
}

// Subscribe to menu items changes
export function subscribeToMenuItems(
  restaurantId: string,
  callback: (items: MenuItem[]) => void,
  onError?: (error: Error) => void
): () => void {
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
      callback(items);
    }, (error) => {
      console.error('Error subscribing to menu items:', error);
      if (onError) {
        onError(new Error('Failed to sync menu items.'));
      }
    });
  } catch (error) {
    console.error('Error setting up menu items subscription:', error);
    if (onError) {
      onError(new Error('Failed to subscribe to menu items.'));
    }
    return () => {};
  }
}

// Subscribe to categories changes
export function subscribeToCategories(
  restaurantId: string,
  callback: (categories: MenuCategory[]) => void,
  onError?: (error: Error) => void
): () => void {
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
      callback(categories);
    }, (error) => {
      console.error('Error subscribing to categories:', error);
      if (onError) {
        onError(new Error('Failed to sync categories.'));
      }
    });
  } catch (error) {
    console.error('Error setting up categories subscription:', error);
    if (onError) {
      onError(new Error('Failed to subscribe to categories.'));
    }
    return () => {};
  }
}

export const menuService = {
  getCategories,
  getMenuItems,
  getMenuItemsByCategory,
  getFeaturedItems,
  getMenuItem,
  subscribeToMenuItems,
  subscribeToCategories,
};
