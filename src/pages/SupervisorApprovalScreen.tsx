import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PreparationPlanReport from "./PreparationPlanReport";

export default function SupervisorApprovalScreen() {
  const [items, setItems] = useState([]);
  const [date, setDate] = useState("");
  const [kitchenId, setKitchenId] = useState("");
  const [kitchens, setKitchens] = useState([]);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("preparation_plan_items")
      .select(
        `
    id,
    meal_type,
    estimated_plates,
    date,
    menu_item:menu_item_id(name),
    kitchen:kitchen_id(name)
  `
      )
      .eq("is_approved", false);

    if (!error) setItems(data);
  };

  useEffect(() => {
    fetchItems();
    fetchKitchens();
  }, []);
  const fetchKitchens = async () => {
    const { data, error } = await supabase.from("kitchens").select("id, name");
    if (!error) setKitchens(data);
  };
  const approveItem = async (id) => {
    await supabase
      .from("preparation_plan_items")
      .update({ is_approved: true })
      .eq("id", id);
    fetchItems();
  };

  const generateIndent = async () => {
    const { error } = await supabase.rpc("generate_indent_for_kitchen", {
      kid: kitchenId,
      plan_date: date,
    });

    if (error) alert("Error generating indent: " + error.message);
    else alert("Indent generated successfully.");
  };
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
      console.error("Error fetching indent:", error.message);
      return [];
    }
    return data;
  };
  const downloadCSV = (data, filename = "indent.csv") => {
    const headers = ["Ingredient", "Unit", "Required Quantity"];
    const rows = data.map((item) => [
      item.ingredients?.name || "",
      item.ingredients?.unit || "",
      item.required_qty,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const fetchDetailedIndent = async () => {
    const { data, error } = await supabase.rpc("get_detailed_indent", {
      kid: kitchenId,
      pdate: date, // as 'YYYY-MM-DD'
    });

    if (error) {
      console.error("Indent fetch error:", error.message);
      return [];
    }
    return data;
  };
  const handleExportIndent = async () => {
    const data = await fetchDetailedIndent();
    if (data.length === 0) return alert("No data found.");
    downloadDetailedCSV(data, `indent-${kitchenName}-${date}.csv`);
  };

  const downloadDetailedCSV = (data, filename = "indent.csv") => {
    const headers = [
      "Kitchen Name",
      "Date",
      "Meal Type",
      "Menu Item Name",
      "Ingredient Name",
      "Per Serving Qty",
      "Estimated Plates",
      "Total Ingredient Qty",
    ];

    const rows = data.map((item) => [
      item.kitchen_name,
      item.date,
      item.meal_type,
      item.menu_item_name,
      item.ingredient_name,
      item.per_serving_qty,
      item.estimated_plates,
      item.total_ingredient_qty,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateAndDownload = async () => {
    const { error } = await supabase.rpc("generate_indent_for_kitchen", {
      kid: kitchenId,
      plan_date: date,
    });

    if (error) {
      alert("Error generating indent: " + error.message);
      return;
    }

    const data = await fetchIndentData(); // from Step 1
    downloadCSV(data); // from Step 2
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Unapproved Preparation Items</h2>
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold">Generate Indent</h3>
        {/* <Input
          placeholder="Kitchen ID"
          value={kitchenId}
          onChange={(e) => setKitchenId(e.target.value)}
          className="mb-2"
        /> */}
        <label className="block mb-1 font-medium">Select Kitchen</label>
        <select
          value={kitchenId}
          onChange={(e) => setKitchenId(e.target.value)}
          className="mb-2 border px-3 py-2 rounded w-full"
        >
          <option value="">-- Select Kitchen --</option>
          {kitchens.map((kitchen) => (
            <option key={kitchen.id} value={kitchen.id}>
              {kitchen.name}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mb-2"
        />
        <Button onClick={generateIndent}>Generate Indent</Button>
        <Button onClick={handleGenerateAndDownload}>
          Generate Indent & Download CSV
        </Button>
        <Button onClick={handleExportIndent}>Export Detailed Indent CSV</Button>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="border p-2 rounded flex justify-between"
          >
            <div>
              <p>Meal: {item.meal_type}</p>
              <p>Menu Item: {item.menu_item?.name}</p>

              <p>Plates: {item.estimated_plates}</p>
              <p>Date: {item.date}</p>
              <p>Kitchen: {item.kitchen?.name}</p>
            </div>
            <Button onClick={() => approveItem(item.id)}>Approve</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
