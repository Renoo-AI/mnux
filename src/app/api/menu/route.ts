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

    const { data: items, error } = await supabase
      .from('items')
      .select('*, categories!inner(*)')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
      .order('category_id')
      .order('sort_order');

    if (error) throw error;

    return NextResponse.json({ items });
  } catch (error) {
    console.error('GET /api/menu error:', error);
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { restaurantId, categoryId, nameFr, nameAr, price, category, categoryAr } = body;

    if (!restaurantId || !nameFr || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let finalCategoryId = categoryId;

    if (!finalCategoryId && category) {
      const { data: existingCat } = await supabase
        .from('categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('name_fr', category)
        .single();

      if (existingCat) {
        finalCategoryId = existingCat.id;
      } else {
        const { data: newCat, error: catError } = await supabase
          .from('categories')
          .insert({
            restaurant_id: restaurantId,
            name_fr: category,
            name_ar: categoryAr || category,
            is_active: true,
          })
          .select('id')
          .single();

        if (catError) throw catError;
        finalCategoryId = newCat.id;
      }
    }

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        restaurant_id: restaurantId,
        category_id: finalCategoryId,
        name_fr: nameFr,
        name_ar: nameAr || nameFr,
        price: parseFloat(price),
        is_active: true,
        is_available: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('POST /api/menu error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nameFr, nameAr, price, category, categoryAr } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const updates: Record<string, unknown> = {};
    if (nameFr !== undefined) updates.name_fr = nameFr;
    if (nameAr !== undefined) updates.name_ar = nameAr;
    if (price !== undefined) updates.price = parseFloat(price);

    if (category !== undefined) {
      const item = await supabase.from('items').select('restaurant_id').eq('id', id).single();
      const restaurantId = item.data?.restaurant_id;

      if (restaurantId) {
        const { data: existingCat } = await supabase
          .from('categories')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .eq('name_fr', category)
          .single();

        if (existingCat) {
          updates.category_id = existingCat.id;
        } else {
          const { data: newCat } = await supabase
            .from('categories')
            .insert({
              restaurant_id: restaurantId,
              name_fr: category,
              name_ar: categoryAr || category,
              is_active: true,
            })
            .select('id')
            .single();

          if (newCat) updates.category_id = newCat.id;
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error('PATCH /api/menu error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
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
      .from('items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/menu error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
