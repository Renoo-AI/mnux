/**
 * Shared SuperAdmin verification for API routes
 * 
 * Uses Firebase Custom Claims with fallback to UID during migration.
 * Import this in all /api/admin/* routes.
 */

import { NextRequest } from 'next/server';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Fallback UID during migration (remove after custom claims migration complete)
const FALLBACK_SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID || '';

// Initialize Firebase Admin SDK
let adminApp: ReturnType<typeof initializeApp> | null = null;

export function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (!projectId || !clientEmail || !privateKey) {
    // Fallback for development without admin SDK
    adminApp = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'menuxtn',
    });
    return adminApp;
  }
  
  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
  return adminApp;
}

/**
 * Verify that the request comes from a superadmin user
 * 
 * Uses Firebase Custom Claims (role: 'superadmin') as primary check,
 * with fallback to UID comparison during migration period.
 * 
 * @param request - The Next.js API request
 * @returns The user's UID if verified as superadmin, null otherwise
 */
export async function verifySuperAdmin(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const idToken = authHeader.substring(7);
  
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Primary: Check custom claim
    if (decodedToken.role === 'superadmin') {
      return { uid: decodedToken.uid };
    }
    
    // Fallback: Check UID during migration period (remove after migration complete)
    if (FALLBACK_SUPERADMIN_UID && decodedToken.uid === FALLBACK_SUPERADMIN_UID) {
      console.warn('Using fallback UID for superadmin. Set custom claim for better security.');
      return { uid: decodedToken.uid };
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a UID is the fallback superadmin UID
 * Used to prevent banning the superadmin during migration
 */
export function isFallbackSuperadmin(uid: string): boolean {
  return uid === FALLBACK_SUPERADMIN_UID;
}
