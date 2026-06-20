import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  const supabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .maybeSingle();

  return !!staff;
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: staffs } = await supabase
      .from('staff')
      .select('*');

    const { count: ordersToday } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    return NextResponse.json({
      restaurants: restaurants || [],
      staffCount: staffs?.length || 0,
      ordersToday: ordersToday || 0,
    });
  } catch (error) {
    console.error('Superadmin API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { restaurantId, status, plan } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updates: Record<string, string> = {};
    if (status) updates.status = status;
    if (plan) updates.plan = plan;

    const { error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurantId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Superadmin PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
