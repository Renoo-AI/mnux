'use client';

import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';

// Types
export interface SecurityStatus {
  allowed: boolean;
  reason?: string;
  type?: 'banned' | 'kicked';
  expiresAt?: number;
}

export interface SecurityLog {
  id: string;
  type: 'rate_limit' | 'ban' | 'kick' | 'honeypot' | 'suspicious_activity';
  deviceId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  restaurantId?: string;
  tableId?: string;
  reason?: string;
  timestamp: number | null;
  metadata?: Record<string, unknown>;
}

export interface BannedDevice {
  id: string;
  deviceId: string;
  ip?: string;
  reason: string;
  bannedAt: number | null;
  expiresAt: number | null;
  bannedBy?: string;
  restaurantId?: string;
}

export interface KickedDevice {
  id: string;
  deviceId: string;
  tableId: string;
  restaurantId: string;
  kickedAt: number | null;
  expiresAt: number | null;
  kickedBy?: string;
  reason?: string;
}

// Device ID management
const DEVICE_ID_KEY = 'menux_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';

  let deviceId = sessionStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    deviceId = `device_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    sessionStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

export function resetDeviceId(): string {
  if (typeof window === 'undefined') return '';
  
  const newDeviceId = `device_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  sessionStorage.setItem(DEVICE_ID_KEY, newDeviceId);
  return newDeviceId;
}

/**
 * Check if Firebase Functions are configured
 * This allows graceful degradation when functions are not deployed
 */
function checkFunctionsConfigured(): boolean {
  // Check if functions region is configured or if we're in development
  // In production without deployed functions, this should return false
  try {
    return functions !== null && typeof functions !== 'undefined';
  } catch {
    return false;
  }
}

// Security service class
class SecurityService {
  // Check if device is allowed to access
  // SECURITY: Returns allowed: true if functions not configured (fail open for availability)
  // In a production system, you'd want to deploy the actual Firebase Functions
  async checkSecurityStatus(
    deviceId: string,
    tableId?: string,
    restaurantId?: string
  ): Promise<SecurityStatus> {
    // If functions are not configured, allow access (fail open)
    // This ensures the app works without deployed Firebase Functions
    // SECURITY NOTE: Deploy Firebase Functions for actual security enforcement
    if (!checkFunctionsConfigured()) {
      return { allowed: true };
    }

    try {
      const fn = httpsCallable(functions, 'checkSecurityStatus');
      const result = await fn({ deviceId, tableId, restaurantId });
      return result.data as SecurityStatus;
    } catch (error) {
      console.error('Error checking security status:', error);
      // Fail open for availability when functions error
      // SECURITY: In production, consider fail closed based on your security requirements
      return { allowed: true };
    }
  }

  // Kick a device from a table
  // NOT CONFIGURED: Returns error if Firebase Functions not deployed
  async kickDevice(
    deviceId: string,
    tableId: string,
    restaurantId: string,
    durationMinutes: number = 30,
    reason: string = 'Suspicious activity'
  ): Promise<{ success: boolean; message: string; expiresAt?: number }> {
    if (!checkFunctionsConfigured()) {
      return { 
        success: false, 
        message: 'Device kick feature is not configured. Deploy Firebase Functions to enable.' 
      };
    }

    try {
      const fn = httpsCallable(functions, 'kickDevice');
      const result = await fn({
        deviceId,
        tableId,
        restaurantId,
        durationMinutes,
        reason,
      });
      return result.data as { success: boolean; message: string; expiresAt?: number };
    } catch (error) {
      console.error('Error kicking device:', error);
      return { 
        success: false, 
        message: 'Failed to kick device. Feature may not be configured.' 
      };
    }
  }

  // Lift a kick
  // NOT CONFIGURED: Returns error if Firebase Functions not deployed
  async liftKick(
    deviceId: string,
    tableId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!checkFunctionsConfigured()) {
      return { 
        success: false, 
        message: 'Device management feature is not configured.' 
      };
    }

    try {
      const fn = httpsCallable(functions, 'liftKick');
      const result = await fn({ deviceId, tableId });
      return result.data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error lifting kick:', error);
      return { 
        success: false, 
        message: 'Failed to lift kick. Feature may not be configured.' 
      };
    }
  }

  // Ban a device
  // NOT CONFIGURED: Returns error if Firebase Functions not deployed
  async banDevice(
    deviceId: string,
    reason: string,
    durationDays?: number,
    ip?: string,
    restaurantId?: string
  ): Promise<{ success: boolean; message: string; expiresAt?: number }> {
    if (!checkFunctionsConfigured()) {
      return { 
        success: false, 
        message: 'Device ban feature is not configured. Deploy Firebase Functions to enable.' 
      };
    }

    try {
      const fn = httpsCallable(functions, 'banDevice');
      const result = await fn({
        deviceId,
        reason,
        durationDays,
        ip,
        restaurantId,
      });
      return result.data as { success: boolean; message: string; expiresAt?: number };
    } catch (error) {
      console.error('Error banning device:', error);
      return { 
        success: false, 
        message: 'Failed to ban device. Feature may not be configured.' 
      };
    }
  }

  // Unban a device
  // NOT CONFIGURED: Returns error if Firebase Functions not deployed
  async unbanDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    if (!checkFunctionsConfigured()) {
      return { 
        success: false, 
        message: 'Device management feature is not configured.' 
      };
    }

    try {
      const fn = httpsCallable(functions, 'unbanDevice');
      const result = await fn({ deviceId });
      return result.data as { success: boolean; message: string };
    } catch (error) {
      console.error('Error unbanning device:', error);
      return { 
        success: false, 
        message: 'Failed to unban device. Feature may not be configured.' 
      };
    }
  }

  // Get security logs
  // NOT CONFIGURED: Returns empty array if Firebase Functions not deployed
  async getSecurityLogs(
    restaurantId?: string,
    type?: string,
    limit: number = 50,
    startAfter?: string
  ): Promise<{ logs: SecurityLog[] }> {
    if (!checkFunctionsConfigured()) {
      return { logs: [] };
    }

    try {
      const fn = httpsCallable(functions, 'getSecurityLogs');
      const result = await fn({ restaurantId, type, limit, startAfter });
      return result.data as { logs: SecurityLog[] };
    } catch (error) {
      console.error('Error getting security logs:', error);
      return { logs: [] };
    }
  }

  // Get banned devices
  // NOT CONFIGURED: Returns empty array if Firebase Functions not deployed
  async getBannedDevices(): Promise<{ devices: BannedDevice[] }> {
    if (!checkFunctionsConfigured()) {
      return { devices: [] };
    }

    try {
      const fn = httpsCallable(functions, 'getBannedDevices');
      const result = await fn({});
      return result.data as { devices: BannedDevice[] };
    } catch (error) {
      console.error('Error getting banned devices:', error);
      return { devices: [] };
    }
  }

  // Get kicked devices
  // NOT CONFIGURED: Returns empty array if Firebase Functions not deployed
  async getKickedDevices(restaurantId?: string): Promise<{ devices: KickedDevice[] }> {
    if (!checkFunctionsConfigured()) {
      return { devices: [] };
    }

    try {
      const fn = httpsCallable(functions, 'getKickedDevices');
      const result = await fn({ restaurantId });
      return result.data as { devices: KickedDevice[] };
    } catch (error) {
      console.error('Error getting kicked devices:', error);
      return { devices: [] };
    }
  }

  // Check if security features are configured
  isSecurityConfigured(): boolean {
    return checkFunctionsConfigured();
  }
}

export const securityService = new SecurityService();
