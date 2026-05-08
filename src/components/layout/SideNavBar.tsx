'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  BookOpen, 
  ClipboardList, 
  Settings,
  HelpCircle,
  LogOut,
  Plus
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/dashboard/orders', label: 'Orders', icon: <ClipboardList className="w-5 h-5" /> },
  { href: '/dashboard/menu', label: 'Menu', icon: <BookOpen className="w-5 h-5" /> },
  { href: '/dashboard/tables', label: 'Tables', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { href: '/dashboard/logs', label: 'Activity', icon: <ClipboardList className="w-5 h-5" /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

interface SideNavBarProps {
  restaurantName?: string;
}

export function SideNavBar({ restaurantName = 'Menux Pro' }: SideNavBarProps) {
  const pathname = usePathname();
  
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen py-6 gap-2 border-r border-outline-variant bg-surface-container-lowest sticky top-0">
      {/* Logo */}
      <div className="px-6 mb-8">
        <h1 className="font-display text-title-sm font-bold text-primary">{restaurantName}</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70">
          Premium Management
        </p>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 mx-4 px-4 py-3 rounded-full transition-all',
                isActive 
                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold' 
                  : 'text-on-surface-variant font-medium hover:bg-surface-container-high'
              )}
            >
              {item.icon}
              <span className="font-title-sm text-label-caps">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* New Table Button */}
      <div className="px-4 mt-auto">
        <Link
          href="/dashboard/tables?action=new"
          className="w-full bg-primary text-on-primary py-3 px-4 rounded-full font-title-sm text-label-caps flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Table
        </Link>
      </div>
      
      {/* Footer Links */}
      <div className="flex flex-col gap-1 border-t border-outline-variant pt-4 mt-4">
        <Link
          href="/help"
          className="flex items-center gap-4 mx-4 px-4 py-3 text-on-surface-variant font-medium hover:bg-surface-container-high transition-all rounded-full"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-title-sm text-label-caps">Support</span>
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-4 mx-4 px-4 py-3 text-error font-medium hover:bg-error-container/20 transition-all rounded-full"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-title-sm text-label-caps">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
