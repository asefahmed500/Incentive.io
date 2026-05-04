"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Percent, FileText, ArrowUp, ArrowDown } from "lucide-react";
import { getCommissions } from "@/lib/actions/commission.actions";
import { getAllSalesRecords } from "@/lib/actions/sales.actions";

export default function AccountantAnalytics() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommission: 0,
    avgDeduction: 0,
    processedCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [commissions, sales] = await Promise.all([
        getCommissions(),
        getAllSalesRecords({}),
      ]);
      
      const safeCommissions = Array.isArray(commissions) ? commissions : [];
      const safeSales = Array.isArray(sales) ? sales : [];
      if (!Array.isArray(commissions)) console.error((commissions as any)?.error || "Failed to fetch commissions");
      if (!Array.isArray(sales)) console.error((sales as any)?.error || "Failed to fetch sales");
      
      const totalCommission = safeCommissions.reduce((sum: number, c: any) => sum + (c.calculatedCommission || 0), 0);
      
      setStats({
        totalSales: safeSales.length,
        totalCommission,
        avgDeduction: 0,
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
        <p className="text-muted-foreground">Commission trends and deduction breakdown</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.totalCommission.toLocaleString()}</div>
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
            <CardTitle className="text-sm font-medium">Avg Deduction</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.avgDeduction}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commission Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              Chart placeholder - Commission trends over time
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deduction Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-red-500" />
                  Tax
                </span>
                <span className="font-medium">5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-red-500" />
                  VAT
                </span>
                <span className="font-medium">10%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-orange-500" />
                  EO/BP
                </span>
                <span className="font-medium">Variable</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}