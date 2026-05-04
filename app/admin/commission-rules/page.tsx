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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Power } from "lucide-react";
import { getCommissionRules, createCommissionRule, updateCommissionRule, deleteCommissionRule } from "@/lib/actions/commission.actions";
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

const ruleSchema = z.object({
  targetPercentageFrom: z.coerce.number().min(0),
  targetPercentageTo: z.coerce.number().min(0),
  commissionRate: z.coerce.number().min(0).max(100),
  priority: z.coerce.number().optional(),
  categoryId: z.string().optional(),
});

export default function AdminCommissionRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editRule, setEditRule] = useState<any>(null);

  const fetchRules = () => {
    startTransition(async () => {
      setLoading(true);
      const [rulesData, categoriesData] = await Promise.all([
        getCommissionRules(),
        getCategories(),
      ]);
      if (Array.isArray(rulesData)) {
        setRules(rulesData);
      } else {
        setRules([]);
        console.error((rulesData as any)?.error || "Failed to fetch rules");
      }
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        setCategories([]);
        console.error((categoriesData as any)?.error || "Failed to fetch categories");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this rule?")) {
      const result = await deleteCommissionRule(id);
      if (result?.error) {
        alert(result.error);
        return;
      }
      fetchRules();
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const result = await updateCommissionRule({ id, isActive: !isActive });
    if (result?.error) {
      alert(result.error);
      return;
    }
    fetchRules();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commission Rules</h1>
          <p className="text-muted-foreground">Manage commission rates by achievement</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditRule(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editRule ? "Edit Rule" : "Add New Rule"}</DialogTitle>
              <DialogDescription>
                Set achievement range and commission rate
              </DialogDescription>
            </DialogHeader>
            <RuleForm
              categories={categories}
              editRule={editRule}
              onSuccess={() => {
                setOpen(false);
                fetchRules();
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
              <Input placeholder="Search rules..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>From %</TableHead>
                <TableHead>To %</TableHead>
                <TableHead>Rate %</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
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
              ) : rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No rules found
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.targetPercentageFrom}%</TableCell>
                    <TableCell>{r.targetPercentageTo}%</TableCell>
                    <TableCell className="font-medium">{r.commissionRate}%</TableCell>
                    <TableCell>{r.priority}</TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? "default" : "secondary"}>
                        {r.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(r.id, r.isActive)}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditRule(r);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
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

function RuleForm({
  categories,
  editRule,
  onSuccess,
}: {
  categories: any[];
  editRule?: any;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(ruleSchema),
    defaultValues: {
      targetPercentageFrom: editRule?.targetPercentageFrom || 0,
      targetPercentageTo: editRule?.targetPercentageTo || 100,
      commissionRate: editRule?.commissionRate || 2,
      priority: editRule?.priority || 0,
      categoryId: editRule?.categoryId || "",
    },
  });

  const onSubmit = async (data: any) => {
    if (editRule) {
      const result = await updateCommissionRule({
        id: editRule.id,
        targetPercentageFrom: data.targetPercentageFrom,
        targetPercentageTo: data.targetPercentageTo,
        commissionRate: data.commissionRate,
        priority: data.priority,
        categoryId: data.categoryId,
      });
      if (result?.error) {
        alert(result.error);
        return;
      }
    } else {
      const result = await createCommissionRule({
        targetPercentageFrom: data.targetPercentageFrom,
        targetPercentageTo: data.targetPercentageTo,
        commissionRate: data.commissionRate,
        priority: data.priority,
        categoryId: data.categoryId,
      });
      if (result?.error) {
        alert(result.error);
        return;
      }
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>From %</Label>
          <Input type="number" {...register("targetPercentageFrom")} />
        </div>
        <div>
          <Label>To %</Label>
          <Input type="number" {...register("targetPercentageTo")} />
        </div>
      </div>
      <div>
        <Label>Commission Rate %</Label>
        <Input type="number" step="0.1" {...register("commissionRate")} />
        {errors.commissionRate && (
          <p className="text-sm text-red-500">{errors.commissionRate.message as string}</p>
        )}
      </div>
      <div>
        <Label>Priority</Label>
        <Input type="number" {...register("priority")} />
      </div>
      <div>
        <Label>Category (optional)</Label>
        <Select
          value={editRule?.categoryId}
          onValueChange={(v) => setValue("categoryId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : editRule ? "Update Rule" : "Create Rule"}
      </Button>
    </form>
  );
}