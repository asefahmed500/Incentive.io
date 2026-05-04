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
import { Plus, Search, Pencil, Trash2, Users, UserPlus, X } from "lucide-react";
import {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addMember,
  removeMember,
} from "@/lib/actions/team.actions";
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
  const [search, setSearch] = useState("");

  const [membersOpen, setMembersOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [memberActionPending, setMemberActionPending] = useState(false);

  const fetchTeams = () => {
    startTransition(async () => {
      setLoading(true);
      const [teamsData, usersData] = await Promise.all([
        getTeams(),
        getUsers({ role: "salesManager", search: "" }),
      ]);
      setTeams(Array.isArray(teamsData) ? teamsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      if (!Array.isArray(teamsData)) console.error((teamsData as any)?.error || "Failed to fetch teams");
      if (!Array.isArray(usersData)) console.error((usersData as any)?.error || "Failed to fetch users");
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("Delete this team? Members will become unassigned.")) {
      const result = await deleteTeam(id);
      if (result?.error) {
        alert(result.error);
        return;
      }
      fetchTeams();
    }
  };

  const openMembersDialog = async (team: any) => {
    setSelectedTeam(team);
    setMembersOpen(true);
    const [teamMembers, executives] = await Promise.all([
      getTeamMembers(team.id),
      getUsers({ role: "salesExecutive", search: "" }),
    ]);
    const members = Array.isArray(teamMembers) ? teamMembers : [];
    const execs = Array.isArray(executives) ? executives : [];
    setMembers(members);
    const memberIds = new Set(members.map((m: any) => m.id));
    setAvailableUsers(execs.filter((u: any) => !memberIds.has(u.id)));
    if (!Array.isArray(teamMembers)) console.error((teamMembers as any)?.error || "Failed to fetch team members");
    if (!Array.isArray(executives)) console.error((executives as any)?.error || "Failed to fetch executives");
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedTeam) return;
    setMemberActionPending(true);
    const addResult = await addMember(selectedTeam.id, userId);
    if (addResult?.error) {
      alert(addResult.error);
      setMemberActionPending(false);
      return;
    }
    const [teamMembers, executives] = await Promise.all([
      getTeamMembers(selectedTeam.id),
      getUsers({ role: "salesExecutive", search: "" }),
    ]);
    const members = Array.isArray(teamMembers) ? teamMembers : [];
    const execs = Array.isArray(executives) ? executives : [];
    setMembers(members);
    const memberIds = new Set(members.map((m: any) => m.id));
    setAvailableUsers(execs.filter((u: any) => !memberIds.has(u.id)));
    fetchTeams();
    setMemberActionPending(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam || !confirm("Remove this member from the team?")) return;
    setMemberActionPending(true);
    const removeResult = await removeMember(selectedTeam.id, userId);
    if (removeResult?.error) {
      alert(removeResult.error);
      setMemberActionPending(false);
      return;
    }
    const [teamMembers, executives] = await Promise.all([
      getTeamMembers(selectedTeam.id),
      getUsers({ role: "salesExecutive", search: "" }),
    ]);
    const members = Array.isArray(teamMembers) ? teamMembers : [];
    const execs = Array.isArray(executives) ? executives : [];
    setMembers(members);
    const memberIds = new Set(members.map((m: any) => m.id));
    setAvailableUsers(execs.filter((u: any) => !memberIds.has(u.id)));
    fetchTeams();
    setMemberActionPending(false);
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
                {editTeam
                  ? `Update team details · ${editTeam.memberCount} member${editTeam.memberCount !== 1 ? "s" : ""}`
                  : "Create a new team"}
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
              <Input placeholder="Search teams..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                teams
                  .filter((team) =>
                    !search || team.name.toLowerCase().includes(search.toLowerCase()) || (team.managerName || "").toLowerCase().includes(search.toLowerCase())
                  )
                  .map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell>{team.managerName || "—"}</TableCell>
                    <TableCell>{team.memberCount} members</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMembersDialog(team)}
                          title="Manage members"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Team Members — {selectedTeam?.name}
            </DialogTitle>
            <DialogDescription>
              Add or remove members from this team
            </DialogDescription>
          </DialogHeader>

          {availableUsers.length > 0 && (
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(userId) => handleAddMember(userId)}
                disabled={memberActionPending}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select an executive to add..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </div>
          )}

          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No members yet. Use the dropdown above to add executives.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={memberActionPending}
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {availableUsers.length === 0 && members.length > 0 && (
            <p className="text-xs text-muted-foreground">
              All executives are already assigned to this team.
            </p>
          )}
        </DialogContent>
      </Dialog>
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
      const result = await updateTeam({ id: editTeam.id, name: data.name, managerId: data.managerId });
      if (result?.error) {
        alert(result.error);
        return;
      }
    } else {
      const result = await createTeam({ name: data.name, managerId: data.managerId });
      if (result?.error) {
        alert(result.error);
        return;
      }
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