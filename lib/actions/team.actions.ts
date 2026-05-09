"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Team } from "@/lib/models/Team";
import { User } from "@/lib/models/User";
import type { AuthUser, UserRole } from "@/types";

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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
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
  await Team.findByIdAndUpdate(parsed.data, { deletedAt: new Date() });
  return { success: true };
}

export async function addMember(teamId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = z.object({ teamId: objectIdSchema, userId: objectIdSchema }).safeParse({ teamId, userId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const team = await Team.findById(parsed.data.teamId);
  if (!team) return { error: "Team not found" };
  const memberObjectId = new mongoose.Types.ObjectId(parsed.data.userId);
  if (team.members.some((m: mongoose.Types.ObjectId) => m.equals(memberObjectId))) {
    return { error: "User is already a member of this team" };
  }
  await Team.findByIdAndUpdate(parsed.data.teamId, { $addToSet: { members: memberObjectId } });
  await User.findByIdAndUpdate(parsed.data.userId, { teamId: parsed.data.teamId });
  return { success: true };
}

export async function removeMember(teamId: string, userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = z.object({ teamId: objectIdSchema, userId: objectIdSchema }).safeParse({ teamId, userId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const team = await Team.findById(parsed.data.teamId);
  if (!team) return { error: "Team not found" };
  const memberObjectId = new mongoose.Types.ObjectId(parsed.data.userId);
  await Team.findByIdAndUpdate(parsed.data.teamId, { $pull: { members: memberObjectId } });
  await User.findByIdAndUpdate(parsed.data.userId, { teamId: null });
  return { success: true };
}

export async function getTeamMembers(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = objectIdSchema.safeParse(teamId);
  if (!parsed.success) return [];
  await connectToDatabase();
  const team = await Team.findById(parsed.data).populate("members", "name email role employeeId phone isActive targetAmount targetPeriod").lean();
  if (!team) return [];
  return (team.members as unknown as Array<{ _id: { toString: () => string }; name: string; email: string; role: string; employeeId: string; phone: string; isActive: boolean; targetAmount: number; targetPeriod: string }>).map((m) => ({
    id: m._id.toString(),
    name: m.name,
    email: m.email,
    role: m.role,
    employeeId: m.employeeId,
    phone: m.phone,
    isActive: m.isActive,
    targetAmount: m.targetAmount,
    targetPeriod: m.targetPeriod,
  }));
}