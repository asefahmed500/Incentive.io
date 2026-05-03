"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Wallet, TrendingUp, DollarSign, Clock, CircleCheck, AlertCircle } from "lucide-react";
import { getPendingManagerApprovals } from "@/lib/actions/approval.actions";
import { getUsers } from "@/lib/actions/user.actions";
import { getSalesRecordsByManagerId } from "@/lib/actions/sales.actions";
import { getCommissionsByEmployee } from "@/lib/actions/commission.actions";
import { checkEligibility } from "@/lib/actions/commission.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;

      const [pending, users, sales] = await Promise.all([
        getPendingManagerApprovals(),
        getUsers({ role: "salesExecutive", search: "" }),
        getSalesRecordsByManagerId(session.user.id),
      ]);
      
      // Filter users to only those managed by this manager
      const teamMembers = users.filter((u: any) => u.managerId === session.user.id);
      
      // Calculate team commissions
      let totalCommissions = 0;
      let eligibleCount = 0;
      
      for (const member of teamMembers) {
        const commissions = await getCommissionsByEmployee(member.id);
        totalCommissions += commissions.totalCommission || 0;
        
        const elig = await checkEligibility(member.id);
        if (elig.eligible) eligibleCount++;
      }
      
      const teamSalesAmount = sales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
      
      setStats({
        teamSize: teamMembers.length,
        pendingApprovals: pending.length,
        teamSales: sales.length,
        teamSalesAmount,
        teamCommissions: totalCommissions,
        teamEligible: eligibleCount,
      });
      setLoading(false);
    };
    
    fetchData();
  }, [session?.user?.id]);

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
  );
}