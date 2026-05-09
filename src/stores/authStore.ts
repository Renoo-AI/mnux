import { create } from 'zustand';
import type { Staff, UserRole } from '@/types';
import { SUPERADMIN_UID } from '@/lib/firebase';

export interface AuthUser {
  uid: string;
  email: string | null;
  staffProfile: Staff | null;
  role: UserRole | null;
  isSuperadmin: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user) => {
    set({ 
      user, 
      isAuthenticated: !!user, 
      isLoading: false 
    });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  
  clearUser: () => {
    set({ 
      user: null, 
      isAuthenticated: false, 
      isLoading: false 
    });
  },
}));

// Helper hook to check superadmin status
export const useIsSuperadmin = (): boolean => {
  const user = useAuthStore((state) => state.user);
  return user?.isSuperadmin ?? false;
};

// Helper hook to check if user can access owner-level features
export const useCanAccessOwnerFeatures = (): boolean => {
  const user = useAuthStore((state) => state.user);
  if (!user) return false;
  return user.isSuperadmin || user.role === 'owner' || user.role === 'admin';
};

// Check if UID is superadmin
export const checkIsSuperadmin = (uid: string | undefined | null): boolean => {
  return uid === SUPERADMIN_UID;
};
