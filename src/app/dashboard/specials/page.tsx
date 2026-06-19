'use client';

import { DailySpecialsManager } from '@/components/daily-specials';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useStaffSession } from '@/contexts/StaffSessionContext';

export default function DailySpecialsPage() {
  const { user } = useAuthStore();
  const { session } = useStaffSession();

  return (
    <DashboardLayout>
      <TopAppBar
        title="Daily Specials"
        subtitle="Manage featured items and time-limited offers"
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
              <Sparkles className="h-8 w-8 text-secondary" />
              Daily Specials
            </h1>
            <p className="text-on-surface-variant mt-1">
              Manage time-limited offers and featured items for your menu.
            </p>
          </div>
        </div>

        <DailySpecialsManager />
      </motion.div>
    </DashboardLayout>
  );
}
