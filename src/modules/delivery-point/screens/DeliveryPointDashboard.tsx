import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Truck, Clock, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DeliveryItem {
  id: string;
  name: string;
  estimated_plates: number;
  received_plates?: number;
  status: "pending" | "received" | "delivered";
}

interface DeliveryPointDashboardProps {
  tripId: string;

  delivery_point_id: string;
}

export function DeliveryPointDashboard({
  tripId,
  delivery_point_id,
}: DeliveryPointDashboardProps) {
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripStatus, setTripStatus] = useState<
    "loading" | "active" | "completed"
  >("loading");
  const [currentStop, setCurrentStop] = useState<{
    id: string;
    name: string;
    sequence: number;
    meal_type?: string;
  } | null>(null);
  //const { user } = useAuth();

  const fetchTripDetails = useCallback(async () => {
    if (!tripId) return;

    setLoading(true);
    try {
      const { data: tripData, error: tripError } = await supabase
        .from("trip_instances")
        .select(
          `
          id,
          status,
          meal_type,
          trip_delivery_points(
            id,
            delivery_point_id,
            stop_order,
            delivered_time,
            delivery_points(name)
          )
        `
        )
        .eq("id", tripId)
        .single();

      if (tripError || !tripData)
        throw tripError || new Error("Trip not found");

      const nextPoint = tripData.trip_delivery_points
        ?.filter((p) => !p.delivered_time)
        ?.sort((a, b) => (a.stop_order || 0) - (b.stop_order || 0))[0];

      setTripStatus(tripData.status === "completed" ? "completed" : "active");

      if (nextPoint) {
        setCurrentStop({
          id: String(nextPoint.delivery_point_id),
          name: nextPoint.delivery_points?.name || "Unknown Stop",
          sequence: nextPoint.stop_order || 0,
          meal_type: tripData.meal_type || undefined,
        });

        const { data: items, error: itemsError } = await supabase
          .from("delivery_point_plan_items")
          .select(
            `
            id,
            menu_items(name),
            estimated_plates,
            received_plates,
            status
          `
          )
          .eq("delivery_point_id", String(nextPoint.delivery_point_id))
          .eq("date", new Date().toISOString().split("T")[0])
          .maybeSingle();

        if (itemsError) throw itemsError;

        setDeliveryItems(
          Array.isArray(items)
            ? items.map((item) => ({
                id: item.id,
                name: item.menu_items?.name || "Unknown Item",
                estimated_plates: item.estimated_plates,
                received_plates: item.received_plates,
                status: item.status as "pending",
              }))
            : []
        );
      } else {
        setCurrentStop(null);
        setDeliveryItems([]);
      }
    } catch (error) {
      console.error("Failed to fetch trip details:", error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  const markItemReceived = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("delivery_point_plan_items")
        .update({
          status: "received",

          received_time: new Date().toISOString(),
        })
        .eq("id", itemId);
      if (error) throw error;
      await fetchTripDetails();
    } catch (err) {
      console.error("Failed to mark item received:", err);
    }
  };

  const completeCurrentStop = async () => {
    if (!tripId || !currentStop?.id) return;

    try {
      const now = new Date().toISOString();

      const { error: stopError } = await supabase
        .from("trip_delivery_points")
        .update({ delivered_time: now, status: "completed", reached: true })
        .eq("trip_id", tripId)
        .eq("delivery_point_id", currentStop.id);

      if (stopError) throw stopError;

      const { error: itemsError } = await supabase
        .from("delivery_point_plan_items")
        .update({
          status: "delivered",
          delivered_time: now,
          updated_at: now,
        })
        .eq("delivery_point_id", currentStop.id)
        .eq("date", new Date().toISOString().split("T")[0]);

      if (itemsError) throw itemsError;

      await fetchTripDetails();
    } catch (err) {
      console.error("Failed to complete stop:", err);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [fetchTripDetails]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading delivery data...</span>
      </div>
    );
  }

  if (tripStatus === "completed") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Trip Completed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>All deliveries are completed for this trip.</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentStop) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Active Delivery Point</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No pending delivery points found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-500" />
          Current Delivery Stop - {currentStop.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Stop Order #{currentStop.sequence}
        </div>
        <div className="space-y-2">
          <h4 className="flex items-center gap-2 font-medium">
            <Package className="h-4 w-4" />
            {deliveryItems.length} Items to Deliver
          </h4>
          {deliveryItems.length > 0 ? (
            <ul className="space-y-2">
              {deliveryItems.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center p-2 border rounded"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.received_plates || 0}/{item.estimated_plates} plates
                    </p>
                  </div>
                  {item.status === "pending" ? (
                    <Button size="sm" onClick={() => markItemReceived(item.id)}>
                      Mark Received
                    </Button>
                  ) : (
                    <span className="text-sm text-green-600">Received</span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No items for this stop.
              {/* currentStop: <li>{currentStop.id}</li>
              deliverypoint: <li>{delivery_point_id}</li> */}
            </p>
          )}
        </div>
        {currentStop.id == delivery_point_id && (
          <div>
            <Button
              className="w-full"
              onClick={completeCurrentStop}
              disabled={deliveryItems.some((item) => item.status === "pending")}
            >
              Complete This Stop
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeliveryPointDashboard;

//the problem i have here is,the functionalityb is working fine how ever the issue is once i end the trip,next stop details were visible  but in every Stop ,i only need complete the stop button in respective current delivery point login
