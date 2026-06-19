'use client';

import { FloorPlan } from '@/components/floor-plan';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';
import { motion } from 'framer-motion';
import { Grid3X3, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useStaffSession } from '@/contexts/StaffSessionContext';

export default function FloorPlanPage() {
  const { user } = useAuthStore();
  const { session } = useStaffSession();

  return (
    <DashboardLayout>
      <TopAppBar
        title="Floor Plan"
        subtitle="Visualize your restaurant layout"
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
              <Grid3X3 className="h-8 w-8 text-secondary" />
              Floor Plan
            </h1>
            <p className="text-on-surface-variant mt-1">
              Visualize and manage your restaurant layout in real-time.
            </p>
          </div>
          <Button variant="outline" className="border-outline-variant hover:bg-surface-container-low">
            <Settings className="h-4 w-4 mr-2" />
            Edit Layout
          </Button>
        </div>

        <FloorPlan editable={false} />
      </motion.div>
    </DashboardLayout>
  );
}
