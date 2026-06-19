'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode, useCallback } from 'react';

interface HoneypotContextType {
  /** Check if current environment appears to be a bot */
  isBotEnvironment: boolean;
  /** Get device fingerprint hash */
  getFingerprint: () => string;
  /** Track user behavior timing */
  trackKeystrokeTiming: (fieldName: string, timing: number) => void;
  /** Track mouse movement patterns */
  trackMousePattern: (x: number, y: number) => void;
  /** Get honeypot field value (should be empty for humans) */
  getHoneypotValue: () => string;
  /** Report honeypot triggered */
  reportHoneypotTrigger: (fieldName: string) => void;
  /** Get current threat level (0-100) */
  threatLevel: number;
  /** Check if request should be blocked */
  shouldBlock: () => boolean;
}

const HoneypotContext = createContext<HoneypotContextType | undefined>(undefined);

// Keystroke timing thresholds (ms) - humans typically take 30-500ms between keystrokes
const KEOKSTROKE_MIN = 15;
const KEOKSTROKE_MAX = 2000;

// Mouse speed thresholds
const MOUSE_SPEED_MIN = 0;
const MOUSE_SPEED_MAX = 3000;

// Form fill time thresholds (ms) - humans take at least 1-2 seconds to fill forms
const FORM_FILL_MIN = 1500;

// Honeypot field names that bots might fill
const HONEYPOT_FIELD_NAMES = [
  'website',
  'url',
  'honeypot',
  '_gotcha',
  'mspMessage',
  'nick',
  'author',
  'comment',
  'email',
  'name',
  'phone',
  'fax',
  'company',
  'address',
  'country',
];

