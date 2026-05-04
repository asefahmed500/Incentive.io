"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCommissions } from "@/lib/actions/commission.actions";
import { Pagination } from "@/components/ui/pagination";

export default function FinanceCommissions() {
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [eligibilityFilter, setEligibilityFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, eligibilityFilter]);

  const fetchCommissions = async () => {
    setLoading(true);
    const data = await getCommissions();
    if (Array.isArray(data)) {
      setCommissions(data);
    } else {
      setCommissions([]);
      console.error((data as any)?.error || "Failed to fetch commissions");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommissions();
  }, []);

  const filtered = commissions.filter((c: any) => {
    if (eligibilityFilter === "eligible" && !c.isEligible) return false;
    if (eligibilityFilter === "not_eligible" && c.isEligible) return false;
    if (
      search &&
      !c.employeeName?.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalEligible = commissions.filter((c: any) => c.isEligible).length;
  const totalNotEligible = commissions.filter((c: any) => !c.isEligible).length;
  const totalCommission = filtered.reduce((sum: number, c: any) => sum + (c.calculatedCommission || 0), 0);

  const exportToCSV = () => {
    if (commissions.length === 0) return;
    const rows = filtered.map((c) => ({
      Employee: c.employeeName || "",
      Company: c.companyName || "",
      Amount: c.netAmount || c.grossAmount || 0,
      Commission: c.calculatedCommission || 0,
      Eligibility: c.isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE",
      Status: c.status || "",
      Date: c.createdAt
        ? new Date(c.createdAt).toLocaleDateString()
        : "",
    }));
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "commissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Commissions</h1>
            <p className="text-muted-foreground">View all commissions and eligibility</p>
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={commissions.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Not Eligible</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalNotEligible}</div>
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
              />
            </div>
            <select
              value={eligibilityFilter}
              onChange={(e) => setEligibilityFilter(e.target.value)}
              className="rounded-md border px-3 py-2"
            >
              <option value="all">All</option>
              <option value="eligible">Eligible</option>
              <option value="not_eligible">Not Eligible</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalPages = Math.max(1, Math.ceil(filtered.length / 20));
            const paginatedFiltered = filtered.slice((page - 1) * 20, page * 20);
            return (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Achievement</TableHead>
                <TableHead>Commission</TableHead>
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
                    No commissions found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFiltered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.employeeName}</TableCell>
                    <TableCell>{c.achievementPercent?.toFixed(1) || 0}%</TableCell>
                    <TableCell>৳{c.calculatedCommission?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.isEligible ? "default" : "secondary"}
                      >
                        {c.isEligible ? "ELIGIBLE" : "NOT_ELIGIBLE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
          );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}