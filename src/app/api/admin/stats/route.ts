import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { verifySuperAdmin, getAdminApp } from '@/lib/admin-auth';

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
