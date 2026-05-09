import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { verifySuperAdmin, getAdminApp, isFallbackSuperadmin } from '@/lib/admin-auth';

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
    
    // Prevent banning superadmin (check both fallback UID and custom claim)
    if (isFallbackSuperadmin(userId)) {
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
