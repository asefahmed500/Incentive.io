"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

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
  await connectToDatabase();
  const notification = await Notification.create({ userId, type, title, message, link });
  return { success: true, id: notification._id.toString() };
}

export async function getNotifications(userId: string, limit = 20) {
  await connectToDatabase();
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
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
  await connectToDatabase();
  const count = await Notification.countDocuments({ userId, isRead: false });
  return count;
}

export async function markAsRead(id: string) {
  await connectToDatabase();
  await Notification.findByIdAndUpdate(id, { isRead: true });
  return { success: true };
}

export async function markAllAsRead(userId: string) {
  await connectToDatabase();
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return { success: true };
}

export async function deleteNotification(id: string) {
  await connectToDatabase();
  await Notification.findByIdAndDelete(id);
  return { success: true };
}

export async function notifySaleSubmitted(employeeId: string, managerId: string, companyName: string) {
  return createNotification({
    userId: managerId,
    type: "SALE_SUBMITTED",
    title: "New Sale Pending Approval",
    message: `${companyName} - Pending your approval`,
    link: "/sales-manager/pending-approvals",
  });
}

export async function notifyManagerApproved(employeeId: string, companyName: string) {
  return createNotification({
    userId: employeeId,
    type: "MANAGER_APPROVED",
    title: "Sale Approved",
    message: `${companyName} - Approved by manager`,
    link: "/sales-dashboard/records",
  });
}

export async function notifyManagerRejected(employeeId: string, companyName: string, reason: string) {
  return createNotification({
    userId: employeeId,
    type: "MANAGER_REJECTED",
    title: "Sale Rejected",
    message: `${companyName} - Rejected: ${reason}`,
    link: "/sales-dashboard/records",
  });
}

export async function notifyAccountantProcessed(managerId: string, companyName: string) {
  return createNotification({
    userId: managerId,
    type: "ACCOUNTANT_PROCESSED",
    title: "Sale Processed",
    message: `${companyName} - Processed by accountant`,
    link: "/sales-manager/records",
  });
}

export async function notifyFinanceApproved(employeeId: string, managerId: string, companyName: string, commission: number) {
  const notif1 = await createNotification({
    userId: employeeId,
    type: "FINANCE_APPROVED",
    title: "Sale Final Approved!",
    message: `${companyName} - Approved! Commission: ৳${commission}`,
    link: "/sales-dashboard/records",
  });
  const notif2 = await createNotification({
    userId: managerId,
    type: "FINANCE_APPROVED",
    title: "Sale Final Approved",
    message: `${companyName} - Approved`,
    link: "/sales-manager/records",
  });
  return { success: true };
}

export async function notifyFinanceRejected(employeeId: string, companyName: string, reason: string) {
  return createNotification({
    userId: employeeId,
    type: "FINANCE_REJECTED",
    title: "Sale Rejected",
    message: `${companyName} - Rejected: ${reason}`,
    link: "/sales-dashboard/records",
  });
}

export async function notifyTargetAssigned(employeeId: string, targetAmount: number) {
  return createNotification({
    userId: employeeId,
    type: "NEW_TARGET",
    title: "New Target Assigned",
    message: `Target: ৳${targetAmount.toLocaleString()}`,
    link: "/sales-dashboard/targets",
  });
}

export async function notifyCommissionEligible(employeeId: string, achievement: number) {
  return createNotification({
    userId: employeeId,
    type: "COMMISSION_ELIGIBLE",
    title: "Commission Eligible!",
    message: `You have reached ${achievement.toFixed(1)}% of your target and are now eligible for commissions.`,
    link: "/sales-dashboard/eligibility",
  });
}

export async function notifyUserCreated(employeeId: string, userName: string, role: string) {
  return createNotification({
    userId: employeeId,
    type: "USER_CREATED",
    title: "Welcome!",
    message: `Your account has been created as ${role}. Please log in and change your password.`,
    link: "/profile",
  });
}