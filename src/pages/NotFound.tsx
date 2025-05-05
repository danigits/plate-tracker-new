
import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-kitchen-primary mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! This page does not exist.</p>
        <Button asChild>
          <a href="/">Return to Kitchen Manager</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
