'use client';

import React from 'react';
import { useSecurity } from './security-provider';
import { SECURITY_UX_CONFIG, SecurityEventType } from '@/lib/security-ux-config';
import { X, Info, AlertTriangle, AlertOctagon, ShieldAlert, CheckCircle } from 'lucide-react';

/**
 * Security Toast Component - Luxury styled security notifications
 */
export function SecurityToastContainer() {
  const { toasts, dismissToast } = useSecurity();

  if (toasts.length === 0) return null;

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'danger':
        return <AlertOctagon className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50 dark:bg-red-950/30',
          border: 'border-l-red-500',
          icon: 'text-red-500',
          title: 'text-red-700 dark:text-red-400',
          message: 'text-red-600 dark:text-red-500',
        };
      case 'danger':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20',
          border: 'border-l-red-400',
          icon: 'text-red-400',
          title: 'text-red-700 dark:text-red-300',
          message: 'text-red-600 dark:text-red-400',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-l-amber-500',
          icon: 'text-amber-500',
          title: 'text-amber-700 dark:text-amber-400',
          message: 'text-amber-600 dark:text-amber-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-[var(--color-surface-container)] dark:bg-[var(--color-primary)]',
          border: 'border-l-[var(--luxury-gold)]',
          icon: 'text-[var(--luxury-gold)]',
          title: 'text-[var(--color-primary)] dark:text-[var(--color-primary-foreground)]',
          message: 'text-[var(--color-on-surface-variant)] dark:text-[var(--color-primary-fixed)]',
        };
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-md">
      {toasts.map((toast) => {
        const styles = getSeverityStyles(toast.severity);
        
        return (
          <div
            key={toast.id}
            className={`
              flex items-start gap-4 p-4
              bg-[var(--color-surface)] dark:bg-[var(--color-primary)]
              rounded-2xl shadow-luxury-medium
              border-l-4 ${styles.border}
              animate-luxury-slide-in-right
              hover:shadow-luxury-deep transition-shadow
            `}
          >
            {/* Icon */}
            <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
              {getIcon(toast.severity)}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm ${styles.title}`}>
                {toast.title}
              </h4>
              <p className={`text-sm mt-1 ${styles.message}`}>
                {toast.message}
              </p>
            </div>
            
            {/* Dismiss Button */}
            <button
              onClick={() => dismissToast(toast.id)}
              className={`
                flex-shrink-0 w-8 h-8
                flex items-center justify-center
                rounded-full
                text-[var(--color-on-surface-variant)]
                hover:bg-[var(--color-surface-container)]
                hover:text-[var(--color-primary)]
                transition-colors
              `}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Honeypot Hidden Fields Component
 * Invisible to humans, visible to bots
 */
export function HoneypotFields() {
  return (
    <div 
      className="absolute -left-[9999px] w-1 h-1 overflow-hidden" 
      aria-hidden="true"
    >
      {/* Primary honeypot field */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
        aria-label="Leave this field empty"
      />
      
      {/* Secondary honeypot fields */}
      <input
        type="text"
        name="honeypot"
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
      />
      
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
      />
      
      <input
        type="text"
        name="mspMessage"
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
      />
      
      <input
        type="email"
        name="email"
        tabIndex={-1}
        autoComplete="off"
        className="w-1 h-1 opacity-0 pointer-events-none"
      />
    </div>
  );
}

/**
 * Security Status Indicator
 * Shows current security status in the UI
 */
export function SecurityStatusIndicator() {
  const { getEventCount } = useSecurity();
  const totalEvents = (Object.keys(SECURITY_UX_CONFIG) as SecurityEventType[])
    .reduce((sum, type) => sum + getEventCount(type), 0);
  
  if (totalEvents === 0) return null;
  
  return (
    <div className="fixed top-4 left-4 z-[9998]">
      <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] dark:bg-[var(--color-primary)] rounded-full shadow-luxury-soft">
        <ShieldAlert className="w-4 h-4 text-[var(--luxury-gold)]" />
        <span className="text-xs font-medium text-[var(--color-on-surface)]">
          {totalEvents} security event{totalEvents !== 1 ? 's' : ''} logged
        </span>
      </div>
    </div>
  );
}

/**
 * Progressive Delay Overlay
 * Shown when security measures are being applied
 */
interface SecurityDelayOverlayProps {
  isActive: boolean;
  message?: string;
  progress?: number; // 0-100
}

export function SecurityDelayOverlay({ isActive, message, progress }: SecurityDelayOverlayProps) {
  if (!isActive) return null;
  
  return (
    <div className="fixed inset-0 bg-[var(--color-background)]/90 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] animate-luxury-fade-in-up">
      {/* Spinner */}
      <div className="relative w-16 h-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-[var(--color-surface-container)]" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--luxury-gold)] animate-luxury-border-spin" />
      </div>
      
      {/* Message */}
      <p className="text-[var(--color-on-surface-variant)] text-sm font-medium mb-4">
        {message || 'Taking longer than usual for your security...'}
      </p>
      
      {/* Progress bar (if provided) */}
      {progress !== undefined && (
        <div className="w-48 h-1.5 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--luxury-gold)] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Attack Blocked Banner
 * Shown when an attack has been blocked
 */
interface AttackBlockedBannerProps {
  isVisible: boolean;
  attackType?: string;
  onDismiss?: () => void;
}

export function AttackBlockedBanner({ isVisible, attackType, onDismiss }: AttackBlockedBannerProps) {
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-20 right-4 z-[10000] animate-luxury-slide-in-right">
      <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-luxury-medium">
        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Attack Blocked</p>
          {attackType && (
            <p className="text-xs text-white/80">{attackType} attempt detected</p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Threat Level Meter
 * Visual indicator of current threat level
 */
interface ThreatLevelMeterProps {
  level: number; // 0-100
  showLabel?: boolean;
}

export function ThreatLevelMeter({ level, showLabel = true }: ThreatLevelMeterProps) {
  const getColor = () => {
    if (level >= 80) return 'bg-red-500';
    if (level >= 50) return 'bg-amber-500';
    if (level >= 25) return 'bg-[var(--luxury-gold)]';
    return 'bg-green-500';
  };
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-[var(--color-surface-container)] rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} rounded-full transition-all duration-300`}
          style={{ width: `${level}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[var(--color-on-surface-variant)] w-12 text-right">
          {level}%
        </span>
      )}
    </div>
  );
}
