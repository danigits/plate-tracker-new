import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainDashboard from "@/pages/Dashboard";
import { DeliveryDashboard } from "@/modules/delivery-point/screens/DeliveryDashboard";
import { Loader2 } from "lucide-react";

const DashboardRouter = () => {
  // First debug point - component mount
  console.log("[1] DashboardRouter mounting");

  const { user, profile, isLoading } = useAuth();

  // Second debug point - after auth state
  console.log("[2] Auth state:", { user, profile, isLoading });

  useEffect(() => {
    // Third debug point - after initial render
    console.log("[3] useEffect triggered", { user, profile, isLoading });
  }, [user, profile, isLoading]);

  if (isLoading) {
    console.log("[4] Loading state active");
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (!user) {
    console.log("[5] No user - redirecting to login");
    return <Navigate to="/login" replace />;
  }

  const userRole = profile?.role || user.role;
  const isDelivery = userRole === "delivery";

  console.log("[6] Routing decision:", {
    userRole,
    profileRole: profile?.role,
    isDelivery,
    rendering: isDelivery ? "DeliveryDashboard" : "MainDashboard",
  });

  return isDelivery ? <DeliveryDashboard /> : <MainDashboard />;
};

export default DashboardRouter;
