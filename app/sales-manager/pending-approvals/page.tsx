"use client";

import { useState, useEffect, useTransition } from "react";
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
import { Check, X, Eye } from "lucide-react";
import { getPendingManagerApprovals, approveSale, rejectSale } from "@/lib/actions/approval.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ManagerApprovals() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [_isPending, startTransition] = useTransition();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const fetchRecords = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getPendingManagerApprovals();
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
    const result = await approveSale(id);
    if (result?.error) {
      alert(result.error);
      return;
    }
    fetchRecords();
  };

  const handleReject = async () => {
    if (selectedRecord && rejectReason) {
      const result = await rejectSale(selectedRecord.id, rejectReason, "manager");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground">Review and approve team sales records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
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
                <TableHead>Employee</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Amount</TableHead>
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
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                    <TableCell>{record.companyName}</TableCell>
                    <TableCell>{record.productCount} products</TableCell>
                    <TableCell>৳{record.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>৳{record.commission?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRecord(record)}>
                        <Eye className="h-4 w-4" />
                      </Button>
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

      <Dialog open={!!selectedRecord && !rejectDialogOpen} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Sales Record Details</DialogTitle>
            <DialogDescription>
              {selectedRecord?.companyName} — {selectedRecord?.employeeName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-medium">{selectedRecord?.companyName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Employee</p>
              <p className="font-medium">{selectedRecord?.employeeName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <p className="font-medium">{selectedRecord?.productCount} products</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-medium">৳{selectedRecord?.totalAmount?.toLocaleString() || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commission</p>
              <p className="font-medium">৳{selectedRecord?.commission?.toLocaleString() || 0}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedRecord(null)}>Close</Button>
            <Button variant="destructive" onClick={() => {
              setRejectDialogOpen(true);
            }}>Reject</Button>
            <Button onClick={() => handleApprove(selectedRecord?.id)} disabled={!selectedRecord?.id}>Approve</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog key={selectedRecord?.id || "reject"} open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Sale</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this sales record.
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
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}