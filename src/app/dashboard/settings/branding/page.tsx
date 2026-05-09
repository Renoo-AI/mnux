'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Palette, Upload, Image as ImageIcon, Type, Code, Globe, Lock, Check, 
  Loader2, AlertCircle, Eye, Sparkles, X, Crown, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { canUseFeature, getPlanDisplayName, getPlanLimits, getFeaturesStatus } from '@/lib/plan-features';
import type { PlanType, PlanFeatureKey, Branding, BrandingSettings, BrandingTheme } from '@/types';
import { DEFAULT_BRANDING, MENUXPRO_DEFAULTS } from '@/types';

// Color presets for quick selection
const COLOR_PRESETS = [
  { name: 'Café', primary: '#3A322D', accent: '#C9A07E' },
  { name: 'Forest', primary: '#1B4332', accent: '#40916C' },
  { name: 'Ocean', primary: '#1D3557', accent: '#457B9D' },
  { name: 'Wine', primary: '#4A1942', accent: '#9B2948' },
  { name: 'Slate', primary: '#2D3436', accent: '#636E72' },
  { name: 'Midnight', primary: '#0F0E17', accent: '#A7A9BE' },
];

// Feature display names
const FEATURE_NAMES: Record<PlanFeatureKey, string> = {
  CUSTOM_LOGO: 'Custom Logo',
  CUSTOM_COLORS: 'Custom Colors',
  CUSTOM_BACKGROUND: 'Background Image',
  CUSTOM_FAVICON: 'Custom Favicon',
  CUSTOM_OPEN_GRAPH: 'Social Preview',
  CUSTOM_MENU_COVER: 'Menu Cover Image',
  CUSTOM_TYPOGRAPHY: 'Custom Fonts',
  CUSTOM_CSS: 'Custom CSS',
  WHITE_LABEL: 'White Label',
  ADVANCED_BRANDING: 'Advanced Branding',
  REMOVE_WATERMARK: 'Remove Watermark',
  UNLIMITED_MENU_ITEMS: 'Unlimited Menu Items',
};

