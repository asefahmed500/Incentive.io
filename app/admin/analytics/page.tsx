"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCommissions } from "@/lib/actions/commission.actions";
import { getTargets } from "@/lib/actions/target.actions";
import { getUsers } from "@/lib/actions/user.actions";
import { getTeams } from "@/lib/actions/team.actions";
import { getAllSalesRecords } from "@/lib/actions/sales.actions";
import { getFinanceApprovalTrends } from "@/lib/actions/analytics.actions";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#9ca3af"];

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalSales: 0,
    totalCommissions: 0,
    pendingSales: 0,
    approvedSales: 0,
  });
  const [statusData, setStatusData] = useState<
    { name: string; value: number }[]
  >([]);
  const [trendData, setTrendData] = useState<
    { month: string; approvedAmount: number; commissionPaid: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [users, teams, commissionsData, targets, salesData, trends] =
        await Promise.all([
          getUsers({ search: "", role: "all" }),
          getTeams(),
          getCommissions(),
          getTargets(),
          getAllSalesRecords({}),
          getFinanceApprovalTrends(6),
        ]);

      const safeUsers = Array.isArray(users) ? users : [];
      const safeTeams = Array.isArray(teams) ? teams : [];
      const safeCommissions = Array.isArray(commissionsData)
        ? commissionsData
        : [];
      const safeSales = Array.isArray(salesData) ? salesData : [];
      const safeTrends = Array.isArray(trends) ? trends : [];
      if (!Array.isArray(users))
        console.error((users as any)?.error || "Failed to fetch users");
      if (!Array.isArray(teams))
        console.error((teams as any)?.error || "Failed to fetch teams");
      if (!Array.isArray(commissionsData))
        console.error(
          (commissionsData as any)?.error || "Failed to fetch commissions"
        );

      const statusMap: Record<string, number> = {};
      for (const s of safeSales) {
        const st = s.status || "Unknown";
        statusMap[st] = (statusMap[st] || 0) + 1;
      }
      setStatusData(
        Object.entries(statusMap).map(([name, value]) => ({ name, value }))
      );

      setStats({
        totalUsers: safeUsers.length,
        totalTeams: safeTeams.length,
        totalSales: safeSales.length,
        totalCommissions: safeCommissions.reduce(
          (sum: number, c: any) => sum + (c.commission || 0),
          0
        ),
        pendingSales: safeCommissions.filter(
          (c: any) => c.status === "Pending"
        ).length,
        approvedSales: safeCommissions.filter(
          (c: any) => c.status === "Approved"
        ).length,
      });
      setTrendData(safeTrends);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          System overview and statistics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{stats.totalCommissions.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                    }
                  >
                    {statusData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Pending</span>
                <span className="font-medium">{stats.pendingSales}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Approved</span>
                <span className="font-medium">{stats.approvedSales}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Approval Trends</CardTitle>
        </CardHeader>
        <CardContent>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    typeof value === "number"
                      ? `৳${value.toLocaleString()}`
                      : value
                  }
                />
                <Legend />
                <Bar
                  dataKey="approvedAmount"
                  fill="#0ea5e9"
                  name="Approved Amount"
                />
                <Bar
                  dataKey="commissionPaid"
                  fill="#22c55e"
                  name="Commission Paid"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-muted-foreground">
              No trend data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}