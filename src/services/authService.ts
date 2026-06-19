import { auth, db, isSuperadminFromClaims } from '@/lib/firebase';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { Staff, UserRole } from '@/types';
import { withRetry, isOfflineError } from '@/hooks/useNetworkStatus';

const STAFF_COLLECTION = 'staff';

export interface AuthUser {
  uid: string;
  email: string | null;
  staffProfile: Staff | null;
  role: UserRole | null;
  isSuperadmin: boolean;
}

// Get staff profile from Firestore with retry logic
async function getStaffProfile(userId: string): Promise<Staff | null> {
  try {
    return await withRetry(async () => {
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
    });
  } catch (error) {
    console.error('Error fetching staff profile:', error);
    
    // If offline, return null but don't throw
    if (isOfflineError(error)) {
      console.warn('Offline - staff profile temporarily unavailable');
      return null;
    }
    
    throw error;
  }
}

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  // Get superadmin status from custom claims
  const tokenResult = await user.getIdTokenResult();
  const isSuperadmin = isSuperadminFromClaims(tokenResult);
  const staffProfile = await getStaffProfile(user.uid);
  
  return {
    uid: user.uid,
    email: user.email,
    staffProfile,
    role: isSuperadmin ? 'admin' : (staffProfile?.role || null),
    isSuperadmin,
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
    
    // Get superadmin status from custom claims
    const tokenResult = await user.getIdTokenResult();
    const isSuperadmin = isSuperadminFromClaims(tokenResult);
    const staffProfile = await getStaffProfile(user.uid);
    
    callback({
      uid: user.uid,
      email: user.email,
      staffProfile,
      role: isSuperadmin ? 'admin' : (staffProfile?.role || null),
      isSuperadmin,
    });
  });
}

// Get current user
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

// Check if user has required role
export function hasRole(user: AuthUser | null, requiredRoles: UserRole[]): boolean {
  if (!user) return false;
  // Superadmin has access to everything
  if (user.isSuperadmin) return true;
  if (!user.role) return false;
  return requiredRoles.includes(user.role);
}

// Check if user is superadmin
export function isSuperadminUser(user: AuthUser | null): boolean {
  return user?.isSuperadmin ?? false;
}

// Check if user is owner or superadmin
export function isOwnerOrAbove(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.isSuperadmin || user.role === 'owner' || user.role === 'admin';
}

// Check if user is manager or above
export function isManagerOrAbove(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.isSuperadmin) return true;
  if (!user.role) return false;
  return ['owner', 'admin', 'manager'].includes(user.role);
}

export const authService = {
  signIn,
  signOut,
  subscribeToAuthState,
  getCurrentUser,
  hasRole,
  isSuperadminUser,
  isOwnerOrAbove,
  isManagerOrAbove,
};
