'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  href?: string;
}

const navItems: NavItem[] = [
  { id: 'overview', icon: 'dashboard', label: 'Overview' },
  { id: 'restaurants', icon: 'storefront', label: 'Restaurants' },
  { id: 'owners', icon: 'group', label: 'Owners' },
  { id: 'plans', icon: 'subscriptions', label: 'Plans' },
  { id: 'orders', icon: 'receipt_long', label: 'Orders' },
  { id: 'logs', icon: 'history', label: 'Activity Logs' },
];

const systemNavItems: NavItem[] = [
  { id: 'security', icon: 'shield', label: 'Security' },
  { id: 'health', icon: 'health_and_safety', label: 'System Health' },
  { id: 'support', icon: 'help_outline', label: 'Support' },
  { id: 'settings', icon: 'settings', label: 'Settings' },
];

interface AdminSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminSidebar({ activeTab = 'overview', onTabChange }: AdminSidebarProps) {
  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant flex flex-col py-lg px-md z-50">
      {/* Logo */}
      <div className="mb-3xl px-md">
        <h1 className="font-display text-display-md font-bold text-primary">MenuxPro</h1>
        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest mt-xs">
          SuperAdmin Console
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-xs overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={`w-full px-4 py-2 flex items-center gap-3 transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-primary text-on-primary rounded-full relative before:content-[""] before:absolute before:left-2 before:w-1 before:h-1 before:bg-secondary-fixed before:rounded-full'
                : 'text-on-surface-variant hover:bg-surface-container-high rounded-full'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </button>
        ))}

        {/* System Section */}
        <div className="pt-lg pb-md">
          <p className="font-label-sm text-label-sm text-outline px-4 uppercase tracking-widest">System</p>
        </div>

        {systemNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange?.(item.id)}
            className={`w-full px-4 py-2 flex items-center gap-3 transition-all duration-200 ${
              activeTab === item.id
                ? 'bg-primary text-on-primary rounded-full relative before:content-[""] before:absolute before:left-2 before:w-1 before:h-1 before:bg-secondary-fixed before:rounded-full'
                : 'text-on-surface-variant hover:bg-surface-container-high rounded-full'
            }`}
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            <span className="font-label-md text-label-md">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto px-md pt-lg border-t border-outline-variant/30">
        <button className="w-full bg-primary-container text-on-primary rounded-full py-md font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-all">
          <span className="material-symbols-outlined">lock_open</span>
          Platform Access
        </button>
      </div>
    </aside>
  );
}
