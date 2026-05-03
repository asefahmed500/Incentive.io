"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/lib/models/Team";
import { User } from "@/lib/models/User";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(200),
  managerId: objectIdSchema,
});

const updateTeamSchema = z.object({
  id: objectIdSchema,
  name: z.string().min(1).max(200).optional(),
  managerId: objectIdSchema.optional(),
});

const deleteTeamSchema = objectIdSchema;

export async function getTeams() {
  await connectToDatabase();
  const teams = await Team.find().populate("managerId", "name email").lean();
  return teams.map((t) => ({
    id: t._id.toString(),
    name: t.name,
    managerId: (t.managerId as unknown as { _id?: { toString: () => string } })?._id?.toString() || "",
    managerName: (t.managerId as unknown as { name?: string })?.name || "",
    memberCount: t.members?.length || 0,
    createdAt: t.createdAt,
  }));
}

export async function createTeam({ name, managerId }: { name: string; managerId: string }) {
  const parsed = createTeamSchema.safeParse({ name, managerId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const team = await Team.create({ name: parsed.data.name, managerId: parsed.data.managerId, members: [] });
  await User.findByIdAndUpdate(parsed.data.managerId, { teamId: team._id });
  return { success: true };
}

export async function updateTeam({ id, name, managerId }: { id: string; name?: string; managerId?: string }) {
  const parsed = updateTeamSchema.safeParse({ id, name, managerId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.managerId) {
    updateData.managerId = parsed.data.managerId;
    await User.findByIdAndUpdate(parsed.data.managerId, { teamId: id });
  }
  await Team.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}

export async function deleteTeam(id: string) {
  const parsed = deleteTeamSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  const team = await Team.findById(parsed.data);
  if (team?.managerId) {
    await User.findByIdAndUpdate(team.managerId, { teamId: null });
  }
  await User.updateMany({ teamId: parsed.data }, { teamId: null });
  await Team.findByIdAndDelete(parsed.data);
  return { success: true };
}