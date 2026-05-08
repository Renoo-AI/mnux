'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Bell, User, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TopAppBarProps {
  title: string;
  subtitle?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  showNotification?: boolean;
  notificationCount?: number;
  user?: {
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  onMenuClick?: () => void;
}

export function TopAppBar({
  title,
  subtitle,
  showSearch = true,
  searchPlaceholder = 'Search...',
  onSearch,
  showNotification = true,
  notificationCount = 0,
  user,
  onMenuClick,
}: TopAppBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };
  
  return (
    <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50 bg-surface shadow-card">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-primary"
          onClick={onMenuClick}
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div>
          <h1 className="font-display text-headline-md font-bold text-primary">{title}</h1>
          {subtitle && (
            <p className="text-on-surface-variant font-label-caps text-label-caps">{subtitle}</p>
          )}
        </div>
      </div>
      
      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        {showSearch && (
          <form onSubmit={handleSearch} className="hidden lg:block relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-2 rounded-full border border-outline-variant bg-surface-container-low w-64 text-body-md focus:border-secondary"
            />
          </form>
        )}
        
        {/* Notifications */}
        {showNotification && (
          <button className="relative p-2 text-primary hover:bg-surface-container-low rounded-full transition-colors">
            <Bell className="w-6 h-6" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
            )}
          </button>
        )}
        
        {/* User */}
        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-outline-variant">
            <div className="text-right hidden sm:block">
              <p className="font-title-sm text-sm leading-none">{user.name}</p>
              {user.role && (
                <p className="font-label-caps text-[10px] text-on-surface-variant uppercase">
                  {user.role}
                </p>
              )}
            </div>
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-secondary-fixed"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center">
                <User className="w-5 h-5 text-on-secondary-container" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
