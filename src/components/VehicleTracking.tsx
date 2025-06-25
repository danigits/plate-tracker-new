import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  TableHeader,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { downloadCSV } from "@/lib/csvutil";
import { useAuth } from "@/contexts/AuthContext";

const RATE_PER_KM = 10;

function getDistanceInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

const VehicleTracking = () => {
  const [isTripLoading, setIsTripLoading] = useState(true);
  const [trips, setTrips] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isReturn, setIsReturn] = useState(true);
  const { user } = useAuth();
  const role = user?.role || "admin"; // fallback to kitchen_admin

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setIsTripLoading(true);

    try {
      const role = user?.user_metadata?.role || "kitchen_admin"; // Fallback role
      const kitchenId = user?.kitchenId;

      let query = supabase
        .from("trip_delivery_points")
        .select(
          `
        
        trip_id,
        delivered_time,
        kitchen_id,
        delivery_point_id,
        kitchens!inner(name, latitude, longitude),
        delivery_points!inner(name, latitude, longitude)
      `
        )
        .order("delivered_time", { ascending: false });

      // ✅ Role-based filter for kitchen admin
      if (role === "kitchen_admin" && kitchenId) {
        query = query.eq("kitchen_id", kitchenId);
      }

      // ✅ Date filters
      if (startDate) query = query.gte("delivered_time", startDate);
      if (endDate) query = query.lte("delivered_time", endDate + "T23:59:59");

      const { data: trips, error } = await query;

      if (error) {
        console.error("Error loading trips:", error);
        return;
      }

      const enriched = await Promise.all(
        (trips || []).map(async (trip) => {
          if (!trip.kitchen_id || !trip.delivery_point_id) {
            console.warn("Trip missing IDs:", trip);
            return null;
          }

          // 🔁 No need to refetch kitchens & delivery points again
          const kitchen = trip.kitchens;
          const delivery = trip.delivery_points;

          if (!kitchen || !delivery) {
            console.warn(
              "Missing embedded kitchen or delivery point",
              trip.trip_id
            );
            return null;
          }

          const distance = getDistanceInKm(
            kitchen.latitude,
            kitchen.longitude,
            delivery.latitude,
            delivery.longitude
          );

          const estimated_cost = Math.round(distance * 10 * 2); // ₹10/km round trip

          return {
            ...trip,
            kitchen,
            delivery,
            distance_km: distance.toFixed(2),
            estimated_cost,
          };
        })
      );

      setTrips(enriched.filter(Boolean));
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setIsTripLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = trips.map((trip) => ({
      Kitchen: trip.kitchens.name,
      DeliveryPoint: trip.delivery_points.name,
      DistanceKm: trip.distance_km,
      Cost: trip.estimated_cost,
      DeliveredTime: trip.delivered_time
        ? new Date(trip.delivered_time).toLocaleString()
        : "Pending",
    }));
    downloadCSV(rows, "vehicle_tracking_report.csv");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meal Preparation</h1>
          <p className="text-muted-foreground">Plan meals and track wastage</p>
        </div>
      </div>

      <div className="p-6">
        <Card>
          <CardTitle className="text-xl mb-4 flex justify-between items-center p-6 pb-0">
            <div className="flex items-center gap-4">
              <div></div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isReturn}
                  onChange={() => setIsReturn((prev) => !prev)}
                  className="h-4 w-4"
                />
                To & Fro
              </label>
              <Button size="sm" onClick={handleExportCSV}>
                Export CSV
              </Button>
            </div>
          </CardTitle>

          <CardContent className="p-6">
            {isTripLoading ? (
              <div className="flex justify-center py-10">
                <Loader className="animate-spin" />
              </div>
            ) : (
              <>
                {/* Date Filters */}
                <div className="flex flex-wrap items-end gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="border px-3 py-2 rounded w-full"
                    />
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="border px-3 py-2 rounded w-full"
                    />
                  </div>

                  <Button
                    onClick={() => fetchTrips()}
                    className="bg-blue-600 hover:bg-blue-700 h-10"
                  >
                    Filter
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      fetchTrips();
                    }}
                    className="h-10"
                  >
                    Reset
                  </Button>
                </div>

                {/* Table */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Kitchen</TableHead>
                        <TableHead>Trip ID</TableHead>
                        <TableHead>Delivery Point</TableHead>
                        <TableHead>Distance (km)</TableHead>
                        <TableHead>Cost (₹)</TableHead>
                        <TableHead>Delivered Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trips.map((trip) => (
                        <TableRow
                          key={trip.trip_id}
                          className="hover:bg-gray-50"
                        >
                          <TableCell>{trip.kitchens?.name}</TableCell>
                          <TableCell className="text-xs text-gray-600">
                            {trip.trip_id}
                          </TableCell>
                          <TableCell>{trip.delivery_points?.name}</TableCell>
                          <TableCell>{trip.distance_km}</TableCell>
                          <TableCell>{trip.estimated_cost}</TableCell>
                          <TableCell>
                            {trip.delivered_time
                              ? new Date(trip.delivered_time).toLocaleString()
                              : "Pending"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VehicleTracking;
