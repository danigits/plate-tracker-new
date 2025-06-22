import React, { useEffect, useState, useRef, useCallback } from "react";
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
import KitchenTripDashboard from "./KitchenTripDashboard";

interface Kitchen {
  id: string;
  name: string;
  status?: string;
}

interface WastageData {
  day: string;
  wasted_quantity: number;
}

interface PerformanceData {
  kitchenName: string;
  efficiency: number;
  wastagePercentage: number;
}

interface Stats {
  totalKitchens: number;
  estimatedPlates: number;
  avgWastageRate: string;
}

interface DashboardCache {
  wastage: Map<string, WastageData[]>;
  performance: Map<string, PerformanceData[]>;
  stats: Map<string, Stats>;
}

const DashboardStats: React.FC = () => {
  const [kitchens, setKitchens] = useState<Kitchen[]>([]);
  const [selectedKitchen, setSelectedKitchen] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 6))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [data, setData] = useState({
    weeklyWastage: [] as WastageData[],
    kitchenPerformance: [] as PerformanceData[],
    stats: {
      totalKitchens: 0,
      estimatedPlates: 0,
      avgWastageRate: 0,
    },
  });
  const [loading, setLoading] = useState({
    wastage: false,
    performance: false,
    stats: false,
  });

  const cacheRef = useRef<DashboardCache>({
    wastage: new Map(),
    performance: new Map(),
    stats: new Map(),
  });
  const abortControllers = useRef<Record<string, AbortController>>({});

  const getCacheKey = useCallback(
    (prefix: string) =>
      `${prefix}-${selectedKitchen}-${dateRange.start}-${dateRange.end}`,
    [selectedKitchen, dateRange]
  );

  useEffect(() => {
    const fetchKitchens = async () => {
      const { data: kitchenData, error } = await supabase
        .from("kitchens")
        .select("id, name");

      if (!error && kitchenData) {
        setKitchens(kitchenData);
        if (kitchenData.length) {
          // No need to set default kitchen since we're using "all"
        }
      }
    };

    fetchKitchens();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (kitchens.length) {
        // Only fetch if kitchens are loaded
        fetchAllData();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedKitchen, dateRange, kitchens]);

  useEffect(() => {
    return () => {
      Object.values(abortControllers.current).forEach((controller) =>
        controller.abort()
      );
    };
  }, []);

  const fetchAllData = useCallback(async () => {
    const wastageKey = getCacheKey("wastage");
    const performanceKey = getCacheKey("performance");
    const statsKey = getCacheKey("stats");

    // Cancel any pending requests
    Object.keys(abortControllers.current).forEach((key) => {
      abortControllers.current[key].abort();
    });

    // Create new abort controllers
    abortControllers.current = {
      [wastageKey]: new AbortController(),
      [performanceKey]: new AbortController(),
      [statsKey]: new AbortController(),
    };

    try {
      setLoading((prev) => ({
        ...prev,
        wastage: true,
        performance: true,
        stats: true,
      }));

      await Promise.all([
        fetchWeeklyWastage(wastageKey),
        fetchKitchenPerformance(performanceKey),
        fetchStats(statsKey),
      ]);
    } finally {
      setLoading((prev) => ({
        ...prev,
        wastage: false,
        performance: false,
        stats: false,
      }));
    }
  }, [getCacheKey]);

  const fetchWeeklyWastage = useCallback(
    async (cacheKey: string) => {
      if (cacheRef.current.wastage.has(cacheKey)) {
        setData((prev) => ({
          ...prev,
          weeklyWastage: cacheRef.current.wastage.get(cacheKey) || [],
        }));
        return;
      }

      try {
        let query = supabase
          .from("delivery_point_plan_items")
          .select("date, wasted_quantity, kitchen_id")
          .gte("date", dateRange.start)
          .lte("date", dateRange.end)
          .order("date", { ascending: true });

        if (selectedKitchen !== "all") {
          query = query.eq("kitchen_id", selectedKitchen);
        }

        const { data: wastageData, error } = await query.abortSignal(
          abortControllers.current[cacheKey].signal
        );

        if (!error && wastageData) {
          const processedData = wastageData.reduce((acc, item) => {
            const day = item.date;
            acc[day] = (acc[day] || 0) + (item.wasted_quantity || 0);
            return acc;
          }, {} as Record<string, number>);

          const result = Object.entries(processedData).map(
            ([day, wastage]) => ({
              day,
              wasted_quantity: wastage,
            })
          );

          cacheRef.current.wastage.set(cacheKey, result);
          setData((prev) => ({ ...prev, weeklyWastage: result }));
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Error fetching wastage data:", err);
        }
      }
    },
    [selectedKitchen, dateRange]
  );

  const fetchKitchenPerformance = useCallback(
    async (cacheKey: string) => {
      if (cacheRef.current.performance.has(cacheKey)) {
        setData((prev) => ({
          ...prev,
          kitchenPerformance: cacheRef.current.performance.get(cacheKey) || [],
        }));
        return;
      }

      try {
        let query = supabase
          .from("delivery_point_plan_items")
          .select("kitchen_id, estimated_plates, wasted_quantity")
          .gte("date", dateRange.start)
          .lte("date", dateRange.end);

        if (selectedKitchen !== "all") {
          query = query.eq("kitchen_id", selectedKitchen);
        }

        const { data: performanceData, error } = await query.abortSignal(
          abortControllers.current[cacheKey].signal
        );

        if (!error && performanceData) {
          const kitchenMap = kitchens.reduce((acc, kitchen) => {
            acc[kitchen.id] = kitchen.name;
            return acc;
          }, {} as Record<string, string>);

          const grouped = performanceData.reduce((acc, item) => {
            const id = item.kitchen_id;
            if (!acc[id]) acc[id] = { totalPlates: 0, totalWastage: 0 };
            acc[id].totalPlates += item.estimated_plates || 0;
            acc[id].totalWastage += item.wasted_plates || 0;
            return acc;
          }, {} as Record<string, { totalPlates: number; totalWastage: number }>);

          const result = Object.entries(grouped).map(([id, stats]) => ({
            kitchenName: kitchenMap[id] || id,
            efficiency:
              stats.totalPlates > 0
                ? 100 - (stats.totalWastage * 100) / stats.totalPlates
                : 100,
            wastagePercentage:
              stats.totalPlates > 0
                ? (stats.totalWastage * 100) / stats.totalPlates
                : 0,
          }));

          cacheRef.current.performance.set(cacheKey, result);
          setData((prev) => ({ ...prev, kitchenPerformance: result }));
        }
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Error fetching performance data:", err);
        }
      }
    },
    [dateRange, kitchens, selectedKitchen]
  );

  const fetchStats = useCallback(
    async (cacheKey: string) => {
      if (cacheRef.current.stats.has(cacheKey)) {
        setData((prev) => ({
          ...prev,
          stats: cacheRef.current.stats.get(cacheKey) || prev.stats,
        }));
        return;
      }

      try {
        let todayPlatesQuery = supabase
          .from("delivery_point_plan_items")
          .select("estimated_plates")
          .eq("date", dateRange.end);
        //.eq("menu_type", "breakfast");

        let todayWastageQuery = supabase
          .from("delivery_point_plan_items")
          .select("wasted_quantity, estimated_plates")
          .gte("date", dateRange.start)
          .lte("date", dateRange.end);

        if (selectedKitchen !== "all") {
          todayPlatesQuery = todayPlatesQuery.eq("kitchen_id", selectedKitchen);
          todayWastageQuery = todayWastageQuery.eq(
            "kitchen_id",
            selectedKitchen
          );
        }

        const [totalKitchensRes, todayPlatesRes, todayWastageRes] =
          await Promise.all([
            supabase
              .from("kitchens")
              .select("id")
              .abortSignal(abortControllers.current[cacheKey].signal),
            todayPlatesQuery.abortSignal(
              abortControllers.current[cacheKey].signal
            ),
            todayWastageQuery.abortSignal(
              abortControllers.current[cacheKey].signal
            ),
          ]);

        const result = {
          totalKitchens: totalKitchensRes.data?.length || 0,
          estimatedPlates:
            todayPlatesRes.data?.reduce(
              (sum, p) => sum + (p.estimated_plates || 0),
              0
            ) || 0,
          avgWastageRate: todayWastageRes.data?.length
            ? (
                (todayWastageRes.data.reduce(
                  (acc, item) => acc + (item.wasted_plates || 0),
                  0
                ) /
                  todayWastageRes.data.reduce(
                    (acc, item) => acc + (item.estimated_plates || 0),
                    1
                  )) *
                100
              ).toFixed(2)
            : "0",
        };

        cacheRef.current.stats.set(cacheKey, result);
        setData((prev) => ({ ...prev, stats: result }));
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Error fetching stats:", err);
        }
      }
    },
    [selectedKitchen, dateRange]
  );

  const csvData = React.useMemo(
    () =>
      data.weeklyWastage.map((row) => ({
        Date: row.day,
        "Wastage (kg)": row.wasted_quantity,
      })),
    [data.weeklyWastage]
  );

  const handleDateChange = useCallback(
    (type: "start" | "end", value: string) => {
      setDateRange((prev) => ({ ...prev, [type]: value }));
    },
    []
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="w-[200px]">
          <label className="text-sm text-muted-foreground block mb-1">
            Kitchen
          </label>
          <Select
            value={selectedKitchen}
            onValueChange={(value) => {
              setSelectedKitchen(value);
              cacheRef.current = {
                wastage: new Map(),
                performance: new Map(),
                stats: new Map(),
              };
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select kitchen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Kitchens</SelectItem>
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
            value={dateRange.start}
            onChange={(e) => handleDateChange("start", e.target.value)}
            disabled={loading.wastage || loading.performance || loading.stats}
          />
        </div>
        <div className="w-[200px]">
          <label className="text-sm text-muted-foreground block mb-1">
            End Date
          </label>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => handleDateChange("end", e.target.value)}
            disabled={loading.wastage || loading.performance || loading.stats}
          />
        </div>
        <CSVLink data={csvData} filename={`wastage_stats.csv`}>
          <Button className="ml-auto" disabled={loading.wastage}>
            {loading.wastage ? "Loading..." : "Export CSV"}
          </Button>
        </CSVLink>
      </div>

      {(loading.wastage || loading.performance || loading.stats) && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg">Loading data...</div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>
              Weekly Wastage Overview
              {loading.wastage && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Loading...)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.weeklyWastage.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyWastage}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="wasted_quantity"
                    name="Food Wastage (kg)"
                    fill="#ef4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                {loading.wastage ? "Loading data..." : "No data available"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-full lg:col-span-1">
          <CardHeader>
            <CardTitle>
              Kitchen Performance
              {loading.performance && (
                <span className="text-sm text-muted-foreground ml-2">
                  (Loading...)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {data.kitchenPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.kitchenPerformance}>
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
            ) : (
              <div className="flex items-center justify-center h-full">
                {loading.performance ? "Loading data..." : "No data available"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kitchens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{data.stats.totalKitchens}</div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Estimated Plates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{data.stats.estimatedPlates}</div>
            {/* <div className="stat-value">{data.stats.estimatedPlates}</div>
            <div className="stat-value">{data.stats.estimatedPlates}</div>
            <div className="stat-value">{data.stats.estimatedPlates}</div> */}
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Wastage Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value">{data.stats.avgWastageRate}%</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardStats;
