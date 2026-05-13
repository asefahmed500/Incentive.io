"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wallet, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { getPendingAccountantApprovals } from "@/lib/actions/approval.actions";
import { getSalesStats } from "@/lib/actions/sales.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function AccountantDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    processedToday: 0,
    totalProcessed: 0,
    totalDeductions: 0,
    pendingFinance: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [pending, salesStats, commissions] = await Promise.all([
      getPendingAccountantApprovals(),
      getSalesStats(),
      getCommissions(),
    ]);

    const safePending = Array.isArray(pending) ? pending : [];
    const safeStats = salesStats && !("error" in salesStats) ? salesStats : { processedToday: 0, approved: 0, pendingFinance: 0, totalDeductions: 0 };
    if (!Array.isArray(pending)) console.error((pending as any)?.error || "Failed to fetch pending approvals");
    if ("error" in salesStats) console.error((salesStats as any).error || "Failed to fetch sales stats");

    setStats({
      pending: safePending.length,
      processedToday: safeStats.processedToday,
      totalProcessed: safeStats.approved + safeStats.pendingFinance,
      totalDeductions: safeStats.totalDeductions,
      pendingFinance: safeStats.pendingFinance,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  if (loading) return <DashboardSkeleton />;

  // Prepare chart data
  const processingStatus = [
    { name: "Processed", value: stats.totalProcessed, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" }
  ];

  const deductionBreakdown = [
    { type: "Tax", amount: stats.totalDeductions * 0.15 },
    { type: "VAT", amount: stats.totalDeductions * 0.10 },
    { type: "EO/BP", amount: stats.totalDeductions * 0.05 },
  ];

  const processingTrends = [
    { month: "Jan", processed: 45, deductions: 67500, pending: 8 },
    { month: "Feb", processed: 52, deductions: 78000, pending: 12 },
    { month: "Mar", processed: 48, deductions: 72000, pending: 10 },
    { month: "Apr", processed: 65, deductions: 97500, pending: 15 },
    { month: "May", processed: 58, deductions: 87000, pending: 11 },
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
          </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed Today</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processedToday}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProcessed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deductions</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalDeductions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={processingStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {processingStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deduction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={deductionBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `৳${(value || 0).toLocaleString()}`}
                />
                <Bar dataKey="amount" fill="#f59e0b" name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Volume & Deductions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={processingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => name === "deductions" ? `৳${(value || 0).toLocaleString()}` : value}
              />
              <Legend />
              <Area type="monotone" dataKey="processed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Processed" />
              <Area type="monotone" dataKey="deductions" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Deductions" />
              <Area type="monotone" dataKey="pending" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Pending" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.pending > 0 && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{stats.pending} sales need processing</p>
              <Button onClick={() => router.push("/accountant/approvals")}>
                Process Now
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => router.push("/accountant/approvals")}>
              View Approvals
            </Button>
            <Button variant="outline" onClick={() => router.push("/accountant/records")}>
              Processed Records
            </Button>
            <Button variant="outline" onClick={() => router.push("/accountant/wallets")}>
              View Wallets
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}