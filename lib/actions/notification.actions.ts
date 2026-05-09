"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import type { AuthUser, UserRole } from "@/types";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const createNotificationSchema = z.object({
  userId: objectIdSchema,
  type: z.string().min(1),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  link: z.string().max(500).optional(),
});

const getNotificationsSchema = z.object({
  userId: objectIdSchema,
  limit: z.number().int().min(1).max(100).optional(),
});

const getUnreadCountSchema = objectIdSchema;
const markAsReadSchema = objectIdSchema;
const markAllAsReadSchema = objectIdSchema;
const deleteNotificationSchema = objectIdSchema;

const notifySaleSubmittedSchema = z.object({
  employeeId: z.string(),
  managerId: objectIdSchema,
  companyName: z.string().min(1).max(500),
});

const notifyManagerApprovedSchema = z.object({
  employeeId: z.string(),
  companyName: z.string().min(1).max(500),
});

const notifyManagerRejectedSchema = z.object({
  employeeId: z.string(),
  companyName: z.string().min(1).max(500),
  reason: z.string().min(1).max(1000),
});

const notifyAccountantProcessedSchema = z.object({
  managerId: objectIdSchema,
  companyName: z.string().min(1).max(500),
});

const notifyFinanceApprovedSchema = z.object({
  employeeId: z.string(),
  managerId: z.string(),
  companyName: z.string().min(1).max(500),
  commission: z.number().min(0),
});

const notifyFinanceRejectedSchema = z.object({
  employeeId: z.string(),
  companyName: z.string().min(1).max(500),
  reason: z.string().min(1).max(1000),
});

const notifyAccountantRejectedSchema = z.object({
  employeeId: z.string(),
  companyName: z.string().min(1).max(500),
  reason: z.string().min(1).max(1000),
});

const notifyTargetAssignedSchema = z.object({
  employeeId: objectIdSchema,
  targetAmount: z.number().min(0),
});

const notifyCommissionEligibleSchema = z.object({
  employeeId: objectIdSchema,
  achievement: z.number().min(0).max(1000),
});

const notifyUserCreatedSchema = z.object({
  employeeId: objectIdSchema,
  userName: z.string().min(1).max(200),
  role: z.string().min(1),
});

const NotificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  link: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = createNotificationSchema.safeParse({ userId, type, title, message, link });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const notification = await Notification.create(parsed.data);
  return { success: true, id: notification._id.toString() };
}

export async function getNotifications(userId: string, limit = 20) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const sessionUserId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  if (userId !== sessionUserId && !["admin", "administrator"].includes(userRole)) {
    return { error: "Forbidden: You can only access your own notifications" };
  }
  const parsed = getNotificationsSchema.safeParse({ userId, limit });
  if (!parsed.success) return [];
  await connectToDatabase();
  const notifications = await Notification.find({ userId: parsed.data.userId })
    .sort({ createdAt: -1 })
    .limit(parsed.data.limit || 20)
    .lean();

  return notifications.map((n) => ({
    id: n._id.toString(),
    type: n.type,
    title: n.title,
    message: n.message,
    link: n.link,
    isRead: n.isRead,
    createdAt: n.createdAt,
  }));
}

export async function getUnreadCount(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return 0;
  const sessionUserId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  if (userId !== sessionUserId && !["admin", "administrator"].includes(userRole)) {
    return 0;
  }
  const parsed = getUnreadCountSchema.safeParse(userId);
  if (!parsed.success) return 0;
  await connectToDatabase();
  const count = await Notification.countDocuments({ userId: parsed.data, isRead: false });
  return count;
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const sessionUserId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  const parsed = markAsReadSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  const notification = await Notification.findById(parsed.data);
  if (!notification) return { error: "Notification not found" };
  if (notification.userId !== sessionUserId && !["admin", "administrator"].includes(userRole)) {
    return { error: "Forbidden: You can only mark your own notifications as read" };
  }
  await Notification.findByIdAndUpdate(parsed.data, { isRead: true });
  return { success: true };
}

export async function markAllAsRead(userId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const sessionUserId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  if (userId !== sessionUserId && !["admin", "administrator"].includes(userRole)) {
    return { error: "Forbidden: You can only mark your own notifications as read" };
  }
  const parsed = markAllAsReadSchema.safeParse(userId);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await Notification.updateMany({ userId: parsed.data, isRead: false }, { isRead: true });
  return { success: true };
}

export async function deleteNotification(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const sessionUserId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  const parsed = deleteNotificationSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  const notification = await Notification.findById(parsed.data);
  if (!notification) return { error: "Notification not found" };
  if (notification.userId !== sessionUserId && !["admin", "administrator"].includes(userRole)) {
    return { error: "Forbidden: You can only delete your own notifications" };
  }
  await Notification.findByIdAndUpdate(parsed.data, { deletedAt: new Date() });
  return { success: true };
}

