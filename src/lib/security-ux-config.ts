/**
 * ============================================
 * MENUXPRO SECURITY UX CONFIG
 * Maps strict security to elegant user experience
 * ============================================
 */

export interface SecurityUXEvent {
  /** Internal security event type */
  type: SecurityEventType;
  /** User-friendly title for UI feedback */
  title: string;
  /** Detailed explanation for user */
  message: string;
  /** Severity level affects visual presentation */
  severity: 'info' | 'warning' | 'danger' | 'critical';
  /** Icon identifier for the event */
  icon: string;
  /** Sound effect identifier (optional) */
  sound?: 'soft-alert' | 'warning' | 'block' | 'success';
  /** Whether to show toast notification */
  showToast: boolean;
  /** Whether to log this event */
  logEvent: boolean;
  /** Whether to silently block without user notification */
  silentBlock: boolean;
  /** Auto-dismiss delay in ms (0 = manual dismiss) */
  autoDismissMs: number;
  /** CSS animation class for entry */
  animationClass: string;
}

export type SecurityEventType =
  | 'BOT_DETECTED'
  | 'HONEYPOT_TRIGGERED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'BRUTE_FORCE_SUSPECTED'
  | 'BRUTE_FORCE_BLOCKED'
  | 'SESSION_ANOMALY'
  | 'SUSPICIOUS_IP'
  | 'CREDENTIAL_STUFFING'
  | 'SQL_INJECTION_ATTEMPT'
  | 'XSS_ATTEMPT'
  | 'CSRF_ATTEMPT'
  | 'INVALID_TOKEN'
  | 'ACCOUNT_LOCKED'
  | 'PROGRESSIVE_DELAY'
  | 'VPN_PROXY_DETECTED'
  | 'HEADLESS_BROWSER_DETECTED'
  | 'DATABASE_ERROR'
  | 'VALIDATION_ERROR'
  | 'AUTH_REQUIRED';

/**
 * Configuration mapping security events to UX feedback
 */
