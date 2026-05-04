"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wallet, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { getPendingAccountantApprovals } from "@/lib/actions/approval.actions";
import { getSalesStats } from "@/lib/actions/sales.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

  useEffect(() => {
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
    
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
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
  );
}