export function AdvancedHoneypotProvider({ children }: { children: ReactNode }) {
  const [isBotEnvironment, setIsBotEnvironment] = useState(false);
  const [threatLevel, setThreatLevel] = useState(0);
  const [honeypotValues, setHoneypotValues] = useState<Map<string, string>>(new Map());
  
  const keystrokeTimings = useRef<Map<string, number[]>>(new Map());
  const mouseMovements = useRef<{ x: number; y: number; t: number }[]>([]);
  const formStartTime = useRef<number>(0);
  const fingerprintCache = useRef<string>('');
  const lastMouseTime = useRef<number>(Date.now());

  // Generate device fingerprint
  const getFingerprint = useCallback(() => {
    if (fingerprintCache.current) {
      return fingerprintCache.current;
    }

    const components: string[] = [];
    
    // Screen info
    components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    
    // Timezone
    components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Language
    components.push(navigator.language);
    
    // Platform
    components.push(navigator.platform || 'unknown');
    
    // Hardware concurrency
    components.push(String(navigator.hardwareConcurrency || 0));
    
    // Device memory (if available)
    if ('deviceMemory' in navigator) {
      components.push(String((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0));
    }
    
    // Touch support
    components.push(String('ontouchstart' in window));
    
    // WebGL renderer (simplified)
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown');
        }
      }
    } catch {
      components.push('webgl-unavailable');
    }
    
    // Hash the components
    const fingerprint = components.join('|');
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    fingerprintCache.current = Math.abs(hash).toString(36);
    return fingerprintCache.current;
  }, []);

  // Check for bot indicators
  useEffect(() => {
    const checkBotIndicators = () => {
      let threat = 0;
      
      // Check for headless browser indicators
      if (
        navigator.webdriver ||
        (navigator as Navigator & { webdriver?: boolean }).webdriver ||
        (typeof navigator.userAgent === 'string' && 
          (navigator.userAgent.includes('HeadlessChrome') ||
           navigator.userAgent.includes('PhantomJS') ||
           navigator.userAgent.includes('Puppeteer')))
      ) {
        threat += 40;
        setIsBotEnvironment(true);
      }
      
      // Check for automation flags
      if (
        ((globalThis as unknown) as Window & { collectChromeHeapMemoryStats?: unknown }).collectChromeHeapMemoryStats !== undefined ||
        (window as Window & { webdriver?: boolean }).webdriver
      ) {
        threat += 30;
      }
      
      // Check for missing common features
      if (typeof (window as any).callPhantom === 'function' || typeof (window as any)._phantom === 'object') {
        threat += 50;
      }
      
      setThreatLevel(Math.min(threat, 100));
    };
    
    checkBotIndicators();
  }, []);

  // Track mouse movements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      const timeDelta = now - lastMouseTime.current;
      
      if (mouseMovements.current.length > 0) {
        const last = mouseMovements.current[mouseMovements.current.length - 1];
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = timeDelta > 0 ? distance / timeDelta : 0;
        
        // Unusually fast or unnatural mouse movement suggests bot
        if (speed > MOUSE_SPEED_MAX && mouseMovements.current.length > 5) {
          setThreatLevel((prev) => Math.min(prev + 5, 100));
        }
      }
      
      mouseMovements.current.push({
        x: e.clientX,
        y: e.clientY,
        t: now,
      });
      
      // Keep only recent movements
      if (mouseMovements.current.length > 100) {
        mouseMovements.current = mouseMovements.current.slice(-50);
      }
      
      lastMouseTime.current = now;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Track keystroke timing
  const trackKeystrokeTiming = useCallback((fieldName: string, timing: number) => {
    // Check for suspiciously fast keystrokes (bot indicator)
    if (timing < KEOKSTROKE_MIN && keystrokeTimings.current.get(fieldName)?.length) {
      setThreatLevel((prev) => Math.min(prev + 3, 100));
    }
    
    // Check for suspiciously slow keystrokes (possible automation)
    if (timing > KEOKSTROKE_MAX) {
      setThreatLevel((prev) => Math.min(prev + 1, 100));
    }
    
    const timings = keystrokeTimings.current.get(fieldName) || [];
    timings.push(timing);
    keystrokeTimings.current.set(fieldName, timings);
  }, []);

  // Track mouse pattern
  const trackMousePattern = useCallback((x: number, y: number) => {
    const now = Date.now();
    
    if (mouseMovements.current.length > 0) {
      const last = mouseMovements.current[mouseMovements.current.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const timeDelta = now - last.t;
      
      if (timeDelta > 0) {
        const speed = distance / timeDelta;
        if (speed > MOUSE_SPEED_MAX) {
          setThreatLevel((prev) => Math.min(prev + 2, 100));
        }
      }
    }
    
    mouseMovements.current.push({ x, y, t: now });
  }, []);

  // Get honeypot field value
  const getHoneypotValue = useCallback(() => {
    // Check for any honeypot field that might be filled
    for (const fieldName of HONEYPOT_FIELD_NAMES) {
      const input = document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement;
      if (input && input.value && input.value.trim() !== '') {
        return input.value;
      }
    }
    return '';
  }, []);

  // Report honeypot trigger
  const reportHoneypotTrigger = useCallback((fieldName: string) => {
    console.log(`[Honeypot] Field "${fieldName}" was filled - bot detected`);
    setThreatLevel(100);
  }, []);

  // Check if request should be blocked
  const shouldBlock = useCallback(() => {
    // High threat level = block
    if (threatLevel >= 80) {
      return true;
    }
    
    // Check honeypot fields
    if (getHoneypotValue()) {
      return true;
    }
    
    // Check for extremely fast form submission
    if (formStartTime.current > 0) {
      const formFillTime = Date.now() - formStartTime.current;
      if (formFillTime < FORM_FILL_MIN && threatLevel > 30) {
        return true;
      }
    }
    
    return false;
  }, [threatLevel, getHoneypotValue]);

  return (
    <HoneypotContext.Provider
      value={{
        isBotEnvironment,
        getFingerprint,
        trackKeystrokeTiming,
        trackMousePattern,
        getHoneypotValue,
        reportHoneypotTrigger,
        threatLevel,
        shouldBlock,
      }}
    >
      {children}
    </HoneypotContext.Provider>
  );
}

export function useHoneypot() {
  const context = useContext(HoneypotContext);
  if (!context) {
    throw new Error('useHoneypot must be used within an AdvancedHoneypotProvider');
  }
  return context;
}

/**
 * Hook for form protection with honeypot
 */
export function useFormHoneypotProtection() {
  const { getHoneypotValue, shouldBlock, trackKeystrokeTiming, isBotEnvironment, threatLevel } = useHoneypot();
  
  const validateForm = useCallback(() => {
    // Check honeypot
    const honeypotValue = getHoneypotValue();
    if (honeypotValue) {
      return { valid: false, reason: 'honeypot' };
    }
    
    // Check threat level
    if (shouldBlock()) {
      return { valid: false, reason: 'threat' };
    }
    
    return { valid: true, reason: null };
  }, [getHoneypotValue, shouldBlock]);
  
  return {
    validateForm,
    isBotEnvironment,
    threatLevel,
    trackKeystrokeTiming,
  };
}