export async function notifySaleSubmitted(employeeId: string, managerId: string, companyName: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifySaleSubmittedSchema.safeParse({ employeeId, managerId, companyName });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.managerId,
    type: "SALE_SUBMITTED",
    title: "New Sale Pending Approval",
    message: `${parsed.data.companyName} - Pending your approval`,
    link: "/sales-manager/pending-approvals",
  });
}

export async function notifyManagerApproved(employeeId: string, companyName: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyManagerApprovedSchema.safeParse({ employeeId, companyName });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.employeeId,
    type: "MANAGER_APPROVED",
    title: "Sale Approved",
    message: `${parsed.data.companyName} - Approved by manager`,
    link: "/sales-dashboard/records",
  });
}

export async function notifyManagerRejected(employeeId: string, companyName: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyManagerRejectedSchema.safeParse({ employeeId, companyName, reason });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.employeeId,
    type: "MANAGER_REJECTED",
    title: "Sale Rejected",
    message: `${parsed.data.companyName} - Rejected: ${parsed.data.reason}`,
    link: "/sales-dashboard/records",
  });
}

export async function notifyAccountantProcessed(managerId: string, companyName: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyAccountantProcessedSchema.safeParse({ managerId, companyName });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.managerId,
    type: "ACCOUNTANT_PROCESSED",
    title: "Sale Processed",
    message: `${parsed.data.companyName} - Processed by accountant`,
    link: "/sales-manager/records",
  });
}

export async function notifyFinanceApproved(employeeId: string, managerId: string, companyName: string, commission: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyFinanceApprovedSchema.safeParse({ employeeId, managerId, companyName, commission });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await createNotification({
    userId: parsed.data.employeeId,
    type: "FINANCE_APPROVED",
    title: "Sale Final Approved!",
    message: `${parsed.data.companyName} - Approved! Commission: ৳${parsed.data.commission}`,
    link: "/sales-dashboard/records",
  });
  await createNotification({
    userId: parsed.data.managerId,
    type: "FINANCE_APPROVED",
    title: "Sale Final Approved",
    message: `${parsed.data.companyName} - Approved`,
    link: "/sales-manager/records",
  });
  return { success: true };
}

export async function notifyFinanceRejected(employeeId: string, companyName: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyFinanceRejectedSchema.safeParse({ employeeId, companyName, reason });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.employeeId,
    type: "FINANCE_REJECTED",
    title: "Sale Rejected",
    message: `${parsed.data.companyName} - Rejected: ${parsed.data.reason}`,
    link: "/sales-dashboard/records",
  });
}

export async function notifyAccountantRejected(employeeId: string, companyName: string, reason: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyAccountantRejectedSchema.safeParse({ employeeId, companyName, reason });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.employeeId,
    type: "ACCOUNTANT_REJECTED",
    title: "Sale Rejected",
    message: `${parsed.data.companyName} - Rejected by accountant: ${parsed.data.reason}`,
    link: "/sales-dashboard/records",
  });
}

export async function notifyTargetAssigned(employeeId: string, targetAmount: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyTargetAssignedSchema.safeParse({ employeeId, targetAmount });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.employeeId,
    type: "NEW_TARGET",
    title: "New Target Assigned",
    message: `Target: ৳${parsed.data.targetAmount.toLocaleString()}`,
    link: "/sales-dashboard/targets",
  });
}

export async function notifyCommissionEligible(employeeId: string, achievement: number) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyCommissionEligibleSchema.safeParse({ employeeId, achievement });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.employeeId,
    type: "COMMISSION_ELIGIBLE",
    title: "Commission Eligible!",
    message: `You have reached ${parsed.data.achievement.toFixed(1)}% of your target and are now eligible for commissions.`,
    link: "/sales-dashboard/eligibility",
  });
}

export async function notifyUserCreated(employeeId: string, userName: string, role: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = notifyUserCreatedSchema.safeParse({ employeeId, userName, role });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  return createNotification({
    userId: parsed.data.employeeId,
    type: "USER_CREATED",
    title: "Welcome!",
    message: `Your account has been created as ${parsed.data.role}. Please log in and change your password.`,
    link: "/profile",
  });
}
export async function notifySaleResubmitted(employeeId: string, companyName: string, managerIds?: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const managers = managerIds && managerIds.length > 0
    ? await User.find({ _id: { $in: managerIds }, role: "salesManager", isActive: true }).lean()
    : await User.find({ role: "salesManager", isActive: true }).lean();

  const notifications = managers.map((manager) =>
    createNotification({
      userId: manager._id.toString(),
      title: "Sale Resubmitted",
      message: `${companyName} has been resubmitted and is pending your review.`,
      type: "SALE_RESUBMITTED",
    })
  );

  await Promise.allSettled(notifications);
  return { success: true };
}
