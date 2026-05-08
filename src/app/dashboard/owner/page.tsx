'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffSession } from '@/contexts/StaffSessionContext';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Coffee,
  ShoppingBag,
  Clock,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
  UserPlus,
  Building2,
} from 'lucide-react';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { session, isStaffAuthenticated, isLoading: sessionLoading } = useStaffSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!sessionLoading && !isStaffAuthenticated) {
      router.push('/staff/login');
      return;
    }
    
    // Check if user has owner role
    if (session && session.role !== 'owner' && session.role !== 'admin') {
      router.push('/staff/dashboard');
      return;
    }
    
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [sessionLoading, isStaffAuthenticated, session, router]);

  if (sessionLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF9]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3A322D]" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <TopAppBar
        title="Owner Dashboard"
        subtitle={`${session?.restaurantName || 'Restaurant'}`}
        showSearch={false}
        user={{
          name: session?.staffName || 'Owner',
          role: session?.role || 'owner',
        }}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#3A322D]">Analytics Overview</h1>
            <p className="text-[#5A4A3D] mt-1">Real-time insights for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-4 py-2 text-sm bg-[#C9A07E]/10 border-[#C9A07E]/30 text-[#3A322D]">
              <Activity className="w-4 h-4 mr-2" />
              Live
            </Badge>
            <Button variant="outline" className="rounded-full" onClick={() => router.push('/dashboard/settings')}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-[#3A322D] to-[#5A4A3D] text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm font-medium uppercase tracking-wider">Today&apos;s Revenue</p>
                  <p className="text-3xl font-bold mt-2">$0.00</p>
                  <div className="flex items-center mt-2 text-sm text-white/50">
                    No data yet
                  </div>
                </div>
                <DollarSign className="w-10 h-10 text-white/30" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#EFE4D8] shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#5A4A3D] text-sm font-medium uppercase tracking-wider">Orders Today</p>
                  <p className="text-3xl font-bold text-[#3A322D] mt-2">0</p>
                  <p className="text-sm text-[#5A4A3D] mt-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    No orders yet
                  </p>
                </div>
                <ShoppingBag className="w-10 h-10 text-[#C9A07E]/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#EFE4D8] shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#5A4A3D] text-sm font-medium uppercase tracking-wider">Avg Order Value</p>
                  <p className="text-3xl font-bold text-[#3A322D] mt-2">$0.00</p>
                  <p className="text-sm text-[#5A4A3D] mt-2 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    No data
                  </p>
                </div>
                <BarChart3 className="w-10 h-10 text-[#C9A07E]/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#EFE4D8] shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#5A4A3D] text-sm font-medium uppercase tracking-wider">Completion Rate</p>
                  <p className="text-3xl font-bold text-[#3A322D] mt-2">-</p>
                  <p className="text-sm text-[#5A4A3D] mt-2 flex items-center">
                    <Activity className="w-4 h-4 mr-1" />
                    No data
                  </p>
                </div>
                <Activity className="w-10 h-10 text-[#C9A07E]/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-[#EFE4D8] p-1 rounded-full">
            <TabsTrigger value="overview" className="rounded-full px-6">Overview</TabsTrigger>
            <TabsTrigger value="revenue" className="rounded-full px-6">Revenue</TabsTrigger>
            <TabsTrigger value="staff" className="rounded-full px-6">Staff</TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-full px-6">Alerts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Revenue Chart */}
              <Card className="lg:col-span-2 bg-white border border-[#EFE4D8]">
                <CardHeader>
                  <CardTitle className="text-[#3A322D] font-serif">Hourly Revenue</CardTitle>
                  <CardDescription>Today&apos;s revenue distribution by hour</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-[#C9A07E]/50 mx-auto mb-4" />
                      <p className="text-[#5A4A3D]">Revenue data will appear here as orders come in</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Selling Items */}
              <Card className="bg-white border border-[#EFE4D8]">
                <CardHeader>
                  <CardTitle className="text-[#3A322D] font-serif">Top Sellers</CardTitle>
                  <CardDescription>Best performing items today</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <ShoppingBag className="w-10 h-10 text-[#C9A07E]/50 mx-auto mb-3" />
                    <p className="text-[#5A4A3D]">No sales data yet</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Comparison */}
            <Card className="bg-white border border-[#EFE4D8]">
              <CardHeader>
                <CardTitle className="text-[#3A322D] font-serif">Weekly Comparison</CardTitle>
                <CardDescription>This week vs last week revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-[#C9A07E]/50 mx-auto mb-4" />
                    <p className="text-[#5A4A3D]">Weekly comparison will appear after collecting data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-white border border-[#EFE4D8]">
                <CardHeader>
                  <CardTitle className="text-[#3A322D] font-serif">Revenue Breakdown</CardTitle>
                  <CardDescription>Sales by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <PieChart className="w-12 h-12 text-[#C9A07E]/50 mx-auto mb-4" />
                    <p className="text-[#5A4A3D]">Revenue breakdown will appear here</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-[#EFE4D8]">
                <CardHeader>
                  <CardTitle className="text-[#3A322D] font-serif">Payment Methods</CardTitle>
                  <CardDescription>Transaction breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <DollarSign className="w-12 h-12 text-[#C9A07E]/50 mx-auto mb-4" />
                    <p className="text-[#5A4A3D]">Payment data will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#3A322D]">Staff Performance</h2>
                <p className="text-[#5A4A3D]">Today&apos;s team metrics</p>
              </div>
              <Button className="bg-[#3A322D] hover:bg-[#5A4A3D] text-white rounded-full" onClick={() => router.push('/dashboard/staff')}>
                <UserPlus className="w-4 h-4 mr-2" />
                Manage Staff
              </Button>
            </div>
            
            <Card className="bg-white border border-[#EFE4D8]">
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-[#C9A07E]/50 mx-auto mb-4" />
                <p className="text-[#5A4A3D]">Staff performance data will appear here</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="bg-white border border-[#EFE4D8]">
              <CardHeader>
                <CardTitle className="text-[#3A322D] font-serif">Recent Alerts</CardTitle>
                <CardDescription>System notifications and important updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-[#C9A07E]/50 mx-auto mb-4" />
                  <p className="text-[#5A4A3D]">No alerts at this time</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
