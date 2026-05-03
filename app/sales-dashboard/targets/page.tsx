"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { getTargets } from "@/lib/actions/target.actions";
import { useSession } from "next-auth/react";
import { getSalesRecords } from "@/lib/actions/sales.actions";

export default function SalesTargets() {
  const { data: session } = useSession();
  const [target, setTarget] = useState<any>(null);
  const [achievement, setAchievement] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return;
      
      const targets = await getTargets();
      const myTarget = targets.find((t: any) => t.id === session.user.id?.toString());
      
      if (myTarget) {
        setTarget(myTarget);
        
        // Calculate achievement from approved sales
        const records = await getSalesRecords({ employeeId: session.user.id });
        const approvedSales = records.filter((r: any) => r.status === "Approved");
        const totalSales = approvedSales.reduce((sum: number, r: any) => sum + (r.totalAmount || 0), 0);
        
        const ach = myTarget.targetAmount > 0 ? (totalSales / myTarget.targetAmount) * 100 : 0;
        setAchievement(ach);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [session?.user?.id]);

  if (loading) return <div className="p-8">Loading...</div>;

  if (!target) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Targets</h1>
          <p className="text-muted-foreground">Your sales targets</p>
        </div>
        
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No target assigned yet</p>
            <p className="text-sm">Contact your manager for target assignment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Targets</h1>
        <p className="text-muted-foreground">Your sales targets and progress</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Target Amount</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{target.targetAmount?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{target.period || "Monthly"}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievement</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${achievement >= 50 ? "text-green-600" : "text-yellow-600"}`}>
              {achievement.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    Progress
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {achievement.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${Math.min(achievement, 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-4">
              {achievement >= 50 ? (
                <span className="text-green-600 font-medium">✓ Eligible for commission</span>
              ) : (
                <span className="text-yellow-600 font-medium">
                  Need {(50 - achievement).toFixed(1)}% more for eligibility
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}