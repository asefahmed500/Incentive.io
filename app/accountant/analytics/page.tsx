"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, FileText } from "lucide-react";
import { getCommissions } from "@/lib/actions/commission.actions";
import { getAllSalesRecords } from "@/lib/actions/sales.actions";
import { getDeductionBreakdown } from "@/lib/actions/analytics.actions";
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DEDUCTION_COLORS = ["#ef4444", "#f59e0b", "#3b82f6"];

export default function AccountantAnalytics() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommission: 0,
    avgDeduction: 0,
    processedCount: 0,
  });
  const [trendData, setTrendData] = useState<
    { month: string; commission: number }[]
  >([]);
  const [deductionData, setDeductionData] = useState<
    { type: string; amount: number }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [commissions, sales, deductions] = await Promise.all([
        getCommissions(),
        getAllSalesRecords({}),
        getDeductionBreakdown(6),
      ]);

      const safeCommissions = Array.isArray(commissions) ? commissions : [];
      const safeSales = Array.isArray(sales) ? sales : [];
      const safeDeductions = Array.isArray(deductions) ? deductions : [];
      if (!Array.isArray(commissions))
        console.error(
          (commissions as any)?.error || "Failed to fetch commissions"
        );
      if (!Array.isArray(sales))
        console.error((sales as any)?.error || "Failed to fetch sales");

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthlyMap: Record<string, number> = {};
      for (const c of safeCommissions) {
        const d = new Date(c.createdAt || Date.now());
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[key] =
          (monthlyMap[key] || 0) +
          (c.calculatedCommission || c.commission || 0);
      }
      const trendEntries = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([key, val]) => {
          const [, month] = key.split("-");
          return { month: monthNames[parseInt(month) - 1], commission: val };
        });

      setTrendData(trendEntries);
      setDeductionData(
        safeDeductions.map((d: any) => ({ type: d.type, amount: d.amount }))
      );

      const totalCommission = safeCommissions.reduce(
        (sum: number, c: any) => sum + (c.calculatedCommission || 0),
        0
      );
      const avgDeduction =
        safeSales.length > 0
          ? Math.round(
              safeSales.reduce(
                (sum: number, s: any) =>
                  sum +
                  ((s.taxAmount || 0) + (s.vatAmount || 0) + (s.eoBpAmount || 0)),
                0
              ) / safeSales.length
            )
          : 0;

      setStats({
        totalSales: safeSales.length,
        totalCommission,
        avgDeduction,
        processedCount: safeCommissions.length,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Commission trends and deduction breakdown
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sales
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commission
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{stats.totalCommission.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Deduction
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{stats.avgDeduction.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commission Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
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
                  <Area
                    type="monotone"
                    dataKey="commission"
                    stroke="#0ea5e9"
                    fill="#0ea5e9"
                    fillOpacity={0.2}
                    name="Commission"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deduction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {deductionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deductionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="amount"
                    label={({ name, value }) =>
                      `${name}: ৳${value?.toLocaleString()}`
                    }
                    nameKey="type"
                  >
                    {deductionData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DEDUCTION_COLORS[index % DEDUCTION_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      typeof value === "number"
                        ? `৳${value.toLocaleString()}`
                        : value
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                No deduction data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}