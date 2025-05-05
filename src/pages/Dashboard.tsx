
import React from 'react';
import DashboardStats from '@/components/dashboard/DashboardStats';
import KitchenStatus from '@/components/dashboard/KitchenStatus';
import AlertsNotifications from '@/components/dashboard/AlertsNotifications';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <DashboardStats />
      <div className="grid gap-6 md:grid-cols-2">
        <KitchenStatus />
        <AlertsNotifications />
      </div>
    </div>
  );
};

export default Dashboard;
