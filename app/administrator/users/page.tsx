"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { getUsers, createUser, updateUser, deleteUser, toggleUserStatus, resetPassword } from "@/lib/actions/user.actions";
import { getTeams } from "@/lib/actions/team.actions";
import { useSession } from "next-auth/react";

export default function SuperAdminUsers() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "salesExecutive",
    phone: "",
    teamId: "",
    managerId: "",
  });

  const fetchManagers = async () => {
    const data = await getUsers({ role: "salesManager" });
    setManagers(Array.isArray(data) ? data : []);
    if (!Array.isArray(data)) console.error((data as any)?.error || "Failed to fetch managers");
  };

  const fetchTeamsData = async () => {
    const data = await getTeams();
    setTeams(Array.isArray(data) ? data : []);
    if (!Array.isArray(data)) console.error((data as any)?.error || "Failed to fetch teams");
  };

  const fetchUsers = () => {
    startTransition(async () => {
      setLoading(true);
      const data = await getUsers({ search, role: roleFilter !== "all" ? roleFilter : undefined });
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        setUsers([]);
        console.error((data as any)?.error || "Failed to fetch users");
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchManagers();
    fetchTeamsData();
    fetchUsers();
  }, [search, roleFilter]);

  const handleSubmit = async () => {
    startTransition(async () => {
      if (editingUser) {
        const result = await updateUser({ id: editingUser.id, ...formData });
        if (result?.error) {
          alert(result.error);
          return;
        }
      } else {
        const result = await createUser(formData);
        if (result?.error) {
          alert(result.error);
          return;
        }
      }
      setOpenDialog(false);
      setEditingUser(null);
      setFormData({ name: "", email: "", password: "", role: "salesExecutive", phone: "", teamId: "", managerId: "" });
      fetchUsers();
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      const result = await deleteUser(id);
      if (result?.error) {
        alert(result.error);
        return;
      }
      fetchUsers();
    }
  };

  const handleToggleStatus = async (id: string) => {
    const result = await toggleUserStatus(id);
    if (result?.error) {
      alert(result.error);
      return;
    }
    fetchUsers();
  };

  const handleResetPassword = async (id: string) => {
    const defaultPassword = "Password123!";
    const result = await resetPassword({ userId: id, newPassword: defaultPassword });
    if (result?.error) {
      alert(result.error);
      return;
    }
    alert("Password reset to default. User will be prompted to change on next login.");
  };

  const openEdit = (user: any) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      phone: user.phone || "",
      teamId: user.teamId || "",
      managerId: user.managerId || "",
    });
    setOpenDialog(true);
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      administrator: "bg-purple-100 text-purple-700",
      admin: "bg-red-100 text-red-700",
      salesManager: "bg-blue-100 text-blue-700",
      salesExecutive: "bg-green-100 text-green-700",
      accountant: "bg-yellow-100 text-yellow-700",
      finance: "bg-cyan-100 text-cyan-700",
    };
    return <span className={`px-2 py-1 rounded text-xs ${colors[role] || "bg-gray-100"}`}>{role}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Full user management (SuperAdmin)</p>
        </div>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingUser(null); setFormData({ name: "", email: "", password: "", role: "salesExecutive", phone: "", teamId: "", managerId: "" }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create User"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
              </div>
              <div>
                <Label>Password {!editingUser && "(required)"}</Label>
                <Input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? "Leave blank to keep current" : "Password"} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="administrator">Administrator (SuperAdmin)</SelectItem>
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
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Phone number" />
              </div>
              <div>
                <Label>Manager</Label>
                <Select value={formData.managerId || "__none__"} onValueChange={(v) => setFormData({ ...formData, managerId: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Team</Label>
                <Select value={formData.teamId || "__none__"} onValueChange={(v) => setFormData({ ...formData, teamId: v === "__none__" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editingUser ? "Update" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter by role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="administrator">SuperAdmin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="salesManager">Sales Manager</SelectItem>
                <SelectItem value="salesExecutive">Sales Executive</SelectItem>
                <SelectItem value="accountant">Accountant</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center">No users found</TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "default" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(user.id)}>
                          {user.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleResetPassword(user.id)}><RefreshCw className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                      </div>
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