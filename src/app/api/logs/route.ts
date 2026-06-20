import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: logs, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Logs GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, orderId, tableId, type, actorId, actorRole, actorName, action, fromStatus, toStatus, reason } = body;

    if (!restaurantId || !type || !actorId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: log, error } = await supabase
      .from('activity_logs')
      .insert({
        restaurant_id: restaurantId,
        order_id: orderId || null,
        table_id: tableId || null,
        type,
        actor_id: actorId,
        actor_role: actorRole || 'system',
        actor_name: actorName || 'System',
        action,
        from_status: fromStatus || null,
        to_status: toStatus || null,
        reason: reason || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    console.error('Logs POST error:', error);
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}
