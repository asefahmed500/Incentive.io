"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { notifyTargetAssigned } from "@/lib/actions/notification.actions";
import { auth } from "@/lib/auth/auth";
import type { AuthUser } from "@/types";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const assignTargetSchema = z.object({
  userId: objectIdSchema,
  targetAmount: z.number().min(0, "Target amount must be non-negative"),
  period: z.string().optional(),
});

const removeTargetSchema = z.object({
  userId: objectIdSchema,
});

export async function getTargets() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator", "salesManager"].includes(userRole)) {
    return { error: "Forbidden: Insufficient permissions" };
  }

  await connectToDatabase();
  const users = await User.find({
    role: { $in: ["salesExecutive", "salesManager"] },
    targetAmount: { $gt: 0 },
  }).populate("managerId", "name").lean();

  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    targetAmount: u.targetAmount,
    managerName: (u.managerId as unknown as { name?: string })?.name || "",
  }));
}

export async function assignTarget({
  userId,
  targetAmount,
  period,
}: {
  userId: string;
  targetAmount: number;
  period?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator", "salesManager"].includes(userRole)) {
    return { error: "Forbidden: Insufficient permissions" };
  }

  const parsed = assignTargetSchema.safeParse({ userId, targetAmount, period });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  await User.findByIdAndUpdate(parsed.data.userId, {
    targetAmount: parsed.data.targetAmount,
    targetPeriod: parsed.data.period || "monthly",
  });

  try {
    await notifyTargetAssigned(parsed.data.userId, parsed.data.targetAmount);
  } catch (notifError) {
    console.error("Failed to send target assigned notification:", notifError);
  }

  return { success: true };
}

export async function removeTarget(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator", "salesManager"].includes(userRole)) {
    return { error: "Forbidden: Insufficient permissions" };
  }

  const parsed = removeTargetSchema.safeParse({ userId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  await User.findByIdAndUpdate(parsed.data.userId, {
    targetAmount: 0,
    targetPeriod: null,
  });
  return { success: true };
}