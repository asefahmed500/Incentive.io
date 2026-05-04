"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, CheckCircle } from "lucide-react";
import { getPendingFinanceApprovals, finalApproveByFinance, rejectSale } from "@/lib/actions/approval.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

export default function FinancePaymentQueue() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const fetchRecords = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getPendingFinanceApprovals();
      if (Array.isArray(data)) {
        setRecords(data);
      } else {
        setRecords([]);
        console.error((data as any)?.error || "Failed to fetch approvals");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleApprove = async (id: string) => {
    const paidBy = (session?.user as any)?.id || "";
    const result = await finalApproveByFinance(id, paidBy);
    if (result?.error) {
      alert(result.error);
      return;
    }
    fetchRecords();
  };

  const handleReject = async () => {
    if (selectedRecord && rejectReason) {
      const result = await rejectSale(selectedRecord.id, rejectReason, "finance");
      if (result?.error) {
        alert(result.error);
        return;
      }
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedRecord(null);
      fetchRecords();
    }
  };

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === records.length && records.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)));
    }
  }, [records, selectedIds]);

  const handleBatchApprove = async () => {
    setBatchProcessing(true);
    const paidBy = (session?.user as any)?.id || "";
    for (const id of selectedIds) {
      const result = await finalApproveByFinance(id, paidBy);
      if (result?.error) {
        alert(`Failed to approve record: ${result.error}`);
        break;
      }
    }
    setBatchProcessing(false);
    setBatchConfirmOpen(false);
    setSelectedIds(new Set());
    fetchRecords();
  };

  const allSelected = records.length > 0 && selectedIds.size === records.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Queue</h1>
          <p className="text-muted-foreground">
            Final approval and trigger commission payment
          </p>
        </div>
        {selectedIds.size > 0 && (
          <Button onClick={() => setBatchConfirmOpen(true)}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Selected ({selectedIds.size})
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Net Sales</TableHead>
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
                    No pending approvals
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow
                    key={record.id}
                    className={selectedIds.has(record.id) ? "bg-primary/5" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(record.id)}
                        onCheckedChange={() => toggleSelect(record.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.employeeName}
                    </TableCell>
                    <TableCell>{record.companyName}</TableCell>
                    <TableCell>
                      ৳{record.netSales?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      ৳{record.commission?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(record.id)}
                      >
                        <Check className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setRejectDialogOpen(true);
                        }}
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Sale</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this sale.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Input
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReject} disabled={!rejectReason}>
                Confirm Reject
              </Button>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={batchConfirmOpen} onOpenChange={setBatchConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Batch Approval</DialogTitle>
            <DialogDescription>
              You are about to approve {selectedIds.size} record
              {selectedIds.size > 1 ? "s" : ""} for payment. This will trigger
              commission payments and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button
              onClick={handleBatchApprove}
              disabled={batchProcessing}
            >
              {batchProcessing ? "Processing..." : "Confirm Approval"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setBatchConfirmOpen(false)}
              disabled={batchProcessing}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}