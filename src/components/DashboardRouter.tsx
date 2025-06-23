import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import MainDashboard from "@/pages/Dashboard";
import { DeliveryDashboard } from "@/modules/delivery-point/screens/DeliveryDashboard";
import { Loader2 } from "lucide-react";

const DashboardRouter = () => {
  const { user } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // This effect helps ensure we've completed the initial auth check
    if (user !== undefined) {
      setAuthChecked(true);
    }
  }, [user]);

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "delivery") {
    return <DeliveryDashboard />;
  }

  return <MainDashboard />;
};

export default DashboardRouter;
