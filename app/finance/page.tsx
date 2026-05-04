"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Wallet, TrendingUp, DollarSign, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { getPendingFinanceApprovals } from "@/lib/actions/approval.actions";
import { getSalesStats } from "@/lib/actions/sales.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

  useEffect(() => {
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
  );
}