import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = createAdminClient();

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'ACTIVE')
      .single();

    if (error || !restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { data: categories } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order');

    const { data: items } = await supabase
      .from('items')
      .select('*, categories!inner(name_fr, name_ar)')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .eq('is_available', true)
      .order('sort_order');

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        currency: restaurant.currency || 'TND',
      },
      categories: categories || [],
      items: (items || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        nameFr: item.name_fr,
        nameAr: item.name_ar,
        descriptionFr: item.description_fr,
        descriptionAr: item.description_ar,
        price: item.price,
        categoryId: item.category_id,
        category: (item.categories as Record<string, string>)?.name_fr || '',
        categoryAr: (item.categories as Record<string, string>)?.name_ar || '',
        imageUrl: item.image_url,
        isBestseller: item.is_bestseller,
        dietaryTags: item.dietary_tags,
      })),
    });
  } catch (error) {
    console.error('Public restaurant API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
