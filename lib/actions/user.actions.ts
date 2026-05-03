"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { sendWelcomeEmail, sendNotificationEmail } from "@/lib/email";
import { notifyUserCreated } from "@/lib/actions/notification.actions";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const getUsersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
});

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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
});

const deleteUserSchema = z.object({
  id: objectIdSchema,
});

const getUserByIdSchema = objectIdSchema;

const getManagerForUserSchema = objectIdSchema;

const toggleUserStatusSchema = objectIdSchema;

const changePasswordSchema = z.object({
  userId: objectIdSchema,
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

const resetPasswordSchema = z.object({
  userId: objectIdSchema,
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function getUsers({
  search,
  role,
}: {
  search?: string;
  role?: string;
}) {
  const parsed = getUsersSchema.safeParse({ search, role });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (parsed.data.search) {
    query.$or = [
      { name: { $regex: parsed.data.search, $options: "i" } },
      { email: { $regex: parsed.data.search, $options: "i" } },
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
}: {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  isActive?: boolean;
}) {
  const parsed = updateUserSchema.safeParse({ id, name, email, role, phone, isActive });
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

  await User.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}

export async function deleteUser(id: string) {
  const parsed = deleteUserSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  await User.findByIdAndDelete(parsed.data.id);
  return { success: true };
}

export async function getUserById(id: string) {
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
  userId,
  currentPassword,
  newPassword,
}: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const parsed = changePasswordSchema.safeParse({ userId, currentPassword, newPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const user = await User.findById(parsed.data.userId);
  if (!user) {
    return { error: "User not found" };
  }

  const isValid = await bcrypt.compare(parsed.data.currentPassword, user.password);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
  await User.findByIdAndUpdate(parsed.data.userId, { password: hashedPassword });
  return { success: true };
}

export async function resetPassword({
  userId,
  newPassword,
}: {
  userId: string;
  newPassword: string;
}) {
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