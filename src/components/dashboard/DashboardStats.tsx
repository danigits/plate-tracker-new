import React, { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  LineChart,
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CSVLink } from "react-csv";

const DashboardStats: React.FC = () => {
  const [kitchens, setKitchens] = useState<any[]>([]);
  const [selectedKitchen, setSelectedKitchen] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().setDate(new Date().getDate() - 6))
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [weeklyWastage, setWeeklyWastage] = useState<any[]>([]);
  const [kitchenPerformance, setKitchenPerformance] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalKitchens: 0,
    estimatedPlates: 0,
    avgWastageRate: 0,
  });

  const cacheRef = useRef<Map<string, any>>(new Map());

  const getCacheKey = (prefix: string) =>
    `${prefix}-${selectedKitchen}-${startDate}-${endDate}`;

  useEffect(() => {
    fetchKitchens();
  }, []);

  useEffect(() => {
    if (selectedKitchen) {
      fetchWeeklyWastage();
      fetchKitchenPerformance();
      fetchStats();
    }
  }, [selectedKitchen, startDate, endDate]);

  const fetchKitchens = async () => {
    const { data, error } = await supabase.from("kitchens").select("id, name");
    if (!error && data) {
      setKitchens(data);
      if (!selectedKitchen && data.length) {
        setSelectedKitchen(data[0].id);
      }
    }
  };

  const fetchWeeklyWastage = async () => {
    const key = getCacheKey("wastage");
    if (cacheRef.current.has(key)) {
      setWeeklyWastage(cacheRef.current.get(key));
      return;
    }

    const { data, error } = await supabase
      .from("preparation_plan_items")
      .select("date, wastage")
      .eq("kitchen_id", selectedKitchen)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (!error && data) {
      const byDate = data.reduce((acc: any, item: any) => {
        const day = item.date;
        acc[day] = (acc[day] || 0) + (item.wastage || 0);
        return acc;
      }, {});

      const result = Object.entries(byDate).map(([day, wastage]) => ({
        day,
        wastage,
      }));
      setWeeklyWastage(result);
      cacheRef.current.set(key, result);
    }
  };

  const fetchKitchenPerformance = async () => {
    const key = getCacheKey("performance");
    if (cacheRef.current.has(key)) {
      setKitchenPerformance(cacheRef.current.get(key));
      return;
    }

    const { data, error } = await supabase
      .from("preparation_plan_items")
      .select("kitchen_id, estimated_plates, wastage")
      .gte("date", startDate)
      .lte("date", endDate);

    if (!error && data) {
      const grouped = data.reduce((acc: any, item: any) => {
        const id = item.kitchen_id;
        if (!acc[id]) acc[id] = { totalPlates: 0, totalWastage: 0 };
        acc[id].totalPlates += item.estimated_plates || 0;
        acc[id].totalWastage += item.wastage || 0;
        return acc;
      }, {});

      const kitchenNames = kitchens.reduce((acc: any, k: any) => {
        acc[k.id] = k.name;
        return acc;
      }, {});

      const result = Object.entries(grouped).map(([id, stats]: any) => ({
        kitchenName: kitchenNames[id] || id,
        efficiency:
          stats.totalPlates > 0
            ? 100 - (stats.totalWastage * 100) / stats.totalPlates
            : 100,
        wastagePercentage:
          stats.totalPlates > 0
            ? (stats.totalWastage * 100) / stats.totalPlates
            : 0,
      }));

      setKitchenPerformance(result);
      cacheRef.current.set(key, result);
    }
  };

  const fetchStats = async () => {
    const key = getCacheKey("stats");
    if (cacheRef.current.has(key)) {
      setStats(cacheRef.current.get(key));
      return;
    }

    const [totalKitchensRes, todayPlatesRes, todayWastageRes] =
      await Promise.all([
        supabase.from("kitchens").select("id, status"),
        supabase
          .from("preparation_plan_items")
          .select("estimated_plates")
          .eq("date", endDate)
          .eq("kitchen_id", selectedKitchen),
        supabase
          .from("preparation_plan_items")
          .select("wastage, estimated_plates")
          .gte("date", startDate)
          .lte("date", endDate)
          .eq("kitchen_id", selectedKitchen),
      ]);

    const totalKitchens = totalKitchensRes.data?.length || 0;
    const estimatedPlates =
      todayPlatesRes.data?.reduce(
        (sum, p) => sum + (p.estimated_plates || 0),
        0
      ) || 0;
    const avgWastageRate =
      todayWastageRes.data && todayWastageRes.data.length
        ? (todayWastageRes.data.reduce(
            (acc, item) => acc + (item.wastage || 0),
            0
          ) /
            todayWastageRes.data.reduce(
              (acc, item) => acc + (item.estimated_plates || 0),
              1
            )) *
          100
        : 0;

    const result = {
      totalKitchens,
      estimatedPlates,
      avgWastageRate: avgWastageRate.toFixed(2),
    };

    setStats(result);
    cacheRef.current.set(key, result);
  };

  const csvData = weeklyWastage.map((row) => ({
    Date: row.day,
    Wastage: row.wastage,
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="w-[200px]">
          <label className="text-sm text-muted-foreground block mb-1">
            Kitchen
          </label>
          <Select value={selectedKitchen} onValueChange={setSelectedKitchen}>
            <SelectTrigger>
              <SelectValue placeholder="Select kitchen" />
            </SelectTrigger>
            <SelectContent>
              {kitchens.map((kitchen) => (
                <SelectItem key={kitchen.id} value={kitchen.id}>
                  {kitchen.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-[200px]">
          <label className="text-sm text-muted-foreground block mb-1">
            Start Date
          </label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-[200px]">
          <label className="text-sm text-muted-foreground block mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <CSVLink
          data={csvData}
          filename={`wastage_stats_${startDate}_to_${endDate}.csv`}
        >
          <Button className="ml-auto">Export CSV</Button>
        </CSVLink>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Wastage Overview</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyWastage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="wastage"
                  name="Food Wastage (kg)"
                  fill="#ef4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>Kitchen Performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kitchenPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kitchenName" />
                <YAxis yAxisId="left" orientation="left" stroke="#10b981" />
                <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="efficiency"
                  name="Efficiency (%)"
                  stroke="#10b981"
                  activeDot={{ r: 8 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="wastagePercentage"
                  name="Wastage (%)"
                  stroke="#ef4444"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kitchens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.totalKitchens}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Estimated Plates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.estimatedPlates}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Wastage Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{stats.avgWastageRate}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
