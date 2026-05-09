'use client';

import { SecurityDashboard } from '@/components/security/security-dashboard';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useStaffSession } from '@/contexts/StaffSessionContext';

export default function SecurityPage() {
  const { user } = useAuthStore();
  const { session } = useStaffSession();

  return (
    <DashboardLayout>
      <TopAppBar
        title="Security Center"
        subtitle="Monitor threats and protect your restaurant"
        showSearch={false}
        user={{
          name: user?.staffProfile?.name || session?.staffName || 'User',
          role: user?.role || session?.role || 'cashier',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-primary">
              <Shield className="h-8 w-8 text-secondary" />
              Security Center
            </h1>
            <p className="text-on-surface-variant mt-1">
              Monitor threats, manage bans, and protect your restaurant.
            </p>
          </div>
        </div>

        <SecurityDashboard />
      </motion.div>
    </DashboardLayout>
  );
}
