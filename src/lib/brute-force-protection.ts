/**
 * Anti-Brute-Force Protection System for MenuxPRO
 * 
 * Comprehensive protection against credential stuffing, brute force attacks,
 * and automated login attempts through:
 * - Progressive delays
 * - Account lockout
 * - IP-based blocking
 * - Device fingerprinting
 * - Anomaly detection
 * - CAPTCHA integration hooks
 * 
 * @author MiniMax Agent
 * @version 2.0.0
 */

import { NextRequest, NextResponse } from 'next/server';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface BruteForceConfig {
  /** Maximum failed attempts before lockout */
  maxAttempts: number;
  /** Time window for counting attempts (ms) */
  attemptWindow: number;
  /** Lockout duration (ms) */
  lockoutDuration: number;
  /** Progressive delay after each failed attempt (ms) */
  progressiveDelay: number;
  /** Enable IP-based blocking */
  blockByIP: boolean;
  /** Enable device fingerprint blocking */
  blockByDevice: boolean;
  /** Enable email-based blocking */
  blockByEmail: boolean;
}

export interface BruteForceStatus {
  isBlocked: boolean;
  blockedUntil?: number;
  attemptsRemaining: number;
  totalAttempts: number;
  lockoutActive: boolean;
  reason?: string;
}

export interface AttemptRecord {
  identifier: string;
  type: 'ip' | 'device' | 'email' | 'username';
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
  blockedUntil: number;
  locked: boolean;
  lockedUntil: number;
}

export interface ProgressiveDelayConfig {
  /** Base delay in ms */
  baseDelay: number;
  /** Maximum delay in ms */
  maxDelay: number;
  /** Delay multiplier per attempt */
  multiplier: number;
}

// ============================================
// DEFAULT CONFIGURATIONS
// ============================================

const DEFAULT_BRUTE_FORCE_CONFIG: BruteForceConfig = {
  maxAttempts: 5,
  attemptWindow: 15 * 60 * 1000,     // 15 minutes
  lockoutDuration: 30 * 60 * 1000,  // 30 minutes
  progressiveDelay: 1000,            // Start with 1 second delay
  blockByIP: true,
  blockByDevice: true,
  blockByEmail: true,
};

const DEFAULT_PROGRESSIVE_DELAY: ProgressiveDelayConfig = {
  baseDelay: 1000,
  maxDelay: 30000,
  multiplier: 2,
};

// ============================================
// IN-MEMORY STORES
// ============================================

const attemptStore = new Map<string, AttemptRecord>();
const captchaRequired = new Map<string, number>();
const suspiciousLoginPatterns = new Map<string, { count: number; lastCheck: number }>();

// ============================================
// HELPER FUNCTIONS
// ============================================

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

function getDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  
  // Create a simple fingerprint hash
  const raw = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return `fp_${Math.abs(hash).toString(36)}`;
}

function getAttemptKey(type: AttemptRecord['type'], identifier: string): string {
  return `${type}:${identifier}`;
}

// ============================================
// CORE BRUTE FORCE PROTECTION
// ============================================

