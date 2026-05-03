"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Target } from "lucide-react";
import { getUsers } from "@/lib/actions/user.actions";
import { assignTarget } from "@/lib/actions/target.actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TeamPage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [targetAmount, setTargetAmount] = useState("");

  useEffect(() => {
    const fetchTeam = async () => {
      const users = await getUsers({ role: "salesExecutive", search: "" });
      setTeamMembers(users);
      setLoading(false);
    };
    fetchTeam();
  }, []);

  const handleAssignTarget = async () => {
    if (selectedMember && targetAmount) {
      await assignTarget({
        userId: selectedMember.id,
        targetAmount: parseFloat(targetAmount),
        period: "monthly",
      });
      setTargetDialogOpen(false);
      setTargetAmount("");
      const users = await getUsers({ role: "salesExecutive", search: "" });
      setTeamMembers(users);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground">Manage your team members and targets</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No team members assigned yet
            </div>
          ) : (
            <div className="divide-y">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        Target: ৳{member.targetAmount?.toLocaleString() || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.targetPeriod || "monthly"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member);
                        setTargetAmount(member.targetAmount?.toString() || "");
                        setTargetDialogOpen(true);
                      }}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Set Target
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/sales-manager/team-sales?employee=${member.id}`)}
                    >
                      View Sales
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Target for {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Target Amount (৳)</Label>
              <Input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Enter target amount"
              />
            </div>
            <Button onClick={handleAssignTarget}>Set Target</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium mb-1">{children}</p>;
}