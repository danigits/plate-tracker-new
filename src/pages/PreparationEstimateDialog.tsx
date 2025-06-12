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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const mealTypes = ["breakfast", "lunch", "dinner"];

export default function PreparationEstimateDialog({
  open,
  onClose,
  kitchenId,
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [menuItemsLoading, setMenuItemsLoading] = useState(false);

  const [plans, setPlans] = useState({
    breakfast: [{ menu_item_id: "", estimated_plates: 0 }],
    lunch: [{ menu_item_id: "", estimated_plates: 0 }],
    dinner: [{ menu_item_id: "", estimated_plates: 0 }],
  });

  // Memoized fetch function
  const fetchMenuItems = useCallback(async () => {
    setMenuItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        console.error("Failed to fetch menu items:", error.message);
        return;
      }
      setMenuItems(data || []);
    } finally {
      setMenuItemsLoading(false);
    }
  }, []);

  // Load menu items when dialog opens
  useEffect(() => {
    if (open) {
      fetchMenuItems();
    }
  }, [open, fetchMenuItems]);

  const handleChange = useCallback((meal, index, key, value) => {
    setPlans((prev) => {
      const updated = [...prev[meal]];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, [meal]: updated };
    });
  }, []);

  const addRow = useCallback((meal) => {
    setPlans((prev) => ({
      ...prev,
      [meal]: [...prev[meal], { menu_item_id: "", estimated_plates: 0 }],
    }));
  }, []);

  const removeRow = useCallback((meal, index) => {
    setPlans((prev) => {
      const updated = [...prev[meal]];
      updated.splice(index, 1);
      return { ...prev, [meal]: updated };
    });
  }, []);

  const renderMealSection = useCallback(
    (meal) => (
      <div key={meal} className="mb-4">
        <h3 className="font-semibold capitalize text-sm mb-2">
          {meal.charAt(0).toUpperCase() + meal.slice(1)}
        </h3>
        {plans[meal].map((item, index) => (
          <div
            className="flex gap-2 mb-2 items-center"
            key={`${meal}-${index}`}
          >
            <Select
              value={item.menu_item_id}
              onValueChange={(value) =>
                handleChange(meal, index, "menu_item_id", value)
              }
              disabled={menuItemsLoading}
            >
              <SelectTrigger className="w-[60%]">
                <SelectValue placeholder="Select menu item" />
              </SelectTrigger>
              <SelectContent>
                {menuItemsLoading ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Loading menu items...
                  </div>
                ) : (
                  menuItems.map((mi) => (
                    <SelectItem key={mi.id} value={mi.id}>
                      {mi.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Input
              type="number"
              className="w-[30%]"
              placeholder="Plates"
              min="0"
              value={item.estimated_plates || ""}
              onChange={(e) =>
                handleChange(
                  meal,
                  index,
                  "estimated_plates",
                  parseInt(e.target.value) || 0
                )
              }
            />

            {plans[meal].length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="w-[10%]"
                onClick={() => removeRow(meal, index)}
              >
                ×
              </Button>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => addRow(meal)}
          className="mt-1"
        >
          + Add item
        </Button>
      </div>
    ),
    [plans, menuItems, menuItemsLoading, handleChange, addRow, removeRow]
  );

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      const allItems = mealTypes.flatMap((meal) =>
        plans[meal]
          .filter((item) => item.menu_item_id && item.estimated_plates > 0)
          .map((item) => ({
            ...item,
            meal_type: meal,
            kitchen_id: kitchenId,
            date: formattedDate,
          }))
      );

      if (allItems.length === 0) {
        alert("Please add at least one valid menu item with plates count");
        return;
      }

      const { error } = await supabase
        .from("preparation_plan_items")
        .insert(allItems);

      if (error) throw error;

      onClose();
      // Reset form after successful submission
      setPlans({
        breakfast: [{ menu_item_id: "", estimated_plates: 0 }],
        lunch: [{ menu_item_id: "", estimated_plates: 0 }],
        dinner: [{ menu_item_id: "", estimated_plates: 0 }],
      });
    } catch (error) {
      console.error("Error saving preparation plan:", error.message);
      alert("Failed to save preparation plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-2xl">
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
