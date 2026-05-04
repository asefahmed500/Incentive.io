"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, TrendingUp } from "lucide-react";
import { getUsers } from "@/lib/actions/user.actions";
import { getCommissions } from "@/lib/actions/commission.actions";
import { useSession } from "next-auth/react";

export default function TeamCommissionsPage() {
  const { data: session } = useSession();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      const [allCommissions, allExecutives] = await Promise.all([
        getCommissions(),
        getUsers({ role: "salesExecutive", search: "" }),
      ]);

      const safeCommissions = Array.isArray(allCommissions) ? allCommissions : [];
      const safeExecutives = Array.isArray(allExecutives) ? allExecutives : [];
      if (!Array.isArray(allCommissions)) console.error((allCommissions as any)?.error || "Failed to fetch commissions");
      if (!Array.isArray(allExecutives)) console.error((allExecutives as any)?.error || "Failed to fetch users");

      const managerId = session?.user?.id;
      const teamMembers = safeExecutives.filter(
        (u: any) => u.managerId === managerId
      );
      const teamMemberIds = new Set(teamMembers.map((u: any) => u.id));

      const teamCommissions = safeCommissions.filter((c: any) =>
        teamMemberIds.has(c.employeeId)
      );

      setCommissions(teamCommissions);
      setUsers(teamMembers);
      setLoading(false);
    };
    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  const filteredCommissions = commissions.filter((c: any) => {
    if (employeeFilter !== "all" && c.employeeId !== employeeFilter) return false;
    if (search && !c.employeeName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalAmount = filteredCommissions.reduce((sum: number, c: any) => sum + (c.calculatedCommission || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Commissions</h1>
        <p className="text-muted-foreground">View all team member commissions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Records</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCommissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commission Amount</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="all">All Employees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No commissions found</TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.employeeName || "—"}</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell className="text-green-600">
                      ৳{c.calculatedCommission?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "Approved" ? "default" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
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