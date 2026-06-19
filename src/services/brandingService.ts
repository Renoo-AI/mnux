/**
 * MenuxPRO Branding Service
 * 
 * Handles branding validation, sanitization, and application
 * with plan-based restrictions.
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { 
  PlanType, 
  Branding, 
  BrandingTheme, 
  UpdateBrandingRequest,
  BrandingSettings,
  Restaurant 
} from '@/types';
import { DEFAULT_BRANDING, MENUXPRO_DEFAULTS } from '@/types';
import { 
  canUseFeature, 
  getPlanLimits, 
  getEffectiveBranding,
  normalizePlanType 
} from '@/lib/plan-features';

const COLLECTION = 'restaurants';

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate hex color format (#RRGGBB)
 */
export function isValidHexColor(color: string | null | undefined): boolean {
  if (!color) return true; // null is valid (will use default)
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * Sanitize hex color - returns null if invalid
 */
export function sanitizeHexColor(color: string | null | undefined): string | null {
  if (!color) return null;
  const trimmed = color.trim();
  if (isValidHexColor(trimmed)) {
    return trimmed.toUpperCase();
  }
  return null;
}

/**
 * Validate URL string
 */
export function isValidUrl(url: string | null | undefined, maxLength: number = 500): boolean {
  if (!url) return true; // null is valid
  if (url.length > maxLength) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize URL - returns null if invalid
 */
export function sanitizeUrl(url: string | null | undefined, maxLength: number = 500): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.length > maxLength) return null;
  
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Validate font family name (Google Fonts)
 */
const ALLOWED_FONTS = [
  'Playfair Display', 'Plus Jakarta Sans', 'Inter', 'Roboto', 'Open Sans',
  'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Poppins', 'Nunito',
  'Ubuntu', 'Merriweather', 'Noto Sans', 'Noto Sans Arabic',
  'Cormorant Garamond', 'Source Sans Pro', 'PT Sans', 'Lora',
  // Add more safe fonts as needed
];

export function isValidFontFamily(font: string | null | undefined): boolean {
  if (!font) return true; // null is valid (will use default)
  return ALLOWED_FONTS.includes(font) || font.startsWith('Noto');
}

/**
 * Sanitize font family
 */
export function sanitizeFontFamily(font: string | null | undefined): string | null {
  if (!font) return null;
  const trimmed = font.trim();
  if (isValidFontFamily(trimmed)) {
    return trimmed;
  }
  return null;
}

/**
 * Validate and sanitize theme object
 */
export function validateTheme(theme: Partial<BrandingTheme> | null | undefined): BrandingTheme {
  const defaultTheme = DEFAULT_BRANDING.theme;
  
  if (!theme) return defaultTheme;
  
  return {
    background: sanitizeHexColor(theme.background) ?? defaultTheme.background,
    foreground: sanitizeHexColor(theme.foreground) ?? defaultTheme.foreground,
    primary: sanitizeHexColor(theme.primary) ?? defaultTheme.primary,
    accent: sanitizeHexColor(theme.accent) ?? defaultTheme.accent,
    card: sanitizeHexColor(theme.card) ?? defaultTheme.card,
    border: sanitizeHexColor(theme.border) ?? defaultTheme.border,
  };
}

// ============================================
// CUSTOM CSS SANITIZATION
// ============================================

// Dangerous CSS patterns to block
const DANGEROUS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /@import/i,
  /expression\s*\(/i,
  /url\s*\(\s*['"]?\s*javascript:/i,
  /behavior\s*:/i,
  /-moz-binding/i,
  /pointer-events\s*:\s*none/i,
];

// Critical selectors that cannot be hidden
const CRITICAL_SELECTORS = [
  /\.cart/i,
  /\[data-cart\]/i,
  /\.order-status/i,
  /\[data-order-status\]/i,
  /\.payment/i,
  /\[data-payment\]/i,
  /\.waiter/i,
  /\[data-waiter\]/i,
  /\.price/i,
  /\[data-price\]/i,
  /button\[.*type.*submit/i,
  /\.submit/i,
];

/**
 * Validate custom CSS for dangerous patterns
 */
export function validateCustomCss(css: string | null): { valid: boolean; error?: string } {
  if (!css) return { valid: true };
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(css)) {
      return { valid: false, error: `CSS contains forbidden pattern: ${pattern.source}` };
    }
  }
  
  // Check for attempts to hide critical elements
  for (const selector of CRITICAL_SELECTORS) {
    // Look for patterns like: selector { display: none } or selector { visibility: hidden }
    const hidePattern = new RegExp(`${selector.source}[\\s\\S]*?(display\\s*:\\s*none|visibility\\s*:\\s*hidden)`, 'i');
    if (hidePattern.test(css)) {
      return { valid: false, error: `CSS cannot hide critical element: ${selector.source}` };
    }
  }
  
  // Check for external URLs (only data: and relative URLs allowed)
  const urlPattern = /url\s*\(\s*['"]?(https?:|\/\/)/gi;
  if (urlPattern.test(css)) {
    return { valid: false, error: 'CSS cannot contain external URLs' };
  }
  
  // Check for fixed positioning that covers the app
  const fixedOverlayPattern = /position\s*:\s*fixed[\s\S]*?(top\s*:\s*0|bottom\s*:\s*0|left\s*:\s*0|right\s*:\s*0)[\s\S]*?(width\s*:\s*100|height\s*:\s*100)/i;
  if (fixedOverlayPattern.test(css)) {
    return { valid: false, error: 'CSS cannot create full-screen fixed overlays' };
  }
  
  // Check z-index abuse
  const highZIndexPattern = /z-index\s*:\s*(999[0-9]|10000|[1-9]\d{4,})/i;
  if (highZIndexPattern.test(css)) {
    return { valid: false, error: 'CSS z-index values above 9999 are not allowed' };
  }
  
  return { valid: true };
}

/**
 * Scope CSS to restaurant public area only
 */
export function scopeCss(css: string | null): string | null {
  if (!css) return null;
  
  // Wrap all selectors in .restaurant-public-scope
  // This is a simplified scoping - for production, use a proper CSS parser
  
  // Remove comments
  let scoped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Add scope prefix to selectors
  // This is a basic implementation - a proper CSS parser would be better
  const lines = scoped.split('\n');
  const scopedLines: string[] = [];
  let inRule = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // Check if this is a selector line (ends with {)
    if (trimmed.endsWith('{') && !trimmed.startsWith('@')) {
      inRule = true;
      // Add scope prefix
      const selectors = trimmed.slice(0, -1).split(',').map(s => {
        const sel = s.trim();
        // Don't double-prefix
        if (sel.startsWith('.restaurant-public-scope')) return sel;
        return `.restaurant-public-scope ${sel}`;
      }).join(', ');
      scopedLines.push(`${selectors} {`);
    } else if (trimmed === '}' && inRule) {
      inRule = false;
      scopedLines.push('}');
    } else if (trimmed.startsWith('@')) {
      // Handle at-rules (media queries, etc.)
      scopedLines.push(trimmed);
    } else {
      scopedLines.push(line);
    }
  }
  
  return scopedLines.join('\n');
}

// ============================================
// BRANDING SERVICE
// ============================================

/**
 * Get branding for a restaurant
 */
export async function getBranding(restaurantId: string): Promise<Branding | null> {
  try {
    const docRef = doc(db, COLLECTION, restaurantId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    return data.branding || DEFAULT_BRANDING;
  } catch (error) {
    console.error('Error fetching branding:', error);
    return null;
  }
}

/**
 * Update branding for a restaurant
 */
export async function updateBranding(
  restaurantId: string, 
  plan: PlanType,
  updates: UpdateBrandingRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const limits = getPlanLimits(plan);
    
    // Validate plan-based restrictions
    if (updates.logoUrl !== undefined && !canUseFeature(plan, 'CUSTOM_LOGO')) {
      return { success: false, error: 'Custom logo requires BASIC plan or higher' };
    }
    
    if (updates.coverImageUrl !== undefined && !canUseFeature(plan, 'CUSTOM_MENU_COVER')) {
      return { success: false, error: 'Custom cover image requires PRO plan or higher' };
    }
    
    if (updates.backgroundImageUrl !== undefined && !canUseFeature(plan, 'CUSTOM_BACKGROUND')) {
      return { success: false, error: 'Custom background requires PRO plan or higher' };
    }
    
    if (updates.faviconUrl !== undefined && !canUseFeature(plan, 'CUSTOM_FAVICON')) {
      return { success: false, error: 'Custom favicon requires PRO plan or higher' };
    }
    
    if ((updates.openGraph?.title || updates.openGraph?.description || updates.openGraph?.imageUrl) 
        && !canUseFeature(plan, 'CUSTOM_OPEN_GRAPH')) {
      return { success: false, error: 'Custom Open Graph requires PRO plan or higher' };
    }
    
    if ((updates.typography?.headingFont || updates.typography?.bodyFont) 
        && !canUseFeature(plan, 'CUSTOM_TYPOGRAPHY')) {
      return { success: false, error: 'Custom typography requires MAX plan' };
    }
    
    if (updates.customCss && !canUseFeature(plan, 'CUSTOM_CSS')) {
      return { success: false, error: 'Custom CSS requires MAX plan' };
    }
    
    if (updates.whiteLabel && !canUseFeature(plan, 'WHITE_LABEL')) {
      return { success: false, error: 'White label requires MAX plan' };
    }
    
    // Build validated branding update
    const brandingUpdate: Partial<Branding> = {};
    
    // Validate URLs
    if (updates.logoUrl !== undefined) {
      const url = sanitizeUrl(updates.logoUrl);
      if (updates.logoUrl && !url) {
        return { success: false, error: 'Invalid logo URL' };
      }
      brandingUpdate.logoUrl = url;
    }
    
    if (updates.coverImageUrl !== undefined) {
      const url = sanitizeUrl(updates.coverImageUrl);
      if (updates.coverImageUrl && !url) {
        return { success: false, error: 'Invalid cover image URL' };
      }
      brandingUpdate.coverImageUrl = url;
    }
    
    if (updates.backgroundImageUrl !== undefined) {
      const url = sanitizeUrl(updates.backgroundImageUrl);
      if (updates.backgroundImageUrl && !url) {
        return { success: false, error: 'Invalid background image URL' };
      }
      brandingUpdate.backgroundImageUrl = url;
    }
    
    if (updates.faviconUrl !== undefined) {
      const url = sanitizeUrl(updates.faviconUrl, 256);
      if (updates.faviconUrl && !url) {
        return { success: false, error: 'Invalid favicon URL' };
      }
      brandingUpdate.faviconUrl = url;
    }
    
    // Validate theme
    if (updates.theme) {
      brandingUpdate.theme = validateTheme(updates.theme);
    }
    
    // Validate typography
    if (updates.typography) {
      brandingUpdate.typography = {
        headingFont: sanitizeFontFamily(updates.typography.headingFont),
        bodyFont: sanitizeFontFamily(updates.typography.bodyFont),
      };
    }
    
    // Validate Open Graph
    if (updates.openGraph) {
      if (updates.openGraph.title && updates.openGraph.title.length > limits.maxOgTitleLength) {
        return { success: false, error: `OG title must be ${limits.maxOgTitleLength} characters or less` };
      }
      if (updates.openGraph.description && updates.openGraph.description.length > limits.maxOgDescriptionLength) {
        return { success: false, error: `OG description must be ${limits.maxOgDescriptionLength} characters or less` };
      }
      brandingUpdate.openGraph = {
        title: updates.openGraph.title?.trim().slice(0, limits.maxOgTitleLength) || null,
        description: updates.openGraph.description?.trim().slice(0, limits.maxOgDescriptionLength) || null,
        imageUrl: sanitizeUrl(updates.openGraph.imageUrl),
      };
    }
    
    // Validate custom CSS
    if (updates.customCss) {
      if (updates.customCss.css && updates.customCss.css.length > limits.maxCustomCssLength) {
        return { success: false, error: `Custom CSS must be ${limits.maxCustomCssLength} characters or less` };
      }
      
      const cssValidation = validateCustomCss(updates.customCss.css ?? null);
      if (!cssValidation.valid) {
        return { success: false, error: cssValidation.error };
      }
      
      brandingUpdate.customCss = {
        enabled: updates.customCss.enabled ?? false,
        css: updates.customCss.css?.trim().slice(0, limits.maxCustomCssLength) || null,
        updatedAt: new Date(),
      };
    }
    
    // Validate white label
    if (updates.whiteLabel) {
      brandingUpdate.whiteLabel = {
        enabled: updates.whiteLabel.enabled ?? false,
        hideMenuxBranding: updates.whiteLabel.hideMenuxBranding ?? false,
      };
    }
    
    // Update the document
    const docRef = doc(db, COLLECTION, restaurantId);
    await updateDoc(docRef, {
      branding: brandingUpdate,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating branding:', error);
    return { success: false, error: 'Failed to update branding' };
  }
}

/**
 * Generate CSS variables from branding theme
 */
export function generateThemeVariables(branding?: Branding): Record<string, string> {
  const theme = branding?.theme;
  
  return {
    '--restaurant-bg': theme?.background || MENUXPRO_DEFAULTS.background,
    '--restaurant-foreground': theme?.foreground || MENUXPRO_DEFAULTS.foreground,
    '--restaurant-primary': theme?.primary || MENUXPRO_DEFAULTS.primary,
    '--restaurant-accent': theme?.accent || MENUXPRO_DEFAULTS.accent,
    '--restaurant-card': theme?.card || MENUXPRO_DEFAULTS.card,
    '--restaurant-border': theme?.border || MENUXPRO_DEFAULTS.border,
  };
}

/**
 * Get effective branding for display (with plan restrictions applied)
 */
export function getDisplayBranding(restaurant: Restaurant): Branding {
  const plan = normalizePlanType(restaurant.plan);
  return getEffectiveBranding(plan, restaurant.branding);
}

export const brandingService = {
  get: getBranding,
  update: updateBranding,
  validateHexColor: isValidHexColor,
  sanitizeHexColor,
  validateUrl: isValidUrl,
  sanitizeUrl,
  validateFontFamily: isValidFontFamily,
  sanitizeFontFamily,
  validateTheme,
  validateCustomCss,
  scopeCss,
  generateThemeVariables,
  getDisplayBranding,
};