export const SECURITY_UX_CONFIG: Record<SecurityEventType, SecurityUXEvent> = {
  BOT_DETECTED: {
    type: 'BOT_DETECTED',
    title: 'Verification Required',
    message: 'Please complete a quick verification to continue.',
    severity: 'warning',
    icon: 'security',
    sound: 'soft-alert',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 5000,
    animationClass: 'animate-luxury-slide-in-right',
  },

  HONEYPOT_TRIGGERED: {
    type: 'HONEYPOT_TRIGGERED',
    title: 'Request Processed',
    message: 'Thank you for your submission.',
    severity: 'info',
    icon: 'check_circle',
    sound: undefined,
    showToast: false,
    logEvent: true,
    silentBlock: true,
    autoDismissMs: 0,
    animationClass: '',
  },

  RATE_LIMIT_EXCEEDED: {
    type: 'RATE_LIMIT_EXCEEDED',
    title: 'Slow Down',
    message: 'You\'re making requests too quickly. Please wait a moment.',
    severity: 'warning',
    icon: 'schedule',
    sound: 'warning',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 8000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  BRUTE_FORCE_SUSPECTED: {
    type: 'BRUTE_FORCE_SUSPECTED',
    title: 'Unusual Activity Detected',
    message: 'We noticed some unusual login attempts. Please verify you\'re human.',
    severity: 'danger',
    icon: 'warning',
    sound: 'warning',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 10000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  BRUTE_FORCE_BLOCKED: {
    type: 'BRUTE_FORCE_BLOCKED',
    title: 'Access Temporarily Restricted',
    message: 'Too many failed attempts. Please try again in a few minutes.',
    severity: 'critical',
    icon: 'block',
    sound: 'block',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 0,
    animationClass: 'animate-luxury-fade-in-scale',
  },

  SESSION_ANOMALY: {
    type: 'SESSION_ANOMALY',
    title: 'Session Updated',
    message: 'Your session has been refreshed for security.',
    severity: 'info',
    icon: 'refresh',
    sound: undefined,
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 4000,
    animationClass: 'animate-luxury-slide-in-right',
  },

  SUSPICIOUS_IP: {
    type: 'SUSPICIOUS_IP',
    title: 'Security Check',
    message: 'We\'re verifying your connection. Please wait.',
    severity: 'warning',
    icon: 'vpn_key',
    sound: 'soft-alert',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 6000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  CREDENTIAL_STUFFING: {
    type: 'CREDENTIAL_STUFFING',
    title: 'Login Issue',
    message: 'Please check your email or password and try again.',
    severity: 'warning',
    icon: 'error_outline',
    sound: 'warning',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 8000,
    animationClass: 'animate-luxury-slide-in-right',
  },

  SQL_INJECTION_ATTEMPT: {
    type: 'SQL_INJECTION_ATTEMPT',
    title: 'Invalid Input',
    message: 'Please enter valid information.',
    severity: 'danger',
    icon: 'report',
    sound: 'block',
    showToast: true,
    logEvent: true,
    silentBlock: true,
    autoDismissMs: 3000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  XSS_ATTEMPT: {
    type: 'XSS_ATTEMPT',
    title: 'Content Not Saved',
    message: 'Your input contained potentially unsafe content.',
    severity: 'danger',
    icon: 'report',
    sound: 'block',
    showToast: true,
    logEvent: true,
    silentBlock: true,
    autoDismissMs: 5000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  CSRF_ATTEMPT: {
    type: 'CSRF_ATTEMPT',
    title: 'Request Expired',
    message: 'Please refresh the page and try again.',
    severity: 'warning',
    icon: 'autorenew',
    sound: 'warning',
    showToast: true,
    logEvent: true,
    silentBlock: true,
    autoDismissMs: 5000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  INVALID_TOKEN: {
    type: 'INVALID_TOKEN',
    title: 'Session Expired',
    message: 'Please log in again to continue.',
    severity: 'warning',
    icon: 'logout',
    sound: 'warning',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 6000,
    animationClass: 'animate-luxury-slide-in-right',
  },

  ACCOUNT_LOCKED: {
    type: 'ACCOUNT_LOCKED',
    title: 'Account Secured',
    message: 'Your account has been temporarily locked for protection. Contact support if needed.',
    severity: 'critical',
    icon: 'lock',
    sound: 'block',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 0,
    animationClass: 'animate-luxury-fade-in-scale',
  },

  PROGRESSIVE_DELAY: {
    type: 'PROGRESSIVE_DELAY',
    title: 'Please Wait',
    message: 'Taking longer than usual. This helps keep your account secure.',
    severity: 'info',
    icon: 'hourglass_empty',
    sound: undefined,
    showToast: true,
    logEvent: false,
    silentBlock: false,
    autoDismissMs: 3000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  VPN_PROXY_DETECTED: {
    type: 'VPN_PROXY_DETECTED',
    title: 'Connection Notice',
    message: 'For security, please disable VPN/proxy and refresh.',
    severity: 'warning',
    icon: 'vpn_lock',
    sound: 'soft-alert',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 8000,
    animationClass: 'animate-luxury-slide-in-right',
  },

  HEADLESS_BROWSER_DETECTED: {
    type: 'HEADLESS_BROWSER_DETECTED',
    title: 'Browser Issue',
    message: 'Please use a standard browser to access this feature.',
    severity: 'warning',
    icon: 'web',
    sound: 'warning',
    showToast: true,
    logEvent: true,
    silentBlock: true,
    autoDismissMs: 5000,
    animationClass: 'animate-luxury-fade-in-up',
  },

  DATABASE_ERROR: {
    type: 'DATABASE_ERROR',
    title: 'Technical Issue',
    message: 'We\'re experiencing temporary issues. Please try again shortly.',
    severity: 'danger',
    icon: 'cloud_off',
    sound: 'warning',
    showToast: true,
    logEvent: true,
    silentBlock: false,
    autoDismissMs: 10000,
    animationClass: 'animate-luxury-fade-in-scale',
  },

  VALIDATION_ERROR: {
    type: 'VALIDATION_ERROR',
    title: 'Check Your Input',
    message: 'Please review the highlighted fields.',
    severity: 'info',
    icon: 'edit_note',
    sound: undefined,
    showToast: true,
    logEvent: false,
    silentBlock: false,
    autoDismissMs: 5000,
    animationClass: 'animate-luxury-slide-in-right',
  },

  AUTH_REQUIRED: {
    type: 'AUTH_REQUIRED',
    title: 'Sign In Required',
    message: 'Please sign in to access this feature.',
    severity: 'info',
    icon: 'login',
    sound: undefined,
    showToast: true,
    logEvent: false,
    silentBlock: false,
    autoDismissMs: 5000,
    animationClass: 'animate-luxury-fade-in-up',
  },
};

/**
 * Get UX config for a security event
 */
export function getSecurityUXConfig(eventType: SecurityEventType): SecurityUXEvent {
  return SECURITY_UX_CONFIG[eventType] || SECURITY_UX_CONFIG.VALIDATION_ERROR;
}

/**
 * Check if event should show toast
 */
export function shouldShowToast(eventType: SecurityEventType): boolean {
  return getSecurityUXConfig(eventType).showToast;
}

/**
 * Check if event should be silently blocked
 */
export function shouldSilentBlock(eventType: SecurityEventType): boolean {
  return getSecurityUXConfig(eventType).silentBlock;
}

/**
 * Get auto-dismiss delay
 */
export function getAutoDismissDelay(eventType: SecurityEventType): number {
  return getSecurityUXConfig(eventType).autoDismissMs;
}

/**
 * Get animation class for event
 */
export function getEventAnimationClass(eventType: SecurityEventType): string {
  return getSecurityUXConfig(eventType).animationClass;
}

/**
 * Security events that are logged but don't block the user
 */
export const SILENT_LOGGED_EVENTS: SecurityEventType[] = [
  'HONEYPOT_TRIGGERED',
  'SQL_INJECTION_ATTEMPT',
  'XSS_ATTEMPT',
  'CSRF_ATTEMPT',
];

/**
 * Security events that require user attention
 */
export const USER_ATTENTION_EVENTS: SecurityEventType[] = [
  'BRUTE_FORCE_BLOCKED',
  'ACCOUNT_LOCKED',
  'INVALID_TOKEN',
  'DATABASE_ERROR',
];

/**
 * Security events that trigger progressive delays
 */
export const PROGRESSIVE_DELAY_EVENTS: SecurityEventType[] = [
  'BRUTE_FORCE_SUSPECTED',
  'CREDENTIAL_STUFFING',
  'RATE_LIMIT_EXCEEDED',
];

/**
 * Map backend security response to UX event
 */
export function mapSecurityResponseToUX(
  response: { blocked?: boolean; reason?: string; delayMs?: number }
): SecurityEventType | null {
  if (response.blocked) {
    if (response.reason?.includes('brute')) {
      return 'BRUTE_FORCE_BLOCKED';
    }
    if (response.reason?.includes('rate')) {
      return 'RATE_LIMIT_EXCEEDED';
    }
    if (response.reason?.includes('honeypot')) {
      return 'HONEYPOT_TRIGGERED';
    }
    return 'BOT_DETECTED';
  }

  if (response.delayMs && response.delayMs > 100) {
    return 'PROGRESSIVE_DELAY';
  }

  return null;
}
