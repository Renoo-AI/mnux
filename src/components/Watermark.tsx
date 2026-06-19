'use client';

import { MessageCircle } from 'lucide-react';

interface WatermarkProps {
  /**
   * Controls whether the watermark is visible.
   * Should be true when restaurant.plan === 'free' or watermarkEnabled is true
   */
  show: boolean;
}

/**
 * Watermark component for free plan restaurants.
 * Shows "Powered by MenuxPro" branding with WhatsApp contact link.
 * Fixed at the bottom of the page, subtle but not removable.
 */
export function Watermark({ show }: WatermarkProps) {
  if (!show) return null;

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 z-40 bg-espresso/95 backdrop-blur-sm border-t border-accent/20 safe-area-inset-bottom"
      role="contentinfo"
      aria-label="MenuxPro branding"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-3">
        <a
          href="https://wa.me/21656110674"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 group hover:opacity-90 transition-opacity"
          aria-label="Contact MenuxPro via WhatsApp"
        >
          {/* WhatsApp Icon */}
          <MessageCircle 
            className="w-4 h-4 sm:w-5 sm:h-5 text-accent group-hover:scale-105 transition-transform" 
            aria-hidden="true"
          />
          
          {/* Branding Text */}
          <p className="text-xs sm:text-sm font-medium text-soft-beige/90">
            <span className="text-soft-beige/70">Powered by</span>{' '}
            <span className="text-accent font-semibold">MenuxPro</span>
            <span className="text-soft-beige/50 ml-1.5">© 2026</span>
          </p>
        </a>
      </div>
      
      {/* Subtle top highlight line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent"
        aria-hidden="true"
      />
    </footer>
  );
}

/**
 * Wrapper component that adds bottom padding to prevent content from being hidden behind the watermark.
 * Use this to wrap page content when the watermark is visible.
 */
export function WatermarkSpacer({ children, showWatermark }: { 
  children: React.ReactNode; 
  showWatermark: boolean;
}) {
  return (
    <div className={showWatermark ? 'pb-14 sm:pb-16' : ''}>
      {children}
    </div>
  );
}

export default Watermark;
