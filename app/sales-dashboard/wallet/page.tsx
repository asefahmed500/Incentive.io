"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CreditCard, Wallet, ArrowRight } from "lucide-react";
import { getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";

export default function SalesWallet() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      setLoading(true);
      const commissions = await getCommissionsByEmployee(session.user.id);
      setData(commissions);
      setLoading(false);
    };
    fetchData();
  }, [session?.user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Wallet</h1>
        <p className="text-muted-foreground">Your commission wallet</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Wallet className="h-12 w-12 text-primary" />
            <div>
              <p className="text-4xl font-bold">৳{data?.pendingCommission?.toLocaleString() || 0}</p>
              <p className="text-sm text-muted-foreground">
                Ready for withdrawal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">৳{data?.totalCommission?.toLocaleString() || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <span className="text-2xl font-bold">৳{data?.paidCommission?.toLocaleString() || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {data?.records?.length === 0 ? (
            <p className="text-center text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {data?.records?.slice(0, 5).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">{record.companyName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">+৳{record.commission?.toLocaleString() || 0}</p>
                    <p className="text-xs text-muted-foreground">
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