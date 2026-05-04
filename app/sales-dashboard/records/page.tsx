"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Pencil, Trash2, Send, Download } from "lucide-react";
import { getSalesRecords, deleteSalesRecord, submitSalesRecord } from "@/lib/actions/sales.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pagination } from "@/components/ui/pagination";

export default function SalesRecords() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const fetchRecords = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getSalesRecords({ 
        employeeId: session?.user?.id,
        search,
        status: statusFilter !== "all" ? statusFilter : undefined
      });
      if (Array.isArray(data)) {
        setRecords(data);
      } else {
        setRecords([]);
        console.error((data as any)?.error || "Failed to fetch records");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this record? This cannot be undone.")) {
      const result = await deleteSalesRecord(id);
      if (result?.error) {
        alert(result.error);
        return;
      }
      fetchRecords();
    }
  };

  const handleSubmit = async (id: string) => {
    const result = await submitSalesRecord(id);
    if (result?.error) {
      alert(result.error);
      return;
    }
    fetchRecords();
  };

  const getStatusBadge = (status: string) => {
    const variantMap: Record<string, "default" | "secondary" | "destructive"> = {
      Draft: "secondary",
      Pending_Manager: "secondary",
      Pending_Accountant: "secondary",
      Pending_Finance: "secondary",
      Approved: "default",
      Rejected: "destructive",
    };
    const variant = variantMap[status] || "secondary";
    return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
  };

  const exportToCSV = () => {
    if (records.length === 0) return;
    const rows = records.map((r) => ({
      Company: r.companyName || "",
      Email: r.companyEmail || "",
      "Products Count": r.productCount || 0,
      "Total Amount": r.totalAmount || 0,
      Status: r.status || "",
      Commission: r.commission || 0,
      "Created Date": r.createdAt
        ? new Date(r.createdAt).toLocaleDateString()
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
    a.download = "sales-records.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Sales Records</h1>
          <p className="text-muted-foreground">View and manage your sales records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={records.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push("/sales-dashboard/add-record")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Sale
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchRecords()}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Pending_Manager">Pending Manager</SelectItem>
                <SelectItem value="Pending_Accountant">Pending Accountant</SelectItem>
                <SelectItem value="Pending_Finance">Pending Finance</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchRecords}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const totalPages = Math.max(1, Math.ceil(records.length / 20));
            const paginatedRecords = records.slice((page - 1) * 20, page * 20);
            return (
          <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commission</TableHead>
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
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.companyName}</TableCell>
                    <TableCell>{record.productCount} products</TableCell>
                    <TableCell>৳{record.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>৳{record.commission || 0}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/sales-dashboard/records/${record.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {record.status === "Draft" && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => router.push(`/sales-dashboard/add-record?id=${record.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleSubmit(record.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
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