"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Target, CheckCircle, XCircle } from "lucide-react";
import { getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";

export default function SalesCommissions() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
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
        <h1 className="text-3xl font-bold">Commissions</h1>
        <p className="text-muted-foreground">View your earned commissions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eligibility Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {eligibility?.eligible ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className="text-lg font-medium">
                {eligibility?.eligible ? "Eligible" : "Not Eligible"}
              </p>
              <p className="text-sm text-muted-foreground">
                Achievement: {eligibility?.achievement?.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {eligibility?.message}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{data?.totalCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{data?.paidCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">৳{data?.pendingCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission Records</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.records?.length === 0 ? (
            <p className="text-center text-muted-foreground">No commissions yet</p>
          ) : (
            <div className="space-y-2">
              {data?.records?.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded">
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