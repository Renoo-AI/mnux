'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { SECURITY_UX_CONFIG, SecurityEventType, getSecurityUXConfig } from '@/lib/security-ux-config';

interface SecurityToast {
  id: string;
  type: SecurityEventType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'critical';
  timestamp: number;
}

interface SecurityContextType {
  /** Get configuration for a security event */
  getEventConfig: (type: SecurityEventType) => ReturnType<typeof getSecurityUXConfig>;
  /** Show a security toast notification */
  showSecurityToast: (type: SecurityEventType, customMessage?: string) => void;
  /** Get all active security toasts */
  toasts: SecurityToast[];
  /** Dismiss a toast by ID */
  dismissToast: (id: string) => void;
  /** Check if a security event should be silent */
  isSilentEvent: (type: SecurityEventType) => boolean;
  /** Register a security event handler */
  onSecurityEvent: (type: SecurityEventType, handler: (config: ReturnType<typeof getSecurityUXConfig>) => void) => void;
  /** Track a security event occurrence */
  trackEvent: (type: SecurityEventType) => void;
  /** Get count of recent security events */
  getEventCount: (type: SecurityEventType) => number;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const MAX_TOASTS = 5;
const EVENT_HISTORY_LIMIT = 50;

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<SecurityToast[]>([]);
  const [eventHandlers] = useState<Map<SecurityEventType, Set<(config: ReturnType<typeof getSecurityUXConfig>) => void>>>(new Map());
  const [eventHistory] = useState<Map<SecurityEventType, number>>(new Map());

  const getEventConfig = useCallback((type: SecurityEventType) => {
    return getSecurityUXConfig(type);
  }, []);

  const showSecurityToast = useCallback((type: SecurityEventType, customMessage?: string) => {
    const config = getSecurityUXConfig(type);
    
    // Skip if silent block
    if (config.silentBlock) {
      return;
    }

    const toast: SecurityToast = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title: config.title,
      message: customMessage || config.message,
      severity: config.severity,
      timestamp: Date.now(),
    };

    setToasts((prev) => {
      const newToasts = [...prev, toast];
      // Keep only the most recent toasts
      return newToasts.slice(-MAX_TOASTS);
    });

    // Auto-dismiss if configured
    if (config.autoDismissMs > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, config.autoDismissMs);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const isSilentEvent = useCallback((type: SecurityEventType) => {
    return getSecurityUXConfig(type).silentBlock;
  }, []);

  const onSecurityEvent = useCallback(
    (type: SecurityEventType, handler: (config: ReturnType<typeof getSecurityUXConfig>) => void) => {
      if (!eventHandlers.has(type)) {
        eventHandlers.set(type, new Set());
      }
      eventHandlers.get(type)!.add(handler);
    },
    [eventHandlers]
  );

  const trackEvent = useCallback(
    (type: SecurityEventType) => {
      const config = getSecurityUXConfig(type);
      
      // Log if configured
      if (config.logEvent) {
        console.log(`[Security Event] ${type}`, {
          timestamp: new Date().toISOString(),
          severity: config.severity,
        });
      }

      // Trigger handlers
      const handlers = eventHandlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => handler(config));
      }

      // Show toast if configured
      if (config.showToast && !config.silentBlock) {
        showSecurityToast(type);
      }

      // Update history
      const currentCount = eventHistory.get(type) || 0;
      eventHistory.set(type, currentCount + 1);

      // Trim history if too large
      if (eventHistory.size > EVENT_HISTORY_LIMIT) {
        const oldestKey = eventHistory.keys().next().value;
        if (oldestKey) {
          eventHistory.delete(oldestKey);
        }
      }
    },
    [eventHandlers, eventHistory, getEventConfig, showSecurityToast]
  );

  const getEventCount = useCallback(
    (type: SecurityEventType) => {
      return eventHistory.get(type) || 0;
    },
    [eventHistory]
  );

  return (
    <SecurityContext.Provider
      value={{
        getEventConfig,
        showSecurityToast,
        toasts,
        dismissToast,
        isSilentEvent,
        onSecurityEvent,
        trackEvent,
        getEventCount,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

export function useSecurityToast() {
  const { toasts, dismissToast, showSecurityToast } = useSecurity();
  return { toasts, dismissToast, showSecurityToast };
}

export function useSecurityEvent() {
  const { trackEvent, getEventCount, getEventConfig } = useSecurity();
  return { trackEvent, getEventCount, getEventConfig };
}
