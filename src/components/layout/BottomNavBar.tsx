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
  Receipt,
  History,
  ChefHat,
  Star,
  Users,
  Gift,
  Grid3X3,
  Sparkles,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

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
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: <ChefHat className="w-6 h-6" /> },
  { href: '/dashboard/floor-plan', label: 'Floor', icon: <Grid3X3 className="w-6 h-6" /> },
  { href: '/dashboard/promotions', label: 'Promos', icon: <Gift className="w-6 h-6" /> },
];

const moreNavItems: NavItem[] = [
  { href: '/dashboard/history', label: 'History', icon: <History className="w-5 h-5" /> },
  { href: '/dashboard/menu', label: 'Menu', icon: <BookOpen className="w-5 h-5" /> },
  { href: '/dashboard/specials', label: 'Specials', icon: <Sparkles className="w-5 h-5" /> },
  { href: '/dashboard/tables', label: 'Tables', icon: <Utensils className="w-5 h-5" /> },
  { href: '/dashboard/waitlist', label: 'Waitlist', icon: <Clock className="w-5 h-5" /> },
  { href: '/dashboard/staff', label: 'Staff', icon: <Users className="w-5 h-5" /> },
  { href: '/dashboard/feedback', label: 'Reviews', icon: <Star className="w-5 h-5" /> },
  { href: '/dashboard/logs', label: 'Activity', icon: <Receipt className="w-5 h-5" /> },
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
              'flex flex-col items-center justify-center p-2 transition-all whitespace-nowrap',
              isActive 
                ? 'bg-secondary-container text-on-secondary-container rounded-full px-4 py-2' 
                : 'text-on-surface-variant hover:text-primary'
            )}
          >
            {item.icon}
            <span className={cn(
              'font-label-caps text-label-caps mt-1 whitespace-nowrap',
              isActive ? 'text-on-secondary-container' : ''
            )}>
              {item.label}
            </span>
          </Link>
        );
      })}
      
      {variant === 'dashboard' && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center p-2 text-on-surface-variant hover:text-primary transition-all">
              <MoreHorizontal className="w-6 h-6" />
              <span className="font-label-caps text-label-caps mt-1">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href);
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 cursor-pointer',
                      isActive ? 'text-primary' : ''
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  );
}