export default function BrandingSettingsPage() {
  const { session } = useStaffSession();
  const { toast } = useToast();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<PlanType>('FREE');
  const [features, setFeatures] = useState<Record<PlanFeatureKey, boolean>>({} as Record<PlanFeatureKey, boolean>);
  const [branding, setBranding] = useState<Branding>(DEFAULT_BRANDING);
  const [previewMode, setPreviewMode] = useState<'light' | 'dark'>('light');
  
  // Form state
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [primaryColor, setPrimaryColor] = useState(MENUXPRO_DEFAULTS.primary);
  const [accentColor, setAccentColor] = useState(MENUXPRO_DEFAULTS.accent);
  const [coverImageUrl, setCoverImageUrl] = useState<string>('');
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('');
  const [ogTitle, setOgTitle] = useState<string>('');
  const [ogDescription, setOgDescription] = useState<string>('');
  const [customCss, setCustomCss] = useState<string>('');
  const [cssEnabled, setCssEnabled] = useState(false);
  const [hideWatermark, setHideWatermark] = useState(false);
  
  // Fetch branding settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.restaurantId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/branding?restaurantId=${session.restaurantId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.settings) {
            const settings = data.settings as BrandingSettings;
            setPlan(settings.plan);
            setFeatures(settings.features);
            setBranding(settings.branding);
            
            // Set form values from branding
            if (settings.branding) {
              setLogoUrl(settings.branding.logoUrl || '');
              setPrimaryColor(settings.branding.theme?.primary || MENUXPRO_DEFAULTS.primary);
              setAccentColor(settings.branding.theme?.accent || MENUXPRO_DEFAULTS.accent);
              setCoverImageUrl(settings.branding.coverImageUrl || '');
              setBackgroundImageUrl(settings.branding.backgroundImageUrl || '');
              setOgTitle(settings.branding.openGraph?.title || '');
              setOgDescription(settings.branding.openGraph?.description || '');
              setCustomCss(settings.branding.customCss?.css || '');
              setCssEnabled(settings.branding.customCss?.enabled || false);
              setHideWatermark(settings.branding.whiteLabel?.hideMenuxBranding || false);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching branding settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load branding settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [session?.restaurantId, toast]);
  
  // Save branding
  const handleSave = useCallback(async () => {
    if (!session?.restaurantId) return;
    
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      
      // Only include fields the plan allows
      if (canUseFeature(plan, 'CUSTOM_LOGO')) {
        updates.logoUrl = logoUrl || null;
      }
      if (canUseFeature(plan, 'CUSTOM_COLORS')) {
        updates.theme = {
          primary: primaryColor,
          accent: accentColor,
        };
      }
      if (canUseFeature(plan, 'CUSTOM_MENU_COVER')) {
        updates.coverImageUrl = coverImageUrl || null;
      }
      if (canUseFeature(plan, 'CUSTOM_BACKGROUND')) {
        updates.backgroundImageUrl = backgroundImageUrl || null;
      }
      if (canUseFeature(plan, 'CUSTOM_OPEN_GRAPH')) {
        updates.openGraph = {
          title: ogTitle || null,
          description: ogDescription || null,
        };
      }
      if (canUseFeature(plan, 'CUSTOM_CSS')) {
        updates.customCss = {
          enabled: cssEnabled,
          css: customCss || null,
        };
      }
      if (canUseFeature(plan, 'WHITE_LABEL')) {
        updates.whiteLabel = {
          enabled: hideWatermark,
          hideMenuxBranding: hideWatermark,
        };
      }
      
      const response = await fetch('/api/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: session.restaurantId,
          updates,
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'Saved',
          description: 'Branding settings updated successfully',
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to save branding settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: 'Error',
        description: 'Failed to save branding settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [session?.restaurantId, plan, logoUrl, primaryColor, accentColor, coverImageUrl, backgroundImageUrl, ogTitle, ogDescription, customCss, cssEnabled, hideWatermark, toast]);
  
  // Apply color preset
  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    if (!canUseFeature(plan, 'CUSTOM_COLORS')) return;
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
  };
  
  // Feature lock component
  const FeatureLock = ({ feature }: { feature: PlanFeatureKey }) => {
    if (features[feature]) return null;
    
    return (
      <div className="absolute inset-0 bg-surface-container-low/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
        <div className="text-center p-4">
          <Lock className="w-8 h-8 text-on-surface-variant mx-auto mb-2" />
          <p className="font-display text-title-sm text-primary mb-1">
            {FEATURE_NAMES[feature]}
          </p>
          <p className="text-on-surface-variant text-sm mb-3">
            Available on higher plans
          </p>
          <Button size="sm" className="bg-primary text-on-primary">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <TopAppBar title="Branding" showSearch={false} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <TopAppBar title="Branding Settings" showSearch={false} />
      
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
        {/* Plan Status */}
        <section className="bg-gradient-to-r from-primary to-primary/80 text-on-primary p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label-caps uppercase tracking-wider opacity-80 mb-1">Current Plan</p>
              <h2 className="font-display text-headline-sm">{getPlanDisplayName(plan)} Plan</h2>
            </div>
            <div className="flex items-center gap-4">
              {plan !== 'MAX' && (
                <Button className="bg-white text-primary hover:bg-white/90">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
        </section>
        
        {/* Logo Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Logo
            </h3>
            <p className="text-on-surface-variant mt-2">
              Upload your restaurant logo to personalize your menu.
            </p>
            <p className="text-on-surface-variant text-sm mt-2">
              Recommended: 512x512px, PNG or SVG, max 512KB
            </p>
          </div>
          
          <div className="lg:col-span-2 relative">
            <FeatureLock feature="CUSTOM_LOGO" />
            <div className="bg-white p-6 rounded-xl shadow-card">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Upload className="w-8 h-8 text-on-surface-variant" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="Enter logo URL or upload..."
                    disabled={!features.CUSTOM_LOGO}
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={!features.CUSTOM_LOGO}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Image
                    </Button>
                    {logoUrl && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setLogoUrl('')}
                        disabled={!features.CUSTOM_LOGO}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Colors Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Colors
            </h3>
            <p className="text-on-surface-variant mt-2">
              Customize your brand colors for a unique look.
            </p>
          </div>
          
          <div className="lg:col-span-2 relative">
            <FeatureLock feature="CUSTOM_COLORS" />
            <div className="bg-white p-6 rounded-xl shadow-card space-y-6">
              {/* Presets */}
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-3">
                  COLOR PRESETS
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      disabled={!features.CUSTOM_COLORS}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant hover:border-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex -space-x-1">
                        <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.primary }} />
                        <div className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.accent }} />
                      </div>
                      <span className="text-sm">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Custom Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                    PRIMARY COLOR
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
                      disabled={!features.CUSTOM_COLORS}
                      className="w-12 h-12 rounded-lg border border-outline-variant cursor-pointer disabled:opacity-50"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value.toUpperCase())}
                      disabled={!features.CUSTOM_COLORS}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                    ACCENT COLOR
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value.toUpperCase())}
                      disabled={!features.CUSTOM_COLORS}
                      className="w-12 h-12 rounded-lg border border-outline-variant cursor-pointer disabled:opacity-50"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value.toUpperCase())}
                      disabled={!features.CUSTOM_COLORS}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className="p-4 rounded-xl border border-outline-variant">
                <p className="font-label-caps text-label-caps text-on-surface-variant mb-3">PREVIEW</p>
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: '#FCFBF9' }}
                >
                  <h4 
                    className="font-display text-title-sm mb-2"
                    style={{ color: primaryColor }}
                  >
                    Sample Menu Item
                  </h4>
                  <p className="text-on-surface-variant text-sm">Description text</p>
                  <p 
                    className="font-bold mt-2"
                    style={{ color: accentColor }}
                  >
                    12.50 DT
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Background & Cover Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary">Background & Cover</h3>
            <p className="text-on-surface-variant mt-2">
              Add a custom background or cover image to your menu.
            </p>
          </div>
          
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="relative">
              <FeatureLock feature="CUSTOM_MENU_COVER" />
              <div className="bg-white p-6 rounded-xl shadow-card">
                <h4 className="font-display text-title-sm text-primary mb-4">Menu Cover Image</h4>
                <div className="flex gap-4">
                  <div className="w-32 h-20 rounded-lg bg-surface-container-low border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden">
                    {coverImageUrl ? (
                      <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-on-surface-variant" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="Cover image URL..."
                      disabled={!features.CUSTOM_MENU_COVER}
                    />
                    <p className="text-xs text-on-surface-variant">Recommended: 1600x900px, max 2MB</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Background Image */}
            <div className="relative">
              <FeatureLock feature="CUSTOM_BACKGROUND" />
              <div className="bg-white p-6 rounded-xl shadow-card">
                <h4 className="font-display text-title-sm text-primary mb-4">Background Image</h4>
                <div className="flex gap-4">
                  <div className="w-32 h-20 rounded-lg bg-surface-container-low border-2 border-dashed border-outline-variant flex items-center justify-center overflow-hidden">
                    {backgroundImageUrl ? (
                      <img src={backgroundImageUrl} alt="Background" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-on-surface-variant" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      value={backgroundImageUrl}
                      onChange={(e) => setBackgroundImageUrl(e.target.value)}
                      placeholder="Background image URL..."
                      disabled={!features.CUSTOM_BACKGROUND}
                    />
                    <p className="text-xs text-on-surface-variant">Recommended: 1600x900px, max 2MB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Open Graph Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Social Preview
            </h3>
            <p className="text-on-surface-variant mt-2">
              Customize how your menu appears when shared on social media.
            </p>
          </div>
          
          <div className="lg:col-span-2 relative">
            <FeatureLock feature="CUSTOM_OPEN_GRAPH" />
            <div className="bg-white p-6 rounded-xl shadow-card space-y-4">
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                  TITLE (max 80 chars)
                </label>
                <Input
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value.slice(0, 80))}
                  placeholder={`${session?.restaurantName || 'Restaurant'} Menu | MenuxPRO`}
                  disabled={!features.CUSTOM_OPEN_GRAPH}
                />
                <p className="text-xs text-on-surface-variant mt-1">{ogTitle.length}/80</p>
              </div>
              <div>
                <label className="font-label-caps text-label-caps text-on-surface-variant block mb-2">
                  DESCRIPTION (max 180 chars)
                </label>
                <textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value.slice(0, 180))}
                  placeholder="View our digital menu, order from your table, and follow your order status."
                  disabled={!features.CUSTOM_OPEN_GRAPH}
                  rows={3}
                  className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container-low resize-none disabled:opacity-50"
                />
                <p className="text-xs text-on-surface-variant mt-1">{ogDescription.length}/180</p>
              </div>
              
              {/* Social Card Preview */}
              <div className="border border-outline-variant rounded-xl overflow-hidden max-w-sm">
                <div className="h-32 bg-surface-container flex items-center justify-center">
                  <span className="text-on-surface-variant text-sm">OG Image Preview</span>
                </div>
                <div className="p-3 bg-white">
                  <p className="text-xs text-on-surface-variant">menux.tn</p>
                  <p className="font-semibold text-sm truncate">
                    {ogTitle || `${session?.restaurantName || 'Restaurant'} Menu | MenuxPRO`}
                  </p>
                  <p className="text-xs text-on-surface-variant line-clamp-2">
                    {ogDescription || 'View our digital menu, order from your table...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Custom CSS Section (MAX only) */}
        {plan === 'MAX' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
                <Code className="w-5 h-5" />
                Custom CSS
              </h3>
              <p className="text-on-surface-variant mt-2">
                Advanced: Add custom CSS to your public menu.
              </p>
              <div className="mt-4 p-3 bg-error-container text-on-error-container rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Bad CSS can affect your menu display. Use carefully.
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-card space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-label-caps text-label-caps text-on-surface-variant">
                    ENABLE CUSTOM CSS
                  </label>
                  <Button
                    variant={cssEnabled ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCssEnabled(!cssEnabled)}
                  >
                    {cssEnabled ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <textarea
                  value={customCss}
                  onChange={(e) => setCustomCss(e.target.value.slice(0, 10000))}
                  placeholder="/* Your custom CSS here */"
                  rows={10}
                  disabled={!cssEnabled}
                  className="w-full p-4 font-mono text-sm border border-outline-variant rounded-xl bg-surface-container-low resize-none disabled:opacity-50"
                />
                <p className="text-xs text-on-surface-variant">{customCss.length}/10,000 characters</p>
              </div>
            </div>
          </section>
        )}
        
        {/* White Label Section (MAX only) */}
        {plan === 'MAX' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h3 className="font-display text-title-sm text-primary">White Label</h3>
              <p className="text-on-surface-variant mt-2">
                Remove MenuxPRO branding from your public menu.
              </p>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white p-6 rounded-xl shadow-card">
                <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                  <div>
                    <p className="font-display text-title-sm text-primary">Hide MenuxPRO Branding</p>
                    <p className="text-on-surface-variant text-sm">Remove "Powered by MenuxPRO" from your menu</p>
                  </div>
                  <Button
                    variant={hideWatermark ? 'default' : 'outline'}
                    onClick={() => setHideWatermark(!hideWatermark)}
                  >
                    {hideWatermark ? 'Hidden' : 'Visible'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Live Preview */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h3 className="font-display text-title-sm text-primary flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Live Preview
            </h3>
            <p className="text-on-surface-variant mt-2">
              See how your menu will look with current branding.
            </p>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-xl shadow-card">
              <div 
                className="rounded-xl overflow-hidden border border-outline-variant"
                style={{ 
                  backgroundColor: primaryColor ? `${primaryColor}10` : '#FCFBF9',
                }}
              >
                {/* Mini Menu Preview */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain" />
                      ) : (
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: primaryColor }}
                        >
                          M
                        </div>
                      )}
                      <span 
                        className="font-display text-title-sm"
                        style={{ color: primaryColor }}
                      >
                        {session?.restaurantName || 'Restaurant'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Sample Item</p>
                        <p className="text-xs text-on-surface-variant">Description</p>
                      </div>
                      <span 
                        className="font-bold"
                        style={{ color: accentColor }}
                      >
                        12.50 DT
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Another Item</p>
                      </div>
                      <span 
                        className="font-bold"
                        style={{ color: accentColor }}
                      >
                        8.00 DT
                      </span>
                    </div>
                  </div>
                  
                  {!hideWatermark && (
                    <p className="text-center text-xs text-on-surface-variant mt-4 opacity-60">
                      Powered by MenuxPRO
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Footer Actions */}
      <footer className="p-10 border-t border-outline-variant flex justify-end gap-4 sticky bottom-0 bg-surface/80 backdrop-blur-md">
        <Button 
          variant="outline" 
          className="px-10 py-4 border border-primary text-primary rounded-full hover:bg-surface-container-low transition-colors"
          onClick={() => {
            // Reset to saved values
            setLogoUrl(branding.logoUrl || '');
            setPrimaryColor(branding.theme?.primary || MENUXPRO_DEFAULTS.primary);
            setAccentColor(branding.theme?.accent || MENUXPRO_DEFAULTS.accent);
          }}
        >
          Discard Changes
        </Button>
        <Button 
          className="px-10 py-4 bg-primary text-on-primary rounded-full shadow-lg hover:opacity-90 transition-opacity"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Save Branding
            </>
          )}
        </Button>
      </footer>
    </DashboardLayout>
  );
}
