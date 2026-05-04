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
import { Plus, Search, Eye, Pencil, Trash2, Send } from "lucide-react";
import { getSalesRecordsByManagerId, deleteSalesRecord, submitSalesRecord } from "@/lib/actions/sales.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SalesManagerRecords() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredRecords, setFilteredRecords] = useState<any[]>([]);
  const router = useRouter();

  const fetchRecords = () => {
    startTransition(async () => {
      setLoading(true);
      const managerId = (session?.user as any)?.id;
      if (!managerId) {
        setLoading(false);
        return;
      }
      const data = await getSalesRecordsByManagerId(managerId);
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
    if (session?.user) {
      fetchRecords();
    }
  }, [session]);

  useEffect(() => {
    let filtered = records;
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.companyName?.toLowerCase().includes(q) ||
          r.employeeName?.toLowerCase().includes(q)
      );
    }
    setFilteredRecords(filtered);
  }, [records, search, statusFilter]);

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
    const colors: Record<string, string> = {
      Draft: "bg-gray-100 text-gray-800",
      Pending_Manager: "bg-yellow-100 text-yellow-800",
      Pending_Accountant: "bg-orange-100 text-orange-800",
      Pending_Finance: "bg-blue-100 text-blue-800",
      Approved: "bg-green-100 text-green-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[status] || "bg-gray-100 text-gray-800"}`}>
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Records</h1>
          <p className="text-muted-foreground">
            Your records and team sales records
          </p>
        </div>
        <Button onClick={() => router.push("/sales-manager/add-record")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Sale
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
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Employee</TableHead>
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
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.companyName}
                    </TableCell>
                    <TableCell>{record.employeeName}</TableCell>
                    <TableCell>{record.productCount} products</TableCell>
                    <TableCell>
                      ৳{record.totalAmount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      ৳{record.commission?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/sales-manager/records/${record.id}`
                            )
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {record.status === "Draft" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/sales-manager/add-record?id=${record.id}`
                                )
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSubmit(record.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
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