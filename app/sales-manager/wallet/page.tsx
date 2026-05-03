"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, DollarSign } from "lucide-react";
import { getCommissionsByEmployee } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";

export default function ManagerWallet() {
  const { data: session } = useSession();
  const [commissions, setCommissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!session?.user?.id) return;
      const data = await getCommissionsByEmployee(session.user.id);
      setCommissions(data);
      setLoading(false);
    };
    fetchCommissions();
  }, [session?.user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">View your commission wallet</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{commissions?.totalCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{commissions?.paidCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Wallet className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">৳{commissions?.pendingCommission?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Commission History</CardTitle>
        </CardHeader>
        <CardContent>
          {commissions?.records?.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No commissions yet</p>
          ) : (
            <div className="space-y-3">
              {commissions?.records?.map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-md border">
                  <div>
                    <p className="font-medium">{record.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">৳{record.commission?.toLocaleString() || 0}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.isPaid ? "Paid" : "Pending"}
                    </p>
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
