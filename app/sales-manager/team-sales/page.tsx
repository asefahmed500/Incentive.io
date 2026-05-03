"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, TrendingUp, DollarSign, Calendar, User, Check } from "lucide-react";
import { getUsers } from "@/lib/actions/user.actions";
import { getSalesRecords } from "@/lib/actions/sales.actions";

export default function TeamSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      const [salesData, usersData] = await Promise.all([
        getSalesRecords({}),
        getUsers({ role: "salesExecutive", search: "" }),
      ]);
      setSales(salesData);
      setUsers(usersData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredSales = sales.filter((s: any) => {
    if (employeeFilter !== "all" && s.employeeId !== employeeFilter) return false;
    if (search && !s.companyName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalAmount = filteredSales.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);
  const approvedAmount = filteredSales
    .filter((s: any) => s.status === "Approved")
    .reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Draft: "secondary",
      Pending_Manager: "secondary",
      Approved: "default",
      Rejected: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Team Sales History</h1>
        <p className="text-muted-foreground">View all team sales records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSales.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">৳{approvedAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
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
                <TableHead>Products</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">No sales found</TableCell>
                </TableRow>
              ) : (
                filteredSales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.employeeName}</TableCell>
                    <TableCell className="font-medium">{s.companyName}</TableCell>
                    <TableCell>{s.productCount} products</TableCell>
                    <TableCell>৳{s.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : "—"}</TableCell>
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