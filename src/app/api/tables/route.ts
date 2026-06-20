import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: tables, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('number');

    if (error) throw error;

    return NextResponse.json({ tables: tables || [] });
  } catch (error) {
    console.error('Tables GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, label, number, zone, seats } = body;

    if (!restaurantId || !label) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const qrToken = crypto.randomUUID();

    const { data: table, error } = await supabase
      .from('tables')
      .insert({
        restaurant_id: restaurantId,
        label,
        number: number || 0,
        zone: zone || '',
        seats: seats || 2,
        qr_token: qrToken,
        is_active: true,
        ordering_enabled: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    console.error('Tables POST error:', error);
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, label, orderingEnabled, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const updates: Record<string, unknown> = {};
    if (label !== undefined) updates.label = label;
    if (orderingEnabled !== undefined) updates.ordering_enabled = orderingEnabled;
    if (isActive !== undefined) updates.is_active = isActive;

    const { error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tables PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tables DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 });
  }
}
