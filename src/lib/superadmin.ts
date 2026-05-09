/**
 * SuperAdmin verification utilities
 * 
 * Uses Firebase Custom Claims for superadmin verification.
 * The 'role' claim is set to 'superadmin' for authorized admin users.
 * 
 * Migration from hardcoded UID:
 * - Old: Compare UID against NEXT_PUBLIC_SUPERADMIN_UID
 * - New: Check if decodedToken.token.role === 'superadmin'
 */

import { getAuth } from 'firebase-admin/auth';
import { DecodedIdToken } from 'firebase-admin/auth';

/**
 * Check if a decoded Firebase ID token has superadmin role
 */
export function isSuperadminFromToken(decodedToken: DecodedIdToken): boolean {
  return decodedToken.role === 'superadmin';
}

/**
 * Check if a UID has superadmin custom claim
 * Requires Firebase Admin SDK
 */
export async function isSuperadminUid(uid: string): Promise<boolean> {
  // This function is for server-side use only
  // It requires Firebase Admin SDK to check custom claims
  try {
    const { getApps, getApp, initializeApp, cert } = await import('firebase-admin/app');
    
    if (getApps().length === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      if (!projectId || !clientEmail || !privateKey) {
        console.error('Missing Firebase Admin credentials');
        return false;
      }
      
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    }
    
    const auth = getAuth(getApp());
    const user = await auth.getUser(uid);
    return user.customClaims?.role === 'superadmin';
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
}

/**
 * Client-side: Check if Firebase user is superadmin
 * Uses the custom claim from the ID token
 */
export function isSuperadminClient(idTokenResult: { claims: Record<string, unknown> } | null): boolean {
  if (!idTokenResult) return false;
  return idTokenResult.claims?.role === 'superadmin';
}

/**
 * Fallback UID for migration period
 * This allows the old superadmin to access the system while claims are being set
 * Can be removed after migration is complete
 */
export const FALLBACK_SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID || '';
