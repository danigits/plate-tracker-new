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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

const mealTypes = ["breakfast", "lunch", "snacks", "dinner"];

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
  const [activeMealTab, setActiveMealTab] = useState("breakfast");
  const [hasLoadedMenuItems, setHasLoadedMenuItems] = useState(false);

  const [plans, setPlans] = useState({
    breakfast: [],
    lunch: [],
    snacks: [],
    dinner: [],
  });

  const fetchMenuItems = useCallback(async () => {
    // Check cache first
    const cached = sessionStorage.getItem("menuItems");
    if (cached) {
      setMenuItems(JSON.parse(cached));
      return; // Don't set hasLoadedMenuItems here
    }

    setMenuItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;

      if (data) {
        setMenuItems(data);
        sessionStorage.setItem("menuItems", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Menu items fetch error:", error.message);
      // Consider showing error to user
    } finally {
      setMenuItemsLoading(false);
    }
  }, []); // Removed hasLoadedMenuItems dependency

  const fetchDeliveryPoints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("delivery_points")
        .select("id, name")
        .eq("kitchen_id", kitchenId);

      if (error) throw error;
      setDeliveryPoints(data || []);
    } catch (error) {
      console.error("Delivery points fetch error:", error.message);
      // Consider showing error to user
      setDeliveryPoints([]); // Explicitly set empty array on error
    }
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
      setPlans({ breakfast: [], lunch: [], snacks: [], dinner: [] });
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
      <TabsContent key={meal} value={meal} className="mt-4 h-[calc(100%-40px)]">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">
              {meal.charAt(0).toUpperCase() + meal.slice(1)} Items
            </h3>
            <div className="w-64">
              <MultiSelect
                items={menuItems.map((mi) => ({
                  id: mi.id,
                  name: mi.name,
                  category_name: meal,
                }))}
                selected={selectedValues}
                onChange={(selectedIds) => {
                  const updated = selectedIds.map((id) => {
                    const existing = plans[meal].find(
                      (i) => i.menu_item_id === id
                    );
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
                placeholder="Select menu items..."
                disabled={menuItemsLoading}
              />
            </div>
          </div>

          {/* ... (rest of your renderMealSection implementation) */}
          {plans[meal].length === 0 ? (
            <Card className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">
                No items selected for {meal}
              </p>
            </Card>
          ) : (
            <ScrollArea className="flex-1 rounded-md border">
              <div className="grid gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
                {plans[meal].map((item, itemIndex) => (
                  <Card key={item.menu_item_id}>
                    <CardHeader className="bg-muted/50 p-4">
                      <CardTitle className="text-lg">
                        {
                          menuItems.find((mi) => mi.id === item.menu_item_id)
                            ?.name
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-[200px] overflow-y-auto">
                        {item.delivery_points.map((dp, dpIndex) => (
                          <div
                            key={dp.delivery_point_id}
                            className="p-3 flex items-center justify-between border-b"
                          >
                            <div className="text-sm font-medium">
                              {
                                deliveryPoints.find(
                                  (d) => d.id === dp.delivery_point_id
                                )?.name
                              }
                            </div>
                            <Input
                              type="number"
                              min="0"
                              value={dp.estimated_plates}
                              placeholder="Plates"
                              className="w-24"
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </TabsContent>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      {/* ... (rest of your dialog implementation) */}
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Create Preparation Estimate
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <div className="mt-2 border rounded-md">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Delivery Points</Label>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {deliveryPoints.length} delivery points available
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Tabs
                value={activeMealTab}
                onValueChange={setActiveMealTab}
                className="h-full"
              >
                <TabsList className="grid grid-cols-3 w-full">
                  {mealTypes.map((meal) => (
                    <TabsTrigger
                      key={meal}
                      value={meal}
                      className="capitalize"
                      disabled={menuItemsLoading}
                    >
                      {meal}
                      {plans[meal].length > 0 && (
                        <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                          {plans[meal].length}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {menuItemsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="mt-4">{mealTypes.map(renderMealSection)}</div>
                )}
              </Tabs>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Saving..." : "Save Plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
