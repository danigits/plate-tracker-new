import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthContext, AuthProvider } from "@/contexts/AuthContext";
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
import CCTVManager from "./components/CctvManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/preparation" element={<Preparation />} />
              <Route path="/preparationnew" element={<PreparationEstimate />} />
              <Route path="/approvals" element={<SupervisorApprovalScreen />} />
              <Route path="/recipes" element={<RecipePage />} />
              <Route path="/cook" element={<CookingSession />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/orders" element={<InventoryOrderScreen />} />
              <Route path="/orderslist" element={<SupervisorOrdersPage />} />
              <Route path="/menu-items/create" element={<MenuManagerForm />} />
              <Route path="/edit-menu/:id" element={<EditMenuPage />} />
              <Route path="/preparation-plans" element={<PreparationPlans />} />
              {/*CreateMenuItemScreen*/}
              <Route path="/ingredients" element={<IngredientsPage />} />
              <Route path="/reports" element={<PreparationPlanReport />} />
              <Route path="/cctv" element={<CCTVManager />} />

              {/* Add additional routes here */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
