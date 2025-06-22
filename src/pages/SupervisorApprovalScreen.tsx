import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"] as const;

export default function SupervisorApprovalScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [date, setDate] = useState("");
  const [kitchenId, setKitchenId] = useState("");
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] =
    useState<(typeof MEAL_TYPES)[number]>("breakfast");
  const { toast } = useToast();

  // Filter items by active tab
  const filteredItems = items.filter((item) => item.meal_type === activeTab);
  const getSelectedCount = (mealType: string) => {
    return items.filter(
      (item) => item.meal_type === mealType && selectedItems.has(item.id)
    ).length;
  };

  // Toggle single item selection

  // Toggle single item selection
  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle select all/none for current tab
  const toggleSelectAll = () => {
    const currentTabItems = items.filter(
      (item) => item.meal_type === activeTab
    );
    if (selectedItems.size === currentTabItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(currentTabItems.map((item) => item.id)));
    }
  };

  // Approve selected items
  const approveSelected = async () => {
    if (selectedItems.size === 0) return;

    setIsApproving(true);

    try {
      const itemIds = Array.from(selectedItems);

      // 1) tell Supabase to *return* the updated rows
      const { data: updatedRows, error } = await supabase
        .from("delivery_point_plan_items")
        .update(
          { status: "approved", updated_at: new Date().toISOString() },
          { returning: "representation" } // ← ask for the updated records
        )
        .in("id", itemIds)
        .eq("status", "pending") // ← only pending items
        .select(); // ← must call select() when returning

      if (error) throw error;

      if ((updatedRows || []).length === 0) {
        // nothing actually changed
        toast.error({
          title: "No items updated",
          description:
            "Looks like nothing matched your filters. Check your RLS or IDs.",
        });
      } else {
        // 2) once you know they were updated, re‑fetch from the server
        await fetchItems();

        toast.success({
          title: "Approval Successful",
          description: `${updatedRows.length} items approved successfully`,
        });
        setSelectedItems(new Set());
      }
    } catch (error: any) {
      console.error("Approval failed:", error);
      toast.error({
        title: "Approval Failed",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  // Fetch kitchens dropdown
  const fetchKitchens = async () => {
    const { data, error } = await supabase.from("kitchens").select("id, name");
    if (error) {
      console.error("Error fetching kitchens:", error.message);
    } else {
      setKitchens(data);
    }
  };

  // Fetch pending items
  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("delivery_point_plan_items")
      .select(
        `
      *,
      menu_items (
        id,
        name,
        serving_qty,
        itemurl
      ),kitchens(id,name),delivery_points(id,name)
    `
      )
      .eq("status", "pending")
      .not("menu_item_id", "is", null); // Only include items with menu_item_id
    // console.log(
    //   supabase.from("delivery_point_plan_items").select("*").limit(1)
    // );
    if (error) {
      console.error("Fetch error:", error);
      // Double check your actual table names in Supabase Table Editor

      return;
    }

    // Transform data to flatten menu_items if needed
    const transformedData = data.map((item) => ({
      ...item,
      menu_item_name: item.menu_items?.name || "No item",
    }));

    setItems(transformedData);
    console.log("Fetched data:", transformedData);
  };

  useEffect(() => {
    fetchKitchens();
    fetchItems();
  }, []);

  // Approve a pending item
  const approveItem = async (id: string) => {
    const { error } = await supabase
      .from("delivery_point_plan_items")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Failed to approve item: " + error.message);
    } else {
      fetchItems();
    }
  };

  // Generate indent from RPC
  const generateIndent = async () => {
    if (!kitchenId || !date) {
      alert("Please select kitchen and date");
      return;
    }

    const { error } = await supabase.rpc("generate_indent_for_kitchen", {
      kid: kitchenId,
      plan_date: date,
    });

    if (error) {
      alert("Error generating indent: " + error.message);
    } else {
      alert("Indent generated successfully");
    }
  };

  // Fetch indent data
  const fetchIndentData = async () => {
    const { data, error } = await supabase
      .from("indents")
      .select(
        `
        ingredient_id,
        ingredients(name, unit),
        required_qty
      `
      )
      .eq("kitchen_id", kitchenId)
      .eq("date", date);

    if (error) {
      console.error("Indent fetch error:", error.message);
      return [];
    }

    return data;
  };

  // Export CSV
  const downloadCSV = (data: any[], filename = "indent.csv") => {
    const headers = ["Ingredient", "Unit", "Required Quantity"];
    const rows = data.map((item) => [
      item.ingredients?.name ?? "",
      item.ingredients?.unit ?? "",
      item.required_qty ?? 0,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch and download detailed indent data
  const fetchDetailedIndent = async () => {
    const { data, error } = await supabase.rpc("get_detailed_indent", {
      kid: kitchenId,
      pdate: date,
    });

    if (error) {
      console.error("Detailed indent fetch error:", error.message);
      return [];
    }

    return data;
  };

  const downloadDetailedCSV = (
    data: any[],
    filename = "detailed-indent.csv"
  ) => {
    const headers = [
      "Kitchen Name",
      "Delivery Points",
      "Date",
      "Meal Type",
      "Menu Item Name",
      "Ingredient Name",
      "Per Serving Qty",
      "Estimated Plates",
      "Total Ingredient Qty",
    ];

    const rows = data.map((item) => [
      item.kitchens?.name,
      item.delivery_points?.name,
      item.date,
      item.meal_type,
      item.menu_item_name,
      item.ingredient_name,
      item.per_serving_qty,
      item.estimated_plates,
      item.total_ingredient_qty,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDetailedIndent = async () => {
    const data = await fetchDetailedIndent();
    if (data.length === 0) {
      alert("No detailed indent data found.");
      return;
    }
    downloadDetailedCSV(data, `detailed-indent-${date}.csv`);
  };

  const handleGenerateAndDownloadCSV = async () => {
    await generateIndent();
    const data = await fetchIndentData();
    if (data.length > 0) {
      downloadCSV(data, `indent-${date}.csv`);
    } else {
      alert("No indent data found.");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Supervisor Approval</h1>

      {/* Kitchen + Date Selector */}
      <div className="space-y-2 border p-4 rounded">
        <label className="block font-semibold">Select Kitchen</label>
        <select
          value={kitchenId}
          onChange={(e) => setKitchenId(e.target.value)}
          className="w-full border px-3 py-2 rounded"
        >
          <option value="">-- Select Kitchen --</option>
          {kitchens.map((k) => (
            <option key={k.id} value={k.id}>
              {k.name}
            </option>
          ))}
        </select>

        <label className="block font-semibold">Select Date</label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="flex gap-2 mt-2">
          <Button onClick={generateIndent}>Generate Indent</Button>
          <Button onClick={handleGenerateAndDownloadCSV}>
            Generate & Download CSV
          </Button>
          <Button onClick={handleExportDetailedIndent}>
            Export Detailed CSV
          </Button>
        </div>
      </div>

      {/* Approval List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Pending Preparation Items</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={toggleSelectAll}
              disabled={filteredItems.length === 0}
            >
              {filteredItems.length > 0 &&
              filteredItems.every((item) => selectedItems.has(item.id))
                ? "Unselect All"
                : "Select All"}
            </Button>
            <Button
              onClick={approveSelected}
              disabled={selectedItems.size === 0 || isApproving}
              className="gap-2"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                `Approve Selected (${selectedItems.size})`
              )}
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as (typeof MEAL_TYPES)[number])
          }
        >
          <TabsList className="grid w-full grid-cols-4">
            {MEAL_TYPES.map((meal) => {
              const count = getSelectedCount(meal);
              return (
                <TabsTrigger
                  key={meal}
                  value={meal}
                  className="capitalize flex gap-2"
                >
                  {meal}
                  {count > 0 && (
                    <span className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {MEAL_TYPES.map((meal) => (
            <TabsContent key={meal} value={meal}>
              {items.filter((i) => i.meal_type === meal).length === 0 ? (
                <Card>
                  <CardContent className="py-4 text-gray-500">
                    No pending {meal} items.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items
                    .filter((i) => i.meal_type === meal)
                    .map((item) => (
                      <Card
                        key={item.id}
                        className={`relative ${
                          selectedItems.has(item.id)
                            ? "ring-2 ring-primary"
                            : ""
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                            />
                            <CardTitle>{item.menu_item_name}</CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Plates
                              </p>
                              <p className="font-medium">
                                {item.estimated_plates}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Date
                              </p>
                              <p className="font-medium">{item.date}</p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Delivery
                              </p>
                              <p className="font-medium">
                                {item.delivery_points?.name || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Kitchen
                              </p>
                              <p className="font-medium">
                                {item.kitchens?.name || "-"}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Status
                              </p>
                              <p className="font-medium capitalize">
                                {item.status}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}


// -- Allow update access
// CREATE POLICY "Allow update if user matches KITCHEN_point"
// ON delivery_point_plan_items
// FOR UPDATE
// USING (
//   kitchen_id = (
//     SELECT kitchen_id::uuid FROM profiles WHERE id = auth.uid()
//   )
// );

