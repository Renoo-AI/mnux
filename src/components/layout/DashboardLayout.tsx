'use client';

import { ReactNode } from 'react';
import { SideNavBar } from './SideNavBar';
import { BottomNavBar } from './BottomNavBar';
import { useStaffSession } from '@/contexts/StaffSessionContext';

interface DashboardLayoutProps {
  children: ReactNode;
  restaurantName?: string;
  userRole?: 'cashier' | 'owner' | 'admin';
}

export function DashboardLayout({ children, restaurantName, userRole: propUserRole }: DashboardLayoutProps) {
  const { session } = useStaffSession();
  
  // Use prop role if provided, otherwise use session role
  const userRole = propUserRole || session?.role;
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <SideNavBar restaurantName={restaurantName} userRole={userRole} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      <BottomNavBar variant="dashboard" />
    </div>
  );
}
