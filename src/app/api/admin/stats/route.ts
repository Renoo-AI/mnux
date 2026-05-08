import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }
  
  if (getApps().length > 0) {
    adminApp = getApp();
    return adminApp;
  }
  
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'menuxtn';
  
  adminApp = initializeApp({
    projectId,
  });
  
  return adminApp;
}

// Verify the ID token and check superadmin status
async function verifySuperAdmin(request: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const idToken = authHeader.substring(7);
  const SUPERADMIN_UID = process.env.NEXT_PUBLIC_SUPERADMIN_UID || 'rjAbnlO0deNZRavuHgfBsxRZTVY2';
  
  try {
    const app = getAdminApp();
    const auth = getAuth(app);
    const decodedToken = await auth.verifyIdToken(idToken);
    
    if (decodedToken.uid !== SUPERADMIN_UID) {
      return null;
    }
    
    return { uid: decodedToken.uid };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// Sanitize text input to prevent XSS
function sanitizeText(text: string, maxLength: number = 200): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifySuperAdmin(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - SuperAdmin access required' },
        { status: 401 }
      );
    }

    const app = getAdminApp();
    const db = getFirestore(app);
    
    // Fetch all stats in parallel
    const [usersSnap, restaurantsSnap, bansSnap, logsSnap] = await Promise.all([
      db.collection('users').get().catch(() => ({ empty: true, docs: [] as any[] })),
      db.collection('restaurants').get().catch(() => ({ empty: true, docs: [] as any[] })),
      db.collection('banned_users').get().catch(() => ({ empty: true, docs: [] as any[] })),
      db.collection('system_logs').orderBy('timestamp', 'desc').limit(50).get().catch(() => ({ empty: true, docs: [] as any[] })),
    ]);

    const users = usersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const restaurants = restaurantsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const systemLogs = logsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    
    const proCount = restaurants.filter((r: any) => r.plan === 'pro').length;
    const businessCount = restaurants.filter((r: any) => r.plan === 'business').length;
    
    const stats = {
      activeMenus: restaurants.filter((r: any) => r.status === 'active').length,
      proMenus: proCount + businessCount,
      usersCount: users.length,
      mrr: (proCount * 29) + (businessCount * 59),
      bannedCount: bansSnap.docs?.length || 0,
    };

    return NextResponse.json({ 
      success: true,
      stats, 
      restaurants, 
      users, 
      bannedUsers: bansSnap.docs?.map((d: any) => d.id) || [],
      systemLogs
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats', success: false },
      { status: 500 }
    );
  }
}
