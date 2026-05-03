"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { checkEligibility } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";
import { Target, CheckCircle, XCircle } from "lucide-react";

export default function SalesExecutiveEligibility() {
  const { data: session } = useSession();
  const [eligibility, setEligibility] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEligibility = async () => {
      if (!session?.user?.id) return;
      const data = await checkEligibility(session.user.id);
      setEligibility(data);
      setLoading(false);
    };
    fetchEligibility();
  }, [session?.user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Eligibility Status</h1>
        <p className="text-muted-foreground">Check your commission eligibility</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Achievement Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium">Achievement</span>
            <span className="text-2xl font-bold">{eligibility?.achievement?.toFixed(1) || 0}%</span>
          </div>
          <Progress value={eligibility?.achievement || 0} className="h-3" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Target: ৳{eligibility?.targetAmount?.toLocaleString() || 0}</span>
            <span className="text-sm text-muted-foreground">Sales: ৳{eligibility?.totalSales?.toLocaleString() || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {eligibility?.eligible ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Eligibility Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={eligibility?.eligible ? "default" : "secondary"} className="text-lg px-4 py-2">
              {eligibility?.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
            </Badge>
            <p className="text-muted-foreground">{eligibility?.message}</p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            You need to achieve at least 50% of your target to be eligible for commissions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
