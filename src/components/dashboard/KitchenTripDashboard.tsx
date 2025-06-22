import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Types
type TripStatus = "pending" | "in_progress" | "completed";

interface Trip {
  id: string;
  kitchen_id: string;
  route_id: string;
  meal_type: string;
  trip_date: string;
  status: TripStatus;
  started_at?: string;
  ended_at?: string;
  created_at?: string;
}

interface DeliveryRoute {
  id: string;
  name: string;
  kitchen_id: string;
}

interface DeliveryPoint {
  id: string;
  name: string;
}

interface TripDeliveryPoint {
  id: string;
  trip_id: string;
  delivery_point_id: string;
  delivery_point: DeliveryPoint;
  stop_order: number;
  status: TripStatus;
  isCurrent?: boolean;
}

const KitchenTripDashboard = () => {
  const { user } = useAuth();
  const [mealType, setMealType] = useState<string>("");
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isCreatingTrip, setIsCreatingTrip] = useState<boolean>(false);
  const [tripPoints, setTripPoints] = useState<TripDeliveryPoint[]>([]);
  const today = new Date().toISOString().slice(0, 10);
  const kitchenId = user?.kitchenId || "";

  useEffect(() => {
    fetchRoutes();
    fetchTrips();
  }, [kitchenId]);

  const fetchRoutes = async () => {
    const { data, error } = await supabase
      .from("delivery_routes")
      .select("*")
      .eq("kitchen_id", kitchenId);
    if (!error && data) setRoutes(data);
  };

  // const fetchTrips = async () => {
  //   const { data, error } = await supabase
  //     .from("trip_instances")
  //     .select("*")
  //     .eq("kitchen_id", kitchenId)
  //     .order("created_at", { ascending: false });
  //   if (!error && data) setTrips(data);
  // };

  const fetchTrips = async () => {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data, error } = await supabase
      .from("trip_instances")
      .select("*")
      .eq("kitchen_id", kitchenId)
      .eq("trip_date", today)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTrips(data);

      const inProgressTrip = data.find((t) => t.status === "in_progress");
      const pendingTrip = data.find((t) => t.status === "pending");

      if (inProgressTrip) {
        setTrip(inProgressTrip);
        await fetchTripPoints(inProgressTrip.id);
      } else if (pendingTrip) {
        setTrip(pendingTrip);
        await fetchTripPoints(pendingTrip.id);
      } else {
        setTrip(null);
        setTripPoints([]);
      }
    } else {
      console.error("Error fetching trips:", error);
    }
  };

  const fetchTripPoints = async (tripId: string) => {
    const { data, error } = await supabase
      .from("trip_delivery_points")
      .select("*, delivery_point:delivery_points(*)")
      .eq("trip_id", tripId)
      .order("stop_order", { ascending: true });
    if (!error && data) setTripPoints(data);
  };

  const createTrip = async () => {
    if (!mealType || !selectedRoute) return;
    setIsCreatingTrip(true);

    const { data: tripData, error: tripError } = await supabase
      .from("trip_instances")
      .insert({
        kitchen_id: kitchenId,
        route_id: selectedRoute,
        meal_type: mealType,
        trip_date: today,
        status: "pending",
      })
      .select("*")
      .maybeSingle();

    if (tripError) {
      console.error("Create trip error:", tripError.message);
      setIsCreatingTrip(false);
      return;
    }

    if (tripData) {
      setTrip(tripData);
      setTrips((prev) => [tripData, ...prev]);

      const { data: routePoints } = await supabase
        .from("delivery_route_points")
        .select("delivery_point_id, stop_order")
        .eq("route_id", selectedRoute);

      if (routePoints) {
        const points = routePoints.map((p) => ({
          trip_id: tripData.id,
          delivery_point_id: p.delivery_point_id,
          stop_order: p.stop_order ?? 0,
          kitchen_id: kitchenId,
          status: "pending" as const,
        }));

        const { error: insertError } = await supabase
          .from("trip_delivery_points")
          .insert(points);

        if (!insertError) {
          await fetchTripPoints(tripData.id);
        } else {
          console.error("Trip point insert failed:", insertError.message);
        }
      }
    }

    setIsCreatingTrip(false);
  };

  const startTrip = async (tripToStart: Trip) => {
    const { data, error } = await supabase
      .from("trip_instances")
      .update({
        started_at: new Date().toISOString(),
        status: "in_progress",
      })
      .eq("id", tripToStart.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Trip start failed:", error);
      return;
    }

    if (data) {
      setTrip(data);
      setTrips((prev) => prev.map((t) => (t.id === data.id ? data : t)));
      await fetchTripPoints(data.id);
    }
  };

  const endTrip = async () => {
    if (!trip) return;

    const { data, error } = await supabase
      .from("trip_instances")
      .update({
        ended_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", trip.id)
      .select()
      .maybeSingle();

    if (!error && data) {
      setTrip(data);
      setTrips((prev) => prev.map((t) => (t.id === data.id ? data : t)));
    }
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "in_progress":
        return <Badge variant="default">In Progress</Badge>;
      case "completed":
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const allDelivered =
    tripPoints.length > 0 && tripPoints.every((p) => p.status === "completed");

  const getStatusIcon = (status: TripStatus) => {
    switch (status) {
      case "completed":
        return "✅";
      case "in_progress":
        return "🔄";
      case "pending":
        return "⏳";
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Trip */}
      <Card>
        <CardHeader>
          <CardTitle>Create Delivery Trip</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Select value={mealType} onValueChange={setMealType}>
            <SelectTrigger>
              <SelectValue placeholder="Select Meal Type" />
            </SelectTrigger>
            <SelectContent>
              {["breakfast", "lunch", "snacks", "dinner"].map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRoute || ""} onValueChange={setSelectedRoute}>
            <SelectTrigger>
              <SelectValue placeholder="Select Route" />
            </SelectTrigger>
            <SelectContent>
              {routes.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {!trip && (
            <Button onClick={createTrip} disabled={isCreatingTrip}>
              {isCreatingTrip ? "Creating..." : "Create Trip"}
            </Button>
          )}

          {trip?.status === "pending" && (
            <Button onClick={() => trip && startTrip(trip)}>Start Trip</Button>
          )}

          {trip?.status === "in_progress" && (
            <Button onClick={endTrip}>End Trip</Button>
          )}
        </CardContent>
      </Card>

      {/* Recent Trips Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Meal</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    {new Date(t.trip_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{t.meal_type}</TableCell>
                  <TableCell>
                    {routes.find((r) => r.id === t.route_id)?.name || "Unknown"}
                  </TableCell>
                  <TableCell>{getStatusBadge(t.status)}</TableCell>
                  <TableCell>
                    {t.status === "pending" && (
                      <Button size="sm" onClick={() => startTrip(t)}>
                        Start
                      </Button>
                    )}
                    {t.status === "in_progress" && (
                      <Button size="sm" variant="outline" disabled>
                        In Progress
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trip Progress - Horizontal */}

      {trip && tripPoints.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              Trip Progress - {trip.meal_type.toUpperCase()}
            </CardTitle>
            {trip?.status === "in_progress" && (
              <Button onClick={endTrip} variant="destructive" className="ml-4">
                End Trip
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="flex flex-col min-w-max">
                {/* Timeline header */}
                <div className="flex gap-1 items-center h-8 mb-2">
                  {tripPoints.map((point, index) => (
                    <div
                      key={`header-${point.id}`}
                      className="w-48 text-center text-xs font-medium"
                    >
                      Stop {point.stop_order + 1}
                    </div>
                  ))}
                </div>

                {/* Main Gantt bars */}
                <div className="flex gap-1 items-center h-12">
                  {tripPoints.map((point, index) => {
                    const statusColor =
                      point.status === "completed"
                        ? "bg-green-500"
                        : point.status === "in_progress"
                        ? "bg-yellow-500"
                        : "bg-gray-300";

                    const borderColor =
                      point.status === "in_progress"
                        ? "ring-2 ring-yellow-500 ring-offset-1"
                        : "";

                    return (
                      <div
                        key={`bar-${point.id}`}
                        className={`h-8 ${statusColor} rounded-md ${borderColor} flex items-center justify-center`}
                        style={{ width: "192px" }} // 12rem = 192px
                      >
                        <span className="text-xs font-medium text-white px-2 truncate">
                          {point.delivery_point?.name || "Unknown"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Status labels */}
                <div className="flex gap-1 items-center h-8 mt-2">
                  {tripPoints.map((point, index) => (
                    <div
                      key={`status-${point.id}`}
                      className="w-48 text-center"
                    >
                      <Badge
                        variant={
                          point.status === "completed" ? "default" : "outline"
                        }
                        className={
                          point.status === "completed"
                            ? "bg-green-500"
                            : point.status === "in_progress"
                            ? "bg-yellow-500 text-yellow-900"
                            : ""
                        }
                      >
                        {point.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KitchenTripDashboard;
