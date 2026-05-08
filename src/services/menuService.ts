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

// Get all categories for a restaurant
export async function getCategories(restaurantId: string): Promise<MenuCategory[]> {
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
}

// Get all menu items for a restaurant
export async function getMenuItems(restaurantId: string): Promise<MenuItem[]> {
  const q = query(
    collection(db, MENU_ITEMS_COLLECTION),
    where('restaurantId', '==', restaurantId),
    orderBy('sortOrder', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToMenuItem)
    .filter((item): item is MenuItem => item !== null);
}

// Get menu items by category
export async function getMenuItemsByCategory(
  restaurantId: string, 
  categoryId: string
): Promise<MenuItem[]> {
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
}

// Get featured items
export async function getFeaturedItems(restaurantId: string): Promise<MenuItem[]> {
  const q = query(
    collection(db, MENU_ITEMS_COLLECTION),
    where('restaurantId', '==', restaurantId),
    where('isFeatured', '==', true),
    where('isAvailable', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(documentToMenuItem)
    .filter((item): item is MenuItem => item !== null);
}

// Get a single menu item
export async function getMenuItem(itemId: string): Promise<MenuItem | null> {
  const docRef = doc(db, MENU_ITEMS_COLLECTION, itemId);
  const snapshot = await getDoc(docRef);
  return documentToMenuItem(snapshot);
}

// Subscribe to menu items changes
export function subscribeToMenuItems(
  restaurantId: string,
  callback: (items: MenuItem[]) => void
): () => void {
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
  });
}

// Subscribe to categories changes
export function subscribeToCategories(
  restaurantId: string,
  callback: (categories: MenuCategory[]) => void
): () => void {
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
  });
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
