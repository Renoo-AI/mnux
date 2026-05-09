import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration for Menux
// Project ID: menuxtn
// SECURITY: All Firebase config values come from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate required Firebase config
function validateFirebaseConfig() {
  const required = ['apiKey', 'authDomain', 'projectId'];
  const missing = required.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missing.length > 0) {
    console.warn(`Missing Firebase config: ${missing.join(', ')}. App may not function correctly.`);
  }
}

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with offline persistence enabled
// This prevents "client is offline" errors when network temporarily drops
let dbInstance: ReturnType<typeof getFirestore>;

if (typeof window !== 'undefined') {
  // Client-side: Enable offline persistence
  try {
    dbInstance = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });
  } catch (error) {
    // If already initialized, get existing instance
    console.log('Firestore already initialized, using existing instance');
    dbInstance = getFirestore(app);
  }
} else {
  // Server-side: Use default settings
  dbInstance = getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const functions = getFunctions(app);

// Initialize Analytics (only in browser environment)
export const initAnalytics = async () => {
  if (typeof window !== 'undefined') {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  }
  return null;
};

// SECURITY: SuperAdmin UID must be set via environment variable
// No hardcoded fallback - this prevents unauthorized access if env var is missing
const SUPERADMIN_UID_ENV = process.env.NEXT_PUBLIC_SUPERADMIN_UID;

if (!SUPERADMIN_UID_ENV && typeof window !== 'undefined') {
  console.error('SECURITY ERROR: NEXT_PUBLIC_SUPERADMIN_UID environment variable is not set!');
}

export const SUPERADMIN_UID = SUPERADMIN_UID_ENV || '';

// Helper function to check if user is superadmin by UID (fallback during migration)
export const isSuperadminByUid = (uid: string | undefined | null): boolean => {
  if (!SUPERADMIN_UID) {
    console.error('SECURITY: SuperAdmin UID not configured - access denied by default');
    return false;
  }
  return uid === SUPERADMIN_UID;
};

// Helper to check if user has superadmin custom claim
// This should be called with the ID token result
export const isSuperadminFromClaims = (tokenResult: { claims: Record<string, unknown> } | null): boolean => {
  if (!tokenResult) return false;
  return tokenResult.claims?.role === 'superadmin';
};

// Legacy export - prefer isSuperadminFromClaims for new code
export const isSuperadmin = isSuperadminByUid;

// Validate config on module load (server-side only)
if (typeof window === 'undefined') {
  validateFirebaseConfig();
}

export default app;
