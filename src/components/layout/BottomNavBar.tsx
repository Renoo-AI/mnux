'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Home, 
  ShoppingBag, 
  BarChart3, 
  User,
  Utensils,
  BookOpen,
  Receipt
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const publicNavItems: NavItem[] = [
  { href: '/', label: 'Home', icon: <Home className="w-6 h-6" /> },
  { href: '/cart', label: 'Cart', icon: <ShoppingBag className="w-6 h-6" /> },
  { href: '/orders', label: 'Status', icon: <BarChart3 className="w-6 h-6" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

const dashboardNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: <Home className="w-6 h-6" /> },
  { href: '/dashboard/orders', label: 'Orders', icon: <Receipt className="w-6 h-6" /> },
  { href: '/dashboard/menu', label: 'Menu', icon: <BookOpen className="w-6 h-6" /> },
  { href: '/dashboard/settings', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

interface BottomNavBarProps {
  variant?: 'public' | 'dashboard';
}

export function BottomNavBar({ variant = 'public' }: BottomNavBarProps) {
  const pathname = usePathname();
  const navItems = variant === 'dashboard' ? dashboardNavItems : publicNavItems;
  
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-5 py-2 md:hidden bg-surface shadow-[0px_-4px_20px_rgba(58,50,45,0.03)] rounded-t-xl">
      {navItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href !== '/' && item.href !== '/dashboard' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center p-2 transition-all',
              isActive 
                ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-2' 
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            {item.icon}
            <span className={cn(
              'font-label-caps text-label-caps mt-1',
              isActive ? 'text-on-secondary-container' : ''
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
