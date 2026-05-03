"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { notifyTargetAssigned } from "@/lib/actions/notification.actions";

export async function getTargets() {
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
    managerName: (u.managerId as any)?.name || "",
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
  await connectToDatabase();
  await User.findByIdAndUpdate(userId, { 
    targetAmount,
    targetPeriod: period || "monthly",
  });

  try {
    await notifyTargetAssigned(userId, targetAmount);
  } catch (notifError) {
    console.error("Failed to send target assigned notification:", notifError);
  }

  return { success: true };
}

export async function removeTarget(userId: string) {
  await connectToDatabase();
  await User.findByIdAndUpdate(userId, { 
    targetAmount: 0,
    targetPeriod: null,
  });
  return { success: true };
}