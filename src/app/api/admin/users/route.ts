import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdminApp() {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }
  adminApp = initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'menuxtn',
  });
  return adminApp;
}

async function verifySuperAdmin(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const idToken = authHeader.substring(7);
  const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID;
  if (!SUPERADMIN_UID) {
    console.error('SECURITY ERROR: SUPERADMIN_UID not configured');
    return null;
  }
  
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(idToken);
    if (decodedToken.uid !== SUPERADMIN_UID) return null;
    return { uid: decodedToken.uid };
  } catch {
    return null;
  }
}

function sanitizeText(text: string, maxLength: number = 200): string {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').slice(0, maxLength);
}

// GET - Fetch all users
export async function GET(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const app = getAdminApp();
    const db = getFirestore(app);
    
    const [usersSnap, bansSnap] = await Promise.all([
      db.collection('users').get().catch(() => ({ docs: [] as any[] })),
      db.collection('banned_users').get().catch(() => ({ docs: [] as any[] })),
    ]);

    const users = usersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const bannedUsers = bansSnap.docs.map((d: any) => d.id);

    return NextResponse.json({ success: true, users, bannedUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST - Ban/Unban user
export async function POST(request: NextRequest) {
  const user = await verifySuperAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userId, action, reason } = body;

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    if (!['ban', 'unban'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "ban" or "unban"' }, { status: 400 });
    }

    const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID;
    if (!SUPERADMIN_UID) {
      console.error('SECURITY ERROR: SUPERADMIN_UID not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    // Prevent banning superadmin
    if (userId === SUPERADMIN_UID) {
      return NextResponse.json({ error: 'Cannot ban superadmin' }, { status: 403 });
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    if (action === 'ban') {
      const sanitizedReason = reason ? sanitizeText(reason, 500) : 'Banned by SuperAdmin';
      
      await db.collection('banned_users').doc(userId).set({
        reason: sanitizedReason,
        bannedAt: Date.now(),
        bannedBy: user.uid,
      });

      // Log the action
      await db.collection('system_logs').add({
        type: 'USER_BANNED',
        message: `User ${userId} has been banned`,
        details: { userId, reason: sanitizedReason },
        timestamp: Date.now(),
        adminUid: user.uid,
      });

      return NextResponse.json({ success: true, action: 'banned' });
    } else {
      await db.collection('banned_users').doc(userId).delete();

      // Log the action
      await db.collection('system_logs').add({
        type: 'USER_UNBANNED',
        message: `User ${userId} has been unbanned`,
        details: { userId },
        timestamp: Date.now(),
        adminUid: user.uid,
      });

      return NextResponse.json({ success: true, action: 'unbanned' });
    }
  } catch (error) {
    console.error('User action error:', error);
    return NextResponse.json({ error: 'Failed to perform action' }, { status: 500 });
  }
}
