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
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/lib/actions/team.actions";
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

const teamSchema = z.object({
  name: z.string().min(1, "Team name required"),
  managerId: z.string().min(1, "Manager required"),
});

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<any>(null);

  const fetchTeams = () => {
    startTransition(async () => {
      setLoading(true);
      const [teamsData, usersData] = await Promise.all([
        getTeams(),
        getUsers({ role: "salesManager", search: "" }),
      ]);
      setTeams(teamsData);
      setUsers(usersData);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this team? Members will become unassigned.")) {
      await deleteTeam(id);
      fetchTeams();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Manage teams</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditTeam(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
              <DialogDescription>
                {editTeam ? "Update team details" : "Create a new team"}
              </DialogDescription>
            </DialogHeader>
            <TeamForm
              users={users}
              editTeam={editTeam}
              onSuccess={() => {
                setOpen(false);
                fetchTeams();
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
              <Input placeholder="Search teams..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team Name</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Members</TableHead>
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
              ) : teams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No teams found
                  </TableCell>
                </TableRow>
              ) : (
                teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.managerName || "—"}</TableCell>
                    <TableCell>{team.memberCount} members</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditTeam(team);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(team.id)}
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

function TeamForm({
  users,
  editTeam,
  onSuccess,
}: {
  users: any[];
  editTeam?: any;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: editTeam?.name || "",
      managerId: editTeam?.managerId || "",
    },
  });

  const onSubmit = async (data: any) => {
    if (editTeam) {
      await updateTeam({ id: editTeam.id, name: data.name, managerId: data.managerId });
    } else {
      await createTeam({ name: data.name, managerId: data.managerId });
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Team Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message as string}</p>
        )}
      </div>
      <div>
        <Label htmlFor="managerId">Manager</Label>
        <Select
          value={editTeam?.managerId}
          onValueChange={(v) => setValue("managerId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select manager" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.managerId && (
          <p className="text-sm text-red-500">{errors.managerId.message as string}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : editTeam ? "Update Team" : "Create Team"}
      </Button>
    </form>
  );
}