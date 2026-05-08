import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import type { Restaurant, RestaurantDocument } from '@/types';

const COLLECTION = 'restaurants';

// Demo restaurant data for offline/fallback mode ONLY
// This should only be used when Firebase is unavailable
const DEMO_RESTAURANTS: Record<string, Restaurant> = {
  'demo': {
    id: 'demo-restaurant-id',
    slug: 'demo',
    name: 'Café Élégance',
    status: 'ACTIVE',
    currency: 'EUR',
    cuisineType: 'French Café',
    address: '123 Rue de la Paix, Paris',
    phone: '+33 1 23 45 67 89',
    email: 'hello@cafe-elegance.fr',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  'zcoffee': {
    id: 'demo-restaurant-zcoffee',
    slug: 'zcoffee',
    name: 'Z Coffee',
    status: 'ACTIVE',
    currency: 'TND',
    cuisineType: 'Coffee Shop',
    address: 'Tunisia',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

// Check if Firebase is available
function isFirebaseAvailable(): boolean {
  try {
    return !!db && !!db.app;
  } catch {
    return false;
  }
}

// Convert Firestore document to Restaurant type
function documentToRestaurant(doc: DocumentSnapshot): Restaurant | null {
  if (!doc.exists()) return null;
  
  const data = doc.data() as RestaurantDocument;
  return {
    id: doc.id,
    ...data,
    createdAt: new Date(data.createdAt.seconds * 1000),
    updatedAt: new Date(data.updatedAt.seconds * 1000),
  };
}

// Get restaurant by ID - Firebase FIRST, demo fallback
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const snapshot = await getDoc(docRef);
      const restaurant = documentToRestaurant(snapshot);
      if (restaurant) return restaurant;
    } catch (error) {
      console.warn('Firebase getRestaurantById error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data only if Firebase fails or unavailable
  const demoRestaurant = Object.values(DEMO_RESTAURANTS).find(r => r.id === id);
  return demoRestaurant || null;
}

// Get restaurant by slug - Firebase FIRST, demo fallback
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('slug', '==', slug)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        return documentToRestaurant(snapshot.docs[0]);
      }
    } catch (error) {
      console.warn('Firebase getRestaurantBySlug error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data only if Firebase fails or no data found
  return DEMO_RESTAURANTS[slug] || null;
}

// Subscribe to restaurant changes
export function subscribeToRestaurant(
  restaurantId: string,
  callback: (restaurant: Restaurant | null) => void
): () => void {
  // Try Firebase first
  if (isFirebaseAvailable()) {
    try {
      const docRef = doc(db, COLLECTION, restaurantId);
      
      return onSnapshot(docRef, (snapshot) => {
        const restaurant = documentToRestaurant(snapshot);
        if (restaurant) {
          callback(restaurant);
        } else {
          // If no Firebase data, try demo
          const demoRestaurant = Object.values(DEMO_RESTAURANTS).find(r => r.id === restaurantId);
          callback(demoRestaurant || null);
        }
      }, (error) => {
        console.warn('Firebase subscribeToRestaurant error, falling back to demo:', error);
        const demoRestaurant = Object.values(DEMO_RESTAURANTS).find(r => r.id === restaurantId);
        callback(demoRestaurant || null);
      });
    } catch (error) {
      console.warn('Firebase subscribeToRestaurant error, falling back to demo:', error);
    }
  }
  
  // Fallback to demo data
  const demoRestaurant = Object.values(DEMO_RESTAURANTS).find(r => r.id === restaurantId);
  if (demoRestaurant) {
    callback(demoRestaurant);
  } else {
    callback(null);
  }
  return () => {};
}

// Check if running in demo mode
export function isDemoRestaurant(restaurantId: string): boolean {
  return Object.values(DEMO_RESTAURANTS).some(r => r.id === restaurantId);
}

export const restaurantService = {
  getById: getRestaurantById,
  getBySlug: getRestaurantBySlug,
  subscribe: subscribeToRestaurant,
  isDemoRestaurant,
  DEMO_RESTAURANTS,
};
