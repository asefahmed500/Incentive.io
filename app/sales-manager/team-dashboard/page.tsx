"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, DollarSign, Target } from "lucide-react";
import { getUsers } from "@/lib/actions/user.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { getSalesRecordsByManagerId } from "@/lib/actions/sales.actions";
import { useSession } from "next-auth/react";

export default function TeamDashboardPage() {
  const { data: session } = useSession();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [salesRecords, setSalesRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const managerId = session?.user?.id;
      if (!managerId) return;

      const [allUsers, allCommissions, teamSales] = await Promise.all([
        getUsers({ role: "salesExecutive", search: "" }),
        getCommissions(),
        getSalesRecordsByManagerId(managerId),
      ]);

      const safeUsers = Array.isArray(allUsers) ? allUsers : [];
      const safeCommissions = Array.isArray(allCommissions) ? allCommissions : [];
      const safeSales = Array.isArray(teamSales) ? teamSales : [];
      if (!Array.isArray(allUsers)) console.error((allUsers as any)?.error || "Failed to fetch users");
      if (!Array.isArray(allCommissions)) console.error((allCommissions as any)?.error || "Failed to fetch commissions");
      if (!Array.isArray(teamSales)) console.error((teamSales as any)?.error || "Failed to fetch sales");

      const members = safeUsers.filter((u: any) => u.managerId === managerId);
      const teamMemberIds = new Set(members.map((u: any) => u.id));
      const teamCommissions = safeCommissions.filter((c: any) =>
        teamMemberIds.has(c.employeeId)
      );

      setTeamMembers(members);
      setCommissions(teamCommissions);
      setSalesRecords(safeSales);
      setLoading(false);
    };
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  const approvedSales = salesRecords.filter(
    (r: any) => r.status === "Approved"
  );
  const totalApprovedAmount = approvedSales.reduce(
    (sum: number, r: any) => sum + (r.totalAmount || 0),
    0
  );
  const totalTargetAmount = teamMembers.reduce(
    (sum: number, m: any) => sum + (m.targetAmount || 0),
    0
  );
  const achievementPercent =
    totalTargetAmount > 0
      ? Math.round((totalApprovedAmount / totalTargetAmount) * 100)
      : 0;

  const totalCommissionAmount = commissions.reduce(
    (sum: number, c: any) => sum + (c.calculatedCommission || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Dashboard</h1>
        <p className="text-muted-foreground">Team performance overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalApprovedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalCommissionAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Achievement</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievementPercent}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No team members assigned yet
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const memberCommissions = commissions.filter(
                  (c: any) => c.employeeId === member.id
                );
                const totalEarned = memberCommissions.reduce(
                  (sum: number, c: any) => sum + (c.calculatedCommission || 0),
                  0
                );
                const paidCount = memberCommissions.filter((c: any) => c.status === "Approved").length;
                const memberSales = approvedSales.filter(
                  (r: any) => r.employeeId === member.id
                );
                const memberTotalSales = memberSales.reduce(
                  (sum: number, r: any) => sum + (r.totalAmount || 0),
                  0
                );
                const memberAchievement =
                  member.targetAmount > 0
                    ? Math.round((memberTotalSales / member.targetAmount) * 100)
                    : 0;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-lg font-bold">৳{totalEarned.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Earned</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{paidCount}</p>
                        <p className="text-xs text-muted-foreground">Approved</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          ৳{member.targetAmount?.toLocaleString() || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Target</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{memberAchievement}%</p>
                        <p className="text-xs text-muted-foreground">Achievement</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}