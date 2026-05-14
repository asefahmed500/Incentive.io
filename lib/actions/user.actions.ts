"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { Wallet } from "@/lib/models/Wallet";
import { Team } from "@/lib/models/Team";
import { sendWelcomeEmail, sendNotificationEmail } from "@/lib/email";
import { notifyUserCreated } from "@/lib/actions/notification.actions";
import { logAudit } from "@/lib/actions/audit.actions";
import type { AuthUser, UserRole } from "@/types";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const getUsersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
});

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  role: z.enum(["admin", "administrator", "salesManager", "salesExecutive", "accountant", "finance"]),
  phone: z.string().max(50).optional(),
});

const updateUserSchema = z.object({
  id: objectIdSchema,
  name: z.string().min(1).max(200).optional(),
  email: z.string().email("Invalid email format").optional(),
  role: z.string().optional(),
  phone: z.string().max(50).optional(),
  isActive: z.boolean().optional(),
  managerId: objectIdSchema.optional(),
  teamId: objectIdSchema.optional(),
});

const deleteUserSchema = z.object({
  id: objectIdSchema,
});

const getUserByIdSchema = objectIdSchema;

const getManagerForUserSchema = objectIdSchema;

const toggleUserStatusSchema = objectIdSchema;

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

const resetPasswordSchema = z.object({
  userId: objectIdSchema,
  newPassword: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export async function getUsers({
  search,
  role,
}: {
  search?: string;
  role?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = getUsersSchema.safeParse({ search, role });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (parsed.data.search) {
    const escapedSearch = parsed.data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
    ];
  }
  if (parsed.data.role && parsed.data.role !== "all") {
    query.role = parsed.data.role;
  }

  const users = await User.find(query).sort({ createdAt: -1 }).lean();
  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    employeeId: u.employeeId,
    phone: u.phone,
    isActive: u.isActive,
    managerId: u.managerId?.toString(),
    teamId: u.teamId?.toString(),
    targetAmount: u.targetAmount,
    createdAt: u.createdAt,
  }));
}

export async function createUser({
  name,
  email,
  password,
  role,
  phone,
}: {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = createUserSchema.safeParse({ name, email, password, role, phone });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const existingUser = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (existingUser) {
    return { error: "Email already registered" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10);
  const employeeId = Math.floor(10000 + Math.random() * 90000).toString();

  await User.create({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password: hashedPassword,
    role: parsed.data.role,
    phone: parsed.data.phone || "",
    employeeId,
    isActive: true,
    targetAmount: 0,
  });

  // Audit logging for user creation
  await logAudit({
    userId: session.user.id,
    userEmail: session.user.email || undefined,
    userRole,
    action: "user.created",
    entity: "User",
    details: {
      createdUserName: parsed.data.name,
      createdUserEmail: parsed.data.email.toLowerCase(),
      createdUserRole: parsed.data.role,
      employeeId,
    },
  });

  try {
    await sendWelcomeEmail(parsed.data.email.toLowerCase(), parsed.data.name);
  } catch (emailError) {
    console.error("Failed to send welcome email:", emailError);
  }

  const createdUser = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (createdUser) {
    try {
      await notifyUserCreated(createdUser._id.toString(), parsed.data.name, parsed.data.role);
    } catch (notifError) {
      console.error("Failed to send in-app notification:", notifError);
    }
  }

  return { success: true };
}

export async function updateUser({
  id,
  name,
  email,
  role,
  phone,
  isActive,
  managerId,
  teamId,
}: {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
  managerId?: string;
  teamId?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = updateUserSchema.safeParse({ id, name, email, role, phone, isActive, managerId, teamId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name) updateData.name = parsed.data.name;
  if (parsed.data.email) updateData.email = parsed.data.email.toLowerCase();
  if (parsed.data.role) updateData.role = parsed.data.role;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.managerId !== undefined) updateData.managerId = parsed.data.managerId || null;
  if (parsed.data.teamId !== undefined) updateData.teamId = parsed.data.teamId || null;

  await User.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = deleteUserSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  // Cascading delete: Clean up related data before deleting user
  const userId = parsed.data;

  // 1. Soft delete user's sales records
  await SalesRecord.updateMany(
    { employeeId: userId },
    { deletedAt: new Date() }
  );

  // 2. Soft delete user's wallet
  await Wallet.findOneAndUpdate(
    { employeeId: userId },
    { deletedAt: new Date() }
  );

  // 3. Remove user from teams (unset from members array)
  await Team.updateMany(
    { members: userId },
    { $pull: { members: userId } }
  );

  // 4. Clear managerId for users who report to this user
  await User.updateMany(
    { managerId: userId },
    { managerId: null }
  );

  // 5. Finally, soft delete the user
  await User.findByIdAndUpdate(userId, { deletedAt: new Date() });

  return { success: true };
}

export async function getUserById(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = getUserByIdSchema.safeParse(id);
  if (!parsed.success) return null;
  await connectToDatabase();
  const user = await User.findById(parsed.data).lean();
  if (!user) return null;
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    employeeId: user.employeeId,
    phone: user.phone,
    isActive: user.isActive,
    managerId: user.managerId?.toString(),
  };
}

export async function getManagerForUser(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = getManagerForUserSchema.safeParse(userId);
  if (!parsed.success) return null;
  await connectToDatabase();
  const user = await User.findById(parsed.data).populate("managerId", "name email phone").lean();
  if (!user || !user.managerId) return null;
  const mgr = user.managerId as unknown as { _id: { toString: () => string }; name: string; email: string; phone?: string };
  return {
    id: mgr._id.toString(),
    name: mgr.name,
    email: mgr.email,
    phone: mgr.phone || "",
  };
}

export async function toggleUserStatus(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = toggleUserStatusSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid user ID" };
  }
  await connectToDatabase();
  const user = await User.findById(parsed.data);
  if (!user) return { error: "User not found" };
  await User.findByIdAndUpdate(parsed.data, { isActive: !user.isActive });
  return { success: true };
}

export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id as string;
  const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const user = await User.findById(userId);
  if (!user) {
    return { error: "User not found" };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
  await User.findByIdAndUpdate(userId, { password: hashedPassword });
  return { success: true };
}

export async function resetPassword({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = resetPasswordSchema.safeParse({ userId, newPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);

  const user = await User.findById(parsed.data.userId);
  if (!user) return { error: "User not found" };

  await User.findByIdAndUpdate(parsed.data.userId, { password: hashedPassword });

  try {
    await sendNotificationEmail(
      user.email,
      "Password Reset",
      `Hi ${user.name},<br><br>Your password has been reset by an administrator. Please log in with your new password and change it immediately.`
    );
  } catch (emailError) {
    console.error("Failed to send password reset email:", emailError);
  }

  return { success: true };
}