export function checkBruteForce(
  identifier: string,
  type: AttemptRecord['type'],
  config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG
): BruteForceStatus {
  const key = getAttemptKey(type, identifier);
  const now = Date.now();
  
  let record = attemptStore.get(key);
  
  // Clean up old records
  if (record && !record.blocked && record.firstAttempt < now - config.attemptWindow * 2) {
    attemptStore.delete(key);
    record = undefined;
  }
  
  // If no record exists, allow
  if (!record) {
    return {
      isBlocked: false,
      attemptsRemaining: config.maxAttempts,
      totalAttempts: 0,
      lockoutActive: false,
    };
  }
  
  // Check if locked out
  if (record.locked && record.lockedUntil > now) {
    return {
      isBlocked: true,
      blockedUntil: record.lockedUntil,
      attemptsRemaining: 0,
      totalAttempts: record.attempts,
      lockoutActive: true,
      reason: `Account locked due to too many failed attempts. Try again in ${Math.ceil((record.lockedUntil - now) / 1000 / 60)} minutes.`,
    };
  }
  
  // Clear lockout if expired
  if (record.locked && record.lockedUntil <= now) {
    record.locked = false;
    record.lockedUntil = 0;
    record.attempts = 0;
    record.firstAttempt = now;
    attemptStore.set(key, record);
  }
  
  // Clean up old attempts
  if (record.firstAttempt < now - config.attemptWindow) {
    record.attempts = 1;
    record.firstAttempt = now;
    record.lastAttempt = now;
    attemptStore.set(key, record);
    
    return {
      isBlocked: false,
      attemptsRemaining: config.maxAttempts - 1,
      totalAttempts: 1,
      lockoutActive: false,
    };
  }
  
  // Check if blocked
  if (record.blocked && record.blockedUntil > now) {
    return {
      isBlocked: true,
      blockedUntil: record.blockedUntil,
      attemptsRemaining: 0,
      totalAttempts: record.attempts,
      lockoutActive: false,
      reason: 'Too many failed attempts. Please wait.',
    };
  }
  
  return {
    isBlocked: false,
    attemptsRemaining: Math.max(0, config.maxAttempts - record.attempts),
    totalAttempts: record.attempts,
    lockoutActive: false,
  };
}

export function recordFailedAttempt(
  identifier: string,
  type: AttemptRecord['type'],
  config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG
): { shouldLockout: boolean; lockoutUntil?: number; newDelay?: number } {
  const key = getAttemptKey(type, identifier);
  const now = Date.now();
  
  let record = attemptStore.get(key);
  
  if (!record) {
    record = {
      identifier,
      type,
      attempts: 1,
      firstAttempt: now,
      lastAttempt: now,
      blocked: false,
      blockedUntil: 0,
      locked: false,
      lockedUntil: 0,
    };
  } else {
    record.attempts++;
    record.lastAttempt = now;
  }
  
  // Check if should lockout
  const shouldLockout = record.attempts >= config.maxAttempts;
  
  if (shouldLockout) {
    record.locked = true;
    record.lockedUntil = now + config.lockoutDuration;
  }
  
  attemptStore.set(key, record);
  
  // Calculate progressive delay
  const newDelay = calculateProgressiveDelay(record.attempts, DEFAULT_PROGRESSIVE_DELAY);
  
  return {
    shouldLockout,
    lockoutUntil: shouldLockout ? record.lockedUntil : undefined,
    newDelay,
  };
}

export function recordSuccessfulAttempt(
  identifier: string,
  type: AttemptRecord['type']
): void {
  const key = getAttemptKey(type, identifier);
  
  // Remove record on successful login
  attemptStore.delete(key);
  
  // Also clear any related attempts
  if (type === 'email') {
    // Clear IP attempts from same login
    for (const [k, record] of attemptStore.entries()) {
      if (record.type === 'ip' && k.includes(identifier)) {
        attemptStore.delete(k);
      }
    }
  }
}

// ============================================
// PROGRESSIVE DELAY CALCULATION
// ============================================

function calculateProgressiveDelay(
  attempts: number,
  config: ProgressiveDelayConfig
): number {
  const delay = Math.min(
    config.maxDelay,
    config.baseDelay * Math.pow(config.multiplier, attempts - 1)
  );
  
  return delay;
}

// ============================================
// CAPTCHA INTEGRATION
// ============================================

export function shouldRequireCaptcha(
  identifier: string,
  type: AttemptRecord['type']
): boolean {
  const key = getAttemptKey(type, identifier);
  
  // Check if CAPTCHA was recently required
  const lastCaptcha = captchaRequired.get(key);
  if (lastCaptcha && Date.now() - lastCaptcha < 30 * 60 * 1000) {
    return true;
  }
  
  // Check attempt record
  const record = attemptStore.get(key);
  if (record && record.attempts >= 3) {
    return true;
  }
  
  return false;
}

export function markCaptchaRequired(
  identifier: string,
  type: AttemptRecord['type']
): void {
  const key = getAttemptKey(type, identifier);
  captchaRequired.set(key, Date.now());
}

