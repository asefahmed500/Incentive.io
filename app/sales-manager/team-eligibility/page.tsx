"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUsers } from "@/lib/actions/user.actions";
import { checkEligibility } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";

export default function ManagerTeamEligibility() {
  const { data: session } = useSession();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      const users = await getUsers({});
      const team = users.filter((u: any) => u.managerId === session?.user?.id);
      
      const withEligibility = await Promise.all(
        team.map(async (member: any) => {
          const elig = await checkEligibility(member.id);
          return { ...member, ...elig };
        })
      );
      
      setTeamMembers(withEligibility);
      setLoading(false);
    };
    fetchTeam();
  }, [session?.user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Eligibility</h1>
        <p className="text-muted-foreground">View team member eligibility status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Eligibility Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No team members</TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>৳{member.targetAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{member.achievement?.toFixed(1) || 0}%</TableCell>
                    <TableCell>
                      <Badge variant={member.eligible ? "default" : "secondary"}>
                        {member.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
