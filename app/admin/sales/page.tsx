"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Eye, Filter, Download } from "lucide-react";
import { getAllSalesRecords } from "@/lib/actions/sales.actions";
import { Pagination } from "@/components/ui/pagination";

export default function AdminSales() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const fetchSales = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getAllSalesRecords({ search, status: statusFilter });
      if (Array.isArray(data)) {
        setSales(data);
      } else {
        setSales([]);
        console.error((data as any)?.error || "Failed to fetch sales records");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      Draft: "bg-gray-100 text-gray-800",
      Pending_Manager: "bg-yellow-100 text-yellow-800",
      Pending_Accountant: "bg-orange-100 text-orange-800",
      Pending_Finance: "bg-blue-100 text-blue-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes[status] || "bg-gray-100 text-gray-800"}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  const exportToCSV = () => {
    if (sales.length === 0) return;
    const rows = sales.map((s) => ({
      Employee: s.employeeName || "",
      Company: s.companyName || "",
      Amount: s.products?.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0) || 0,
      Status: s.approvalStatus || s.status || "",
      Commission: s.commission || s.calculatedCommission || 0,
      Date: s.date
        ? new Date(s.date).toLocaleDateString()
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
    a.download = "sales.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sales Records</h1>
            <p className="text-muted-foreground">View all sales records</p>
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={sales.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company or employee..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchSales()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending_Manager">Pending Manager</SelectItem>
                <SelectItem value="Pending_Accountant">Pending Accountant</SelectItem>
                <SelectItem value="Pending_Finance">Pending Finance</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchSales}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalPages = Math.max(1, Math.ceil(sales.length / 20));
            const paginatedSales = sales.slice((page - 1) * 20, page * 20);
            return (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No sales records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="font-medium">{s.companyName}</TableCell>
                    <TableCell>{s.employeeName}</TableCell>
                    <TableCell>৳{(s.products?.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0) || 0).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(s.approvalStatus)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSale(s)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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