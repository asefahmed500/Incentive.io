"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileText, DollarSign } from "lucide-react";
import { getAllSalesRecords } from "@/lib/actions/sales.actions";

export default function AccountantRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRecords = async () => {
    setLoading(true);
    const data = await getAllSalesRecords({ status: statusFilter !== "all" ? statusFilter : undefined });
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, [statusFilter]);

  const filtered = records.filter((r: any) => {
    if (search && !r.companyName?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      Draft: "secondary",
      Pending_Manager: "yellow",
      Pending_Accountant: "orange",
      Pending_Finance: "blue",
      Approved: "default",
      Rejected: "red",
    };
    return <Badge variant={variants[status] as any || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Records</h1>
        <p className="text-muted-foreground">View all sales records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="Approved">Approved</option>
              <option value="Pending_Accountant">Pending Accountant</option>
              <option value="Pending_Finance">Pending Finance</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">No records found</TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.companyName}</TableCell>
                    <TableCell>{r.employeeName}</TableCell>
                    <TableCell>৳{r.amount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{getStatusBadge(r.approvalStatus)}</TableCell>
                    <TableCell>{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}</TableCell>
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