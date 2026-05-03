"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Target, Wallet, TrendingUp, DollarSign, Users, Building2, CheckCircle, XCircle, Clock } from "lucide-react";
import { getSalesRecords } from "@/lib/actions/sales.actions";
import { getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      const records = await getSalesRecords({ employeeId: session.user.id });
      const commissions = await getCommissionsByEmployee(session.user.id);
      const elig = await checkEligibility(session.user.id);
      
      const pending = records.filter((r: any) => r.status !== "Approved" && r.status !== "Draft").length;
      const approvedAmount = records
        .filter((r: any) => r.status === "Approved")
        .reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
      
      setStats({
        totalRecords: records.length,
        pending,
        approvedAmount,
        commission: commissions.pendingCommission || 0,
      });
      setEligibility(elig);
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
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords}</div>
          </CardContent>
        </Card>
        
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
            <CardTitle className="text-sm font-medium">Approved Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.approvedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{stats.commission.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {eligibility?.eligible ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <XCircle className="h-10 w-10 text-red-500" />
              )}
              <div>
                <p className="text-lg font-medium">
                  {eligibility?.eligible ? "Eligible for Commission" : "Not Eligible"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Achievement: {eligibility?.achievement?.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {eligibility?.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => router.push("/sales-dashboard/add-record")}>
              Add New Sale
            </Button>
            <Button variant="outline" onClick={() => router.push("/sales-dashboard/records")}>
              View Records
            </Button>
            <Button variant="outline" onClick={() => router.push("/sales-dashboard/commissions")}>
              View Commissions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}