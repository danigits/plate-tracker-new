import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type InventoryOrder = {
  id: string;
  submitted_at: string;
  supervisor_id: string;
  status: string;
  kitchen_id: string;
};

type InventoryOrderItem = {
  id: string;
  item_name: string;
  requested_quantity: number;
  unit: string;
  status: string;
  order_id: string;
};

type EnrichedOrder = InventoryOrder & {
  supervisor_name?: string;
  kitchen_name?: string;
  items: InventoryOrderItem[];
};

const CentralSupervisorOrders: React.FC = () => {
  const [orders, setOrders] = useState<EnrichedOrder[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Step 1: Get pending orders
      const { data: rawOrders, error: orderError } = await supabase
        .from("inventory_orders")
        .select("*")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });

      if (orderError) throw orderError;
      if (!rawOrders) return;

      // Step 2: Get all order items
      const orderIds = rawOrders.map((o) => o.id);
      const { data: items, error: itemsError } = await supabase
        .from("inventory_order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      // Step 3: Fetch kitchen names
      const kitchenIds = [...new Set(rawOrders.map((o) => o.kitchen_id))];
      const { data: kitchens, error: kitchenError } = await supabase
        .from("kitchens")
        .select("id, name")
        .in("id", kitchenIds);

      if (kitchenError) throw kitchenError;
      const kitchenMap = Object.fromEntries(
        kitchens?.map((k) => [k.id, k.name]) || []
      );

      // Step 4: Fetch supervisor names
      const supervisorIds = [...new Set(rawOrders.map((o) => o.supervisor_id))];
      const { data: supervisors, error: supervisorsError } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", supervisorIds);

      if (supervisorsError) throw supervisorsError;
      const supervisorMap = Object.fromEntries(
        supervisors?.map((s) => [s.id, s.name]) || []
      );

      // Step 5: Merge all data
      const enrichedOrders = rawOrders.map((order) => ({
        ...order,
        supervisor_name: supervisorMap[order.supervisor_id] || "Unknown",
        kitchen_name: kitchenMap[order.kitchen_id] || "Unknown",
        items: items?.filter((i) => i.order_id === order.id) || [],
      }));

      setOrders(enrichedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const approveOrder = async (orderId: string) => {
    try {
      const { error: orderError } = await supabase
        .from("inventory_orders")
        .update({ status: "approved" })
        .eq("id", orderId);

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase
        .from("inventory_order_items")
        .update({ status: "approved" })
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;

      alert("Order approved successfully");
      await fetchOrders(); // Refresh the list
    } catch (error) {
      console.error("Error approving order:", error);
      alert("Failed to approve order");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Pending Inventory Orders</h1>

      {orders.length === 0 && <p>No pending orders.</p>}

      {orders.map((order) => (
        <div
          key={order.id}
          className="border rounded-lg p-4 mb-4 bg-white shadow"
        >
          <p className="text-gray-700 text-sm mb-1">Order ID: {order.id}</p>
          <p className="text-gray-700 text-sm mb-1">
            Submitted At: {new Date(order.submitted_at).toLocaleString()}
          </p>
          <p className="text-gray-700 text-sm mb-1">
            Kitchen: <strong>{order.kitchen_name}</strong>
          </p>
          <p className="text-gray-700 text-sm mb-2">
            Supervisor: <strong>{order.supervisor_name}</strong>
          </p>

          <div className="mb-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="text-sm text-gray-800 flex justify-between"
              >
                <span>{item.item_name}</span>
                <span>
                  {item.requested_quantity} {item.unit}
                </span>
              </div>
            ))}
          </div>

          <Button onClick={() => approveOrder(order.id)}>Approve Order</Button>
        </div>
      ))}
    </div>
  );
};

export default CentralSupervisorOrders;
