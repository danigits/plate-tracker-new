
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ChefHat, 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  BarChart2, 
  Users, 
  Settings, 
  LogOut
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel, 
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';

const AppSidebar = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = user.role === UserRole.ADMIN;
  const isSupervisor = user.role === UserRole.SUPERVISOR;

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col items-center py-6">
        <div className="flex items-center mb-3">
          <ChefHat size={28} className="text-kitchen-secondary mr-2" />
          <span className="font-bold text-xl">Kitchen Manager</span>
        </div>
        <div className="text-sm text-sidebar-foreground/70">{user.name} ({user.role})</div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard size={20} />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/inventory">
                    <Package size={20} />
                    <span>Inventory</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/preparation">
                    <ClipboardList size={20} />
                    <span>Preparation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {(isAdmin || isSupervisor) && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/analytics">
                      <BarChart2 size={20} />
                      <span>Analytics</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {isAdmin && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/users">
                          <Users size={20} />
                          <span>Users</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/settings">
                          <Settings size={20} />
                          <span>Settings</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={logout}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
