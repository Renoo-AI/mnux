/**
 * MenuxPRO Plan Feature System
 * 
 * Controls which features are available per plan.
 * Plan hierarchy: FREE < BASIC < PRO < MAX
 */

import type { PlanType, PlanFeatureKey, BrandingSettings, Branding } from '@/types';
import { DEFAULT_BRANDING } from '@/types';

// Plan hierarchy for comparison
const PLAN_HIERARCHY: Record<PlanType, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  MAX: 3,
};

// Feature matrix per plan
const PLAN_FEATURES: Record<PlanType, Set<PlanFeatureKey>> = {
  FREE: new Set([
    // No customization features for FREE
  ]),
  
  BASIC: new Set([
    'CUSTOM_LOGO',
    // Basic accent color only (controlled)
  ]),
  
  PRO: new Set([
    'CUSTOM_LOGO',
    'CUSTOM_COLORS',
    'CUSTOM_BACKGROUND',
    'CUSTOM_MENU_COVER',
    'CUSTOM_OPEN_GRAPH',
    'CUSTOM_FAVICON',
    'REMOVE_WATERMARK',
  ]),
  
  MAX: new Set([
    'CUSTOM_LOGO',
    'CUSTOM_COLORS',
    'CUSTOM_BACKGROUND',
    'CUSTOM_MENU_COVER',
    'CUSTOM_OPEN_GRAPH',
    'CUSTOM_FAVICON',
    'CUSTOM_TYPOGRAPHY',
    'CUSTOM_CSS',
    'WHITE_LABEL',
    'ADVANCED_BRANDING',
    'REMOVE_WATERMARK',
    'UNLIMITED_MENU_ITEMS',
  ]),
};

// Plan limits
const PLAN_LIMITS: Record<PlanType, {
  maxMenuItems: number;
  maxLogoSize: number;        // bytes
  maxCoverSize: number;
  maxBackgroundSize: number;
  maxOgSize: number;
  maxFaviconSize: number;
  maxCustomCssLength: number;
  maxOgTitleLength: number;
  maxOgDescriptionLength: number;
}> = {
  FREE: {
    maxMenuItems: 8,
    maxLogoSize: 0,            // Not allowed
    maxCoverSize: 0,
    maxBackgroundSize: 0,
    maxOgSize: 0,
    maxFaviconSize: 0,
    maxCustomCssLength: 0,
    maxOgTitleLength: 0,
    maxOgDescriptionLength: 0,
  },
  BASIC: {
    maxMenuItems: 50,
    maxLogoSize: 512 * 1024,   // 512 KB
    maxCoverSize: 0,           // Not allowed
    maxBackgroundSize: 0,
    maxOgSize: 0,
    maxFaviconSize: 0,
    maxCustomCssLength: 0,
    maxOgTitleLength: 0,
    maxOgDescriptionLength: 0,
  },
  PRO: {
    maxMenuItems: 200,
    maxLogoSize: 512 * 1024,   // 512 KB
    maxCoverSize: 2 * 1024 * 1024,  // 2 MB
    maxBackgroundSize: 2 * 1024 * 1024,  // 2 MB
    maxOgSize: 1024 * 1024,    // 1 MB
    maxFaviconSize: 256 * 1024, // 256 KB
    maxCustomCssLength: 0,     // Not allowed
    maxOgTitleLength: 80,
    maxOgDescriptionLength: 180,
  },
  MAX: {
    maxMenuItems: -1,          // Unlimited
    maxLogoSize: 512 * 1024,   // 512 KB
    maxCoverSize: 2 * 1024 * 1024,  // 2 MB
    maxBackgroundSize: 2 * 1024 * 1024,  // 2 MB
    maxOgSize: 1024 * 1024,    // 1 MB
    maxFaviconSize: 256 * 1024, // 256 KB
    maxCustomCssLength: 10000, // 10 KB
    maxOgTitleLength: 80,
    maxOgDescriptionLength: 180,
  },
};

/**
 * Check if a plan can use a specific feature
 */
export function canUseFeature(plan: PlanType, featureKey: PlanFeatureKey): boolean {
  return PLAN_FEATURES[plan].has(featureKey);
}

/**
 * Check if plan meets or exceeds a minimum plan level
 */
export function isPlanAtLeast(plan: PlanType, minimumPlan: PlanType): boolean {
  return PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[minimumPlan];
}

/**
 * Get all features available for a plan
 */
export function getPlanFeatures(plan: PlanType): PlanFeatureKey[] {
  return Array.from(PLAN_FEATURES[plan]);
}

/**
 * Get plan limits
 */
export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan];
}

/**
 * Get all features with their availability status for a plan
 */
