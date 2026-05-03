"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/lib/models/Team";
import { User } from "@/lib/models/User";

export async function getTeams() {
  await connectToDatabase();
  const teams = await Team.find().populate("managerId", "name email").lean();
  return teams.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    managerId: (t.managerId as any)?._id?.toString() || "",
    managerName: (t.managerId as any)?.name || "",
    memberCount: t.members?.length || 0,
    createdAt: t.createdAt,
  }));
}

export async function createTeam({ name, managerId }: { name: string; managerId: string }) {
  await connectToDatabase();
  const team = await Team.create({ name, managerId, members: [] });
  await User.findByIdAndUpdate(managerId, { teamId: team._id });
  return { success: true };
}

export async function updateTeam({ id, name, managerId }: { id: string; name?: string; managerId?: string }) {
  await connectToDatabase();
  const updateData: any = {};
  if (name) updateData.name = name;
  if (managerId) {
    updateData.managerId = managerId;
    await User.findByIdAndUpdate(managerId, { teamId: id });
  }
  await Team.findByIdAndUpdate(id, updateData);
  return { success: true };
}

export async function deleteTeam(id: string) {
  await connectToDatabase();
  const team = await Team.findById(id);
  if (team?.managerId) {
    await User.findByIdAndUpdate(team.managerId, { teamId: null });
  }
  await User.updateMany({ teamId: id }, { teamId: null });
  await Team.findByIdAndDelete(id);
  return { success: true };
}
