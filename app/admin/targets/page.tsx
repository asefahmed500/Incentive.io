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
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { getTargets, assignTarget, removeTarget } from "@/lib/actions/target.actions";
import { getUsers } from "@/lib/actions/user.actions";
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

const targetSchema = z.object({
  userId: z.string().min(1, "User required"),
  targetAmount: z.coerce.number().min(0, "Target must be positive"),
  period: z.string().optional(),
});

export default function AdminTargets() {
  const [targets, setTargets] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);

  const fetchTargets = () => {
    startTransition(async () => {
      setLoading(true);
      const [targetsData, usersData] = await Promise.all([
        getTargets(),
        getUsers({ search: "", role: "all" }),
      ]);
      const safeTargets = Array.isArray(targetsData) ? targetsData : [];
      const safeUsers = Array.isArray(usersData) ? usersData : [];
      if (!Array.isArray(targetsData)) console.error((targetsData as any)?.error || "Failed to fetch targets");
      if (!Array.isArray(usersData)) console.error((usersData as any)?.error || "Failed to fetch users");
      setTargets(safeTargets);
      const executives = safeUsers.filter(
        (u: any) => u.role === "salesExecutive" || u.role === "salesManager"
      );
      setAvailableUsers(executives);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTargets();
  }, []);

  const handleRemove = async (id: string) => {
    if (confirm("Remove target from this user?")) {
      const result = await removeTarget(id);
      if (result?.error) {
        alert(result.error);
        return;
      }
      fetchTargets();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Targets</h1>
          <p className="text-muted-foreground">Assign sales targets to users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditTarget(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Assign Target
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTarget ? "Edit Target" : "Assign New Target"}</DialogTitle>
              <DialogDescription>
                Set monthly or quarterly sales target
              </DialogDescription>
            </DialogHeader>
            <TargetForm
              availableUsers={availableUsers}
              editTarget={editTarget}
              onSuccess={() => {
                setOpen(false);
                fetchTargets();
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
              <Input placeholder="Search users..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Target</TableHead>
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
              ) : targets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No targets assigned
                  </TableCell>
                </TableRow>
              ) : (
                targets.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="capitalize">
                      {t.role.replace(/([A-Z])/g, " $1").trim()}
                    </TableCell>
                    <TableCell>{t.managerName || "—"}</TableCell>
                    <TableCell className="font-medium">৳{t.targetAmount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditTarget(t);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(t.id)}
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

function TargetForm({
  availableUsers,
  editTarget,
  onSuccess,
}: {
  availableUsers: any[];
  editTarget?: any;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      userId: editTarget?.id || "",
      targetAmount: editTarget?.targetAmount || 0,
      period: editTarget?.period || "monthly",
    },
  });

  useEffect(() => {
    if (editTarget) {
      reset({
        userId: editTarget.id,
        targetAmount: editTarget.targetAmount,
        period: editTarget.period || "monthly",
      });
    }
  }, [editTarget]);

  const onSubmit = async (data: any) => {
    if (editTarget) {
      const result = await assignTarget({
        userId: editTarget.id,
        targetAmount: data.targetAmount,
        period: data.period,
      });
      if (result?.error) {
        alert(result.error);
        return;
      }
    } else {
      const result = await assignTarget({
        userId: data.userId,
        targetAmount: data.targetAmount,
        period: data.period,
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
      {!editTarget && (
        <div>
          <Label>User</Label>
          <Select onValueChange={(v) => setValue("userId", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.userId && (
            <p className="text-sm text-red-500">{errors.userId.message as string}</p>
          )}
        </div>
      )}
      <div>
        <Label>Target Amount</Label>
        <Input type="number" {...register("targetAmount")} />
        {errors.targetAmount && (
          <p className="text-sm text-red-500">{errors.targetAmount.message as string}</p>
        )}
      </div>
      <div>
        <Label>Period</Label>
        <Select
          value={editTarget?.period || "monthly"}
          onValueChange={(v) => setValue("period", v)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="quarterly">Quarterly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : editTarget ? "Update Target" : "Assign Target"}
      </Button>
    </form>
  );
}