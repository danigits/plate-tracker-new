import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { MultiSelect } from "@/components/MultiSelect";

const mealTypes = ["breakfast", "lunch", "dinner"];

export default function PreparationEstimateDialog({
  open,
  onClose,
  kitchenId,
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [deliveryPoints, setDeliveryPoints] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);

  const [plans, setPlans] = useState({
    breakfast: [],
    lunch: [],
    dinner: [],
  });

  const fetchMenuItems = useCallback(async () => {
    setMenuItemsLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) console.error("Menu items fetch error:", error.message);
    setMenuItems(data || []);
    setMenuItemsLoading(false);
  }, []);

  const fetchDeliveryPoints = useCallback(async () => {
    const { data, error } = await supabase
      .from("delivery_points")
      .select("id, name")
      .eq("kitchen_id", kitchenId);

    if (error) console.error("Delivery points fetch error:", error.message);
    setDeliveryPoints(data || []);
  }, [kitchenId]);

  useEffect(() => {
    if (open) {
      fetchMenuItems();
      fetchDeliveryPoints();
    }
  }, [open, fetchMenuItems, fetchDeliveryPoints]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      const allItems = mealTypes.flatMap((meal) =>
        plans[meal].flatMap((item) =>
          item.delivery_points
            .filter((dp) => dp.estimated_plates > 0)
            .map((dp) => ({
              meal_type: meal,
              kitchen_id: kitchenId,
              date: formattedDate,
              menu_item_id: item.menu_item_id,
              delivery_point_id: dp.delivery_point_id,
              estimated_plates: dp.estimated_plates,
            }))
        )
      );

      if (allItems.length === 0) {
        alert("Please add at least one valid menu item with plates count");
        return;
      }

      const { error } = await supabase
        .from("delivery_point_plan_items")
        .insert(allItems);
      if (error) throw error;

      onClose();
      setPlans({ breakfast: [], lunch: [], dinner: [] });
    } catch (error) {
      console.error("Submit error:", error.message);
      alert("Failed to save preparation plan");
    } finally {
      setLoading(false);
    }
  };

  const renderMealSection = (meal) => {
    const selectedValues = plans[meal].map((item) => item.menu_item_id);

    return (
      <div key={meal} className="mb-6">
        <h3 className="font-semibold capitalize text-sm mb-2">
          {meal.charAt(0).toUpperCase() + meal.slice(1)}
        </h3>

        <MultiSelect
          items={menuItems.map((mi) => ({
            id: mi.id,
            name: mi.name,
            category_name: meal,
          }))}
          selected={selectedValues}
          onChange={(selectedIds) => {
            const updated = selectedIds.map((id) => {
              const existing = plans[meal].find((i) => i.menu_item_id === id);
              return (
                existing || {
                  menu_item_id: id,
                  delivery_points: deliveryPoints.map((dp) => ({
                    delivery_point_id: dp.id,
                    estimated_plates: 0,
                  })),
                }
              );
            });
            setPlans((prev) => ({ ...prev, [meal]: updated }));
          }}
        />

        {plans[meal].map((item, itemIndex) => (
          <div
            key={item.menu_item_id}
            className="border rounded-md p-3 mt-3 bg-muted"
          >
            <p className="font-medium text-sm mb-1">
              {menuItems.find((mi) => mi.id === item.menu_item_id)?.name}
            </p>
            <div className="max-h-[200px] overflow-y-auto space-y-2">
              {item.delivery_points.map((dp, dpIndex) => (
                <div
                  key={dp.delivery_point_id}
                  className="flex gap-2 items-center"
                >
                  <span className="w-[40%] text-sm">
                    {
                      deliveryPoints.find((d) => d.id === dp.delivery_point_id)
                        ?.name
                    }
                  </span>
                  <Input
                    type="number"
                    min="0"
                    value={dp.estimated_plates}
                    placeholder="Plates"
                    className="w-[60%]"
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      setPlans((prev) => {
                        const updated = [...prev[meal]];
                        updated[itemIndex].delivery_points[
                          dpIndex
                        ].estimated_plates = value;
                        return { ...prev, [meal]: updated };
                      });
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-3xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Preparation Estimate</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">Date</Label>
            <div className="border rounded-md">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </div>
          </div>

          {mealTypes.map(renderMealSection)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
