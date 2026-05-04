"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { getAllSalesRecords } from "@/lib/actions/sales.actions";

export default function FinanceSalesRecords() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchRecords = async () => {
    setLoading(true);
    const data = await getAllSalesRecords({});
    if (Array.isArray(data)) {
      setRecords(data);
    } else {
      setRecords([]);
      console.error((data as any)?.error || "Failed to fetch records");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filtered = records.filter((r: any) => {
    if (statusFilter !== "all" && r.financeStatus !== statusFilter) {
      return false;
    }
    if (
      search &&
      !r.companyName?.toLowerCase().includes(search.toLowerCase()) &&
      !r.employeeName?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      Draft: "secondary",
      Pending: "yellow",
      Approved: "default",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Records</h1>
        <p className="text-muted-foreground">View all sales records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
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
              <option value="Pending">Pending</option>
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
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.companyName}</TableCell>
                    <TableCell>{r.employeeName}</TableCell>
                    <TableCell>৳{r.amount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{getStatusBadge(r.financeStatus)}</TableCell>
                    <TableCell>
                      {r.createdAt
                        ? new Date(r.createdAt).toLocaleDateString()
                        : "—"}
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