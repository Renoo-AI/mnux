'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StaffSession, StaffRole } from '@/types';
import { SUPERADMIN_UID } from '@/lib/firebase';

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
}

const StaffSessionContext = createContext<StaffSessionContextType | undefined>(undefined);

const STORAGE_KEY = 'menux_staff_session';

// Demo staff data for testing without Firebase
const DEMO_STAFF: Record<string, { restaurantId: string; restaurantSlug: string; restaurantName: string; staffId: string; staffName: string; role: StaffRole; pin: string }> = {
  'zcoffee-1234': {
    restaurantId: 'demo-restaurant-zcoffee',
    restaurantSlug: 'zcoffee',
    restaurantName: 'Z Coffee',
    staffId: 'demo-staff-001',
    staffName: 'Cashier Demo',
    role: 'cashier',
    pin: '1234',
  },
  'zcoffee-5678': {
    restaurantId: 'demo-restaurant-zcoffee',
    restaurantSlug: 'zcoffee',
    restaurantName: 'Z Coffee',
    staffId: 'demo-staff-002',
    staffName: 'Owner Demo',
    role: 'owner',
    pin: '5678',
  },
  'superadmin-9999': {
    restaurantId: 'all',
    restaurantSlug: 'admin',
    restaurantName: 'MenuxPro Admin',
    staffId: SUPERADMIN_UID,
    staffName: 'Super Admin',
    role: 'admin',
    pin: '9999',
  },
};

export function StaffSessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StaffSession & { isSuperadmin?: boolean };
        setSession(parsed);
        setIsSuperadmin(parsed.isSuperadmin ?? parsed.staffId === SUPERADMIN_UID);
      }
    } catch (error) {
      console.error('Failed to load staff session:', error);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login with restaurant slug + PIN
  const loginStaff = useCallback(async (restaurantSlug: string, pin: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // For MVP, use demo authentication
      // In production, this would call a Firebase Cloud Function
      const key = `${restaurantSlug.toLowerCase()}-${pin}`;
      const demoStaff = DEMO_STAFF[key];
      
      if (demoStaff) {
        const isSuper = demoStaff.staffId === SUPERADMIN_UID;
        const newSession: StaffSession & { isSuperadmin?: boolean } = {
          restaurantId: demoStaff.restaurantId,
          restaurantSlug: demoStaff.restaurantSlug,
          restaurantName: demoStaff.restaurantName,
          staffId: demoStaff.staffId,
          staffName: demoStaff.staffName,
          role: demoStaff.role,
          isSuperadmin: isSuper,
        };
        
        setSession(newSession);
        setIsSuperadmin(isSuper);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        
        return { success: true };
      }
      
      // Invalid credentials
      return { success: false, error: 'Invalid restaurant code or PIN' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login superadmin with email/password
  const loginSuperadmin = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    try {
      // Import Firebase auth dynamically to avoid SSR issues
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if this is the superadmin
      if (user.uid === SUPERADMIN_UID) {
        const newSession: StaffSession & { isSuperadmin?: boolean } = {
          restaurantId: 'all',
          restaurantSlug: 'admin',
          restaurantName: 'MenuxPro Admin',
          staffId: user.uid,
          staffName: 'Super Admin',
          role: 'admin',
          isSuperadmin: true,
        };
        
        setSession(newSession);
        setIsSuperadmin(true);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
        
        return { success: true };
      }
      
      // Not the superadmin
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
    setIsSuperadmin(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: StaffSessionContextType = {
    session,
    isLoading,
    isStaffAuthenticated: session !== null,
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
export function useRequireStaff(allowedRoles?: StaffRole[]) {
  const { session, isLoading, isStaffAuthenticated, isSuperadmin } = useStaffSession();
  
  // Superadmin has access to everything
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