export function clearCaptchaRequirement(
  identifier: string,
  type: AttemptRecord['type']
): void {
  const key = getAttemptKey(type, identifier);
  captchaRequired.delete(key);
}

// ============================================
// ANOMALY DETECTION FOR LOGIN ATTEMPTS
// ============================================

export interface LoginAnomaly {
  type: 'unusual_time' | 'unusual_location' | 'rapid_attempts' | 'credential_stuffing' | 'distributed_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
}

export function detectLoginAnomalies(
  request: NextRequest,
  email?: string
): LoginAnomaly[] {
  const anomalies: LoginAnomaly[] = [];
  const ip = getClientIp(request);
  const now = Date.now();
  
  // Check for unusual timing (3 AM - 5 AM is common for attacks)
  const hour = new Date().getHours();
  if (hour >= 3 && hour <= 5) {
    anomalies.push({
      type: 'unusual_time',
      severity: 'low',
      confidence: 60,
      description: 'Login attempt during unusual hours (3 AM - 5 AM local time)',
    });
  }
  
  // Check for rapid attempts from same IP
  const record = attemptStore.get(getAttemptKey('ip', ip));
  if (record && record.attempts > 10) {
    anomalies.push({
      type: 'rapid_attempts',
      severity: 'high',
      confidence: 90,
      description: 'Very high number of login attempts from this IP',
    });
  }
  
  // Check for distributed attack (many emails from same IP)
  let emailCount = 0;
  for (const [key, rec] of attemptStore.entries()) {
    if (rec.type === 'ip' && key === ip) {
      emailCount++;
    }
  }
  
  if (emailCount > 5) {
    anomalies.push({
      type: 'distributed_attack',
      severity: 'critical',
      confidence: 85,
      description: 'Multiple different accounts being targeted from same IP',
    });
  }
  
  // Check for credential stuffing patterns
  const stuffingKey = `stuffing:${ip}`;
  const stuffingRecord = suspiciousLoginPatterns.get(stuffingKey);
  
  if (stuffingRecord) {
    if (now - stuffingRecord.lastCheck < 60 * 60 * 1000) {
      // Multiple emails tried from same IP
      anomalies.push({
        type: 'credential_stuffing',
        severity: 'high',
        confidence: 75,
        description: 'Multiple email addresses tried from this IP (credential stuffing pattern)',
      });
    }
  }
  
  return anomalies;
}

export function recordSuspiciousPattern(
  identifier: string,
  patternType: string
): void {
  const key = `${patternType}:${identifier}`;
  const record = suspiciousLoginPatterns.get(key) || { count: 0, lastCheck: Date.now() };
  record.count++;
  record.lastCheck = Date.now();
  suspiciousLoginPatterns.set(key, record);
}

// ============================================
// COMBINED LOGIN SECURITY CHECK
// ============================================

export interface LoginSecurityCheck {
  allowed: boolean;
  status: BruteForceStatus;
  anomalies: LoginAnomaly[];
  requiresCaptcha: boolean;
  delay?: number;
  blockReason?: string;
}

