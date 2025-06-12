import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
interface PreparationPlanReportRow {
  kitchen_name: string;
  date: string;
  meal_type: string;
  menu_item_name: string;
  ingredient_name: string;
  per_serving_qty: number;
  estimated_plates: number;
  unit: string;
  total_ingredient_qty: number;
}

// Then use in your component:

const PreparationPlanReport = () => {
  //const [reportData, setReportData] = useState<any[]>([]);
  const [reportData, setReportData] = useState<PreparationPlanReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    kitchen_id: "",
    date: new Date().toISOString().split("T")[0], // Today's date by default
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("preparation_plan_report")
        .select("*")
        .order("date", { ascending: true })
        .order("kitchen_name", { ascending: true })
        .order("meal_type", { ascending: true });

      if (filters.kitchen_id) {
        query = query.eq("kitchen_id", filters.kitchen_id);
      }

      if (filters.date) {
        query = query.eq("date", filters.date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReportData(data || []);
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert("No data to export");
      return;
    }

    const csvData = reportData.map((row) => ({
      Kitchen: row.kitchen_name,
      Date: row.date,
      "Meal Type": row.meal_type,
      "Menu Item": row.menu_item_name,
      Ingredient: row.ingredient_name,
      "Qty/Serve": row.per_serving_qty,
      unit: row.unit,
      Plates: row.estimated_plates,
      "Total Needed": `${row.total_ingredient_qty.toFixed(2)}`,
    }));

    const csv = Papa.unparse(csvData, {
      quotes: true,
      delimiter: ",",
      header: true,
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `preparation-plan-${filters.date || "report"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchReport();
  }, [filters]);

  return (
    <div className="p-4">
      <div className="flex gap-4 mb-6">
        <select
          value={filters.kitchen_id}
          onChange={(e) =>
            setFilters({ ...filters, kitchen_id: e.target.value })
          }
          className="p-2 border rounded"
        >
          <option value="">All Kitchens</option>
          {/* Populate with your kitchens */}
        </select>

        <input
          type="date"
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="p-2 border rounded"
        />

        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Refresh
        </button>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded ml-auto"
          disabled={reportData.length === 0}
        >
          Export CSV
        </button>
      </div>

      {loading ? (
        <p>Loading report...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Kitchen</th>
                <th className="py-2 px-4 border">Date</th>
                <th className="py-2 px-4 border">Meal Type</th>
                <th className="py-2 px-4 border">Menu Item</th>
                <th className="py-2 px-4 border">Ingredient</th>
                <th className="py-2 px-4 border">Qty/1000</th>
                <th className="py-2 px-4 border">Estimated Plates</th>
                <th className="py-2 px-4 border">units</th>
                <th className="py-2 px-4 border">Total Needed</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : ""}>
                  <td className="py-2 px-4 border">{row.kitchen_name}</td>
                  <td className="py-2 px-4 border">{row.date}</td>
                  <td className="py-2 px-4 border">{row.meal_type}</td>
                  <td className="py-2 px-4 border">{row.menu_item_name}</td>
                  <td className="py-2 px-4 border">{row.ingredient_name}</td>
                  <td className="py-2 px-4 border text-right">
                    {row.per_serving_qty}
                  </td>
                  <td className="py-2 px-4 border text-right">
                    {row.estimated_plates}
                  </td>
                  <td className="py-2 px-4 border text-right font-medium">
                    {row.unit}
                  </td>
                  <td className="py-2 px-4 border text-right font-medium">
                    {row.total_ingredient_qty.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PreparationPlanReport;
