import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client"; // adjust as needed
import FuelHistory from "./FuelHistory";
import { useAuth } from "@/contexts/AuthContext";

const fuelTypes = [
  { type: "Diesel", unit: "liters" },
  { type: "LPG", unit: "kg" },
  { type: "Electricity", unit: "Units" },
  { type: "Firewood", unit: "kg" },
  { type: "Petrol", unit: "liters" },
  { type: "Water", unit: "liters" },
];

export default function FuelEntryCards() {
  const { profile } = useAuth();
  const [date, setDate] = useState("");
  const [entries, setEntries] = useState(
    fuelTypes.map((f) => ({
      type: f.type,
      unit: f.unit,
      morning: "",
      evening: "",
      total: "",
    }))
  );

  const handleChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;
    setEntries(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Replace this with real kitchen_id from context or props
    const kitchen_id = profile.kitchen_id;

    const payload = entries.map((entry) => {
      const base = {
        fuel_type: entry.type,
        unit: entry.unit,
        entry_date: date,
        kitchen_id,
      };

      return entry.type === "Electricity"
        ? {
            ...base,
            morning_reading: entry.morning ? parseFloat(entry.morning) : null,
            evening_reading: entry.evening ? parseFloat(entry.evening) : null,
            total_consumption: null,
          }
        : {
            ...base,
            total_consumption: entry.total ? parseFloat(entry.total) : null,
            morning_reading: null,
            evening_reading: null,
          };
    });

    const { error } = await supabase
      .from("kitchen_fuel_management")
      .upsert(payload, { onConflict: "kitchen_id,entry_date,fuel_type" });

    if (error) {
      alert("Error saving data");
      console.error(error);
    } else {
      alert("Fuel data saved successfully");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold">Daily Fuel Entry</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-4 mb-6">
          <label className="font-semibold text-lg">Date:</label>
          <input
            type="date"
            className="border rounded px-4 py-2 w-60"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((entry, idx) => (
            <div
              key={entry.type}
              className="rounded-xl border bg-white shadow p-5 space-y-4"
            >
              <div className="text-xl font-semibold text-gray-800">
                {entry.type}{" "}
                <span className="text-sm text-gray-500">({entry.unit})</span>
              </div>

              {entry.type === "Electricity" ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Opening Reading
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full border rounded px-3 py-2"
                      value={entry.morning}
                      onChange={(e) =>
                        handleChange(idx, "morning", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Closing Reading
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="mt-1 w-full border rounded px-3 py-2"
                      value={entry.evening}
                      onChange={(e) =>
                        handleChange(idx, "evening", e.target.value)
                      }
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Total Consumption
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="mt-1 w-full border rounded px-3 py-2"
                    value={entry.total}
                    onChange={(e) => handleChange(idx, "total", e.target.value)}
                    placeholder={`Enter amount in ${entry.unit}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Save Entries
          </button>
        </div>
      </form>

      <FuelHistory kitchenId={profile?.kitchen_id} />
    </div>
  );
}
