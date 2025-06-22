import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function FuelHistory({ kitchenId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kitchenId) return;

    const fetchData = async () => {
      const { data, error } = await supabase
        .from("kitchen_fuel_management")
        .select("*")
        .eq("kitchen_id", kitchenId)
        .order("entry_date", { ascending: false })
        .limit(30);

      if (error) {
        console.error("Error loading history", error);
      } else {
        setData(data);
      }

      setLoading(false);
    };

    fetchData();
  }, [kitchenId]);

  if (loading) return <p>Loading fuel history...</p>;
  if (data.length === 0) return <p>No data found.</p>;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-2">Fuel Entry History</h2>
      <div className="overflow-auto">
        <table className="min-w-full bg-white border rounded shadow text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Date</th>
              <th className="p-2">Fuel</th>
              <th className="p-2">Morning</th>
              <th className="p-2">Evening</th>
              <th className="p-2">Total</th>
              <th className="p-2">Unit</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">{row.entry_date}</td>
                <td className="p-2">{row.fuel_type}</td>
                <td className="p-2">
                  {row.morning_reading !== null ? row.morning_reading : "-"}
                </td>
                <td className="p-2">
                  {row.evening_reading !== null ? row.evening_reading : "-"}
                </td>
                <td className="p-2">
                  {row.total_consumption !== null ? row.total_consumption : "-"}
                </td>
                <td className="p-2">{row.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
