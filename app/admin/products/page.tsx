"use client";

import { useState, useTransition, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/lib/actions/product.actions";
import { getCategories } from "@/lib/actions/category.actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const productSchema = z.object({
  name: z.string().min(1, "Name required"),
  sku: z.string().min(1, "SKU required"),
  categoryId: z.string().min(1, "Category required"),
  price: z.coerce.number().min(0, "Price required"),
  stock: z.coerce.number().min(0).optional(),
});

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const fetchProducts = () => {
    startTransition(async () => {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        getProducts({ categoryId: categoryFilter !== "all" ? categoryFilter : undefined, search }),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this product?")) {
      await deleteProduct(id);
      fetchProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage products</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditProduct(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>
                {editProduct ? "Update product details" : "Create a new product"}
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              categories={categories}
              editProduct={editProduct}
              onSuccess={() => {
                setOpen(false);
                fetchProducts();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchProducts}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
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
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>{p.categoryName}</TableCell>
                    <TableCell>৳{p.price}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditProduct(p);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
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

function ProductForm({
  categories,
  editProduct,
  onSuccess,
}: {
  categories: any[];
  editProduct?: any;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: editProduct?.name || "",
      sku: editProduct?.sku || "",
      categoryId: editProduct?.categoryId || "",
      price: editProduct?.price || 0,
      stock: editProduct?.stock || 0,
    },
  });

  const onSubmit = async (data: any) => {
    if (editProduct) {
      await updateProduct({
        id: editProduct.id,
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        price: data.price,
        stock: data.stock,
      });
    } else {
      await createProduct({
        name: data.name,
        sku: data.sku,
        categoryId: data.categoryId,
        price: data.price,
        stock: data.stock,
      });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Product Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="sku">SKU</Label>
        <Input id="sku" {...register("sku")} />
        {errors.sku && (
          <p className="text-sm text-red-500">{errors.sku.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="categoryId">Category</Label>
        <Select
          value={editProduct?.categoryId}
          onValueChange={(v) => setValue("categoryId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && (
          <p className="text-sm text-red-500">{errors.categoryId.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="price">Price</Label>
        <Input id="price" type="number" {...register("price")} />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="stock">Stock</Label>
        <Input id="stock" type="number" {...register("stock")} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : editProduct ? "Update Product" : "Create Product"}
      </Button>
    </form>
  );
}