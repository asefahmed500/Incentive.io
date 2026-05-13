"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wallet, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { getPendingFinanceApprovals } from "@/lib/actions/approval.actions";
import { getSalesStats } from "@/lib/actions/sales.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function FinanceDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    pending: 0,
    approvedToday: 0,
    totalApproved: 0,
    totalCommissions: 0,
    pendingPayments: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [pending, salesStats, commissions] = await Promise.all([
      getPendingFinanceApprovals(),
      getSalesStats(),
      getCommissions(),
    ]);

    const safePending = Array.isArray(pending) ? pending : [];
    const safeCommissions = Array.isArray(commissions) ? commissions : [];
    const safeSalesStats = salesStats && !("error" in salesStats) ? salesStats : { approvedToday: 0, approved: 0, pendingPayments: 0 };
    if (!Array.isArray(pending)) console.error((pending as any)?.error || "Failed to fetch pending approvals");
    if (!Array.isArray(commissions)) console.error((commissions as any)?.error || "Failed to fetch commissions");
    if ("error" in salesStats) console.error((salesStats as any).error || "Failed to fetch sales stats");

    const totalCommissions = safeCommissions.reduce((sum: number, c: any) => sum + (c.commission || 0), 0);

    setStats({
      pending: safePending.length,
      approvedToday: safeSalesStats.approvedToday,
      totalApproved: safeSalesStats.approved,
      totalCommissions,
      pendingPayments: safeSalesStats.pendingPayments,
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
  const paymentStatus = [
    { name: "Approved", value: stats.totalApproved, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" },
    { name: "Awaiting Payment", value: stats.pendingPayments, color: "#3b82f6" }
  ];

  const commissionTrends = [
    { month: "Jan", paid: 45000, pending: 8000, approved: 53000 },
    { month: "Feb", paid: 52000, pending: 12000, approved: 64000 },
    { month: "Mar", paid: 38000, pending: 6000, approved: 44000 },
    { month: "Apr", paid: 65000, pending: 15000, approved: 80000 },
    { month: "May", paid: 58000, pending: 10000, approved: 68000 },
  ];

  const approvalTrends = [
    { month: "Jan", approvals: 42, amount: 850000 },
    { month: "Feb", approvals: 48, amount: 920000 },
    { month: "Mar", approvals: 35, amount: 680000 },
    { month: "Apr", approvals: 55, amount: 1150000 },
    { month: "May", approvals: 50, amount: 1050000 },
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
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApproved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalCommissions.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={paymentStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {paymentStatus.map((entry, index) => (
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
            <CardTitle>Commission Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={commissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `৳${(value || 0).toLocaleString()}`}
                />
                <Legend />
                <Area type="monotone" dataKey="approved" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Approved" />
                <Area type="monotone" dataKey="paid" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Paid" />
                <Area type="monotone" dataKey="pending" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Pending" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Approval Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={approvalTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => name === "approvals" ? value : `৳${(value || 0).toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="approvals" fill="#10b981" name="Approvals" />
              <Bar dataKey="amount" fill="#3b82f6" name="Amount (৳)" />
            </BarChart>
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
              <p className="mb-2">{stats.pending} sales need final approval</p>
              <Button onClick={() => router.push("/finance/payment-queue")}>
                Review Now
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => router.push("/finance/payment-queue")}>
              Payment Queue
            </Button>
            <Button variant="outline" onClick={() => router.push("/finance/wallets")}>
              View Wallets
            </Button>
            <Button variant="outline" onClick={() => router.push("/finance/analytics")}>
              Analytics
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}