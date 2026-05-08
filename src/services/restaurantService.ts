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

// Get restaurant by ID
export async function getRestaurantById(id: string): Promise<Restaurant | null> {
  const docRef = doc(db, COLLECTION, id);
  const snapshot = await getDoc(docRef);
  return documentToRestaurant(snapshot);
}

// Get restaurant by slug
export async function getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  const q = query(
    collection(db, COLLECTION),
    where('slug', '==', slug)
  );
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  
  return documentToRestaurant(snapshot.docs[0]);
}

// Subscribe to restaurant changes
export function subscribeToRestaurant(
  restaurantId: string,
  callback: (restaurant: Restaurant | null) => void
): () => void {
  const docRef = doc(db, COLLECTION, restaurantId);
  
  return onSnapshot(docRef, (snapshot) => {
    callback(documentToRestaurant(snapshot));
  });
}

export const restaurantService = {
  getById: getRestaurantById,
  getBySlug: getRestaurantBySlug,
  subscribe: subscribeToRestaurant,
};
