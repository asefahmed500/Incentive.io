"use server";

import { z } from "zod";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

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
  const parsed = createNotificationSchema.safeParse({ userId, type, title, message, link });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const notification = await Notification.create(parsed.data);
  return { success: true, id: notification._id.toString() };
}

export async function getNotifications(userId: string, limit = 20) {
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
  const parsed = getUnreadCountSchema.safeParse(userId);
  if (!parsed.success) return 0;
  await connectToDatabase();
  const count = await Notification.countDocuments({ userId: parsed.data, isRead: false });
  return count;
}

export async function markAsRead(id: string) {
  const parsed = markAsReadSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await Notification.findByIdAndUpdate(parsed.data, { isRead: true });
  return { success: true };
}

export async function markAllAsRead(userId: string) {
  const parsed = markAllAsReadSchema.safeParse(userId);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await Notification.updateMany({ userId: parsed.data, isRead: false }, { isRead: true });
  return { success: true };
}

export async function deleteNotification(id: string) {
  const parsed = deleteNotificationSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await Notification.findByIdAndDelete(parsed.data);
  return { success: true };
}

export async function notifySaleSubmitted(employeeId: string, managerId: string, companyName: string) {
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

export async function notifyTargetAssigned(employeeId: string, targetAmount: number) {
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