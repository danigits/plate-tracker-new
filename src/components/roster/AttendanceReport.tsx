import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@/contexts/AuthContext";

export function AttendanceReport() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{
    [staffId: string]: { [date: string]: string };
  }>({});
  const [startDate, setStartDate] = useState<Date>(
    dayjs().subtract(6, "day").toDate()
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const getDateRange = () => {
    const range: string[] = [];
    for (
      let d = dayjs(startDate);
      d.isBefore(endDate) || d.isSame(endDate, "day");
      d = d.add(1, "day")
    ) {
      range.push(d.format("YYYY-MM-DD"));
    }
    return range;
  };

  const fetchData = async () => {
    const days = getDateRange();

    const { data: staffList, error: staffError } = await supabase
      .from("kitchen_staff")
      .select("id, full_name")
      .eq("kitchen_id", user?.kitchenId)
      .eq("is_active", true);

    if (staffError) {
      console.error("Staff fetch error", staffError);
      return;
    }

    const { data: attData, error: attError } = await supabase
      .from("kitchen_staff_attendance")
      .select("staff_id, date, status")
      .in("date", days)
      .eq("kitchen_id", user?.kitchenId);

    if (attError) {
      console.error("Attendance fetch error", attError);
      return;
    }

    const attMap: any = {};
    (attData || []).forEach((row) => {
      if (!attMap[row.staff_id]) attMap[row.staff_id] = {};
      attMap[row.staff_id][row.date] = row.status;
    });

    setStaff(staffList || []);
    setAttendance(attMap);
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const days = getDateRange();

  const renderCell = (staffId: string, date: string) => {
    const status = attendance[staffId]?.[date] || "-";
    switch (status) {
      case "present":
        return "✅";
      case "absent":
        return "❌";
      case "late":
        return "🕒";
      case "on_leave":
        return "🏖️";
      default:
        return "-";
    }
  };

  const countStatus = (staffId: string, status: string) =>
    days.filter((d) => attendance[staffId]?.[d] === status).length;

  const exportToExcel = () => {
    const exportData = staff.map((s) => {
      const row: any = { Name: s.full_name };
      days.forEach((d) => {
        row[dayjs(d).format("DD MMM")] = attendance[s.id]?.[d] || "-";
      });
      row["Present"] = countStatus(s.id, "present");
      row["Absent"] = countStatus(s.id, "absent");
      row["Late"] = countStatus(s.id, "late");
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");

    const blob = XLSX.write(wb, { bookType: "csv", type: "array" });
    saveAs(new Blob([blob]), "attendance_report.csv");
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(d) => setStartDate(d!)}
            className="border p-1 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={(d) => setEndDate(d!)}
            className="border p-1 rounded"
          />
        </div>
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 py-1 rounded h-fit mt-5"
        >
          Refresh
        </button>
        <button
          onClick={exportToExcel}
          className="bg-green-600 text-white px-4 py-1 rounded h-fit mt-5"
        >
          Export to Excel
        </button>
      </div>

      <div className="overflow-auto border rounded-xl">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1">Staff Name</th>
              {days.map((date) => (
                <th key={date} className="px-2 py-1 text-xs">
                  {dayjs(date).format("DD MMM")}
                </th>
              ))}
              <th>✅</th>
              <th>❌</th>
              <th>🕒</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-2 py-1">{s.full_name}</td>
                {days.map((d) => (
                  <td key={d} className="px-2 text-center">
                    {renderCell(s.id, d)}
                  </td>
                ))}
                <td className="text-center">{countStatus(s.id, "present")}</td>
                <td className="text-center">{countStatus(s.id, "absent")}</td>
                <td className="text-center">{countStatus(s.id, "late")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
