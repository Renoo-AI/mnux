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
  Plus,
  History,
  Receipt,
  ChefHat,
  Star,
  Users,
  Gift,
  Grid3X3,
  Sparkles,
  Clock,
  Shield,
  BarChart3,
  Crown,
  CreditCard
} from 'lucide-react';

import type { StaffRole } from '@/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: StaffRole[]; // If not specified, visible to all roles
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/dashboard/owner', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['owner', 'admin'] },
  { href: '/dashboard/kitchen', label: 'Kitchen', icon: <ChefHat className="w-5 h-5" /> },
  { href: '/dashboard/floor-plan', label: 'Floor Plan', icon: <Grid3X3 className="w-5 h-5" /> },
  { href: '/dashboard/history', label: 'History', icon: <History className="w-5 h-5" /> },
  { href: '/dashboard/menu', label: 'Menu', icon: <BookOpen className="w-5 h-5" /> },
  { href: '/dashboard/specials', label: 'Specials', icon: <Sparkles className="w-5 h-5" /> },
  { href: '/dashboard/tables', label: 'Tables', icon: <UtensilsCrossed className="w-5 h-5" /> },
  { href: '/dashboard/waitlist', label: 'Waitlist', icon: <Clock className="w-5 h-5" /> },
  { href: '/dashboard/promotions', label: 'Promotions', icon: <Gift className="w-5 h-5" />, roles: ['owner', 'admin'] },
  { href: '/dashboard/staff', label: 'Staff', icon: <Users className="w-5 h-5" />, roles: ['owner', 'admin'] },
  { href: '/dashboard/feedback', label: 'Feedback', icon: <Star className="w-5 h-5" />, roles: ['owner', 'admin'] },
  { href: '/dashboard/security', label: 'Security', icon: <Shield className="w-5 h-5" />, roles: ['owner', 'admin'] },
  { href: '/dashboard/logs', label: 'Activity', icon: <Receipt className="w-5 h-5" /> },
  { href: '/dashboard/billing', label: 'Billing', icon: <CreditCard className="w-5 h-5" />, roles: ['owner', 'admin'] },
  { href: '/dashboard/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

interface SideNavBarProps {
  restaurantName?: string;
  userRole?: StaffRole;
}

export function SideNavBar({ restaurantName = 'Menux Pro', userRole }: SideNavBarProps) {
  const pathname = usePathname();
  
  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true; // Visible to all if no roles specified
    return item.roles.includes(userRole || 'cashier');
  });
  
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen py-6 gap-2 border-r border-outline-variant bg-surface-container-lowest sticky top-0">
      {/* Logo */}
      <div className="px-6 mb-8">
        <h1 className="font-display text-title-sm font-bold text-primary">{restaurantName}</h1>
        <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70">
          Premium Management
        </p>
      </div>
      
      {/* Role Badge */}
      {userRole === 'owner' && (
        <div className="mx-6 mb-4 px-3 py-2 bg-gradient-to-r from-[#C9A07E]/20 to-[#3A322D]/10 rounded-full flex items-center gap-2">
          <Crown className="w-4 h-4 text-[#C9A07E]" />
          <span className="text-xs font-medium text-[#3A322D]">Owner Access</span>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-4 mx-4 px-4 py-3 rounded-full transition-all whitespace-nowrap',
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
          className="flex items-center gap-4 mx-4 px-4 py-3 text-on-surface-variant font-medium hover:bg-surface-container-high transition-all rounded-full whitespace-nowrap"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-title-sm text-label-caps">Support</span>
        </Link>
        <Link
          href="/login"
          className="flex items-center gap-4 mx-4 px-4 py-3 text-error font-medium hover:bg-error-container/20 transition-all rounded-full whitespace-nowrap"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-title-sm text-label-caps">Logout</span>
        </Link>
      </div>
    </aside>
  );
}
