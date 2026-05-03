"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";
import { useSession } from "next-auth/react";
import { checkEligibility } from "@/lib/actions/commission.actions";

export default function ManagerTargets() {
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
        <h1 className="text-3xl font-bold">My Targets</h1>
        <p className="text-muted-foreground">View your assigned targets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Target Progress
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
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              {eligibility?.message || "No target assigned yet"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
