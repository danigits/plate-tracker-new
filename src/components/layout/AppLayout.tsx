
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';

const AppLayout: React.FC = () => {
  const { user } = useAuth();

  // If no user is logged in, redirect to login page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="p-4 md:p-6">
            <div className="flex items-center mb-6">
              <SidebarTrigger className="mr-2 md:hidden" />
              <h1 className="text-2xl font-bold">Kitchen Management System</h1>
            </div>
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;
