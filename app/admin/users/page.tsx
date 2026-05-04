"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Edit, Shield, ShieldOff, RotateCcw, Trash2, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { getUsers, createUser, updateUser, deleteUser, resetPassword, toggleUserStatus } from "@/lib/actions/user.actions";
import { getTeams } from "@/lib/actions/team.actions";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const userSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 chars").optional(),
  role: z.enum(["admin", "salesManager", "salesExecutive", "accountant", "finance"]),
  phone: z.string().optional(),
});

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "",
    phone: "",
    managerId: "",
    teamId: "",
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const fetchUsers = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getUsers({ search, role: roleFilter });
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
        console.error((data as any)?.error || "Failed to fetch users");
      }
      setLoading(false);
    });
  };

  const fetchDropdowns = async () => {
    const [mgrs, tmData] = await Promise.all([
      getUsers({ role: "salesManager" }),
      getTeams(),
    ]);
    setManagers(Array.isArray(mgrs) ? mgrs : []);
    setTeams(Array.isArray(tmData) ? tmData : []);
    if (!Array.isArray(mgrs)) console.error((mgrs as any)?.error || "Failed to fetch managers");
    if (!Array.isArray(tmData)) console.error((tmData as any)?.error || "Failed to fetch teams");
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const openEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
      managerId: user.managerId || "",
      teamId: user.teamId || "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async () => {
    startTransition(async () => {
      const result = await updateUser({
        id: editingUser.id,
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        phone: editForm.phone,
        managerId: editForm.managerId || undefined,
        teamId: editForm.teamId || undefined,
      });
      if (result?.error) {
        alert(result.error);
        return;
      }
      setEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    });
  };

  const exportToCSV = () => {
    if (users.length === 0) return;
    const rows = users.map((u) => ({
      Name: u.name,
      Email: u.email,
      Role: u.role.replace(/([A-Z])/g, " $1").trim(),
      "Employee ID": u.employeeId || "",
      Phone: u.phone || "",
      Status: u.isActive ? "Active" : "Inactive",
      "Created Date": u.createdAt
        ? new Date(u.createdAt).toLocaleDateString()
        : "",
    }));
    const headers = Object.keys(rows[0]).join(",");
    const csvRows = rows.map((row) =>
      Object.values(row)
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [headers, ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV} disabled={users.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account</DialogDescription>
            </DialogHeader>
            <UserForm
              onSuccess={() => {
                setOpen(false);
                fetchUsers();
              }}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user details, manager, and team assignment</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="salesManager">Sales Manager</SelectItem>
                  <SelectItem value="salesExecutive">Sales Executive</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <Label>Manager</Label>
              <Select value={editForm.managerId || "_none"} onValueChange={(v) => setEditForm({ ...editForm, managerId: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {managers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Team</Label>
              <Select value={editForm.teamId || "_none"} onValueChange={(v) => setEditForm({ ...editForm, teamId: v === "_none" ? "" : v })}>
                <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={isPending}>
              {isPending ? "Saving..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="salesExecutive">Sales Executive</SelectItem>
                <SelectItem value="salesManager">Sales Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
            {(() => {
              const totalPages = Math.max(1, Math.ceil(users.length / 20));
              const paginatedUsers = users.slice((page - 1) * 20, page * 20);
              return (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
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
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">
                      {user.role.replace(/([A-Z])/g, " $1").trim()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const result = await toggleUserStatus(user.id);
                          if (result?.error) {
                            alert(result.error);
                            return;
                          }
                          fetchUsers();
                        }}
                      >
                        {user.isActive ? (
                          <ShieldOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (confirm("Reset this user's password? A temporary password will be generated.")) {
                            const tempPassword = `Tmp${Math.random().toString(36).slice(2, 10)}!`;
                            const result = await resetPassword({ userId: user.id, newPassword: tempPassword });
                            if (result?.success) {
                              alert(`Password reset. Temporary password: ${tempPassword}\n\nPlease share this securely with the user.`);
                            } else {
                              alert("Failed to reset password: " + (result?.error || "Unknown error"));
                            }
                            fetchUsers();
                          }
                        }}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm"
                        onClick={async () => {
                          if (confirm("Delete this user? This cannot be undone.")) {
                            const result = await deleteUser(user.id);
                            if (result?.error) {
                              alert(result.error);
                              return;
                            }
                            fetchUsers();
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </>
            );
            })()}
          </CardContent>
      </Card>
    </div>
  );
}

function UserForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: "salesExecutive",
    },
  });

  const onSubmit = async (data: z.infer<typeof userSchema>) => {
    startTransition(async () => {
      const result = await createUser({
        name: data.name,
        email: data.email,
        password: data.password || "TempPass123!",
        role: data.role,
        phone: data.phone,
      });
      if (result?.error) {
        alert(result.error);
        return;
      }
      if (result.success) {
        onSuccess();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>
      <div>
        <Label htmlFor="role">Role</Label>
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salesExecutive">Sales Executive</SelectItem>
                <SelectItem value="salesManager">Sales Manager</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create User"}
      </Button>
    </form>
  );
}