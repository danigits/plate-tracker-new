
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, ResponsiveContainer, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line } from 'recharts';
import { mockWeeklyWastage, mockKitchenPerformance } from '@/data/mockData';

const DashboardStats: React.FC = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="col-span-full lg:col-span-2">
        <CardHeader>
          <CardTitle>Weekly Wastage Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockWeeklyWastage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="wastage" name="Food Wastage (kg)" fill="#ef4444" />
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
            <LineChart data={mockKitchenPerformance}>
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
          <div className="stat-value">40</div>
          <p className="stat-label">34 Active, 2 Inactive, 4 Maintenance</p>
        </CardContent>
      </Card>

      <Card className="stat-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Today's Estimated Plates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="stat-value">4,280</div>
          <p className="stat-label">
            <span className="trend-up">↑2.1% </span>
            from yesterday
          </p>
        </CardContent>
      </Card>

      <Card className="stat-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg. Wastage Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="stat-value">3.8%</div>
          <p className="stat-label">
            <span className="trend-down">↓0.5% </span>
            from last week
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
