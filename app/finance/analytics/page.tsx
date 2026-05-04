"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, FileText, Calendar, Download } from "lucide-react";
import { getCommissions } from "@/lib/actions/commission.actions";
import { getAllSalesRecords } from "@/lib/actions/sales.actions";

export default function FinanceAnalytics() {
  const [stats, setStats] = useState({
    totalPayout: 0,
    pendingPayout: 0,
    monthlyPayout: 0,
    avgCommission: 0,
    recordsProcessed: 0,
    eligibleCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState("month");

  const fetchData = async () => {
    setLoading(true);
    const [commissions, sales] = await Promise.all([
      getCommissions(),
      getAllSalesRecords({}),
    ]);

    const now = new Date();
    let periodStart = new Date();
    if (periodFilter === "month") {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (periodFilter === "week") {
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      periodStart = new Date(0);
    }

    const safeCommissions = Array.isArray(commissions) ? commissions : [];
    const safeSales = Array.isArray(sales) ? sales : [];
    if (!Array.isArray(commissions)) console.error((commissions as any)?.error || "Failed to fetch commissions");
    if (!Array.isArray(sales)) console.error((sales as any)?.error || "Failed to fetch sales");

    const periodCommissions = safeCommissions.filter(
      (c: any) => new Date(c.createdAt) >= periodStart
    );

    const totalPayout = periodCommissions
      .filter((c: any) => c.isPaid)
      .reduce((sum: number, c: any) => sum + (c.calculatedCommission || 0), 0);

    const pendingPayout = periodCommissions
      .filter((c: any) => !c.isPaid)
      .reduce((sum: number, c: any) => sum + (c.calculatedCommission || 0), 0);

    const eligibleCount = periodCommissions.filter(
      (c: any) => c.status === "ELIGIBLE"
    ).length;

    setStats({
      totalPayout,
      pendingPayout,
      monthlyPayout: totalPayout,
      avgCommission: periodCommissions.length > 0 
        ? totalPayout / periodCommissions.length 
        : 0,
      recordsProcessed: safeSales.filter((s: any) => s.financeStatus === "Approved").length,
      eligibleCount,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [periodFilter]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Payment trends and commission analytics</p>
      </div>

      <div className="flex gap-2">
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="rounded-md border px-3 py-2"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout (Period)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalPayout.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payout</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ৳{stats.pendingPayout.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ৳{stats.avgCommission.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eligible Records</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eligibleCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart placeholder - Payment trends over time
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Commission Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  0-80% Achievement
                </span>
                <span className="font-medium">2.0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  81-100% Achievement
                </span>
                <span className="font-medium">3.0%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  101-150% Achievement
                </span>
                <span className="font-medium">4.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  151%+ Achievement
                </span>
                <span className="font-medium">5.0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}