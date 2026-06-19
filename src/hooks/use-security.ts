'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { securityService, getDeviceId, SecurityStatus } from '@/services/securityService';
import { toast } from 'sonner';

// Rate limiting hook
export function useRateLimit(
  action: string,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  const requestsRef = useRef<number[]>([]);

  const checkRateLimit = useCallback((): { allowed: boolean; remaining: number; resetIn: number } => {
    const now = Date.now();
    
    // Clean up old requests
    requestsRef.current = requestsRef.current.filter(time => now - time < windowMs);
    
    const remaining = Math.max(0, maxRequests - requestsRef.current.length);
    
    if (requestsRef.current.length >= maxRequests) {
      const oldestRequest = Math.min(...requestsRef.current);
      const resetIn = oldestRequest + windowMs - now;
      return { allowed: false, remaining: 0, resetIn };
    }
    
    requestsRef.current.push(now);
    return { allowed: true, remaining: remaining - 1, resetIn: windowMs };
  }, [maxRequests, windowMs]);

  return { checkRateLimit };
}

// Honeypot hook for form protection
export function useHoneypot() {
  const [honeypotValue, setHoneypotValue] = useState('');

  const honeypotProps = {
    name: 'website', // Common honeypot field name
    tabIndex: -1, // Prevent tab navigation
    autoComplete: 'off',
    value: honeypotValue,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setHoneypotValue(e.target.value),
    className: 'absolute -left-[9999px] w-1 h-1 opacity-0 pointer-events-none',
    'aria-hidden': true,
  };

  const isBot = honeypotValue !== '';

  return { honeypotProps, isBot, honeypotValue };
}

// Device security check hook
export function useDeviceSecurity() {
  const [deviceId] = useState(() => {
    if (typeof window !== 'undefined') {
      return getDeviceId();
    }
    return '';
  });
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({ allowed: true });
  const [isChecking, setIsChecking] = useState(false);

  const checkSecurity = useCallback(async (tableId?: string, restaurantId?: string) => {
    if (!deviceId) return { allowed: true };
    
    setIsChecking(true);
    try {
      const status = await securityService.checkSecurityStatus(deviceId, tableId, restaurantId);
      setSecurityStatus(status);
      
      if (!status.allowed) {
        toast.error(`Access denied: ${status.reason || 'Device restricted'}`);
      }
      
      return status;
    } catch (error) {
      console.error('Security check failed:', error);
      return { allowed: true };
    } finally {
      setIsChecking(false);
    }
  }, [deviceId]);

  return { deviceId, securityStatus, checkSecurity, isChecking };
}

// Security action hook for admins
export function useSecurityActions() {
  const [isProcessing, setIsProcessing] = useState(false);

  const kickDevice = useCallback(async (
    deviceId: string,
    tableId: string,
    restaurantId: string,
    durationMinutes: number = 30,
    reason: string = 'Suspicious activity'
  ) => {
    setIsProcessing(true);
    try {
      const result = await securityService.kickDevice(deviceId, tableId, restaurantId, durationMinutes, reason);
      toast.success(result.message);
      return result;
    } catch (error) {
      toast.error('Failed to kick device');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const liftKick = useCallback(async (deviceId: string, tableId: string) => {
    setIsProcessing(true);
    try {
      const result = await securityService.liftKick(deviceId, tableId);
      toast.success(result.message);
      return result;
    } catch (error) {
      toast.error('Failed to lift kick');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const banDevice = useCallback(async (
    deviceId: string,
    reason: string,
    durationDays?: number,
    ip?: string,
    restaurantId?: string
  ) => {
    setIsProcessing(true);
    try {
      const result = await securityService.banDevice(deviceId, reason, durationDays, ip, restaurantId);
      toast.success(result.message);
      return result;
    } catch (error) {
      toast.error('Failed to ban device');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const unbanDevice = useCallback(async (deviceId: string) => {
    setIsProcessing(true);
    try {
      const result = await securityService.unbanDevice(deviceId);
      toast.success(result.message);
      return result;
    } catch (error) {
      toast.error('Failed to unban device');
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    kickDevice,
    liftKick,
    banDevice,
    unbanDevice,
    isProcessing,
  };
}
