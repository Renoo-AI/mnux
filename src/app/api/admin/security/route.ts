/**
 * SuperAdmin Security Management API
 * 
 * Endpoints:
 * - GET: List banned IPs/devices and security events
 * - POST: Ban/unban IP or device
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { verifySuperAdmin, getAdminApp } from '@/lib/admin-auth';
import { checkRateLimit, rateLimitResponse, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

// GET - List bans and security events
export async function GET(request: NextRequest) {
  try {
    const user = await verifySuperAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Rate limit
    const rateLimitResult = checkRateLimit(user.uid, RATE_LIMIT_CONFIGS.magicLink);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'ips', 'devices', 'events', 'all'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    const result: {
      bannedIps?: Array<{ id: string; ip: string; reason: string; bannedAt: number; expiresAt: number; autoBanned?: boolean }>;
      bannedDevices?: Array<{ id: string; deviceId: string; reason: string; bannedAt: number; expiresAt: number }>;
      recentEvents?: Array<{ id: string; type: string; ip: string; identifier: string; timestamp: number; details: Record<string, unknown> }>;
    } = {};
    
    if (type === 'ips' || type === 'all') {
      const ipsSnapshot = await db.collection('banned_ips')
        .orderBy('bannedAt', 'desc')
        .limit(limit)
        .get();
      
      result.bannedIps = ipsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; ip: string; reason: string; bannedAt: number; expiresAt: number; autoBanned?: boolean }>;
    }
    
    if (type === 'devices' || type === 'all') {
      const devicesSnapshot = await db.collection('banned_devices')
        .orderBy('bannedAt', 'desc')
        .limit(limit)
        .get();
      
      result.bannedDevices = devicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; deviceId: string; reason: string; bannedAt: number; expiresAt: number }>;
    }
    
    if (type === 'events' || type === 'all') {
      const eventsSnapshot = await db.collection('security_events')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      
      result.recentEvents = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{ id: string; type: string; ip: string; identifier: string; timestamp: number; details: Record<string, unknown> }>;
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in GET /api/admin/security:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Ban or unban IP/device
export async function POST(request: NextRequest) {
  try {
    const user = await verifySuperAdmin(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Rate limit
    const rateLimitResult = checkRateLimit(user.uid, RATE_LIMIT_CONFIGS.magicLink);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult.retryAfter);
    }
    
    const body = await request.json();
    const { action, targetType, target, reason, durationHours, durationDays } = body;
    
    if (!action || !targetType || !target) {
      return NextResponse.json({ 
        error: 'Missing required fields: action, targetType, target' 
      }, { status: 400 });
    }
    
    if (!['ban', 'unban'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "ban" or "unban"' }, { status: 400 });
    }
    
    if (!['ip', 'device'].includes(targetType)) {
      return NextResponse.json({ error: 'Invalid targetType. Use "ip" or "device"' }, { status: 400 });
    }
    
    const app = getAdminApp();
    const db = getFirestore(app);
    
    const collection = targetType === 'ip' ? 'banned_ips' : 'banned_devices';
    const docId = targetType === 'ip' ? target.replace(/[:.]/g, '_') : target;
    
    if (action === 'ban') {
      if (!reason) {
        return NextResponse.json({ error: 'Reason is required for banning' }, { status: 400 });
      }
      
      const duration = durationDays ? durationDays * 24 * 60 * 60 * 1000 : 
                       durationHours ? durationHours * 60 * 60 * 1000 :
                       24 * 60 * 60 * 1000; // Default 24 hours
      
      const expiresAt = Date.now() + duration;
      
      const banData = {
        [targetType === 'ip' ? 'ip' : 'deviceId']: target,
        reason,
        bannedAt: Date.now(),
        expiresAt,
        bannedBy: user.uid,
        autoBanned: false,
      };
      
      await db.collection(collection).doc(docId).set(banData);
      
      // Log the action
      await db.collection('system_logs').add({
        type: 'MANUAL_BAN',
        message: `${targetType.toUpperCase()} banned: ${target}`,
        details: {
          targetType,
          target,
          reason,
          durationHours: duration / (60 * 60 * 1000),
          bannedBy: user.uid,
        },
        timestamp: Date.now(),
        adminUid: user.uid,
      });
      
      return NextResponse.json({
        success: true,
        message: `${targetType === 'ip' ? 'IP' : 'Device'} banned successfully`,
        expiresAt,
      });
    }
    
    if (action === 'unban') {
      await db.collection(collection).doc(docId).delete();
      
      // Log the action
      await db.collection('system_logs').add({
        type: 'MANUAL_UNBAN',
        message: `${targetType.toUpperCase()} unbanned: ${target}`,
        details: {
          targetType,
          target,
          unbannedBy: user.uid,
        },
        timestamp: Date.now(),
        adminUid: user.uid,
      });
      
      return NextResponse.json({
        success: true,
        message: `${targetType === 'ip' ? 'IP' : 'Device'} unbanned successfully`,
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/admin/security:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
