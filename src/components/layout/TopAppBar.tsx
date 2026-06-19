'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search, Bell, User, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NotificationCenter, NotificationBell } from '@/components/notification-center';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };
  
  return (
    <>
      <header className="flex justify-between items-center px-6 py-4 w-full sticky top-0 z-50 bg-surface/95 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-primary p-2 hover:bg-surface-container-high rounded-full transition-colors"
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
        <div className="flex items-center gap-3">
          {/* Search */}
          {showSearch && (
            <form onSubmit={handleSearch} className="hidden lg:block relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant w-5 h-5 group-focus-within:text-secondary transition-colors" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-2.5 rounded-full border border-outline-variant bg-surface-container-low w-72 text-body-md focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all"
              />
            </form>
          )}
          
          {/* Notifications */}
          {showNotification && (
            <NotificationBell 
              onClick={() => setShowNotifications(true)}
              unreadCount={notificationCount}
            />
          )}
          
          {/* User */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-outline-variant">
              <div className="text-right hidden sm:block">
                <p className="font-title-sm text-sm leading-none text-primary">{user.name}</p>
                {user.role && (
                  <p className="font-label-caps text-[10px] text-on-surface-variant uppercase mt-0.5">
                    {user.role}
                  </p>
                )}
              </div>
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-secondary-fixed hover:scale-105 transition-transform cursor-pointer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                  <span className="text-on-secondary font-bold text-sm">
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Notification Center Panel */}
      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
}
