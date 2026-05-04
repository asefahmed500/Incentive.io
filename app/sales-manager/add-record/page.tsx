"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, Send, Upload, X, FileText } from "lucide-react";
import { getCategories } from "@/lib/actions/category.actions";
import { createSalesRecord, submitSalesRecord, getSalesRecord, updateSalesRecord } from "@/lib/actions/sales.actions";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface UploadedFile {
  url: string;
  fileName: string;
  size: number;
}

function Checkbox({ 
  checked, 
  onCheckedChange 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <input 
      type="checkbox" 
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="h-4 w-4"
    />
  );
}

export default function ManagerAddRecordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>}>
      <ManagerAddRecord />
    </Suspense>
  );
}

function ManagerAddRecord() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = !!editId;
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [products, setProducts] = useState([
    { productName: "", categoryId: "", unitPrice: "", quantity: "1", originalPrice: "", dealNotes: "" }
  ]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories();
      setCategories(data);
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (!editId) return;
    const loadRecord = async () => {
      setIsLoading(true);
      const record = await getSalesRecord(editId);
      if (record) {
        setCompanyName(record.companyName || "");
        setCompanyEmail(record.companyEmail || "");
        setTaxEnabled(record.taxEnabled || false);
        setVatEnabled(record.vatEnabled || false);
        if (record.products && record.products.length > 0) {
          setProducts(
            record.products.map((p: any) => ({
              productName: p.productName || "",
              categoryId: p.categoryId?.toString() || p.category || "",
              unitPrice: p.unitPrice?.toString() || "",
              quantity: p.quantity?.toString() || "1",
              originalPrice: p.originalPrice?.toString() || "",
              dealNotes: p.dealNotes || "",
            }))
          );
        }
        if (record.proofOfSale && record.proofOfSale.length > 0) {
          setUploadedFiles(
            record.proofOfSale.map((url: string) => ({
              url,
              fileName: url.split("/").pop() || "file",
              size: 0,
            }))
          );
        }
      }
      setIsLoading(false);
    };
    loadRecord();
  }, [editId]);

  const addProduct = () => {
    if (products.length < 20) {
      setProducts([...products, { productName: "", categoryId: "", unitPrice: "", quantity: "1", originalPrice: "", dealNotes: "" }]);
    }
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 10MB limit.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setUploadedFiles(prev => [...prev, {
            url: result.url,
            fileName: result.fileName,
            size: result.size,
          }]);
        } else {
          alert(result.error || "Failed to upload file");
        }
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload file");
      }
    }

    setIsUploading(false);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const buildRecordData = () => ({
    employeeId: session?.user?.id || "",
    employeeName: session?.user?.name || "",
    companyName,
    companyEmail,
    products: products.map(p => ({
      productName: p.productName,
      categoryId: p.categoryId,
      unitPrice: parseFloat(p.unitPrice) || 0,
      quantity: parseInt(p.quantity) || 1,
      originalPrice: p.originalPrice ? parseFloat(p.originalPrice) : undefined,
      dealNotes: p.dealNotes,
    })),
    taxEnabled,
    vatEnabled,
    proofOfSale: uploadedFiles.map(f => f.url),
  });

  const handleSaveDraft = () => {
    startTransition(async () => {
      const data = buildRecordData();
      let result;
      if (isEditing) {
        result = await updateSalesRecord(editId, data);
      } else {
        result = await createSalesRecord(data);
      }
      if (result.success) {
        router.push("/sales-manager/records");
      }
    });
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const data = buildRecordData();
      if (isEditing) {
        const result = await updateSalesRecord(editId, data);
        if (result.success) {
          await submitSalesRecord(editId);
          router.push("/sales-manager/records");
        }
      } else {
        const record = await createSalesRecord(data);
        if (record.success && record.id) {
          await submitSalesRecord(record.id);
          router.push("/sales-manager/records");
        }
      }
    });
  };

  const calculateTotal = () => {
    return products.reduce((sum, p) => {
      return sum + (parseFloat(p.unitPrice) || 0) * (parseInt(p.quantity) || 1);
    }, 0);
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading record...</p>
        </div>
      ) : (
      <>
      <div>
        <h1 className="text-3xl font-bold">{isEditing ? "Edit Sales Record" : "Add Sales Record"}</h1>
        <p className="text-muted-foreground">{isEditing ? "Modify the sales record details" : "Create a new sales record as manager"}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" />
            </div>
            <div>
              <Label>Company Email</Label>
              <Input type="email" value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} placeholder="Enter company email" />
            </div>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Checkbox checked={taxEnabled} onCheckedChange={setTaxEnabled} />
              <Label>Include Tax</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={vatEnabled} onCheckedChange={setVatEnabled} />
              <Label>Include VAT</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {products.map((product, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Product {index + 1}</CardTitle>
              {products.length > 1 && (
                <Button variant="ghost" size="sm" onClick={() => removeProduct(index)}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Product Name</Label>
                <Input value={product.productName} onChange={(e) => updateProduct(index, "productName", e.target.value)} placeholder="Enter product name" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={product.categoryId} onValueChange={(v) => updateProduct(index, "categoryId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Unit Price</Label>
                <Input type="number" value={product.unitPrice} onChange={(e) => updateProduct(index, "unitPrice", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Original Price</Label>
                <Input type="number" value={product.originalPrice} onChange={(e) => updateProduct(index, "originalPrice", e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={product.quantity} onChange={(e) => updateProduct(index, "quantity", e.target.value)} />
              </div>
              <div>
                <Label>Deal Notes</Label>
                <Input value={product.dealNotes} onChange={(e) => updateProduct(index, "dealNotes", e.target.value)} placeholder="Add any notes..." />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-between items-center">
        {products.length < 20 && (
          <Button variant="outline" onClick={addProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total: ৳{calculateTotal().toLocaleString()}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proof of Sale (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">
              <Upload className="h-4 w-4" />
              Upload Files
              <input
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>
            <p className="text-sm text-muted-foreground">
              JPG, PNG, PDF (max 10MB each)
            </p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md border"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleSaveDraft} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Saving..." : "Save Draft"}
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          <Send className="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>
      </div>
      </>
      )}
    </div>
  );
}
