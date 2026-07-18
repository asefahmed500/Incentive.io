"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { Wallet } from "@/lib/models/Wallet";
import { Team } from "@/lib/models/Team";
import { sendWelcomeEmail, sendNotificationEmail, sendPasswordResetEmail } from "@/lib/email";
import { notifyUserCreated } from "@/lib/actions/notification.actions";
import { logAudit } from "@/lib/actions/audit.actions";
import { passwordSchema } from "@/lib/validations/user.validation";
import { hashPassword, verifyPassword, generateSecureToken } from "@/lib/utils/password";
import type { AuthUser, UserRole } from "@/types";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const getUsersSchema = z.object({
  search: z.string().optional(),
  role: z.string().optional(),
});

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email format"),
  password: passwordSchema,
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
  newPassword: passwordSchema,
});

const resetPasswordSchema = z.object({
  userId: objectIdSchema,
  newPassword: passwordSchema,
});

export async function getUsers({
  search,
  role,
  page,
  limit,
}: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = getUsersSchema.safeParse({ search, role });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (parsed.data.search) {
    const escapedSearch = parsed.data.search.replace(/[.*+?^{}()|[\]\\]/g, "\\$&");
    query.$or = [
      { name: { $regex: escapedSearch, $options: "i" } },
      { email: { $regex: escapedSearch, $options: "i" } },
    ];
  }
  if (parsed.data.role && parsed.data.role !== "all") {
    query.role = parsed.data.role;
  }

  const mapUser = (u: any) => ({
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
  });

  if (page !== undefined && page > 0 && limit !== undefined && limit > 0) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    return {
      users: users.map(mapUser),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    } as any;
  }

  const users = await User.find(query).sort({ createdAt: -1 }).lean();
  return users.map(mapUser);
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
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = createUserSchema.safeParse({ name, email, password, role, phone });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const existingUser = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (existingUser) {
    return { error: "Email already registered" };
  }

  const hashedPassword = await hashPassword(parsed.data.password);
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
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = updateUserSchema.safeParse({ id, name, email, role, phone, isActive, managerId, teamId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.email !== undefined) updateData.email = parsed.data.email.toLowerCase();
  if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
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
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
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
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  if (id === session.user.id) return { error: "Cannot deactivate your own account" };
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

  const isValid = await verifyPassword(parsed.data.currentPassword, user.password);
  if (!isValid) {
    return { error: "Current password is incorrect" };
  }

  const hashedPassword = await hashPassword(parsed.data.newPassword);
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
  if (!["admin", "administrator", "salesManager"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = resetPasswordSchema.safeParse({ userId, newPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const hashedPassword = await hashPassword(parsed.data.newPassword);

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

// Schema for password reset request
const requestPasswordResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Schema for password reset with token
const resetPasswordWithTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

/**
 * Request a password reset for a user
 * Generates a secure token and sends it via email
 */
export async function requestPasswordReset(email: string) {
  const parsed = requestPasswordResetSchema.safeParse({ email });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await connectToDatabase();

  // Find user by email (case insensitive)
  const user = await User.findOne({
    email: parsed.data.email.toLowerCase(),
    deletedAt: null,
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  // Generate secure token
  const resetToken = generateSecureToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store token in database
  await User.findByIdAndUpdate(user._id, {
    resetPasswordToken: resetToken,
    resetPasswordExpires: resetExpires,
  });

  // Send password reset email using the dedicated styled template
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const emailResult = await sendPasswordResetEmail(user.email, user.name, resetUrl);
    if (!emailResult.success) {
      console.error("❌ Password reset email failed to send:", emailResult.error);
    } else {
      console.log("✅ Password reset email sent to:", user.email);
    }
  } catch (emailError) {
    console.error("❌ Unexpected error sending password reset email:", emailError);
  }

  // Audit log
  try {
    await logAudit({
      userId: user._id.toString(),
      userEmail: user.email,
      userRole: user.role,
      action: "password.reset.requested",
      entity: "User",
      details: { email: user.email },
    });
  } catch (auditError) {
    console.error("Failed to log audit:", auditError);
  }

  return { success: true };
}

/**
 * Reset password using token
 * Validates token and updates password
 */
export async function resetPasswordWithToken(token: string, newPassword: string) {
  const parsed = resetPasswordWithTokenSchema.safeParse({ token, newPassword });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  await connectToDatabase();

  // Find user with valid reset token
  const user = await User.findOne({
    resetPasswordToken: parsed.data.token,
    resetPasswordExpires: { $gt: new Date() },
    deletedAt: null,
  });

  if (!user) {
    return { error: "Invalid or expired reset token" };
  }

  // Hash new password
  const hashedPassword = await hashPassword(parsed.data.newPassword);

  // Update password and clear reset token using MongoDB operators
  await User.findByIdAndUpdate(user._id, {
    $set: { password: hashedPassword },
    $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
  });

  // Send confirmation email
  try {
    await sendNotificationEmail(
      user.email,
      "Password Reset Successful",
      `Hi ${user.name},<br><br>Your password has been successfully reset. You can now log in with your new password.<br><br>
       If you didn't make this change, please contact support immediately.`
    );
  } catch (emailError) {
    console.error("Failed to send password reset confirmation email:", emailError);
  }

  // Audit log
  try {
    await logAudit({
      userId: user._id.toString(),
      userEmail: user.email,
      userRole: user.role,
      action: "password.reset.completed",
      entity: "User",
      details: { email: user.email },
    });
  } catch (auditError) {
    console.error("Failed to log audit:", auditError);
  }

  return { success: true };
}