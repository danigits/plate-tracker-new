import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";

export function AttendanceEditor({
  kitchenId,
  staffList,
}: {
  kitchenId: string;
  staffList: any[];
}) {
  const [form, setForm] = useState({
    staff_id: "",
    date: dayjs().format("YYYY-MM-DD"),
    shift: "morning",
    status: "present",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("kitchen_staff_attendance")
      .upsert([{ ...form, kitchen_id: kitchenId }], {
        onConflict: ["staff_id", "date", "shift"],
      });

    setLoading(false);
    if (error) alert("Error: " + error.message);
    else alert("Attendance updated");
  };

  return (
    <div className="border rounded p-4 space-y-2">
      <select
        name="staff_id"
        value={form.staff_id}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option value="">Select Staff</option>
        {staffList.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name}
          </option>
        ))}
      </select>
      <input
        type="date"
        name="date"
        value={form.date}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <select
        name="shift"
        value={form.shift}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option value="morning">Morning</option>
        <option value="afternoon">Afternoon</option>
        <option value="evening">Evening</option>
      </select>
      <select
        name="status"
        value={form.status}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      >
        <option value="present">Present</option>
        <option value="absent">Absent</option>
        <option value="late">Late</option>
        <option value="on_leave">On Leave</option>
      </select>
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Saving..." : "Save Attendance"}
      </button>
    </div>
  );
}
