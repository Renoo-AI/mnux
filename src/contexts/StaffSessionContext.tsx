'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { StaffSession, StaffRole } from '@/types';
import { SUPERADMIN_UID, auth, isSuperadminFromClaims } from '@/lib/firebase';
import { onAuthStateChanged, User, getIdTokenResult } from 'firebase/auth';
import { isOfflineError } from '@/hooks/useNetworkStatus';

interface StaffSessionContextType {
  session: StaffSession | null;
  isLoading: boolean;
  isStaffAuthenticated: boolean;
  isSuperadmin: boolean;
  loginStaff: (restaurantSlug: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginSuperadmin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logoutStaff: () => void;
  currentStaff: StaffSession | null;
  currentRestaurant: { id: string; slug: string; name: string } | null;
  isOffline: boolean;
}

const StaffSessionContext = createContext<StaffSessionContextType | undefined>(undefined);

// SECURITY: Only store non-authoritative UI hints in localStorage
// NEVER store: role, isSuperadmin, restaurantId authorization, staffId authorization
// This key only stores minimal UX convenience data
const UI_HINT_KEY = 'menux_staff_ui_hint';

interface StaffUIHint {
  restaurantSlug: string;
  displayName: string;
  lastUsedAt: number;
}

export function StaffSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isSuperadminState, setIsSuperadminState] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  
  // Ref to prevent multiple concurrent auth state processing
  const isProcessingAuthState = useRef(false);

  // SECURITY: isSuperadmin is derived from Firebase Auth:
  // 1. Primary: Custom claim 'role: superadmin' in the ID token
  // 2. Fallback: UID comparison during migration period
  // NEVER trust localStorage for superadmin status
  const isSuperadmin = isSuperadminState;

  // Sync with Firebase Auth state - this is the ONLY source of truth for superadmin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Prevent race conditions - only process one auth state change at a time
      if (isProcessingAuthState.current) {
        return;
      }
      isProcessingAuthState.current = true;
      
      try {
        setFirebaseUser(user);
        
        if (user) {
          try {
            // Get the ID token result to check custom claims
            const tokenResult = await getIdTokenResult(user);
            
            // Check for superadmin status via custom claim (primary)
            const hasSuperadminClaim = isSuperadminFromClaims(tokenResult);
            
            // Fallback: Check UID during migration period
            const isFallbackSuperadmin = user.uid === SUPERADMIN_UID;
            
            const isActuallySuperadmin = hasSuperadminClaim || isFallbackSuperadmin;
            
            setIsSuperadminState(isActuallySuperadmin);
            setIsOffline(false);
            
            // SECURITY: If user is superadmin, create an in-memory session
            // This session is derived from Firebase Auth, NOT from localStorage
            if (isActuallySuperadmin) {
              const superadminSession: StaffSession = {
                restaurantId: 'all',
                restaurantSlug: 'admin',
                restaurantName: 'MenuxPro Admin',
                staffId: user.uid,
                staffName: user.displayName || user.email?.split('@')[0] || 'Super Admin',
                role: 'admin',
              };
              
              setSession(superadminSession);
            } else {
              // Not superadmin - clear session if it was a superadmin session
              setSession(null);
            }
          } catch (error) {
            console.error('Error checking superadmin status:', error);
            
            // Check if it's an offline error
            if (isOfflineError(error)) {
              setIsOffline(true);
              // Keep existing session if offline
              console.warn('Offline - maintaining existing session state');
            } else {
              setIsSuperadminState(false);
              setSession(null);
            }
          }
        } else {
          // User signed out - clear session
          setIsSuperadminState(false);
          setSession(null);
          setIsOffline(false);
        }
      } finally {
        isProcessingAuthState.current = false;
        setIsLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Load staff session hint from localStorage on mount (non-authoritative UI hint only)
  // SECURITY: This is only for UX convenience - it does NOT grant any access
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Check if we have a Firebase user first
        if (firebaseUser) {
          // Firebase Auth already initialized the session
          return;
        }

        // Load UI hint for convenience (e.g., pre-fill restaurant slug)
        const stored = localStorage.getItem(UI_HINT_KEY);
        if (stored) {
          const hint = JSON.parse(stored) as StaffUIHint;
          
          // SECURITY: We do NOT create a session from localStorage
          // The hint is only used for UX convenience (pre-filling forms, etc.)
          // Actual session creation requires server verification via PIN or Firebase Auth
          console.log('UI hint loaded for convenience:', hint.restaurantSlug);
        }
      } catch (error) {
        console.error('Failed to load UI hint:', error);
        localStorage.removeItem(UI_HINT_KEY);
      }
    };

    initializeSession();
  }, [firebaseUser]);

  // Login with restaurant slug + PIN (server-side verification)
  const loginStaff = useCallback(async (restaurantSlug: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Call the server-side API for PIN verification
      // SECURITY: The server verifies the PIN and returns the session
      const response = await fetch('/api/staff/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantSlug: restaurantSlug.toLowerCase(),
          pin,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success && data.session) {
        const newSession: StaffSession = {
          restaurantId: data.session.restaurantId,
          restaurantSlug: data.session.restaurantSlug,
          restaurantName: data.session.restaurantName,
          staffId: data.session.staffId,
          staffName: data.session.staffName,
          role: data.session.role,
        };
        
        setSession(newSession);
        
        // SECURITY: Only store non-authoritative UI hint
        // This does NOT grant access - access is verified server-side
        const uiHint: StaffUIHint = {
          restaurantSlug: data.session.restaurantSlug,
          displayName: data.session.staffName,
          lastUsedAt: Date.now(),
        };
        localStorage.setItem(UI_HINT_KEY, JSON.stringify(uiHint));
        
        return { success: true };
      }
      
      // Handle API error response
      const errorMessage = data.error || 'Invalid restaurant code or PIN';
      return { success: false, error: errorMessage };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please check your connection and try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login superadmin with email/password (Firebase Auth verification)
  const loginSuperadmin = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Import Firebase auth dynamically to avoid SSR issues
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // SECURITY: Check if this is the superadmin
      // Primary: Custom claim 'role: superadmin'
      // Fallback: UID comparison during migration
      const tokenResult = await getIdTokenResult(user);
      const hasSuperadminClaim = isSuperadminFromClaims(tokenResult);
      const isFallbackSuperadmin = user.uid === SUPERADMIN_UID;
      
      if (hasSuperadminClaim || isFallbackSuperadmin) {
        // Session will be created by onAuthStateChanged listener
        return { success: true };
      }
      
      // Not the superadmin - sign out immediately
      await import('firebase/auth').then(({ signOut }) => signOut(auth));
      return { success: false, error: 'Access denied. Superadmin privileges required.' };
    } catch (error: unknown) {
      console.error('Superadmin login error:', error);
      const firebaseError = error as { code?: string };
      if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/wrong-password') {
        return { success: false, error: 'Invalid email or password' };
      }
      if (firebaseError.code === 'auth/user-not-found') {
        return { success: false, error: 'User not found' };
      }
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logoutStaff = useCallback(async () => {
    try {
      // Sign out from Firebase if logged in
      const { auth } = await import('@/lib/firebase');
      const { signOut } = await import('firebase/auth');
      await signOut(auth);
    } catch {
      // Ignore signout errors
    }
    setSession(null);
    // Clear UI hint on logout
    localStorage.removeItem(UI_HINT_KEY);
  }, []);

  const value: StaffSessionContextType = {
    session,
    isLoading,
    isStaffAuthenticated: session !== null,
    // SECURITY: isSuperadmin comes ONLY from Firebase Auth UID verification
    isSuperadmin,
    loginStaff,
    loginSuperadmin,
    logoutStaff,
    currentStaff: session,
    currentRestaurant: session ? {
      id: session.restaurantId,
      slug: session.restaurantSlug,
      name: session.restaurantName,
    } : null,
    isOffline,
  };

  return (
    <StaffSessionContext.Provider value={value}>
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession() {
  const context = useContext(StaffSessionContext);
  if (context === undefined) {
    throw new Error('useStaffSession must be used within a StaffSessionProvider');
  }
  return context;
}

// Hook for protecting staff routes
// SECURITY: All authorization is based on Firebase Auth, NOT localStorage
export function useRequireStaff(allowedRoles?: StaffRole[]) {
  const { session, isLoading, isStaffAuthenticated, isSuperadmin } = useStaffSession();
  
  // SECURITY: Superadmin status comes from Firebase Auth UID verification
  // Superadmin has access to everything (verified server-side)
  const hasRequiredRole = isSuperadmin || !allowedRoles || (session && allowedRoles.includes(session.role));
  
  return {
    session,
    isLoading,
    isStaffAuthenticated,
    hasRequiredRole,
    isAuthorized: isStaffAuthenticated && hasRequiredRole,
    isSuperadmin,
  };
}

export default StaffSessionContext;
