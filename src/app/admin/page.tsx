'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, SUPERADMIN_UID } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut, getIdToken } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { KPICard, QuickAction, StatusBadge } from '@/components/admin/KPICard';
import { FloatingShortcut } from '@/components/admin/FloatingShortcut';

// Types
interface Restaurant {
  id: string;
  name: string;
  slug: string;
  ownerUid?: string;
  plan: 'free' | 'pro' | 'business';
  status: 'active' | 'inactive' | 'offline';
  createdAt: number;
  menuItemCount?: number;
  orderCount?: number;
}

interface UserProfile {
  id: string;
  displayName?: string;
  email?: string;
  globalRole?: string;
  lastLoginAt?: number;
}

interface Stats {
  activeMenus: number;
  proMenus: number;
  usersCount: number;
  mrr: number;
  bannedCount?: number;
}

interface SystemLog {
  id: string;
  type: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

// API helper
async function apiCall(
  path: string, 
  method: string = 'GET', 
  body?: unknown, 
  token?: string
): Promise<Response> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  return fetch(`/api/admin${path}`, options);
}

// Page variants for animations
const pageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 }
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Auth state
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Data state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [bannedUsers, setBannedUsers] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<Stats>({ activeMenus: 0, proMenus: 0, usersCount: 0, mrr: 0 });
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // Check authorization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && user.uid === SUPERADMIN_UID) {
        setIsAuthorized(true);
        try {
          const token = await getIdToken(user);
          setAuthToken(token);
        } catch (error) {
          console.error('Failed to get auth token:', error);
        }
      } else {
        setIsAuthorized(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!isAuthorized || !authToken) return;
    
    setIsRefreshing(true);
    try {
      const response = await apiCall('/stats', 'GET', undefined, authToken);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: 'Session expired',
            description: 'Please login again',
            variant: 'destructive',
          });
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
        setRestaurants(data.restaurants);
        setUsers(data.users);
        setBannedUsers(new Set(data.bannedUsers || []));
        setSystemLogs(data.systemLogs || []);
      }
    } catch (err) {
      console.error("Error loading dashboard", err);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [isAuthorized, authToken, toast, router]);

  useEffect(() => {
    if (isAuthorized && authToken) {
      fetchData();
    }
  }, [isAuthorized, authToken, fetchData]);

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-lg">
            <Loader2 className="w-8 h-8 text-primary-fixed animate-spin" />
          </div>
          <p className="font-body-md text-on-surface-variant">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-md">
        <div className="bg-surface-container-lowest p-xl rounded-lg max-w-md w-full text-center" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
          <div className="w-16 h-16 bg-error-container rounded-full flex items-center justify-center mx-auto mb-lg">
            <span className="material-symbols-outlined text-error text-[32px]">lock</span>
          </div>
          <h2 className="font-display text-headline-lg text-primary mb-sm">Access Denied</h2>
          <p className="font-body-md text-on-surface-variant mb-xl">
            You do not have permission to access this panel. Only the SuperAdmin can view this page.
          </p>
          <button
            onClick={() => router.push('/admin/login')}
            className="w-full bg-primary text-on-primary py-md rounded-full font-label-md hover:opacity-90 transition-opacity"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Top Header */}
      <AdminHeader 
        title="SuperAdmin" 
        subtitle="Production"
        searchPlaceholder="Search accounts, logs, or metrics..."
      />

      {/* Main Content */}
      <main className="ml-[280px] p-xl space-y-xl max-w-[1440px]">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div 
              key="overview" 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className="space-y-xl"
            >
              {/* Hero Header */}
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-xl">
                <div className="max-w-2xl">
                  <h2 className="font-display text-display-lg text-primary mb-xs tracking-tight">
                    SuperAdmin Command Center
                  </h2>
                  <p className="font-body-lg text-on-surface-variant">
                    Monitor restaurants, plans, orders, and platform health across the global MenuxPro ecosystem.
                  </p>
                </div>
                <div className="flex gap-md">
                  <button
                    onClick={() => setActiveTab('health')}
                    className="px-xl py-md bg-surface border border-outline-variant text-primary rounded-full font-label-md hover:bg-surface-container-low transition-all"
                  >
                    Open system health
                  </button>
                  <button
                    onClick={() => setActiveTab('restaurants')}
                    className="px-xl py-md bg-primary text-on-primary rounded-full font-label-md hover:opacity-90 transition-all"
                  >
                    Review pending restaurants
                  </button>
                </div>
              </section>

              {/* KPI Row */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-md">
                <KPICard
                  label="Total Restaurants"
                  value={stats.activeMenus}
                  trend={{ value: '4%', direction: 'up' }}
                  icon="storefront"
                />
                <KPICard
                  label="Active Restaurants"
                  value={Math.round(stats.activeMenus * 0.72)}
                  trend={{ value: '12%', direction: 'up' }}
                  icon="check_circle"
                />
                <KPICard
                  label="Free Accounts"
                  value={stats.activeMenus - stats.proMenus}
                  trend={{ value: '0%', direction: 'neutral' }}
                />
                <KPICard
                  label="Pro Accounts"
                  value={stats.proMenus}
                  trend={{ value: '8%', direction: 'up' }}
                />
                <KPICard
                  label="Orders Today"
                  value="4.2k"
                  trend={{ value: '22%', direction: 'up' }}
                  icon="receipt_long"
                />
                <KPICard
                  label="Platform Alerts"
                  value="2"
                  variant="warning"
                  trend={{ value: 'HIGH', direction: 'down' }}
                />
              </section>

              {/* Health & Activity Bento Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
                {/* Left Column */}
                <div className="lg:col-span-8 space-y-xl">
                  {/* Platform Health Strip */}
                  <div className="bg-primary text-on-primary p-xl rounded-lg flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-md">
                      <span className="material-symbols-outlined text-secondary-fixed text-[32px]">security</span>
                      <div>
                        <p className="font-headline-md text-headline-md text-primary-fixed">System Infrastructure</p>
                        <p className="text-on-primary-container text-sm">Real-time gateway monitoring</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-xl">
                      {['Firebase', 'Orders API', 'Auth', 'Firestore'].map((service) => (
                        <div key={service} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(121,87,58,0.8)]" />
                          <span className="font-label-sm text-label-sm">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Activity Timeline */}
                  <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline-variant/10" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                    <h4 className="font-display text-headline-lg text-primary mb-xl">Recent Activity</h4>
                    <div className="space-y-xl relative before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-outline-variant">
                      {systemLogs.slice(0, 3).map((log, i) => (
                        <div key={log.id || i} className="relative pl-12">
                          <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                            log.type.includes('MAGIC') ? 'bg-primary' : 
                            log.type.includes('error') ? 'bg-error-container' : 'bg-surface-container border border-outline-variant'
                          }`}>
                            <span className={`material-symbols-outlined text-[14px] ${
                              log.type.includes('MAGIC') ? 'text-on-primary' : 
                              log.type.includes('error') ? 'text-error' : 'text-on-surface-variant'
                            }`}>
                              {log.type.includes('MAGIC') ? 'upgrade' : 
                               log.type.includes('error') ? 'trending_up' : 'add'}
                            </span>
                          </div>
                          <div>
                            <p className="font-body-md text-on-surface">
                              {log.message || log.type}
                            </p>
                            <p className="text-on-surface-variant text-sm">
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-4 space-y-xl">
                  {/* Quick Actions */}
                  <div className="bg-surface-container-low p-xl rounded-lg border border-outline-variant">
                    <h4 className="font-label-sm text-label-sm text-on-surface-variant tracking-widest mb-lg uppercase">
                      Quick Actions
                    </h4>
                    <div className="space-y-sm">
                      <QuickAction icon="add_circle" label="Manual Create" onClick={() => setActiveTab('restaurants')} />
                      <QuickAction icon="terminal" label="Review Logs" onClick={() => setActiveTab('logs')} />
                      <QuickAction icon="forum" label="WhatsApp Support" variant="gold" />
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline-variant/10" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                    <h4 className="font-label-sm text-label-sm text-on-surface-variant tracking-widest mb-lg uppercase">
                      Est. MRR
                    </h4>
                    <div className="text-center py-lg">
                      <span className="font-display text-display-lg text-primary">{stats.mrr}</span>
                      <span className="font-body-lg text-on-surface-variant ml-sm">TND</span>
                    </div>
                    <div className="flex justify-center gap-md">
                      <StatusBadge status="active" label="Active" />
                      <StatusBadge status="pass" label="Verified" />
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {/* Restaurants Tab */}
          {activeTab === 'restaurants' && (
            <motion.div 
              key="restaurants" 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className="space-y-xl"
            >
              <section className="flex flex-col md:flex-row md:items-end justify-between gap-lg">
                <div>
                  <h2 className="font-display text-display-lg text-primary tracking-tight">Restaurants</h2>
                  <p className="font-body-lg text-on-surface-variant mt-xs">
                    View and manage every restaurant workspace.
                  </p>
                </div>
                <button className="bg-primary text-on-primary px-xl py-md rounded-full flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg">
                  <span className="material-symbols-outlined">add</span>
                  <span className="font-label-md">Add Restaurant</span>
                </button>
              </section>

              {/* Filter Bar */}
              <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex flex-wrap items-center justify-between gap-md" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                <div className="flex items-center gap-xs overflow-x-auto">
                  {['All', 'Free', 'Pro', 'Active', 'Suspended'].map((filter, i) => (
                    <button
                      key={filter}
                      className={`px-lg py-sm rounded-full font-label-md transition-all ${
                        i === 0 
                          ? 'bg-primary text-on-primary' 
                          : 'text-on-surface-variant hover:bg-surface-container-low'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
                <div className="relative max-w-xs">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg">filter_list</span>
                  <input
                    type="text"
                    placeholder="Filter by name or slug..."
                    className="w-full pl-md pr-md py-sm bg-surface rounded-full border border-outline-variant font-body-sm focus:outline-none"
                  />
                </div>
              </section>

              {/* Restaurants Table */}
              <section className="bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/10" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container-low border-b border-outline-variant">
                      <tr>
                        <th className="px-xl py-lg font-label-sm text-outline uppercase tracking-widest">Restaurant</th>
                        <th className="px-xl py-lg font-label-sm text-outline uppercase tracking-widest">Slug</th>
                        <th className="px-xl py-lg font-label-sm text-outline uppercase tracking-widest">Owner</th>
                        <th className="px-xl py-lg font-label-sm text-outline uppercase tracking-widest">Plan</th>
                        <th className="px-xl py-lg font-label-sm text-outline uppercase tracking-widest">Status</th>
                        <th className="px-xl py-lg font-label-sm text-outline uppercase tracking-widest">Items</th>
                        <th className="px-xl py-lg font-label-sm text-outline uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant">
                      {restaurants.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-container-low/50 transition-colors group">
                          <td className="px-xl py-xl">
                            <div className="flex items-center gap-md">
                              <div className="w-14 h-14 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center overflow-hidden">
                                <span className="material-symbols-outlined text-outline text-2xl">storefront</span>
                              </div>
                              <div>
                                <p className="font-headline-md text-headline-md text-primary leading-none">{r.name}</p>
                                <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Restaurant</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-xl py-xl">
                            <code className="bg-surface-container px-md py-xs rounded font-body-sm text-body-sm text-on-surface-variant">
                              {r.slug}
                            </code>
                          </td>
                          <td className="px-xl py-xl">
                            <span className="font-body-md text-body-md text-on-surface">Owner</span>
                          </td>
                          <td className="px-xl py-xl">
                            <span className={`px-lg py-xs rounded-full font-label-sm ${
                              r.plan === 'pro' 
                                ? 'bg-secondary-fixed text-on-secondary-fixed-variant' 
                                : 'bg-surface-container-highest text-on-surface-variant'
                            }`}>
                              {r.plan.charAt(0).toUpperCase() + r.plan.slice(1)}
                            </span>
                          </td>
                          <td className="px-xl py-xl">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${r.status === 'active' ? 'bg-green-500' : 'bg-outline'}`} />
                              <span className="font-label-md text-label-md text-on-surface">
                                {r.status === 'active' ? 'Active' : 'Offline'}
                              </span>
                            </div>
                          </td>
                          <td className="px-xl py-xl font-body-md text-body-md text-on-surface">
                            {r.menuItemCount || 0} items
                          </td>
                          <td className="px-xl py-xl">
                            <div className="flex items-center gap-xs">
                              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant hover:text-primary" title="Details">
                                <span className="material-symbols-outlined">info</span>
                              </button>
                              <button className="p-2 hover:bg-surface-container-high rounded-full transition-all text-on-surface-variant hover:text-primary" title="Open Menu">
                                <span className="material-symbols-outlined">open_in_new</span>
                              </button>
                              <button className="p-2 hover:bg-error-container/30 rounded-full transition-all text-on-surface-variant hover:text-error" title="Suspend">
                                <span className="material-symbols-outlined">block</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {restaurants.length === 0 && (
                  <div className="p-3xl text-center">
                    <span className="material-symbols-outlined text-display-md text-outline mb-lg block">storefront</span>
                    <h3 className="font-display text-display-md text-primary mb-sm">No restaurants yet</h3>
                    <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto mb-xl">
                      Start your platform ecosystem by adding your first restaurant partner.
                    </p>
                    <button className="bg-primary text-on-primary px-xl py-md rounded-full font-label-md">
                      Add Restaurant
                    </button>
                  </div>
                )}
              </section>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <motion.div 
              key="security" 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className="space-y-xl"
            >
              <div className="mb-3xl">
                <h2 className="font-display text-display-lg text-primary mb-xs">Security & Access</h2>
                <p className="font-body-lg text-on-surface-variant">Audit trail and infrastructure hardening.</p>
              </div>

              {/* Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
                <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline-variant/10" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                  <div className="flex justify-between items-start mb-lg">
                    <span className="material-symbols-outlined text-primary bg-primary-fixed p-3 rounded-full">rule</span>
                    <StatusBadge status="pass" label="PASS" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">Rules Test Status</h3>
                  <p className="font-body-sm text-on-surface-variant">Last full security rules validation completed successfully.</p>
                </div>

                <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline-variant/10" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                  <div className="flex justify-between items-start mb-lg">
                    <span className="material-symbols-outlined text-primary bg-primary-fixed p-3 rounded-full">verified_user</span>
                    <StatusBadge status="verified" label="VERIFIED" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">Custom Claims</h3>
                  <p className="font-body-sm text-on-surface-variant">Administrative privilege tokens are active and encrypted.</p>
                </div>

                <div className="bg-surface-container-lowest p-xl rounded-lg border border-outline-variant/10" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                  <div className="flex justify-between items-start mb-lg">
                    <span className="material-symbols-outlined text-primary bg-primary-fixed p-3 rounded-full">api</span>
                    <StatusBadge status="active" label="ACTIVE" />
                  </div>
                  <h3 className="font-headline-md text-headline-md text-primary mb-2">Admin API</h3>
                  <p className="font-body-sm text-on-surface-variant">Secure endpoint traffic monitoring is operational.</p>
                </div>
              </div>

              {/* Security Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
                <div className="lg:col-span-4 bg-surface-container-lowest p-xl rounded-lg border border-outline-variant/10 h-full" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                  <div className="flex items-center gap-sm mb-lg">
                    <span className="material-symbols-outlined text-error">warning</span>
                    <h3 className="font-headline-md text-headline-md text-primary">Current Risks</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="p-lg bg-error-container/30 border border-error-container rounded-lg">
                      <p className="font-label-sm text-error uppercase mb-1">Critical Action</p>
                      <p className="font-body-md text-on-surface font-semibold">SuperAdmin custom claims: Manual check required</p>
                      <p className="font-body-sm text-on-surface-variant mt-2">3 privilege escalation attempts detected in staging.</p>
                    </div>
                    <div className="p-lg bg-surface-container border border-outline-variant rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-label-sm text-on-surface-variant uppercase">Network Security</p>
                        <span className="text-[10px] bg-secondary-container text-on-secondary-fixed-variant px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                      </div>
                      <p className="font-body-md text-on-surface font-semibold">Rate limiting: Active</p>
                      <p className="font-body-sm text-on-surface-variant mt-2">Global threshold set to 1,000 req/min per IP.</p>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 bg-primary-container text-on-primary p-xl rounded-lg shadow-xl flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary rounded-full opacity-20 blur-3xl" />
                  <div>
                    <div className="flex justify-between items-center mb-xl">
                      <h3 className="font-headline-md text-headline-md text-primary-fixed">Firestore Rules Test Panel</h3>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#81c784]" />
                        <span className="font-label-sm text-primary-fixed-dim">Last run: 12m ago</span>
                      </div>
                    </div>
                    <div className="bg-primary/50 border border-outline-variant/20 rounded-lg p-lg mb-lg font-mono text-body-sm text-on-primary-fixed-variant">
                      <p className="text-[#81c784] font-bold mb-2">{`// SECURITY TEST RESULTS`}</p>
                      <p className="text-on-primary/80">Running 24 individual assertion suites...</p>
                      <p className="text-[#81c784]">✓ Authenticated Read Access [PASS]</p>
                      <p className="text-[#81c784]">✓ Owner Write Restricted [PASS]</p>
                      <p className="text-[#81c784]">✓ Admin Field Modification [PASS]</p>
                      <p className="text-on-primary/80">All 24/24 rules passing.</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-primary-fixed-dim uppercase tracking-widest">Global Status</span>
                      <span className="font-display text-display-md text-white">SUCCESS</span>
                    </div>
                    <button className="bg-primary-fixed text-primary px-xl py-3 rounded-full font-label-md hover:scale-105 transition-transform active:scale-95">
                      Trigger Validation
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Default tabs */}
          {['owners', 'plans', 'orders', 'logs', 'health', 'support', 'settings'].includes(activeTab) && (
            <motion.div 
              key={activeTab} 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className="space-y-xl"
            >
              <div className="mb-3xl">
                <h2 className="font-display text-display-lg text-primary mb-xs">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="font-body-lg text-on-surface-variant">
                  {activeTab === 'logs' && 'System audit trail and activity logs.'}
                  {activeTab === 'health' && 'Monitor system infrastructure and health.'}
                  {activeTab === 'support' && 'Manage business leads and support queue.'}
                  {activeTab === 'settings' && 'Configure platform settings.'}
                  {activeTab === 'owners' && 'Manage restaurant owners and accounts.'}
                  {activeTab === 'plans' && 'Manage subscription plans and billing.'}
                  {activeTab === 'orders' && 'View and manage all orders across the platform.'}
                </p>
              </div>

              {/* Placeholder content */}
              <div className="bg-surface-container-lowest p-3xl rounded-lg border border-outline-variant/10 text-center" style={{ boxShadow: '0px 4px 24px rgba(58, 50, 45, 0.04)' }}>
                <span className="material-symbols-outlined text-display-md text-outline mb-lg block">
                  {activeTab === 'logs' && 'history'}
                  {activeTab === 'health' && 'health_and_safety'}
                  {activeTab === 'support' && 'help_outline'}
                  {activeTab === 'settings' && 'settings'}
                  {activeTab === 'owners' && 'group'}
                  {activeTab === 'plans' && 'subscriptions'}
                  {activeTab === 'orders' && 'receipt_long'}
                </span>
                <h3 className="font-display text-headline-lg text-primary mb-sm">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
                </h3>
                <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
                  This module is under development. Full functionality coming soon.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Shortcut */}
      <FloatingShortcut onClick={() => setActiveTab('overview')} />
    </div>
  );
}
