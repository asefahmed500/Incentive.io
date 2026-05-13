"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, TrendingUp, DollarSign, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { getPendingManagerApprovals } from "@/lib/actions/approval.actions";
import { getUsers } from "@/lib/actions/user.actions";
import { getSalesRecordsByManagerId } from "@/lib/actions/sales.actions";
import { getCommissionsByEmployee } from "@/lib/actions/commission.actions";
import { checkEligibility } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardSkeleton } from "@/components/loading/dashboard-skeleton";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

export default function SalesManagerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    teamSize: 0,
    pendingApprovals: 0,
    teamSales: 0,
    teamSalesAmount: 0,
    teamCommissions: 0,
    teamEligible: 0,
  });
  const [loading, setLoading] = useState(true);
  const [teamMembersData, setTeamMembersData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!session?.user?.id) return;

    const [pending, users, sales] = await Promise.all([
      getPendingManagerApprovals(),
      getUsers({ role: "salesExecutive", search: "" }),
      getSalesRecordsByManagerId(session.user.id),
    ]);

    const safePending = Array.isArray(pending) ? pending : [];
    const safeUsers = Array.isArray(users) ? users : [];
    const safeSales = Array.isArray(sales) ? sales : [];
    if (!Array.isArray(pending)) console.error((pending as any)?.error || "Failed to fetch pending approvals");
    if (!Array.isArray(users)) console.error((users as any)?.error || "Failed to fetch users");
    if (!Array.isArray(sales)) console.error((sales as any)?.error || "Failed to fetch sales");

    // Filter users to only those managed by this manager
    const teamMembers = safeUsers.filter((u: any) => u.managerId === session.user.id);

    // Calculate team commissions and member stats
    let totalCommissions = 0;
    let eligibleCount = 0;
    const memberStats: any[] = [];

    for (const member of teamMembers) {
      const commissions = await getCommissionsByEmployee(member.id);
      totalCommissions += commissions.totalCommission || 0;

      const elig = await checkEligibility(member.id);
      if (elig.eligible) eligibleCount++;

      const memberSales = safeSales.filter((s: any) => s.employeeId === member.id);
      const memberSalesAmount = memberSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

      memberStats.push({
        name: member.name,
        sales: memberSalesAmount,
        commission: commissions.totalCommission || 0,
        achievement: elig.achievement || 0,
      });
    }

    const teamSalesAmount = safeSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

    setStats({
      teamSize: teamMembers.length,
      pendingApprovals: safePending.length,
      teamSales: safeSales.length,
      teamSalesAmount,
      teamCommissions: totalCommissions,
      teamEligible: eligibleCount,
    });
    setTeamMembersData(memberStats);
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
  const salesByStatus = [
    { name: "Approved", value: stats.teamSales - stats.pendingApprovals, color: "#10b981" },
    { name: "Pending", value: stats.pendingApprovals, color: "#f59e0b" }
  ];

  const monthlyTrends = [
    { month: "Jan", sales: 450000, commission: 13500, approvals: 42 },
    { month: "Feb", sales: 520000, commission: 15600, approvals: 48 },
    { month: "Mar", sales: 380000, commission: 11400, approvals: 35 },
    { month: "Apr", sales: 650000, commission: 19500, approvals: 62 },
    { month: "May", sales: 580000, commission: 17400, approvals: 55 },
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
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teamSize}</div>
            <p className="text-xs text-muted-foreground">{stats.teamEligible} eligible</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Sales Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.teamSalesAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.teamSales} records</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.teamCommissions.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Team Sales by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
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
            <CardTitle>Monthly Sales & Commissions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `৳${(value || 0).toLocaleString()}`}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} name="Sales" />
                <Line type="monotone" dataKey="commission" stroke="#10b981" strokeWidth={2} name="Commission" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Member Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={teamMembersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => `৳${(value || 0).toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="sales" fill="#3b82f6" name="Sales" />
              <Bar dataKey="commission" fill="#10b981" name="Commission" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {stats.pendingApprovals > 0 && (
          <Card className="border-yellow-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">{stats.pendingApprovals} sales pending your approval</p>
              <Button onClick={() => router.push("/sales-manager/pending-approvals")}>
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
            <Button onClick={() => router.push("/sales-manager/pending-approvals")}>
              View Approvals
            </Button>
            <Button variant="outline" onClick={() => router.push("/sales-manager/team")}>
              View Team
            </Button>
            <Button variant="outline" onClick={() => router.push("/sales-manager/records")}>
              Sales History
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
    </ErrorBoundary>
  );
}