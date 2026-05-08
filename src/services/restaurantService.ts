import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  onSnapshot,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import type { Restaurant } from '@/types';

const COLLECTION = 'restaurants';

type FirestoreTimestamp = { seconds: number; nanoseconds: number };

// Convert Firestore document to Restaurant type
function documentToRestaurant(docSnap: DocumentSnapshot | QueryDocumentSnapshot): Restaurant | null {
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data()!;
  return {
    slug: data.slug,
    name: data.name,
    status: data.status,
    currency: data.currency,
    cuisineType: data.cuisineType,
    address: data.address,
    logoUrl: data.logoUrl,
    phone: data.phone,
    email: data.email,
    ownerUid: data.ownerUid,
    plan: data.plan,
    slugType: data.slugType,
    watermarkEnabled: data.watermarkEnabled,
    maxMenuItems: data.maxMenuItems,
    branding: data.branding,
    openingHours: data.openingHours,
    staffUids: data.staffUids,
    id: docSnap.id,
    createdAt: data.createdAt ? new Date((data.createdAt as FirestoreTimestamp).seconds * 1000) : new Date(),
    updatedAt: data.updatedAt ? new Date((data.updatedAt as FirestoreTimestamp).seconds * 1000) : new Date(),
  };
}

// Get restaurant by ID
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  try {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    return documentToRestaurant(snapshot);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    throw new Error('Failed to fetch restaurant. Please check your connection.');
  }
}

// Get restaurant by slug
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('slug', '==', slug),
      where('status', '==', 'active')
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      return documentToRestaurant(snapshot.docs[0]);
    }
    return null;
  } catch (error) {
    console.error('Error fetching restaurant by slug:', error);
    throw new Error('Failed to fetch restaurant. Please check your connection.');
  }
}

// Subscribe to restaurant changes
export function subscribeToRestaurant(
  restaurantId: string,
  callback: (restaurant: Restaurant | null) => void,
  onError?: (error: Error) => void
): () => void {
  try {
    const docRef = doc(db, COLLECTION, restaurantId);
    
    return onSnapshot(docRef, (snapshot) => {
      const restaurant = documentToRestaurant(snapshot);
      callback(restaurant);
    }, (error) => {
      console.error('Error subscribing to restaurant:', error);
      if (onError) {
        onError(new Error('Failed to sync restaurant data.'));
      }
    });
  } catch (error) {
    console.error('Error setting up restaurant subscription:', error);
    if (onError) {
      onError(new Error('Failed to subscribe to restaurant.'));
    }
    return () => {};
  }
}

export const restaurantService = {
  getById: getRestaurantById,
  getBySlug: getRestaurantBySlug,
  subscribe: subscribeToRestaurant,
};