export function performLoginSecurityCheck(
  request: NextRequest,
  email?: string,
  config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG
): LoginSecurityCheck {
  const ip = getClientIp(request);
  const device = getDeviceFingerprint(request);
  
  // Check brute force status for IP
  const ipStatus = checkBruteForce(ip, 'ip', config);
  
  // Check brute force status for device
  const deviceStatus = checkBruteForce(device, 'device', config);
  
  // Check brute force status for email if provided
  let emailStatus: BruteForceStatus | undefined;
  if (email) {
    emailStatus = checkBruteForce(email, 'email', config);
  }
  
  // Combine results
  const isBlocked = ipStatus.isBlocked || deviceStatus.isBlocked || (emailStatus?.isBlocked ?? false);
  const blockedUntil = Math.max(
    ipStatus.blockedUntil || 0,
    deviceStatus.blockedUntil || 0,
    emailStatus?.blockedUntil || 0
  );
  
  // Detect anomalies
  const anomalies = detectLoginAnomalies(request, email);
  
  // Check if CAPTCHA required
  const requiresCaptcha = email 
    ? shouldRequireCaptcha(email, 'email') 
    : false;
  
  // Determine block reason
  let blockReason: string | undefined;
  if (ipStatus.isBlocked) blockReason = ipStatus.reason;
  else if (deviceStatus.isBlocked) blockReason = deviceStatus.reason;
  else if (emailStatus?.isBlocked) blockReason = emailStatus.reason;
  
  return {
    allowed: !isBlocked,
    status: {
      isBlocked,
      blockedUntil: blockedUntil || undefined,
      attemptsRemaining: Math.min(
        ipStatus.attemptsRemaining,
        deviceStatus.attemptsRemaining,
        emailStatus?.attemptsRemaining ?? Infinity
      ),
      totalAttempts: Math.max(
        ipStatus.totalAttempts,
        deviceStatus.totalAttempts,
        emailStatus?.totalAttempts ?? 0
      ),
      lockoutActive: ipStatus.lockoutActive || deviceStatus.lockoutActive || (emailStatus?.lockoutActive ?? false),
      reason: blockReason,
    },
    anomalies,
    requiresCaptcha,
    delay: ipStatus.totalAttempts > 0 ? calculateProgressiveDelay(ipStatus.totalAttempts, DEFAULT_PROGRESSIVE_DELAY) : undefined,
    blockReason,
  };
}

// ============================================
// SECURITY RESPONSE HELPERS
// ============================================

export function createLoginSecurityResponse(check: LoginSecurityCheck): NextResponse {
  const response: Record<string, unknown> = {
    success: check.allowed,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
  
  if (!check.allowed) {
    response.error = 'Too many login attempts. Please try again later.';
    
    if (check.status.blockedUntil) {
      response.retryAfter = Math.ceil((check.status.blockedUntil - Date.now()) / 1000);
    }
    
    if (process.env.NODE_ENV === 'development') {
      response.details = {
        status: check.status,
        anomalies: check.anomalies,
      };
    }
  } else {
    if (check.requiresCaptcha) {
      response.warning = 'CAPTCHA required';
      response.requiresCaptcha = true;
    }
    
    if (check.delay && check.delay > 1000) {
      response.delay = check.delay;
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  };
  
  return new NextResponse(JSON.stringify(response), {
    status: check.allowed ? 200 : 429,
    headers,
  });
}

export function createCaptchaRequiredResponse(returnUrl?: string): NextResponse {
  const response = {
    success: false,
    error: 'CAPTCHA verification required',
    requiresCaptcha: true,
    returnUrl,
    timestamp: new Date().toISOString(),
  };
  
  return new NextResponse(JSON.stringify(response), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

// ============================================
// CLEANUP OLD DATA
// ============================================

if (typeof setInterval !== 'undefined') {
  // Clean up old records every 5 minutes
  setInterval(() => {
    const now = Date.now();
    
    for (const [key, record] of attemptStore.entries()) {
      // Remove records older than 24 hours
      if (record.lastAttempt < now - 24 * 60 * 60 * 1000) {
        attemptStore.delete(key);
      }
    }
    
    // Clean up CAPTCHA requirements
    for (const [key, timestamp] of captchaRequired.entries()) {
      if (now - timestamp > 60 * 60 * 1000) {
        captchaRequired.delete(key);
      }
    }
    
    // Clean up suspicious patterns
    for (const [key, record] of suspiciousLoginPatterns.entries()) {
      if (now - record.lastCheck > 60 * 60 * 1000) {
        suspiciousLoginPatterns.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

// ============================================
// EXPORTS
// ============================================

export const bruteForceProtection = {
  checkBruteForce,
  recordFailedAttempt,
  recordSuccessfulAttempt,
  shouldRequireCaptcha,
  markCaptchaRequired,
  clearCaptchaRequirement,
  detectLoginAnomalies,
  performLoginSecurityCheck,
  createLoginSecurityResponse,
  createCaptchaRequiredResponse,
  DEFAULT_BRUTE_FORCE_CONFIG,
  DEFAULT_PROGRESSIVE_DELAY,
};

export default bruteForceProtection;
