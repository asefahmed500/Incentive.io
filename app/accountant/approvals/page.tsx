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
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, Calculator, XCircle } from "lucide-react";
import { getPendingAccountantApprovals, processByAccountant, rejectSale } from "@/lib/actions/approval.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

export default function AccountantApprovals() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [eoBpAmount, setEoBpAmount] = useState("");
  const [eoBpReason, setEoBpReason] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [vatRate, setVatRate] = useState("0");
  const [processDialogOpen, setProcessDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRecords = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getPendingAccountantApprovals();
      setRecords(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleProcess = async () => {
    if (selectedRecord) {
      await processByAccountant({
        id: selectedRecord.id,
        eoBpAmount: parseFloat(eoBpAmount) || 0,
        eoBpReason,
        taxRate: parseFloat(taxRate) || 0,
        vatRate: parseFloat(vatRate) || 0,
      });
      setProcessDialogOpen(false);
      setEoBpAmount("");
      setEoBpReason("");
      setTaxRate("0");
      setVatRate("0");
      fetchRecords();
    }
  };

  const handleReject = async () => {
    if (selectedRecord && rejectReason) {
      await rejectSale(selectedRecord.id, rejectReason, "finance");
      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedRecord(null);
      fetchRecords();
    }
  };

  const calculateNet = () => {
    if (!selectedRecord) return 0;
    const gross = selectedRecord.totalAmount || 0;
    const tax = selectedRecord.taxEnabled ? gross * 0.05 : gross * (parseFloat(taxRate) / 100);
    const vat = selectedRecord.vatEnabled ? gross * 0.10 : gross * (parseFloat(vatRate) / 100);
    const eobp = parseFloat(eoBpAmount) || 0;
    return gross - tax - vat - eobp;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pending Approvals</h1>
        <p className="text-muted-foreground">Process sales with tax, VAT, and deductions</p>
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
                <TableHead>Gross Sales</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No pending approvals
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employeeName}</TableCell>
                    <TableCell>{record.companyName}</TableCell>
                    <TableCell>৳{record.totalAmount?.toLocaleString() || 0}</TableCell>
                    <TableCell>৳{record.commission?.toLocaleString() || 0}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setTaxRate(record.taxEnabled ? "5" : "0");
                          setVatRate(record.vatEnabled ? "10" : "0");
                          setProcessDialogOpen(true);
                        }}
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(record);
                          setRejectDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={processDialogOpen} onOpenChange={setProcessDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Sale</DialogTitle>
            <DialogDescription>
              Calculate net sales after deductions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex justify-between mb-2">
                <span>Gross Sales:</span>
                <span className="font-medium">৳{selectedRecord?.totalAmount?.toLocaleString() || 0}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax (5%):</span>
                <span className="font-medium">
                  {selectedRecord?.taxEnabled ? "Included" : `-$৳${((selectedRecord?.totalAmount || 0) * (parseFloat(taxRate) || 0) / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span>VAT (10%):</span>
                <span className="font-medium">
                  {selectedRecord?.vatEnabled ? "Included" : `-$৳${((selectedRecord?.totalAmount || 0) * (parseFloat(vatRate) || 0) / 100).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span>EO/BP:</span>
                <span className="font-medium">-৳{parseFloat(eoBpAmount) || 0}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Net Sales:</span>
                <span className="font-bold text-lg">৳{calculateNet().toFixed(2)}</span>
              </div>
            </div>
            
            {!selectedRecord?.taxEnabled && (
              <div>
                <Label>Tax Rate %</Label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  placeholder="5"
                />
              </div>
            )}
            
            {!selectedRecord?.vatEnabled && (
              <div>
                <Label>VAT Rate %</Label>
                <Input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  placeholder="10"
                />
              </div>
            )}
            
            <div>
              <Label>EO/BP Amount</Label>
              <Input
                type="number"
                value={eoBpAmount}
                onChange={(e) => setEoBpAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            
            <div>
              <Label>EO/BP Reason</Label>
              <Input
                value={eoBpReason}
                onChange={(e) => setEoBpReason(e.target.value)}
                placeholder="Reason for deduction"
              />
            </div>
            
            <Button onClick={handleProcess} disabled={isPending}>
              {isPending ? "Processing..." : "Process & Forward"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              <Button onClick={handleReject} disabled={!rejectReason || isPending}>
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