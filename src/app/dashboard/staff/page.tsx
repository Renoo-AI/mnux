'use client';

import { StaffManager } from '@/components/staff-manager';
import { DashboardLayout } from '@/components/layout';
import { TopAppBar } from '@/components/layout';

export default function StaffPage() {
  return (
    <DashboardLayout>
      <TopAppBar
        title="Staff Management"
        subtitle="Manage your team"
        showSearch={false}
        user={{ name: 'Manager', role: 'manager' }}
      />
      <div className="p-6 md:p-10 max-w-7xl w-full mx-auto animate-fade-in">
        <StaffManager />
      </div>
    </DashboardLayout>
  );
}
