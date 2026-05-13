"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Target, Wallet, TrendingUp, DollarSign, Users, Building2, CheckCircle, XCircle, Clock, RefreshCw, ArrowRight } from "lucide-react";
import { getSalesRecords } from "@/lib/actions/sales.actions";
import { getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { getSalesTrends, getCommissionProgress } from "@/lib/actions/analytics.actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Area, AreaChart } from "recharts";
import { useSSE } from "@/hooks/use-sse";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/error-boundary";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6"];

export default function SalesDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRecords: 0,
    pending: 0,
    approvedAmount: 0,
    commission: 0,
  });
  const [eligibility, setEligibility] = useState<any>(null);
  const [salesTrends, setSalesTrends] = useState<Array<{ month: string; sales: number; commission: number }>>([]);
  const [commissionProgress, setCommissionProgress] = useState<Array<{ month: string; earned: number; target: number }>>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    const records = await getSalesRecords({ employeeId: session.user.id });
    const commissions = await getCommissionsByEmployee(session.user.id);
    const elig = await checkEligibility(session.user.id);

    // Fetch real analytics data
    const trendsResult = await getSalesTrends(session.user.id, 6);
    const progressResult = await getCommissionProgress(session.user.id, 6);

    const safeRecords = Array.isArray(records) ? records : [];
    if (!Array.isArray(records)) console.error((records as any)?.error || "Failed to fetch records");

    // Fix: Only count records actively in approval workflow, not Draft or Approved
    const pending = safeRecords.filter((r: any) =>
      r.status === "Pending_Manager" || r.status === "Pending_Accountant" || r.status === "Pending_Finance"
    ).length;
    const approvedAmount = safeRecords
      .filter((r: any) => r.status === "Approved")
      .reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);

    setStats({
      totalRecords: safeRecords.length,
      pending,
      approvedAmount,
      commission: commissions.pendingCommission || 0,
    });
    setEligibility(elig);

    // Set chart data from real analytics or use empty arrays if error
    if (Array.isArray(trendsResult)) {
      setSalesTrends(trendsResult.length > 0 ? trendsResult : [
        { month: "No Data", sales: 0, commission: 0 }
      ]);
    } else if (trendsResult?.error) {
      console.error("Sales trends error:", trendsResult.error);
      setSalesTrends([{ month: "No Data", sales: 0, commission: 0 }]);
    }

    if (Array.isArray(progressResult)) {
      setCommissionProgress(progressResult.length > 0 ? progressResult : [
        { month: "No Data", earned: 0, target: 0 }
      ]);
    } else if (progressResult?.error) {
      console.error("Commission progress error:", progressResult.error);
      setCommissionProgress([{ month: "No Data", earned: 0, target: 0 }]);
    }

    setLoading(false);
  };

  // Use SSE for real-time updates
  useSSE({
    onSaleUpdate: () => {
      fetchData();
    },
    onCommissionUpdate: () => {
      fetchData();
    },
    onDashboardRefresh: () => {
      fetchData();
    },
  });

  useEffect(() => {
    fetchData();

    // Fallback polling every 60 seconds in case SSE fails
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-48 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Prepare chart data
  const recordsByStatus = [
    { name: "Approved", value: stats.totalRecords - stats.pending, color: "#10b981" },
    { name: "Pending", value: stats.pending, color: "#f59e0b" }
  ];

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {session?.user?.name}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} aria-label="Refresh dashboard data">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.totalRecords}</div>
            <p className="text-xs text-muted-foreground mt-1">All sales records</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">৳{stats.approvedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total approved amount</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">৳{stats.commission.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Records Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={recordsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {recordsByStatus.map((entry, index) => (
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
            <CardTitle>Sales vs Commission Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `৳${(value || 0).toLocaleString()}`}
                />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Sales" />
                <Area type="monotone" dataKey="commission" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Commission" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Progress vs Target</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={commissionProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => `৳${(value || 0).toLocaleString()}`}
              />
              <Bar dataKey="earned" fill="#10b981" name="Earned" />
              <Bar dataKey="target" fill="#e5e7eb" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={eligibility?.eligible ? "border-green-200 bg-green-50/50 dark:bg-green-950/20" : "border-red-200 bg-red-50/50 dark:bg-red-950/20"}>
          <CardHeader>
            <CardTitle>Eligibility Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${eligibility?.eligible ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                {eligibility?.eligible ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-lg font-semibold">
                  {eligibility?.eligible ? "Eligible for Commission" : "Not Yet Eligible"}
                </p>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Achievement</span>
                    <span className="font-semibold">{eligibility?.achievement?.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${eligibility?.eligible ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(eligibility?.achievement || 0, 100)}%` }}
                    />
                  </div>
                </div>
                {eligibility?.message && (
                  <p className="text-xs text-muted-foreground mt-2">{eligibility.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="w-full justify-between" onClick={() => router.push("/sales-dashboard/add-record")} aria-label="Navigate to add new sale page">
              <span>Add New Sale</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => router.push("/sales-dashboard/records")} aria-label="Navigate to view all sales records">
              <span>View Records</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between" onClick={() => router.push("/sales-dashboard/commissions")} aria-label="Navigate to view commissions page">
              <span>View Commissions</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}