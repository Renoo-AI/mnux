'use client';

import React from 'react';

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  searchPlaceholder?: string;
}

export function AdminHeader({ 
  title = 'SuperAdmin', 
  subtitle = 'Production',
  searchPlaceholder = 'Search resources...'
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 w-full z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center h-20 px-xl ml-[280px] w-[calc(100%-280px)]">
      {/* Search */}
      <div className="flex items-center gap-lg flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="w-full bg-surface-container-low border-none rounded-full pl-xl py-sm font-body-sm text-body-sm focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-lg">
        {/* Notifications */}
        <button className="relative p-sm rounded-full hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
        </button>

        <div className="h-8 w-px bg-outline-variant" />

        {/* User Info */}
        <div className="flex items-center gap-md">
          <div className="text-right">
            <p className="font-label-md text-label-md text-primary">{title}</p>
            <p className="font-label-sm text-label-sm text-on-surface-variant">{subtitle}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center border border-outline-variant overflow-hidden">
            <span className="material-symbols-outlined text-primary">account_circle</span>
          </div>
        </div>
      </div>
    </header>
  );
}
