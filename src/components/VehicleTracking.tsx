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
import { Loader } from "lucide-react";
import { TripMap } from "./TripMap";

const VehicleTracking = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("trip_delivery_points")
        .select(
          `
          id, delivered_time, distance_km, estimated_cost, created_at,
          kitchens(name), delivery_points(name)
        `
        )
        .order("created_at", { ascending: false });

      if (!error) setTrips(data || []);
      setLoading(false);
    };

    fetchTrips();
  }, []);

  return (
    <div className="p-6">
      <Card>
        <CardTitle className="text-xl mb-4">Vehicle Tracking</CardTitle>

        {/* Insert Map */}
        {!loading && trips.length > 0 && (
          <div className="my-6">
            <TripMap trips={trips} />
          </div>
        )}
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader className="animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kitchen</TableHead>
                  <TableHead>Delivery Point</TableHead>
                  <TableHead>Distance (km)</TableHead>
                  <TableHead>Cost (₹)</TableHead>
                  <TableHead>Delivered Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell>{trip.kitchens?.name}</TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VehicleTracking;
