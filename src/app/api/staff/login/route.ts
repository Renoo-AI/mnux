import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, userId, pin } = body;

    if (!restaurantId || !userId || !pin) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 });
    }

    if (String(staff.pin) !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', restaurantId)
      .single();

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        displayName: staff.display_name,
        role: staff.role,
        restaurantId: staff.restaurant_id,
        restaurantName: restaurant?.name || '',
      },
    });
  } catch (error) {
    console.error('Staff login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
