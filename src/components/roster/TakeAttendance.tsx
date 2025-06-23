import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function TakeAttendance() {
  const [staff, setStaff] = useState<any[]>([]);
  const [marking, setMarking] = useState<
    { id: string; action: "present" | "absent" }[]
  >([]);
  const [attendance, setAttendance] = useState<{
    [id: string]: {
      status: "present" | "absent" | null;
      check_in_time?: string;
    };
  }>({});
  const [shift, setShift] = useState<string>("morning");
  const { user } = useAuth();

  useEffect(() => {
    if (user?.kitchenId) {
      fetchStaff();
      fetchAttendance();
    }
  }, [user?.kitchenId, shift]);

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

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from("kitchen_staff_attendance")
      .select("staff_id, status, check_in_time")
      .eq("kitchen_id", user?.kitchenId)
      .eq("date", dayjs().format("YYYY-MM-DD"))
      .eq("shift", shift);

    if (error) {
      console.error("Error fetching attendance:", error.message);
    }

    const attendanceMap: any = {};
    (data || []).forEach((row) => {
      attendanceMap[row.staff_id] = {
        status: row.status,
        check_in_time: row.check_in_time,
      };
    });

    setAttendance(attendanceMap);
  };

  const handleMarkAttendance = async (
    staffId: string,
    status: "present" | "absent"
  ) => {
    setMarking((prev) => [...prev, { id: staffId, action: status }]);

    // First delete any existing record for this staff/shift/day
    await supabase
      .from("kitchen_staff_attendance")
      .delete()
      .eq("staff_id", staffId)
      .eq("kitchen_id", user?.kitchenId)
      .eq("date", dayjs().format("YYYY-MM-DD"))
      .eq("shift", shift);

    // Then insert new record if marking present
    if (status === "present") {
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
      }
    }

    // Update local state
    setAttendance((prev) => ({
      ...prev,
      [staffId]: {
        status,
        check_in_time:
          status === "present" ? new Date().toISOString() : undefined,
      },
    }));

    setMarking((prev) => prev.filter((item) => item.id !== staffId));
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

      {staff.map((s) => {
        const isMarking = marking.some((m) => m.id === s.id);
        const currentStatus = attendance[s.id]?.status;

        return (
          <div
            key={s.id}
            className="p-2 border rounded flex justify-between items-center"
          >
            <div>
              <div className="font-medium">{s.full_name}</div>
              <div className="text-sm text-gray-600">{s.role}</div>
              {currentStatus === "present" &&
                attendance[s.id]?.check_in_time && (
                  <div className="text-xs text-gray-500">
                    {dayjs(attendance[s.id].check_in_time).format("h:mm A")}
                  </div>
                )}
            </div>

            <div className="flex gap-2">
              {currentStatus === "present" ? (
                <>
                  <span className="text-green-600 font-semibold">
                    ✅ Present
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAttendance(s.id, "absent")}
                    disabled={isMarking}
                  >
                    {isMarking ? "Updating..." : "Mark Absent"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleMarkAttendance(s.id, "absent")}
                    disabled={isMarking}
                  >
                    {isMarking ? "Updating..." : "Mark Absent"}
                  </Button>
                  <Button
                    onClick={() => handleMarkAttendance(s.id, "present")}
                    disabled={isMarking}
                  >
                    {isMarking ? "Updating..." : "Mark Present"}
                  </Button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
