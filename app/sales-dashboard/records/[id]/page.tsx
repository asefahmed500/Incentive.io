"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { getSalesRecord, deleteSalesRecord } from "@/lib/actions/sales.actions";

export default function SalesRecordDetail() {
  const params = useParams();
  const router = useRouter();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      const data = await getSalesRecord(params.id as string);
      setRecord(data);
      setLoading(false);
    };
    if (params.id) fetchRecord();
  }, [params.id]);

  const handleDelete = async () => {
    if (confirm("Delete this record? This cannot be undone.")) {
      await deleteSalesRecord(params.id as string);
      router.push("/sales-dashboard/records");
    }
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
    return <Badge variant={variantMap[status] || "secondary"}>{status.replace(/_/g, " ")}</Badge>;
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!record) return <div className="p-6">Record not found</div>;

  const totalAmount = record.products?.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/sales-dashboard/records")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Sale Details</h1>
            <p className="text-muted-foreground">{record.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(record.status)}
          {record.status === "Draft" && (
            <>
              <Button variant="outline" onClick={() => router.push(`/sales-dashboard/add-record?id=${record.id}`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span className="font-medium">{record.companyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{record.companyEmail}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Employee</span><span className="font-medium">{record.employeeName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : "-"}</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Financial Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">Gross Sales</span><span className="font-medium">৳{totalAmount.toLocaleString()}</span></div>
            {record.taxEnabled && <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span className="font-medium">৳{record.taxAmount?.toLocaleString() || 0}</span></div>}
            {record.vatEnabled && <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span className="font-medium">৳{record.vatAmount?.toLocaleString() || 0}</span></div>}
            {record.eoBpAmount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">EO/BP</span><span className="font-medium">৳{record.eoBpAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between border-t pt-2"><span className="font-medium">Net Sales</span><span className="font-bold">৳{record.netSales?.toLocaleString() || totalAmount.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Commission</span><span className="font-medium">৳{record.commission?.toLocaleString() || 0}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Products ({record.products?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {record.products?.map((product: any, index: number) => (
              <div key={index} className="rounded-lg border p-4">
                <div className="grid gap-2 md:grid-cols-4">
                  <div><span className="text-sm text-muted-foreground">Name</span><p className="font-medium">{product.productName}</p></div>
                  <div><span className="text-sm text-muted-foreground">Unit Price</span><p className="font-medium">৳{product.unitPrice?.toLocaleString()}</p></div>
                  <div><span className="text-sm text-muted-foreground">Quantity</span><p className="font-medium">{product.quantity}</p></div>
                  <div><span className="text-sm text-muted-foreground">Total</span><p className="font-bold">৳{(product.unitPrice * product.quantity).toLocaleString()}</p></div>
                </div>
                {product.originalPrice && <p className="text-sm text-muted-foreground mt-1">Original Price: ৳{product.originalPrice.toLocaleString()}</p>}
                {product.dealNotes && <p className="text-sm text-muted-foreground mt-1">Notes: {product.dealNotes}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {record.rejectionReason && (
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-red-600">Rejection Reason</CardTitle></CardHeader>
          <CardContent><p>{record.rejectionReason}</p></CardContent>
        </Card>
      )}

      {record.proofOfSale?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Proof of Sale</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {record.proofOfSale.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Document {i + 1}</a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Status History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between"><span className="text-muted-foreground">Approval Status</span><Badge>{record.approvalStatus}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Accountant Status</span><Badge>{record.accountantStatus}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Finance Status</span><Badge>{record.financeStatus}</Badge></div>
          {record.updatedAt && <div className="flex justify-between"><span className="text-muted-foreground">Last Updated</span><span>{new Date(record.updatedAt).toLocaleString()}</span></div>}
        </CardContent>
      </Card>
    </div>
  );
}