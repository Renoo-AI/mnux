import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, tableId, tableLabel, items, customerNote, language } = body;

    if (!restaurantId || !tableId || !tableLabel || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('id, status')
      .eq('id', restaurantId)
      .eq('status', 'ACTIVE')
      .single();

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found or inactive' }, { status: 404 });
    }

    const { data: table } = await supabase
      .from('tables')
      .select('id, is_active, ordering_enabled')
      .eq('id', tableId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (!table?.ordering_enabled) {
      return NextResponse.json({ error: 'Table not available for ordering' }, { status: 400 });
    }

    const existingOrder = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', tableId)
      .in('status', ['CREATED', 'ACCEPTED'])
      .maybeSingle();

    if (existingOrder.data) {
      return NextResponse.json({ error: 'This table already has an active order' }, { status: 409 });
    }

    let total = 0;
    for (const item of items) {
      if (!item.itemId || !item.price || !item.quantity) {
        return NextResponse.json({ error: 'Invalid item format' }, { status: 400 });
      }
      total += parseFloat(item.price) * item.quantity;
    }

    total = Math.round(total * 1000) / 1000;

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        table_id: tableId,
        table_label: tableLabel,
        status: 'CREATED',
        items: items.map((item: Record<string, unknown>) => ({
          itemId: item.itemId,
          nameFr: item.nameFr || item.name || '',
          nameAr: item.nameAr || '',
          price: parseFloat(String(item.price)),
          quantity: parseInt(String(item.quantity)),
          note: item.note || '',
        })),
        subtotal: total,
        total,
        currency: 'TND',
        customer_note: customerNote || '',
        source: 'PUBLIC_QR',
        language: language || 'FR',
      })
      .select('id')
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      restaurant_id: restaurantId,
      order_id: order.id,
      table_id: tableId,
      type: 'ORDER_STATUS_CHANGE',
      actor_id: 'system',
      actor_role: 'owner',
      actor_name: 'Customer QR',
      action: 'ORDER_CREATED',
      to_status: 'CREATED',
    });

    return NextResponse.json({ success: true, orderId: order.id }, { status: 201 });
  } catch (error) {
    console.error('Public orders API error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
