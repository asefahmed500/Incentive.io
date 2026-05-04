"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, DollarSign, CheckCircle, Clock, XCircle, Database, TrendingUp } from "lucide-react";
import { getUsers } from "@/lib/actions/user.actions";
import { getTeams } from "@/lib/actions/team.actions";
import { getSalesStats } from "@/lib/actions/sales.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
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
    
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin panel</p>
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
  );
}