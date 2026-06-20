'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/browser';
import type { User } from '@supabase/supabase-js';

interface StaffProfile {
  id: string;
  userId: string;
  restaurantId: string;
  restaurantName: string;
  displayName: string;
  role: 'owner' | 'manager' | 'cashier' | 'super_admin' | 'admin';
  isActive: boolean;
}

export function useAuth(requiredRole?: string) {
  const [user, setUser] = useState<User | null>(null);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setUser(null);
      setStaff(null);
      setLoading(false);
      return;
    }

    setUser(session.user);

    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('*, restaurants!inner(name)')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (staffError || !staffData) {
      setStaff(null);
      if (requiredRole) setError('No staff profile found');
      setLoading(false);
      return;
    }

    const profile: StaffProfile = {
      id: staffData.id,
      userId: staffData.user_id,
      restaurantId: staffData.restaurant_id,
      restaurantName: (staffData.restaurants as Record<string, string>)?.name || '',
      displayName: staffData.display_name || '',
      role: staffData.role,
      isActive: staffData.is_active,
    };

    if (requiredRole && profile.role !== requiredRole) {
      setStaff(null);
      setError(`Role ${requiredRole} required, found ${profile.role}`);
      setLoading(false);
      return;
    }

    setStaff(profile);
    setLoading(false);
  }, [requiredRole]);

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    return () => subscription.unsubscribe();
  }, [refresh]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStaff(null);
  };

  return { user, staff, loading, error, signOut, refresh };
}
