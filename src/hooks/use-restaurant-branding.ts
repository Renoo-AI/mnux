/**
 * Hook to load and apply restaurant branding to public pages
 */

import { useState, useEffect, useMemo } from 'react';
import { restaurantService } from '@/services/restaurantService';
import { brandingService } from '@/services/brandingService';
import { normalizePlanType, shouldShowWatermark, canUseFeature } from '@/lib/plan-features';
import type { Restaurant, Branding, BrandingTheme } from '@/types';
import { DEFAULT_BRANDING, MENUXPRO_DEFAULTS } from '@/types';

interface UseRestaurantBrandingResult {
  loading: boolean;
  error: string | null;
  restaurant: Restaurant | null;
  branding: Branding;
  theme: Required<BrandingTheme>;
  showWatermark: boolean;
  themeVariables: Record<string, string>;
  customCss: string | null;
  scopedCss: string | null;
}

/**
 * Hook to load and process restaurant branding
 */
export function useRestaurantBranding(restaurantSlug: string): UseRestaurantBrandingResult {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  
  useEffect(() => {
    const loadBranding = async () => {
      if (!restaurantSlug) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const restaurantData = await restaurantService.getBySlug(restaurantSlug);
        
        if (!restaurantData) {
          setError('Restaurant not found');
          setLoading(false);
          return;
        }
        
        setRestaurant(restaurantData);
        
        const plan = normalizePlanType(restaurantData.plan);
        const effectiveBranding = brandingService.getDisplayBranding(restaurantData);
        setBranding(effectiveBranding);
        
      } catch (err) {
        console.error('Error loading restaurant branding:', err);
        setError('Failed to load restaurant');
      } finally {
        setLoading(false);
      }
    };
    
    loadBranding();
  }, [restaurantSlug]);
  
  // Compute derived values
  const plan = useMemo(() => normalizePlanType(restaurant?.plan), [restaurant]);
  
  const showWatermark = useMemo(() => {
    return shouldShowWatermark(plan, branding);
  }, [plan, branding]);
  
  const theme = useMemo<Required<BrandingTheme>>(() => ({
    background: branding.theme?.background || MENUXPRO_DEFAULTS.background,
    foreground: branding.theme?.foreground || MENUXPRO_DEFAULTS.foreground,
    primary: branding.theme?.primary || MENUXPRO_DEFAULTS.primary,
    accent: branding.theme?.accent || MENUXPRO_DEFAULTS.accent,
    card: branding.theme?.card || MENUXPRO_DEFAULTS.card,
    border: branding.theme?.border || MENUXPRO_DEFAULTS.border,
  }), [branding.theme]);
  
  const themeVariables = useMemo(() => 
    brandingService.generateThemeVariables(branding),
  [branding]);
  
  const customCss = useMemo(() => {
    if (!canUseFeature(plan, 'CUSTOM_CSS')) return null;
    if (!branding.customCss?.enabled) return null;
    return branding.customCss.css;
  }, [plan, branding.customCss]);
  
  const scopedCss = useMemo(() => {
    if (!customCss) return null;
    return brandingService.scopeCss(customCss);
  }, [customCss]);
  
  return {
    loading,
    error,
    restaurant,
    branding,
    theme,
    showWatermark,
    themeVariables,
    customCss,
    scopedCss,
  };
}

/**
 * Generate inline styles for branding
 */
export function getBrandingStyles(
  branding: Branding, 
  options?: { 
    includeBackground?: boolean;
    includeCover?: boolean;
  }
): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  if (options?.includeBackground && branding.backgroundImageUrl) {
    styles.backgroundImage = `url(${branding.backgroundImageUrl})`;
    styles.backgroundSize = 'cover';
    styles.backgroundPosition = 'center';
    styles.backgroundAttachment = 'fixed';
  }
  
  return styles;
}

/**
 * Get Open Graph metadata for a restaurant
 */
export function getRestaurantOgMetadata(
  restaurant: Restaurant,
  branding?: Branding,
  siteUrl: string = 'https://menux.tn'
) {
  const plan = normalizePlanType(restaurant.plan);
  const effectiveBranding = branding || DEFAULT_BRANDING;
  
  const title = canUseFeature(plan, 'CUSTOM_OPEN_GRAPH') && effectiveBranding.openGraph?.title
    ? effectiveBranding.openGraph.title
    : `${restaurant.name} Menu | MenuxPRO`;
  
  const description = canUseFeature(plan, 'CUSTOM_OPEN_GRAPH') && effectiveBranding.openGraph?.description
    ? effectiveBranding.openGraph.description
    : `View ${restaurant.name}'s digital menu, order from your table, and follow your order status.`;
  
  const imageUrl = canUseFeature(plan, 'CUSTOM_OPEN_GRAPH') && effectiveBranding.openGraph?.imageUrl
    ? effectiveBranding.openGraph.imageUrl
    : `${siteUrl}/og/menuxpro-og.png`;
  
  return {
    title,
    description,
    imageUrl,
  };
}
