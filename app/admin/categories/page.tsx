"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { getCategories, createCategory, updateCategory, deleteCategory, toggleCategoryAutoApprove } from "@/lib/actions/category.actions";
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
import { useNotifications } from "@/hooks/useNotifications";

const categorySchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().optional(),
  autoApprove: z.boolean().optional(),
});

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<any>(null);
  const [search, setSearch] = useState("");

  const fetchCategories = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this category? Products using it will lose category.")) {
      await deleteCategory(id);
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditCategory(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
              <DialogDescription>
                {editCategory ? "Update category" : "Create a new category"}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              editCategory={editCategory}
              onSuccess={() => {
                setOpen(false);
                fetchCategories();
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
              <Input placeholder="Search categories..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Auto-Approve</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No categories found
                  </TableCell>
                </TableRow>
              ) : (
                categories
                  .filter((cat) =>
                    !search || cat.name.toLowerCase().includes(search.toLowerCase()) || (cat.description || "").toLowerCase().includes(search.toLowerCase())
                  )
                  .map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell>{cat.description || "—"}</TableCell>
                    <TableCell>
                      {cat.autoApprove ? (
                        <Badge variant="default">Enabled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const result = await toggleCategoryAutoApprove({ id: cat.id, autoApprove: !cat.autoApprove });
                          if (result.error) {
                            alert(result.error);
                          } else {
                            fetchCategories();
                          }
                        }}
                        title={cat.autoApprove ? "Disable auto-approve" : "Enable auto-approve"}
                      >
                        {cat.autoApprove ? "Disable" : "Enable"} Auto-Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditCategory(cat);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(cat.id)}
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

function CategoryForm({
  editCategory,
  onSuccess,
}: {
  editCategory?: any;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { showSuccess, showError } = useNotifications();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: editCategory?.name || "",
      description: editCategory?.description || "",
      autoApprove: editCategory?.autoApprove || false,
    },
  });

  const onSubmit = async (data: any) => {
    startTransition(async () => {
      try {
        if (editCategory) {
          const result = await updateCategory({
            id: editCategory.id,
            name: data.name,
            description: data.description,
            autoApprove: data.autoApprove,
          }) as { success?: boolean; error?: string } | undefined;
          if (result?.error) {
            showError(result.error);
            return;
          }
        } else {
          const result = await createCategory({
            name: data.name,
            description: data.description,
            autoApprove: data.autoApprove,
          }) as { success?: boolean; error?: string } | undefined;
          if (result?.error) {
            showError(result.error);
            return;
          }
        }
        showSuccess(editCategory ? "Category updated" : "Category created");
        onSuccess();
      } catch (err) {
        showError(err instanceof Error ? err.message : "An error occurred");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Category Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="description">Description (optional)</Label>
        <Input id="description" {...register("description")} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoApprove"
          {...register("autoApprove")}
          checked={watch("autoApprove")}
          onCheckedChange={(checked) => {
            // Manually update the form value when checkbox changes
            (register("autoApprove") as any).onChange({ target: { value: checked, name: "autoApprove" } });
          }}
        />
        <Label htmlFor="autoApprove" className="cursor-pointer">
          Enable Auto-Approve for this category
        </Label>
      </div>
      <p className="text-sm text-muted-foreground">
        Sales with all products from auto-approve categories will be automatically approved upon submission, bypassing the normal approval workflow.
      </p>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : editCategory ? "Update Category" : "Create Category"}
      </Button>
    </form>
  );
}