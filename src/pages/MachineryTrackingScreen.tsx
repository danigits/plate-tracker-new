// MachineryTrackingScreen.tsx
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import dayjs from "dayjs";
import { useAuth } from "@/contexts/AuthContext";

export function MachineryTrackingScreen() {
  const { profile } = useAuth();
  const kitchenId = profile?.kitchen_id;
  const userId = profile?.id;

  const [machineryList, setMachineryList] = useState<any[]>([]);
  const [logs, setLogs] = useState<any>({});

  useEffect(() => {
    if (!kitchenId) return;

    const fetchMachinery = async () => {
      const { data, error } = await supabase
        .from("machinery")
        .select("id, name")
        .eq("kitchen_id", kitchenId);

      if (error) console.error(error);
      else setMachineryList(data);
    };

    const fetchTodayLogs = async () => {
      const today = dayjs().format("YYYY-MM-DD");
      const { data, error } = await supabase
        .from("machinery_usage_log")
        .select("*")
        .gte("start_time", `${today}T00:00:00`)
        .eq("user_id", userId);

      if (!error && data) {
        const grouped = Object.fromEntries(
          data.map((log) => [log.machinery_id, log])
        );
        setLogs(grouped);
      }
    };

    fetchMachinery();
    fetchTodayLogs();
  }, [kitchenId]);

  const handleStart = async (machinery_id: string) => {
    const { error } = await supabase.from("machinery_usage_log").insert({
      machinery_id,
      user_id: userId,
      start_time: new Date().toISOString(),
    });
    if (error) return alert("Error: " + error.message);
    alert("Started tracking");
    window.location.reload();
  };

  const handleEnd = async (logId: string) => {
    const { error } = await supabase
      .from("machinery_usage_log")
      .update({ end_time: new Date().toISOString() })
      .eq("id", logId);

    if (error) return alert("Error: " + error.message);
    alert("Stopped tracking");
    window.location.reload();
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-bold">Machinery Daily Tracker</h2>

      {machineryList.map((machine) => {
        const log = logs[machine.id];
        return (
          <div
            key={machine.id}
            className="border p-4 rounded shadow-sm flex justify-between items-center"
          >
            <div>
              <div className="font-semibold text-lg">{machine.name}</div>
              {log?.start_time && (
                <div className="text-sm text-gray-600">
                  Start: {dayjs(log.start_time).format("HH:mm A")}
                </div>
              )}
              {log?.end_time && (
                <div className="text-sm text-gray-600">
                  End: {dayjs(log.end_time).format("HH:mm A")}
                </div>
              )}
            </div>

            {!log ? (
              <Button onClick={() => handleStart(machine.id)}>Start</Button>
            ) : !log.end_time ? (
              <Button onClick={() => handleEnd(log.id)} variant="destructive">
                Stop
              </Button>
            ) : (
              <span className="text-green-600 font-semibold">Completed</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
