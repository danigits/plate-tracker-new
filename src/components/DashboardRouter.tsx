import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

// Import both dashboards
import MainDashboard from "@/pages/Dashboard";
import { DeliveryDashboard } from "@/modules/ delivery-point/screens/DeliveryDashboard";

const DashboardRouter = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "delivery") {
    return <DeliveryDashboard />;
  }

  return <MainDashboard />;
};

export default DashboardRouter;
