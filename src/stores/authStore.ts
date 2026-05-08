import { create } from 'zustand';
import type { Staff, UserRole } from '@/types';

export interface AuthUser {
  uid: string;
  email: string | null;
  staffProfile: Staff | null;
  role: UserRole | null;
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
