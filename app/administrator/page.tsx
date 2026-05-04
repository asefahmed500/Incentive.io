"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, FileText, Wallet, Activity, Database, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { getUsers } from "@/lib/actions/user.actions";
import { getTeams } from "@/lib/actions/team.actions";
import { getSalesStats } from "@/lib/actions/sales.actions";
import { getCommissions } from "@/lib/actions/commission.actions";

export default function AdministratorDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    teams: 0,
    sales: 0,
    pendingSales: 0,
    approvedSales: 0,
    commissions: 0,
    totalCommissionAmount: 0,
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
      
      const totalCommissionAmount = safeCommissions.reduce((sum: number, c: any) => sum + (c.commission || 0), 0);
      
      setStats({
        users: Array.isArray(users) ? users.length : 0,
        teams: Array.isArray(teams) ? teams.length : 0,
        sales: safeSalesStats.total,
        pendingSales: safeSalesStats.pendingManager + safeSalesStats.pendingAccountant + safeSalesStats.pendingFinance,
        approvedSales: safeSalesStats.approved,
        commissions: safeCommissions.length,
        totalCommissionAmount,
      });
      
      // Check health
      try {
        const res = await fetch("/api/health");
        const data = await res.json();
        setHealth({
          database: data.database?.connected || false,
          api: data.overall === "healthy",
          auth: true,
        });
      } catch (error) {
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
        <h1 className="text-3xl font-bold">SuperAdmin Dashboard</h1>
        <p className="text-muted-foreground">Full system overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSales}</div>
            <p className="text-xs text-muted-foreground">{stats.sales} total</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Amount</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalCommissionAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.commissions} records</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/administrator/sync" className="block p-3 rounded-md border hover:bg-gray-50 transition-colors">
                <p className="font-medium">Database Sync</p>
                <p className="text-sm text-muted-foreground">Recalculate all commissions</p>
              </a>
              <a href="/administrator/backups" className="block p-3 rounded-md border hover:bg-gray-50 transition-colors">
                <p className="font-medium">Backup / Restore</p>
                <p className="text-sm text-muted-foreground">Manage database backups</p>
              </a>
              <a href="/administrator/audit-logs" className="block p-3 rounded-md border hover:bg-gray-50 transition-colors">
                <p className="font-medium">Audit Logs</p>
                <p className="text-sm text-muted-foreground">View system activity</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}