"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, DollarSign, CheckCircle, Clock } from "lucide-react";
import { getCommissions } from "@/lib/actions/commission.actions";

export default function FinanceApprovedPage() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const data = await getCommissions();
      if (Array.isArray(data)) {
        setCommissions(data);
      } else {
        setCommissions([]);
        console.error((data as any)?.error || "Failed to fetch commissions");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredCommissions = commissions.filter((c: any) => {
    if (c.status === "Approved" && (c.isPaid || c.paymentStatus === "Paid")) {
      if (search && !c.employeeName?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }
    return false;
  });

  const totalPaid = filteredCommissions.reduce((sum: number, c: any) => sum + (c.calculatedCommission || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approved Commissions</h1>
        <p className="text-muted-foreground">Commissions approved and paid out</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredCommissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {commissions.filter((c: any) => c.status === "Approved" && !c.isPaid && c.paymentStatus !== "Paid").length}
            </div>
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredCommissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">No approved commissions found</TableCell>
                </TableRow>
              ) : (
                filteredCommissions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.employeeName || "—"}</TableCell>
                    <TableCell className="text-green-600">
                      ৳{c.calculatedCommission?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {c.isPaid || c.paymentStatus === "Paid" ? "Paid" : "Pending"}
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