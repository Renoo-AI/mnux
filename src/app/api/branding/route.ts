import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { brandingService } from '@/services/brandingService';
import { normalizePlanType, getBrandingSettings } from '@/lib/plan-features';
import type { PlanType, UpdateBrandingRequest, Branding, BrandingSettings } from '@/types';
import { DEFAULT_BRANDING } from '@/types';

// Helper to check if user is owner or staff
async function validateRestaurantAccess(
  restaurantId: string, 
  request: NextRequest
): Promise<{ authorized: boolean; isOwner: boolean; plan: PlanType }> {
  try {
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      return { authorized: false, isOwner: false, plan: 'FREE' };
    }
    
    const data = restaurantDoc.data();
    const plan = normalizePlanType(data.plan);
    
    // For now, return authorized if restaurant exists
    // Real implementation would check auth token and ownership
    return { authorized: true, isOwner: true, plan };
  } catch (error) {
    console.error('Error validating access:', error);
    return { authorized: false, isOwner: false, plan: 'FREE' };
  }
}

/**
 * GET /api/branding?restaurantId=xxx
 * Get branding settings for a restaurant
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }
    
    // Get restaurant data
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    
    if (!restaurantDoc.exists()) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }
    
    const data = restaurantDoc.data();
    const plan = normalizePlanType(data.plan);
    const branding = data.branding as Branding | undefined;
    
    const settings: BrandingSettings = getBrandingSettings(plan, branding);
    
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branding settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/branding
 * Update branding for a restaurant
 * Body: { restaurantId: string, updates: UpdateBrandingRequest }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, updates } = body as { 
      restaurantId: string; 
      updates: UpdateBrandingRequest 
    };
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    // Validate access
    const { authorized, plan } = await validateRestaurantAccess(restaurantId, request);
    
    if (!authorized) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Update branding
    const result = await brandingService.update(restaurantId, plan, updates);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update branding' },
        { status: 400 }
      );
    }
    
    // Fetch updated branding
    const restaurantRef = doc(db, 'restaurants', restaurantId);
    const restaurantDoc = await getDoc(restaurantRef);
    const updatedBranding = restaurantDoc.exists() 
      ? restaurantDoc.data().branding as Branding | undefined
      : undefined;
    
    return NextResponse.json({
      success: true,
      branding: updatedBranding || DEFAULT_BRANDING,
    });
  } catch (error) {
    console.error('Error updating branding:', error);
    return NextResponse.json(
      { error: 'Failed to update branding' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/branding
 * Reset branding to defaults
 * Body: { restaurantId: string, action: 'reset' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, action } = body;
    
    if (!restaurantId) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }
    
    if (action === 'reset') {
      // Validate access
      const { authorized } = await validateRestaurantAccess(restaurantId, request);
      
      if (!authorized) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      // Reset branding to defaults
      const restaurantRef = doc(db, 'restaurants', restaurantId);
      await updateDoc(restaurantRef, {
        branding: DEFAULT_BRANDING,
        updatedAt: serverTimestamp(),
      });
      
      return NextResponse.json({
        success: true,
        branding: DEFAULT_BRANDING,
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error resetting branding:', error);
    return NextResponse.json(
      { error: 'Failed to reset branding' },
      { status: 500 }
    );
  }
}

// Import updateDoc which was missing
import { updateDoc } from 'firebase/firestore';
