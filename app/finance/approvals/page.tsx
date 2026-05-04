"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Check, X, DollarSign, FileText, User, Calendar, Eye } from "lucide-react";
import { getPendingFinanceApprovals, finalApproveByFinance, rejectSale } from "@/lib/actions/approval.actions";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function FinanceApprovals() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    const data = await getPendingFinanceApprovals();
    if (Array.isArray(data)) {
      setRecords(data);
    } else {
      setRecords([]);
      console.error((data as any)?.error || "Failed to fetch approvals");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleApprove = async (recordId: string) => {
    try {
      const paidBy = (session?.user as any)?.id || "";
      const approveResult = await finalApproveByFinance(recordId, paidBy);
      if (approveResult?.error) {
        toast.error(approveResult.error);
        return;
      }
      toast.success("Record approved successfully");
      setShowApproveDialog(false);
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error("Failed to approve record");
    }
  };

  const handleReject = async () => {
    if (!selectedRecord) return;
    try {
      const rejectResult = await rejectSale(selectedRecord.id, rejectReason, "finance");
      if (rejectResult?.error) {
        toast.error(rejectResult.error);
        return;
      }
      toast.success("Record rejected");
      setShowRejectDialog(false);
      setSelectedRecord(null);
      setRejectReason("");
      fetchRecords();
    } catch (error) {
      toast.error("Failed to reject record");
    }
  };

  const totalAmount = records.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
  const totalCommission = records.reduce((sum: number, r: any) => sum + (r.calculatedCommission || 0), 0);

  const calculateNet = (record: any) => {
    const gross = record.amount || 0;
    const tax = record.taxAmount || 0;
    const vat = record.vatAmount || 0;
    const eoBp = record.eoBpAmount || 0;
    return gross - tax - vat - eoBp;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and finalize pending sales from Accountant
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{records.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">৳{totalAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ৳{totalCommission.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Finance Approval</CardTitle>
          <CardDescription>
            Records processed by Accountant awaiting final approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Net Sales</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Date</TableHead>
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
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No pending records
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.companyName}</TableCell>
                    <TableCell>{record.employeeName}</TableCell>
                    <TableCell>৳{record.amount?.toLocaleString() || 0}</TableCell>
                    <TableCell>৳{calculateNet(record).toLocaleString()}</TableCell>
                    <TableCell className="text-green-600">
                      ৳{record.calculatedCommission?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {record.createdAt
                        ? new Date(record.createdAt).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={!!selectedRecord && !showApproveDialog && !showRejectDialog} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sales Record Details</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{selectedRecord.companyName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Employee</Label>
                  <p className="font-medium">{selectedRecord.employeeName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Gross Amount</Label>
                  <p className="font-medium">৳{selectedRecord.amount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tax Amount</Label>
                  <p className="font-medium">৳{selectedRecord.taxAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">VAT Amount</Label>
                  <p className="font-medium">৳{selectedRecord.vatAmount?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">EO/BP Amount</Label>
                  <p className="font-medium">৳{selectedRecord.eoBpAmount?.toLocaleString() || 0}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">EO/BP Reason</Label>
                  <p className="font-medium">{selectedRecord.eoBpReason || "—"}</p>
                </div>
                <div className="col-span-2 bg-muted p-4 rounded-lg">
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Net Sales</span>
                    <span className="font-semibold text-green-600">
                      ৳{calculateNet(selectedRecord).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Commission</Label>
                  <p className="text-xl font-bold text-green-600">
                    ৳{selectedRecord.calculatedCommission?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                  Close
                </Button>
                <Button variant="destructive" onClick={() => setShowRejectDialog(true)}>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button onClick={() => setShowApproveDialog(true)}>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Approval</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to approve this sales record? This will trigger
            commission eligibility calculation and mark the record as ready for
            payment.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => selectedRecord && handleApprove(selectedRecord.id)}>
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Sales Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason</Label>
              <Input
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}