export function getFeaturesStatus(plan: PlanType): Record<PlanFeatureKey, boolean> {
  const allFeatures: PlanFeatureKey[] = [
    'CUSTOM_LOGO',
    'CUSTOM_COLORS',
    'CUSTOM_BACKGROUND',
    'CUSTOM_FAVICON',
    'CUSTOM_OPEN_GRAPH',
    'CUSTOM_MENU_COVER',
    'CUSTOM_TYPOGRAPHY',
    'CUSTOM_CSS',
    'WHITE_LABEL',
    'ADVANCED_BRANDING',
    'REMOVE_WATERMARK',
    'UNLIMITED_MENU_ITEMS',
  ];
  
  return allFeatures.reduce((acc, feature) => {
    acc[feature] = canUseFeature(plan, feature);
    return acc;
  }, {} as Record<PlanFeatureKey, boolean>);
}

/**
 * Get branding settings for a restaurant
 */
export function getBrandingSettings(plan: PlanType, branding?: Branding): BrandingSettings {
  return {
    plan,
    features: getFeaturesStatus(plan),
    branding: branding || DEFAULT_BRANDING,
    limits: PLAN_LIMITS[plan],
  };
}

/**
 * Check if watermark should be shown for a plan
 */
export function shouldShowWatermark(plan: PlanType, branding?: Branding): boolean {
  // FREE always shows watermark
  if (plan === 'FREE') return true;
  
  // BASIC always shows watermark
  if (plan === 'BASIC') return true;
  
  // PRO can hide watermark (feature included)
  if (plan === 'PRO') {
    // Watermark can be removed for PRO
    return false;
  }
  
  // MAX can have white label (hide branding completely)
  if (plan === 'MAX') {
    return !(branding?.whiteLabel?.hideMenuxBranding ?? false);
  }
  
  return true;
}

/**
 * Validate if a plan can use custom CSS
 */
export function canUseCustomCss(plan: PlanType): boolean {
  return plan === 'MAX';
}

/**
 * Get effective branding with defaults applied
 */
export function getEffectiveBranding(plan: PlanType, branding?: Branding): Branding {
  const effective: Branding = {
    ...DEFAULT_BRANDING,
    ...branding,
  };
  
  // Apply plan restrictions - null out features not allowed
  if (!canUseFeature(plan, 'CUSTOM_LOGO')) {
    effective.logoUrl = null;
  }
  if (!canUseFeature(plan, 'CUSTOM_COLORS')) {
    effective.theme = { ...DEFAULT_BRANDING.theme };
  }
  if (!canUseFeature(plan, 'CUSTOM_BACKGROUND')) {
    effective.backgroundImageUrl = null;
  }
  if (!canUseFeature(plan, 'CUSTOM_MENU_COVER')) {
    effective.coverImageUrl = null;
  }
  if (!canUseFeature(plan, 'CUSTOM_OPEN_GRAPH')) {
    effective.openGraph = { ...DEFAULT_BRANDING.openGraph };
  }
  if (!canUseFeature(plan, 'CUSTOM_FAVICON')) {
    effective.faviconUrl = null;
  }
  if (!canUseFeature(plan, 'CUSTOM_TYPOGRAPHY')) {
    effective.typography = { ...DEFAULT_BRANDING.typography };
  }
  if (!canUseFeature(plan, 'CUSTOM_CSS')) {
    effective.customCss = { enabled: false, css: null, updatedAt: null };
  }
  if (!canUseFeature(plan, 'WHITE_LABEL')) {
    effective.whiteLabel = { enabled: false, hideMenuxBranding: false };
  }
  
  return effective;
}

/**
 * Normalize legacy plan types to new format
 */
export function normalizePlanType(plan: string | undefined | null): PlanType {
  if (!plan) return 'FREE';
  
  const upperPlan = plan.toUpperCase() as PlanType;
  
  // Handle new format
  if (['FREE', 'BASIC', 'PRO', 'MAX'].includes(upperPlan)) {
    return upperPlan;
  }
  
  // Handle legacy format
  if (plan === 'free') return 'FREE';
  if (plan === 'pro') return 'PRO';
  
  return 'FREE';
}

/**
 * Get plan display name
 */
export function getPlanDisplayName(plan: PlanType): string {
  const names: Record<PlanType, string> = {
    FREE: 'Free',
    BASIC: 'Basic',
    PRO: 'Pro',
    MAX: 'Max',
  };
  return names[plan];
}

/**
 * Get plan price (for display)
 */
export function getPlanPrice(plan: PlanType): { amount: number; currency: string; period: string } {
  const prices: Record<PlanType, { amount: number; currency: string; period: string }> = {
    FREE: { amount: 0, currency: 'EUR', period: 'month' },
    BASIC: { amount: 29, currency: 'EUR', period: 'month' },
    PRO: { amount: 79, currency: 'EUR', period: 'month' },
    MAX: { amount: 199, currency: 'EUR', period: 'month' },
  };
  return prices[plan];
}

export const planFeaturesService = {
  canUseFeature,
  isPlanAtLeast,
  getPlanFeatures,
  getPlanLimits,
  getFeaturesStatus,
  getBrandingSettings,
  shouldShowWatermark,
  canUseCustomCss,
  getEffectiveBranding,
  normalizePlanType,
  getPlanDisplayName,
  getPlanPrice,
};
