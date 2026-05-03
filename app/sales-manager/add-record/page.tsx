"use client";

import { useState, useEffect, useTransition } from "react";
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
import { Plus, Trash2, Save, Send } from "lucide-react";
import { getCategories } from "@/lib/actions/category.actions";
import { createSalesRecord, submitSalesRecord, updateSalesRecord } from "@/lib/actions/sales.actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

export default function ManagerAddRecord() {
  const { data: session } = useSession();
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [vatEnabled, setVatEnabled] = useState(false);
  const [products, setProducts] = useState([
    { productName: "", categoryId: "", unitPrice: "", quantity: "1", originalPrice: "", dealNotes: "" }
  ]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories();
      setCategories(data);
    };
    loadCategories();
  }, []);

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

  const handleSaveDraft = async () => {
    startTransition(async () => {
      const record = await createSalesRecord({
        companyName,
        companyEmail,
        taxEnabled,
        vatEnabled,
        products: products.map(p => ({
          productName: p.productName,
          categoryId: p.categoryId,
          unitPrice: parseFloat(p.unitPrice) || 0,
          quantity: parseInt(p.quantity) || 1,
          originalPrice: parseFloat(p.originalPrice) || 0,
          dealNotes: p.dealNotes,
        })),
        employeeId: session?.user?.id || "",
        employeeName: session?.user?.name || "",
      });
      
      if (record) {
        router.push("/sales-manager/records");
      }
    });
  };

  const handleSubmit = async () => {
    startTransition(async () => {
      const record = await createSalesRecord({
        companyName,
        companyEmail,
        taxEnabled,
        vatEnabled,
        products: products.map(p => ({
          productName: p.productName,
          categoryId: p.categoryId,
          unitPrice: parseFloat(p.unitPrice) || 0,
          quantity: parseInt(p.quantity) || 1,
          originalPrice: parseFloat(p.originalPrice) || 0,
          dealNotes: p.dealNotes,
        })),
        employeeId: session?.user?.id || "",
        employeeName: session?.user?.name || "",
      });
      
      if (record?.id) {
        await submitSalesRecord(record.id);
        router.push("/sales-manager/records");
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
      <div>
        <h1 className="text-3xl font-bold">Add Sales Record</h1>
        <p className="text-muted-foreground">Create a new sales record as manager</p>
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

      <div className="flex gap-4">
        <Button variant="outline" onClick={handleSaveDraft} disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          Save Draft
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          <Send className="h-4 w-4 mr-2" />
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}
