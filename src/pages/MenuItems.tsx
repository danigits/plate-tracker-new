import React from "react";
import MenuItemDialog from "@/components/dashboard/MenuItemDialog";

export default function MenuItemsPage() {
  const kitchenId = "your-kitchen-id"; // replace with actual kitchen id from context/user session

  const handleRefresh = () => {
    // refetch menu items logic
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Menu Items</h1>
        <MenuItemDialog
          kitchenId={kitchenId}
          onMenuItemCreated={handleRefresh}
        />
      </div>
      {/* Menu list table or cards */}
    </div>
  );
}
