"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search } from "lucide-react";
import { getCommissions } from "@/lib/actions/commission.actions";

export default function AdminCommissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCommissions = async () => {
    setLoading(true);
    const data = await getCommissions();
    const safeData = Array.isArray(data) ? data : [];
    if (!Array.isArray(data)) console.error((data as any)?.error || "Failed to fetch commissions");
    if (search) {
      setCommissions(safeData.filter((c: any) => 
        c.employeeName?.toLowerCase().includes(search.toLowerCase())
      ));
    } else {
      setCommissions(safeData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const totalEligible = commissions.filter((c: any) => c.isEligible).length;
  const totalCommission = commissions.reduce((sum: number, c: any) => sum + (c.calculatedCommission || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commissions</h1>
        <p className="text-muted-foreground">View all commissions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Eligible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalEligible}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalCommission.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchCommissions()}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : commissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No commissions found</TableCell>
                </TableRow>
              ) : (
                commissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.employeeName}</TableCell>
                    <TableCell>৳{c.calculatedCommission?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge variant={c.isEligible ? "default" : "secondary"}>
                        {c.isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE"}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}</TableCell>
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