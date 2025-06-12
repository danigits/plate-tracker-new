import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChefHat,
  LayoutDashboard,
  Package,
  ClipboardList,
  CookingPot,
  BarChart2,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/types/auth";

const AppSidebar = () => {
  const { user, logout } = useAuth();
  const [inventoryOpen, setInventoryOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === UserRole.ADMIN;
  const isSupervisor = user.role === UserRole.SUPERVISOR;

  const toggleInventory = () => {
    setInventoryOpen(!inventoryOpen);
  };

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-col items-center py-6">
        <div className="flex items-center mb-3">
          <ChefHat size={28} className="text-kitchen-secondary mr-2" />
          <span className="font-bold text-xl">Kitchen Manager</span>
        </div>
        <div className="text-sm text-sidebar-foreground/70">
          {user.name} ({user.role})
        </div>
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
                  <Link to="/preparationnew">
                    <ClipboardList size={20} />
                    <span>Meal Management</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Inventory with submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleInventory}
                  className="justify-between"
                >
                  <div className="flex items-center">
                    <Package size={20} />
                    <span>Inventory</span>
                  </div>
                  {inventoryOpen ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </SidebarMenuButton>

                {/* Submenu items - shown only when inventoryOpen is true */}
                {inventoryOpen && (
                  <div className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-1">
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/inventory" className="pl-4">
                          <Package size={16} />
                          <span>Manage Inventory</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/orders" className="pl-4">
                          <ClipboardList size={16} />
                          <span>Orders</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/orderslist" className="pl-4">
                          <ClipboardList size={16} />
                          <span>Approve Orders</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </div>
                )}
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/recipes">
                    <CookingPot size={20} />
                    <span>Cooking SOP</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/recipes">
                    <CookingPot size={20} />
                    <span>Attendance</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/cctv">
                    <CookingPot size={20} />
                    <span>CCTV Cameras</span>
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
                        <Link to="/menu-items/create">
                          <Settings size={20} />
                          <span>Create Menu Item</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/ingredients">
                          <Settings size={20} />
                          <span>Manage Ingredients</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/approvals">
                          <Settings size={20} />
                          <span>Indents & Approvals</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/reports">
                          <Settings size={20} />
                          <span>Reports</span>
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
