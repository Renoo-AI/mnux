'use client';

import { ReactNode } from 'react';
import { SideNavBar } from './SideNavBar';
import { BottomNavBar } from './BottomNavBar';

interface DashboardLayoutProps {
  children: ReactNode;
  restaurantName?: string;
}

export function DashboardLayout({ children, restaurantName }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <SideNavBar restaurantName={restaurantName} />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
      
      {/* Mobile Bottom Nav */}
      <BottomNavBar variant="dashboard" />
    </div>
  );
}
