/**
 * Script to set superadmin custom claim for a user
 * 
 * Usage: 
 *   bun run scripts/set-superadmin-claim.ts <uid>
 *   bun run scripts/set-superadmin-claim.ts rjAbnlO0deNZRavuHgfBsxRZTVY2
 * 
 * This script must be run with Firebase Admin SDK credentials.
 * Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.
 * 
 * SECURITY: This script grants superadmin privileges and should be used with caution.
 */

import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const SUPERADMIN_ROLE = 'superadmin';

// SECURITY: Prevent running in production without explicit override
if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SUPERADMIN_SCRIPT !== 'true') {
  console.error('❌ SECURITY ERROR: This script is blocked in production!');
  console.error('   To allow running in production, set ALLOW_SUPERADMIN_SCRIPT=true');
  console.error('   WARNING: This grants superadmin privileges to any user!');
  process.exit(1);
}

async function setSuperadminClaim(uid: string) {
  // Initialize Firebase Admin
  if (getApps().length === 0) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!projectId || !clientEmail || !privateKey) {
      console.error('ERROR: Missing Firebase Admin credentials.');
      console.error('Required environment variables:');
      console.error('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      console.error('  - FIREBASE_CLIENT_EMAIL');
      console.error('  - FIREBASE_PRIVATE_KEY');
      process.exit(1);
    }
    
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  
  const app = getApp();
  const auth = getAuth(app);
  
  try {
    // Get user to verify it exists
    const userRecord = await auth.getUser(uid);
    console.log(`Found user: ${userRecord.email || uid}`);
    
    // Set custom claim
    await auth.setCustomUserClaims(uid, { role: SUPERADMIN_ROLE });
    console.log(`✅ Successfully set superadmin claim for user: ${uid}`);
    
    // Verify the claim was set
    const updatedUser = await auth.getUser(uid);
    console.log(`   Custom claims: ${JSON.stringify(updatedUser.customClaims)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting superadmin claim:', error);
    process.exit(1);
  }
}

// Get UID from command line argument
const uid = process.argv[2];

if (!uid) {
  console.error('Usage: bun run scripts/set-superadmin-claim.ts <uid>');
  console.error('Example: bun run scripts/set-superadmin-claim.ts rjAbnlO0deNZRavuHgfBsxRZTVY2');
  process.exit(1);
}

setSuperadminClaim(uid);
