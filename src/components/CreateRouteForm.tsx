import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export default function CreateRouteForm() {
  const [kitchens, setKitchens] = useState([]);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [kitchenId, setKitchenId] = useState("");
  const [mealType, setMealType] = useState("");
  const [routeName, setRouteName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: k } = await supabase.from("kitchens").select("id, name");
      const { data: dp } = await supabase
        .from("delivery_points")
        .select("id, name");
      setKitchens(k || []);
      setDeliveryPoints(dp || []);
    };
    fetchData();
  }, []);

  const handlePointToggle = (pointId: string) => {
    setSelectedPoints((prev) =>
      prev.includes(pointId)
        ? prev.filter((id) => id !== pointId)
        : [...prev, pointId]
    );
  };

  const handleSubmit = async () => {
    const routeId = uuidv4();
    const { error: routeErr } = await supabase.from("delivery_routes").insert({
      id: routeId,
      kitchen_id: kitchenId,
      meal_type: mealType,
      name: routeName,
    });

    if (routeErr) {
      console.error(routeErr);
      return alert("Error creating route");
    }

    const inserts = selectedPoints.map((pointId, index) => ({
      route_id: routeId,
      delivery_point_id: pointId,
      stop_order: index + 1,
    }));

    const { error: pointsErr } = await supabase
      .from("delivery_route_points")
      .insert(inserts);

    if (pointsErr) {
      console.error(pointsErr);
      return alert("Error creating route points");
    }

    alert("Route created successfully!");
    setRouteName("");
    setSelectedPoints([]);
    setKitchenId("");
    setMealType("");
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow rounded">
      <h2 className="text-xl font-semibold mb-4">Create Delivery Route</h2>

      <div className="space-y-4">
        <Select value={kitchenId} onValueChange={setKitchenId}>
          <SelectTrigger>
            <SelectValue placeholder="Select Kitchen" />
          </SelectTrigger>
          <SelectContent>
            {kitchens.map((k) => (
              <SelectItem key={k.id} value={k.id}>
                {k.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mealType} onValueChange={setMealType}>
          <SelectTrigger>
            <SelectValue placeholder="Select Meal Type" />
          </SelectTrigger>
          <SelectContent>
            {["breakfast", "lunch", "snacks", "dinner"].map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={routeName}
          onChange={(e) => setRouteName(e.target.value)}
          placeholder="Route Name"
        />

        <div className="space-y-2">
          <label className="block font-medium">
            Select Delivery Points (in order):
          </label>
          {deliveryPoints.map((dp) => (
            <div key={dp.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedPoints.includes(dp.id)}
                onChange={() => handlePointToggle(dp.id)}
              />
              <label>{dp.name}</label>
            </div>
          ))}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={
            !kitchenId || !mealType || !routeName || selectedPoints.length === 0
          }
        >
          Create Route
        </Button>
      </div>
    </div>
  );
}
