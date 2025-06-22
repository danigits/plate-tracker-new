import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function TakeAttendance() {
  const [staff, setStaff] = useState<any[]>([]);
  const [marking, setMarking] = useState<string[]>([]);
  const [marked, setMarked] = useState<{ [id: string]: boolean }>({});
  const [shift, setShift] = useState<string>("morning"); // ✅ fixed: use string not string[]
  const { user } = useAuth();

  useEffect(() => {
    if (user?.kitchenId) {
      fetchStaff();
      fetchMarked();
    }
  }, [user?.kitchenId, shift]); // ✅ fixed: added shift and user dependency

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("kitchen_staff")
      .select("id, full_name, role")
      .eq("kitchen_id", user?.kitchenId)
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching staff:", error.message);
    }

    setStaff(data || []);
  };

  const fetchMarked = async () => {
    const { data, error } = await supabase
      .from("kitchen_staff_attendance")
      .select("staff_id")
      .eq("kitchen_id", user?.kitchenId)
      .eq("date", dayjs().format("YYYY-MM-DD"))
      .eq("shift", shift);

    if (error) {
      console.error("Error fetching attendance:", error.message);
    }

    const markedMap: any = {};
    (data || []).forEach((row) => {
      markedMap[row.staff_id] = true;
    });

    setMarked(markedMap);
  };

  const handleMarkPresent = async (staffId: string) => {
    setMarking((prev) => [...prev, staffId]);

    const { error } = await supabase.from("kitchen_staff_attendance").insert([
      {
        staff_id: staffId,
        kitchen_id: user?.kitchenId,
        date: dayjs().format("YYYY-MM-DD"),
        shift,
        status: "present",
        check_in_time: new Date(),
      },
    ]);

    if (error) {
      alert("Error marking attendance: " + error.message);
    } else {
      setMarked((prev) => ({ ...prev, [staffId]: true }));
    }

    setMarking((prev) => prev.filter((id) => id !== staffId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">Take Attendance</h2>
        <select
          className="border p-1 rounded"
          value={shift}
          onChange={(e) => setShift(e.target.value)}
        >
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>

      {staff.map((s) => (
        <div
          key={s.id}
          className="p-2 border rounded flex justify-between items-center"
        >
          <div>
            <div className="font-medium">{s.full_name}</div>
            <div className="text-sm text-gray-600">{s.role}</div>
          </div>
          {marked[s.id] ? (
            <span className="text-green-600 font-semibold">✅ Marked</span>
          ) : (
            <Button
              onClick={() => handleMarkPresent(s.id)}
              disabled={marking.includes(s.id)}
            >
              {marking.includes(s.id) ? "Marking..." : "Mark Present"}
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
