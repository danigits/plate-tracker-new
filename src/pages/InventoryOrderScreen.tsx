import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Trash, Pencil } from "lucide-react";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

type OrderItem = {
  item_id: string;
  item_name: string;
  requested_quantity: number;
  available_quantity: number;
  unit: string;
};

type PastOrder = {
  id: string;
  status: string;
  submitted_at: string;
  items: {
    item_name: string;
    requested_quantity: number;
    unit: string;
  }[];
};

const InventoryOrderScreen: React.FC = () => {
  const [kitchenId, setKitchenId] = useState<string | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [quantityNeeded, setQuantityNeeded] = useState<string>("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [pastOrders, setPastOrders] = useState<PastOrder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      const userJson = await AsyncStorage.getItem("kitchenUser");
      if (userJson) {
        const kitchenUser = JSON.parse(userJson);
        setKitchenId(kitchenUser.kitchenId);
      }
      fetchItems();
      fetchPastOrders();
    };
    loadData();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("inventory_items")
      .select("id, name, quantity, unit");

    if (error) console.error("Fetch items error:", error);
    else setItems(data as InventoryItem[]);
  };

  const fetchPastOrders = async () => {
    const userRes = await supabase.auth.getUser();
    const user = userRes.data.user;
    if (!user) return;

    const { data, error } = await supabase
      .from("inventory_orders")
      .select("id, status, submitted_at")
      .eq("supervisor_id", user.id)
      .in("status", ["pending", "approved"])
      .order("submitted_at", { ascending: false });

    if (!data) return;

    const orderIds = data.map((o) => o.id);
    const { data: itemData } = await supabase
      .from("inventory_order_items")
      .select("order_id, item_name, requested_quantity, unit")
      .in("order_id", orderIds);

    const enriched: PastOrder[] = data.map((order) => ({
      ...order,
      items:
        itemData
          ?.filter((i) => i.order_id === order.id)
          .map(({ item_name, requested_quantity, unit }) => ({
            item_name,
            requested_quantity,
            unit,
          })) || [],
    }));

    setPastOrders(enriched);
  };

  const addItemToOrder = () => {
    const item = items.find((i) => i.id === selectedItemId);
    const qty = parseFloat(quantityNeeded);

    if (!item || !qty || qty <= 0) return toast({ title: "Invalid input" });

    const exists = orderItems.find((o) => o.item_id === selectedItemId);
    if (exists)
      return toast({ title: "Item already added", description: item.name });

    setOrderItems((prev) => [
      ...prev,
      {
        item_id: item.id,
        item_name: item.name,
        requested_quantity: qty,
        available_quantity: item.quantity,
        unit: item.unit,
      },
    ]);

    setSelectedItemId("");
    setQuantityNeeded("");
    setIsDialogOpen(false);
  };

  const deleteItem = (id: string) =>
    setOrderItems((prev) => prev.filter((item) => item.item_id !== id));

  const submitOrder = async () => {
    const userRes = await supabase.auth.getUser();
    const user = userRes.data.user;
    if (!user || !kitchenId || orderItems.length === 0) return;

    const { data: order, error } = await supabase
      .from("inventory_orders")
      .insert([
        {
          supervisor_id: user.id,
          kitchen_id: kitchenId,
          status: "pending",
          submitted_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error || !order) return toast({ title: "Order failed" });

    const payload = orderItems.map((item) => ({
      order_id: order.id,
      item_name: item.item_name,
      requested_quantity: item.requested_quantity,
      unit: item.unit,
      status: "pending",
    }));

    const { error: itemError } = await supabase
      .from("inventory_order_items")
      .insert(payload);

    if (itemError) {
      toast({ title: "Failed to add items" });
      return;
    }

    toast({ title: "Order submitted successfully" });
    setOrderItems([]);
    fetchPastOrders();
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Create Inventory Order</h1>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Add Item</Button>
        </DialogTrigger>
        <DialogContent>
          <Select value={selectedItemId} onValueChange={setSelectedItemId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select item" />
            </SelectTrigger>
            <SelectContent>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.quantity} {item.unit})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Quantity needed"
            value={quantityNeeded}
            onChange={(e) => setQuantityNeeded(e.target.value)}
          />

          <Button onClick={addItemToOrder}>Add to Order</Button>
        </DialogContent>
      </Dialog>

      <div className="mt-4 space-y-2">
        {orderItems.map((item) => (
          <div
            key={item.item_id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <p>
              {item.item_name} – {item.requested_quantity} {item.unit}{" "}
              (Available: {item.available_quantity})
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteItem(item.item_id)}
            >
              <Trash className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        ))}
      </div>

      {orderItems.length > 0 && (
        <Button className="mt-4" onClick={submitOrder}>
          Submit Order
        </Button>
      )}

      <h2 className="text-lg font-semibold mt-8 mb-2">
        Pending & Approved Orders
      </h2>

      <div className="space-y-4">
        {pastOrders.map((order) => (
          <div key={order.id} className="border p-4 rounded shadow-sm bg-white">
            <p>
              <strong>Status:</strong>{" "}
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </p>
            <p>
              <strong>Date:</strong>{" "}
              {new Date(order.submitted_at).toLocaleString()}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {order.items.map((item, index) => (
                <li key={index}>
                  • {item.item_name}: {item.requested_quantity} {item.unit}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryOrderScreen;
