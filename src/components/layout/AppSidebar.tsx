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
  const [adminOpen, setAdminOpen] = useState(false);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === UserRole.ADMIN;
  const isSupervisor = user.role === UserRole.SUPERVISOR;
  const isDelivery = user.role === UserRole.DELIVERY;
  const isInventory = user.role === UserRole.INVENTORY;
  const isSuperAdmin = user.role === UserRole.SUPERADMIN;
  const toggleInventory = () => {
    setInventoryOpen(!inventoryOpen);
  };
  const toggleadminopen = () => {
    setAdminOpen(!adminOpen);
  };
  const toggleattendanceopen = () => {
    setAttendanceOpen(!attendanceOpen);
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
        {!isDelivery && (
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

                {/* <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link to="/ktdashboard">
                        <LayoutDashboard size={20} />
                        <span>KitchentripDashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem> */}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/preparationnew">
                      <ClipboardList size={20} />
                      <span>Meal Management</span>
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
                    <Link to="/deliverypoints">
                      <ClipboardList size={20} />
                      <span>Food Tracking</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/vehicaltracker">
                      <Settings size={20} />
                      <span>Vehical Tracking</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {/* <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/preparationsup">
                      <ClipboardList size={20} />
                      <span>SUPER VISOR Meal Management</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem> */}

                {/* Inventory with submenu */}
                {isInventory && (
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
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/recipes">
                      <CookingPot size={20} />
                      <span>Cooking SOP</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {/* <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/recipes">
                      <CookingPot size={20} />
                      <span>Attendance</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem> */}
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
        )}
        {isDelivery && (
          <SidebarGroup>
            <SidebarGroupLabel>Main Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/delivery_dashboard">
                      <LayoutDashboard size={20} />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {(isAdmin || isSupervisor || !isDelivery) && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isAdmin && (
                  <>
                    {/* Inventory with submenu */}
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={toggleadminopen}
                        className="justify-between"
                      >
                        <div className="flex items-center">
                          <Package size={20} />
                          <span>Admin</span>
                        </div>
                        {adminOpen ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </SidebarMenuButton>

                      {/* Submenu items - shown only when inventoryOpen is true */}
                      {adminOpen && (
                        <div className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-1">
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to="/signup" className="pl-4">
                                <Package size={16} />
                                <span>Signup</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>

                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to="/users" className="pl-4">
                                <ClipboardList size={16} />
                                <span>User Management</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>

                          {/* <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to="/orderslist" className="pl-4">
                                <ClipboardList size={16} />
                                <span>Approve Orders</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem> */}
                          {/* {attendanceOpen &&(
                        <div className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-1">
                          
                        </div>
                      )} */}
                        </div>
                      )}
                      <SidebarMenuButton
                        onClick={toggleattendanceopen}
                        className="justify-between"
                      >
                        <div className="flex items-center">
                          <Package size={20} />
                          <span>Attendance </span>
                        </div>
                        {attendanceOpen ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </SidebarMenuButton>
                      {attendanceOpen && (
                        <div className="ml-6 pl-2 border-l border-gray-200 dark:border-gray-700 space-y-1">
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to="/takeattendance">
                                <Settings size={20} />
                                <span>Take Attendance</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to="/attendance">
                                <Settings size={20} />
                                <span>Attendance Report</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                          <SidebarMenuItem>
                            <SidebarMenuButton asChild>
                              <Link to="/staff">
                                <Settings size={20} />
                                <span>Add Employees</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        </div>
                      )}
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
                        <Link to="/routeform">
                          <Settings size={20} />
                          <span>Create Route Item</span>
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
                        <Link to="/machines">
                          <Settings size={20} />
                          <span>Machine Management</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <Link to="/fuelmgmt">
                          <Settings size={20} />
                          <span>Fuel Management</span>
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
