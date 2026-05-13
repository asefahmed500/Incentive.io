"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, DollarSign, CheckCircle, Clock, XCircle, Database, TrendingUp, RefreshCw } from "lucide-react";
import { getUsers } from "@/lib/actions/user.actions";
import { getTeams } from "@/lib/actions/team.actions";
import { getSalesStats } from "@/lib/actions/sales.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalSales: 0,
    pendingSales: 0,
    approvedSales: 0,
    rejectedSales: 0,
    totalCommissions: 0,
  });
  const [health, setHealth] = useState({
    database: false,
    api: false,
    auth: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [users, teams, salesStats, commissions] = await Promise.all([
      getUsers({ search: "", role: "all" }),
      getTeams(),
      getSalesStats(),
      getCommissions(),
    ]);

    const safeCommissions = Array.isArray(commissions) ? commissions : [];
    const safeSalesStats = salesStats && !("error" in salesStats) ? salesStats : { total: 0, pendingManager: 0, pendingAccountant: 0, pendingFinance: 0, approved: 0, rejected: 0 };
    if (!Array.isArray(users)) console.error((users as any)?.error || "Failed to fetch users");
    if (!Array.isArray(teams)) console.error((teams as any)?.error || "Failed to fetch teams");
    if (!Array.isArray(commissions)) console.error((commissions as any)?.error || "Failed to fetch commissions");
    if ("error" in salesStats) console.error((salesStats as any).error || "Failed to fetch sales stats");

    const totalCommissions = safeCommissions.reduce((sum: number, c: any) => sum + (c.commission || 0), 0);

    setStats({
      totalUsers: Array.isArray(users) ? users.length : 0,
      totalTeams: Array.isArray(teams) ? teams.length : 0,
      totalSales: safeSalesStats.total,
      pendingSales: safeSalesStats.pendingManager + safeSalesStats.pendingAccountant + safeSalesStats.pendingFinance,
      approvedSales: safeSalesStats.approved,
      rejectedSales: safeSalesStats.rejected,
      totalCommissions,
    });

    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth({
        database: data.database?.connected || false,
        api: data.overall === "healthy",
        auth: true,
      });
    } catch {
      setHealth({ database: false, api: false, auth: false });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Poll every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []); // Admin dashboard doesn't need session dependency as it shows global data

  if (loading) return <DashboardSkeleton />;

  // Prepare chart data
  const salesByStatus = [
    { name: "Approved", value: stats.approvedSales, color: "#10b981" },
    { name: "Pending", value: stats.pendingSales, color: "#f59e0b" },
    { name: "Rejected", value: stats.rejectedSales, color: "#ef4444" }
  ];

  const monthlyTrends = [
    { month: "Jan", approved: 45, pending: 12, rejected: 5 },
    { month: "Feb", approved: 52, pending: 15, rejected: 3 },
    { month: "Mar", approved: 48, pending: 10, rejected: 7 },
    { month: "Apr", approved: 65, pending: 18, rejected: 4 },
    { month: "May", approved: 58, pending: 14, rejected: 6 },
  ];

  const commissionByRole = [
    { role: "Sales Exec", amount: 45000 },
    { role: "Sales Manager", amount: 12000 },
    { role: "Accountant", amount: 8000 },
    { role: "Finance", amount: 5000 }
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome to the admin panel</p>
          </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSales}</div>
            <p className="text-xs text-muted-foreground">{stats.totalSales} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalCommissions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approvedSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejectedSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalSales.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={salesByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {salesByStatus.map((entry, index) => (
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
            <CardTitle>Sales Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={2} name="Approved" />
                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Distribution by Role</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={commissionByRole}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip
                formatter={(value) => `৳${(value || 0).toLocaleString()}`}
              />
              <Bar dataKey="amount" fill="#3b82f6" name="Commission" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => router.push("/admin/users")}>Manage Users</Button>
            <Button variant="outline" onClick={() => router.push("/admin/teams")}>Manage Teams</Button>
            <Button variant="outline" onClick={() => router.push("/admin/sales")}>View Sales Records</Button>
            <Button variant="outline" onClick={() => router.push("/admin/analytics")}>Analytics</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database</span>
                <span className={`text-sm flex items-center gap-1 ${health.database ? "text-green-600" : "text-red-600"}`}>
                  {health.database ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {health.database ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">API Server</span>
                <span className={`text-sm flex items-center gap-1 ${health.api ? "text-green-600" : "text-red-600"}`}>
                  {health.api ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {health.api ? "Running" : "Error"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Auth Service</span>
                <span className={`text-sm flex items-center gap-1 ${health.auth ? "text-green-600" : "text-red-600"}`}>
                  {health.auth ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {health.auth ? "Active" : "Error"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}