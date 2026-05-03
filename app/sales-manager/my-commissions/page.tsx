"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Wallet, CreditCard, TrendingUp, CircleCheck, CircleX, ArrowDownLeft, Check, X } from "lucide-react";
import { getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";

export default function MyCommissionsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      const [commissions, elig] = await Promise.all([
        getCommissionsByEmployee(session.user.id),
        checkEligibility(session.user.id),
      ]);
      setData(commissions);
      setEligibility(elig);
      setLoading(false);
    };
    fetchData();
  }, [session?.user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Commissions</h1>
        <p className="text-muted-foreground">Your commission earnings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eligibility Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {eligibility?.eligible ? (
              <CircleCheck className="h-10 w-10 text-green-500" />
            ) : (
              <CircleX className="h-10 w-10 text-red-500" />
            )}
            <div>
              <p className="text-lg font-medium">
                {eligibility?.eligible ? "Eligible for Commission" : "Not Eligible"}
              </p>
              <p className="text-sm text-muted-foreground">
                Achievement: {eligibility?.achievement?.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{data?.totalCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{data?.paidCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">৳{data?.pendingCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.records?.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No commissions yet
            </div>
          ) : (
            <div className="divide-y">
              {data?.records?.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{record.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">৳{record.commission?.toLocaleString() || 0}</p>
                    <Badge variant={record.isPaid ? "default" : "secondary"}>
                      {record.isPaid ? "Paid" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Badge({ children, variant }: { children: React.ReactNode; variant?: string }) {
  const variantClasses = {
    default: "bg-green-100 text-green-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant as keyof typeof variantClasses] || variantClasses.secondary}`}>
      {children}
    </span>
  );
}