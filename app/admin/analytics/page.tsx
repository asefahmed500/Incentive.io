"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCommissions } from "@/lib/actions/commission.actions";
import { getTargets } from "@/lib/actions/target.actions";
import { getUsers } from "@/lib/actions/user.actions";
import { getTeams } from "@/lib/actions/team.actions";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTeams: 0,
    totalSales: 0,
    totalCommissions: 0,
    pendingSales: 0,
    approvedSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [users, teams, commissionsData, targets] = await Promise.all([
        getUsers({ search: "", role: "all" }),
        getTeams(),
        getCommissions(),
        getTargets(),
      ]);
      
      const safeUsers = Array.isArray(users) ? users : [];
      const safeTeams = Array.isArray(teams) ? teams : [];
      const safeCommissions = Array.isArray(commissionsData) ? commissionsData : [];
      if (!Array.isArray(users)) console.error((users as any)?.error || "Failed to fetch users");
      if (!Array.isArray(teams)) console.error((teams as any)?.error || "Failed to fetch teams");
      if (!Array.isArray(commissionsData)) console.error((commissionsData as any)?.error || "Failed to fetch commissions");
      
      setStats({
        totalUsers: safeUsers.length,
        totalTeams: safeTeams.length,
        totalSales: safeCommissions.length,
        totalCommissions: safeCommissions.reduce((sum: number, c: any) => sum + (c.commission || 0), 0),
        pendingSales: safeCommissions.filter((c: any) => c.status === "Pending").length,
        approvedSales: safeCommissions.filter((c: any) => c.status === "Approved").length,
      });
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
        <p className="text-muted-foreground">System overview and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalCommissions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Status</CardTitle>
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
        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Active Targets</span>
                <span className="font-medium">{stats.totalUsers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}