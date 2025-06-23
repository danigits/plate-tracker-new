import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Preparation from "./pages/Preparation";
import NotFound from "./pages/NotFound";
import RecipePage from "./pages/RecipePage";
import CookingSession from "./pages/CookingSession";
import UsersPage from "./pages/UsersPage";
import InventoryOrderScreen from "./pages/InventoryOrderScreen";
import SupervisorOrdersPage from "./pages/SupervisorOrdersPage";
import RecipeIngredientsScreen from "./pages/RecipeIngredientsScreen";
import CreateMenuItemScreen from "./pages/CreateMenuItemScreen";
import IngredientsPage from "./pages/Ingredientspage";
import EditMenuPage from "./pages/EditMenuPage"; // adjust path as needed
import MenuPage from "./pages/MenuPage";
import MenuManagerForm from "./pages/MenuManagerForm";
import PreparationEstimate from "./pages/PreperationEstimate";
import PreparationPlans from "./pages/PreparationPlans";
import SupervisorApprovalScreen from "./pages/SupervisorApprovalScreen";
import PreparationPlanReport from "./pages/PreparationPlanReport";
import CCTVManager from "./components/CCTVManager";
import DeliveryPointManager from "./pages/DeliveryPointManager";
import SupreparationEstimate from "./pages/SupPreperationEstimate";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DashboardRouter from "./components/DashboardRouter";
import { DeliveryDashboard } from "./modules/delivery-point/screens/DeliveryDashboard";
import { supabase } from "./integrations/supabase/client";
import { PrivateRoutes } from "@/components/PrivateRoutes"; // new file you created
import { MachineryUploadForm } from "./pages/MachineryUploadForm";
import { MachineryManager } from "./pages/MachineryManager";
import { MachineryDetail } from "./pages/MachineryList";
import VehicleTracking from "./components/VehicleTracking";
import CreateRouteForm from "./components/CreateRouteForm";
import KitchenTripDashboard from "./components/dashboard/KitchenTripDashboard";
import FuelManagement from "./components/FuelManagement";
import { AttendanceReport } from "./components/roster/AttendanceReport";
import KitchenStaffManager from "./components/roster/KitchenStaffManager";
import { TakeAttendance } from "./components/roster/TakeAttendance";

const queryClient = new QueryClient();

const App = () => {
  //if (!profile) return null; // Or show a loading spinner

  //const { user } = useAuth();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />

              <Route element={<PrivateRoutes />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />

                  <Route
                    path="/delivery_dashboard"
                    element={<DeliveryDashboard />}
                  />

                  <Route
                    path="/deliverypoints"
                    element={<DeliveryPointManager />}
                  />
                  {/* other protected routes */}

                  <Route
                    path="/ktdashboard"
                    element={<DeliveryPointManager />}
                  />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/preparation" element={<Preparation />} />
                  <Route
                    path="/preparationnew"
                    element={<PreparationEstimate />}
                  />
                  <Route
                    path="/preparationsup"
                    element={<SupreparationEstimate />}
                  />
                  <Route
                    path="/approvals"
                    element={<SupervisorApprovalScreen />}
                  />
                  <Route path="/recipes" element={<RecipePage />} />
                  <Route path="/cook" element={<CookingSession />} />
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/orders" element={<InventoryOrderScreen />} />
                  <Route
                    path="/orderslist"
                    element={<SupervisorOrdersPage />}
                  />
                  <Route
                    path="/menu-items/create"
                    element={<MenuManagerForm />}
                  />
                  <Route path="/edit-menu/:id" element={<EditMenuPage />} />
                  <Route
                    path="/preparation-plans"
                    element={<PreparationPlans />}
                  />
                  <Route path="/ingredients" element={<IngredientsPage />} />
                  <Route path="/reports" element={<PreparationPlanReport />} />
                  <Route path="/attendance" element={<AttendanceReport />} />
                  <Route path="/takeattendance" element={<TakeAttendance />} />
                  <Route path="/staff" element={<KitchenStaffManager />} />

                  <Route path="/cctv" element={<CCTVManager />} />
                  <Route path="/machines" element={<MachineryManager />} />
                  <Route path="/vehicaltraker" element={<VehicleTracking />} />
                  <Route path="/routeform" element={<CreateRouteForm />} />

                  <Route path="/fuelmgmt" element={<FuelManagement />} />

                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
