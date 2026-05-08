import { auth, db } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { Staff, UserRole } from '@/types';

const STAFF_COLLECTION = 'staff';

export interface AuthUser {
  uid: string;
  email: string | null;
  staffProfile: Staff | null;
  role: UserRole | null;
}

// Get staff profile from Firestore
async function getStaffProfile(userId: string): Promise<Staff | null> {
  const docRef = doc(db, STAFF_COLLECTION, userId);
  const snapshot = await getDoc(docRef);
  
  if (!snapshot.exists()) return null;
  
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    createdAt: new Date(data.createdAt.seconds * 1000),
    updatedAt: new Date(data.updatedAt.seconds * 1000),
  } as Staff;
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const staffProfile = await getStaffProfile(user.uid);
  
  return {
    uid: user.uid,
    email: user.email,
    staffProfile,
    role: staffProfile?.role || null,
  };
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// Subscribe to auth state changes
export function subscribeToAuthState(
  callback: (user: AuthUser | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }
    
    const staffProfile = await getStaffProfile(user.uid);
    
    callback({
      uid: user.uid,
      email: user.email,
      staffProfile,
      role: staffProfile?.role || null,
    });
  });
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Check if user has required role
export function hasRole(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
  if (!user || !user.role) return false;
  return requiredRoles.includes(user.role);
}

// Check if user is owner
export function isOwner(user: AuthUser | null): boolean {
  return user?.role === 'owner';
}

// Check if user is manager or above
export function isManagerOrAbove(user: AuthUser | null): boolean {
  if (!user || !user.role) return false;
  return ['owner', 'manager'].includes(user.role);
}

export const authService = {
  signIn,
  signOut,
  subscribeToAuthState,
  getCurrentUser,
  hasRole,
  isOwner,
  isManagerOrAbove,
};
