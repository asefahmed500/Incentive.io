"use server";

import { auth } from "@/lib/auth/auth";
import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { User } from "@/lib/models/User";
import CommissionRule from "@/lib/models/CommissionRule";
import { sendNotificationEmail } from "@/lib/email";
import { notifyManagerApproved, notifyManagerRejected, notifyAccountantProcessed, notifyAccountantRejected, notifyFinanceApproved, notifyFinanceRejected } from "@/lib/actions/notification.actions";
import { logAudit } from "@/lib/actions/audit.actions";
import { resetSaleStatuses } from "@/lib/actions/sales.actions";
import type { AuthUser, UserRole } from "@/types";
import { sseManager, SSE_EVENTS } from "@/lib/sse";
import { calculatePercentage, calculateProductTotal, roundMoney } from "@/lib/utils/money";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const approveSaleSchema = z.object({
  id: objectIdSchema,
  paidBy: z.string().optional(),
});

const rejectSaleSchema = z.object({
  id: objectIdSchema,
  reason: z.string().min(1, "Rejection reason is required").max(1000),
  rejectedBy: z.enum(["manager", "accountant", "finance"]).optional(),
});

const processByAccountantSchema = z.object({
  id: objectIdSchema,
  eoBpAmount: z.number().min(0).optional(),
  eoBpReason: z.string().max(500).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  vatRate: z.number().min(0).max(100).optional(),
});

const finalApproveByFinanceSchema = z.object({
  id: objectIdSchema,
  paidBy: objectIdSchema,
});

export async function getPendingManagerApprovals() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["salesManager", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const records = await SalesRecord.find({ status: "Pending_Manager" })
    .populate("managerId", "name")
    .lean();

  return records.map((r) => {
    const totalAmount = r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0);
    return {
      id: r._id.toString(),
      status: r.status,
      employeeName: r.employeeName,
      companyName: r.companyName,
      productCount: r.products.length,
      totalAmount,
      commission: r.calculatedCommission,
      createdAt: r.createdAt,
    };
  });
}

export async function approveSale(id: string, paidBy?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["salesManager", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = approveSaleSchema.safeParse({ id, paidBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };

  if (record.status !== "Pending_Manager") {
    return { error: "Record is not pending manager approval" };
  }

  if (userRole === "salesManager" && record.managerId?.toString() !== session.user.id) {
    return { error: "You can only approve records assigned to your team" };
  }

  const previousStatus = record.status;
  record.status = "Pending_Accountant";
  record.approvalStatus = "Approved";
  record.approvedBy = record.managerId;
  record.approvedAt = new Date();

  const commission = await calculateCommission(record);
  record.calculatedCommission = commission;
  record.commission = commission;

  await record.save();

  await logAudit({
    userId: record.managerId?.toString(),
    userRole: "salesManager",
    action: "APPROVE_SALE",
    entity: "SalesRecord",
    entityId: parsed.data.id,
    details: { previousStatus, newStatus: "Pending_Accountant", commission },
  });

  try {
    const employee = await User.findById(record.employeeId);
    if (employee?.email) {
      await sendNotificationEmail(
        employee.email,
        "Sale Approved by Manager",
        `Your sale for <strong>${record.companyName}</strong> has been approved by your manager and is now pending accountant review.`
      );
    }
  } catch (emailError) {
    console.error("Failed to send approval email:", emailError);
  }

  try {
    await notifyManagerApproved(record.employeeId?.toString(), record.companyName);
  } catch (notifError) {
    console.error("Failed to send in-app notification:", notifError);
  }

  // Send real-time update via SSE
  sseManager.sendToUser(record.employeeId?.toString(), {
    type: SSE_EVENTS.SALE_APPROVED,
    payload: {
      id: record._id.toString(),
      companyName: record.companyName,
      status: "Pending_Accountant",
      commission: record.calculatedCommission,
    },
  });

  // Notify dashboard to refresh
  sseManager.sendToUser(record.employeeId?.toString(), {
    type: SSE_EVENTS.DASHBOARD_REFRESH,
    payload: { reason: "sale_approved" },
  });

  return { success: true };
}

export async function rejectSale(id: string, reason: string, rejectedBy?: "manager" | "accountant" | "finance") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["salesManager", "accountant", "finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = rejectSaleSchema.safeParse({ id, reason, rejectedBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };

  const statusMap: Record<string, string> = {
    manager: "Pending_Manager",
    accountant: "Pending_Accountant",
    finance: "Pending_Finance",
  };
  const requiredStatus = statusMap[parsed.data.rejectedBy || ""];
  if (!requiredStatus) {
    return { error: "Invalid rejection role" };
  }
  if (record.status !== requiredStatus) {
    return { error: `Record is not pending ${parsed.data.rejectedBy} rejection` };
  }

  // Store rejection info before resetting
  const rejectionReason = parsed.data.reason;
  const rejectorRole = parsed.data.rejectedBy;

  // Reset all status fields using helper function
  await resetSaleStatuses(parsed.data.id);

  // Update with rejection information and set approval status
  await SalesRecord.findByIdAndUpdate(parsed.data.id, {
    status: "Draft",
    approvalStatus: "Rejected",
    rejectionReason,
    rejectedBy: rejectorRole,
  });

  {
    await logAudit({
      userId: record.managerId?.toString(),
      userRole: rejectorRole === "finance" ? "finance" : rejectorRole === "accountant" ? "accountant" : "salesManager",
      action: "REJECT_SALE",
      entity: "SalesRecord",
      entityId: parsed.data.id,
      details: { reason: parsed.data.reason, rejectedBy: rejectorRole },
    });

    try {
      const employee = await User.findById(record.employeeId);
      if (employee?.email) {
        const rejectorLabel = parsed.data.rejectedBy === "finance" ? "Finance" : parsed.data.rejectedBy === "accountant" ? "Accountant" : "Manager";
        await sendNotificationEmail(
          employee.email,
          "Sale Rejected",
          `Your sale for <strong>${record.companyName}</strong> has been rejected by ${rejectorLabel}. Reason: ${parsed.data.reason}`
        );
      }
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }
    try {
      const employeeId = record.employeeId?.toString();
      const companyName = record.companyName;
      const reason = parsed.data.reason;
      if (parsed.data.rejectedBy === "finance") {
        await notifyFinanceRejected(employeeId, companyName, reason);
      } else if (parsed.data.rejectedBy === "accountant") {
        await notifyAccountantRejected(employeeId, companyName, reason);
      } else {
        await notifyManagerRejected(employeeId, companyName, reason);
      }
    } catch (notifError) {
      console.error("Failed to send in-app notification:", notifError);
    }

    // Send real-time update via SSE
    sseManager.sendToUser(record.employeeId?.toString(), {
      type: SSE_EVENTS.SALE_REJECTED,
      payload: {
        id: parsed.data.id,
        companyName: record.companyName,
        reason: parsed.data.reason,
        rejectedBy: parsed.data.rejectedBy,
      },
    });

    // Notify dashboard to refresh
    sseManager.sendToUser(record.employeeId?.toString(), {
      type: SSE_EVENTS.DASHBOARD_REFRESH,
      payload: { reason: "sale_rejected" },
    });
  }

  return { success: true };
}

export async function getPendingAccountantApprovals() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["accountant", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const records = await SalesRecord.find({
    status: "Pending_Accountant",
    approvalStatus: "Approved"
  })
    .populate("employeeId", "name")
    .lean();

  return records.map((r) => ({
    id: r._id.toString(),
    status: r.status,
    employeeId: (r.employeeId as unknown as { _id?: { toString: () => string } })?._id?.toString(),
    employeeName: (r.employeeId as unknown as { name?: string })?.name || r.employeeName,
    companyName: r.companyName,
    products: r.products,
    totalAmount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0),
    commission: r.calculatedCommission,
    taxEnabled: r.taxEnabled,
    vatEnabled: r.vatEnabled,
    taxRate: r.taxRate,
    taxAmount: r.taxAmount,
    vatRate: r.vatRate,
    vatAmount: r.vatAmount,
    eoBpAmount: r.eoBpAmount,
    eoBpReason: r.eoBpReason,
    createdAt: r.createdAt,
  }));
}

export async function processByAccountant({
  id,
  eoBpAmount,
  eoBpReason,
  taxRate,
  vatRate,
}: {
  id: string;
  eoBpAmount?: number;
  eoBpReason?: string;
  taxRate?: number;
  vatRate?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["accountant", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = processByAccountantSchema.safeParse({ id, eoBpAmount, eoBpReason, taxRate, vatRate });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };

  if (record.status !== "Pending_Accountant" || record.approvalStatus !== "Approved") {
    return { error: "Record is not pending accountant processing" };
  }

  const grossAmount = record.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0);

  let taxAmount = 0;
  if (parsed.data.taxRate !== undefined && parsed.data.taxRate !== null && !record.taxEnabled) {
    taxAmount = calculatePercentage(grossAmount, parsed.data.taxRate);
    record.taxRate = parsed.data.taxRate;
    record.taxAmount = taxAmount;
  }

  let vatAmount = 0;
  if (parsed.data.vatRate !== undefined && parsed.data.vatRate !== null && !record.vatEnabled) {
    vatAmount = calculatePercentage(grossAmount, parsed.data.vatRate);
    record.vatRate = parsed.data.vatRate;
    record.vatAmount = vatAmount;
  }

  record.eoBpAmount = parsed.data.eoBpAmount || 0;
  record.eoBpReason = parsed.data.eoBpReason || "";

  const netSales = roundMoney(grossAmount - taxAmount - vatAmount - (parsed.data.eoBpAmount || 0));
  if (netSales < 0) {
    return { error: "Net sales cannot be negative. Adjust deductions to be less than gross amount." };
  }
  record.netSales = netSales;

  const recalculatedCommission = await calculateCommission(record);
  record.commission = recalculatedCommission;
  record.calculatedCommission = recalculatedCommission;

  record.status = "Pending_Finance";
  record.accountantStatus = "Approved";
  record.processedAt = new Date();

  await record.save();

  await logAudit({
    userRole: "accountant",
    action: "PROCESS_SALE",
    entity: "SalesRecord",
    entityId: parsed.data.id,
    details: { eoBpAmount: parsed.data.eoBpAmount, taxRate: parsed.data.taxRate, vatRate: parsed.data.vatRate, netSales },
  });

  try {
    const financeUsers = await User.find({ role: "finance", isActive: true });
    const emailPromises = financeUsers
      .filter(user => user.email)
      .map(user =>
        sendNotificationEmail(
          user.email,
          "Sale Processed by Accountant",
          `A sale for <strong>${record.companyName}</strong> has been processed by the accountant and is awaiting your final approval. Net Sales: ৳${netSales.toLocaleString()}`
        ).catch(err => {
          console.error(`Failed to send email to ${user.email}:`, err);
        })
      );

    await Promise.allSettled(emailPromises);
  } catch (emailError) {
    console.error("Failed to send accountant processed email:", emailError);
  }

  try {
    if (record.managerId) {
      await notifyAccountantProcessed(record.managerId.toString(), record.companyName);
    }
  } catch (notifError) {
    console.error("Failed to send in-app notification:", notifError);
  }

  // Send real-time update via SSE
  sseManager.sendToUser(record.employeeId?.toString(), {
    type: SSE_EVENTS.SALE_UPDATED,
    payload: {
      id: parsed.data.id,
      companyName: record.companyName,
      status: "Pending_Finance",
      netSales,
    },
  });

  // Notify manager dashboard to refresh
  if (record.managerId) {
    sseManager.sendToUser(record.managerId.toString(), {
      type: SSE_EVENTS.DASHBOARD_REFRESH,
      payload: { reason: "accountant_processed" },
    });
  }

  // Notify finance users
  sseManager.sendToRole("finance", {
    type: SSE_EVENTS.DASHBOARD_REFRESH,
    payload: { reason: "pending_finance" },
  });

  return { success: true, netSales };
}

export async function getPendingFinanceApprovals() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const records = await SalesRecord.find({
    status: "Pending_Finance",
    accountantStatus: "Approved"
  })
    .populate("employeeId", "name")
    .lean();

  return records.map((r) => {
    const grossAmount = r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0)
    return {
      id: r._id.toString(),
      status: r.status,
      employeeId: (r.employeeId as unknown as { _id?: { toString: () => string } })?._id?.toString(),
      employeeName: (r.employeeId as unknown as { name?: string })?.name || r.employeeName,
      companyName: r.companyName,
      amount: grossAmount,
      netSales: r.netSales || grossAmount,
      taxAmount: r.taxAmount || 0,
      vatAmount: r.vatAmount || 0,
      eoBpAmount: r.eoBpAmount || 0,
      eoBpReason: r.eoBpReason || "",
      calculatedCommission: r.calculatedCommission || 0,
      createdAt: r.createdAt,
    }
  });
}

export async function finalApproveByFinance(id: string, paidBy: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = finalApproveByFinanceSchema.safeParse({ id, paidBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };

  if (record.status !== "Pending_Finance" || record.accountantStatus !== "Approved") {
    return { error: "Record is not pending finance approval" };
  }
  if (record.paymentStatus === "Paid") {
    return { error: "Record has already been paid" };
  }

  record.status = "Approved";
  record.financeStatus = "Approved";
  record.finalApprovedAt = new Date();
  record.paymentStatus = "Paid";
  record.isPaid = true;
  record.paymentDate = new Date();
  record.paidBy = new mongoose.Types.ObjectId(parsed.data.paidBy);

  // Use a single transaction for both sale approval and wallet credit to prevent race conditions
  // Try transaction first, fall back to non-transactional for local MongoDB
  try {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Save the record within the transaction
      await record.save({ session: dbSession });

      // Credit wallet within the same transaction
      const { _markCommissionPaidWithSession } = await import("@/lib/actions/wallet.actions");
      const walletResult = await _markCommissionPaidWithSession(
        record.employeeId?.toString(),
        record.commission || record.calculatedCommission,
        parsed.data.id,
        dbSession
      );

      if (walletResult?.error) {
        await dbSession.abortTransaction();
        return { error: walletResult.error };
      }

      // Commit transaction only if both operations succeed
      await dbSession.commitTransaction();
    } catch (error) {
      await dbSession.abortTransaction();
      throw error;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    // Check if it's a transaction error (local MongoDB doesn't support transactions)
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("retryable writes") || errorMessage.includes("replica set") || errorMessage.includes("Transaction numbers")) {
      // Fall back to non-transactional operation with rollback logic
      try {
        // Store previous state for potential rollback
        const previousStatus = record.status;
        const previousFinanceStatus = record.financeStatus;
        const previousPaymentStatus = record.paymentStatus;
        const previousIsPaid = record.isPaid;

        await record.save();

        // Credit wallet without session
        const { _markCommissionPaidWithSession } = await import("@/lib/actions/wallet.actions");
        const walletResult = await _markCommissionPaidWithSession(
          record.employeeId?.toString(),
          record.commission || record.calculatedCommission,
          parsed.data.id
        );

        if (walletResult?.error) {
          // Rollback the record to previous state
          await SalesRecord.findByIdAndUpdate(parsed.data.id, {
            status: previousStatus,
            financeStatus: previousFinanceStatus,
            paymentStatus: previousPaymentStatus,
            isPaid: previousIsPaid,
            $unset: {
              finalApprovedAt: 1,
              paymentDate: 1,
              paidBy: 1
            }
          });
          return { error: walletResult.error };
        }
      } catch (fallbackError) {
        return { error: "Operation failed: " + (fallbackError instanceof Error ? fallbackError.message : "Unknown error") };
      }
    } else {
      return { error: "Transaction failed: " + errorMessage };
    }
  }

  await logAudit({
    userId: parsed.data.paidBy,
    userRole: "finance",
    action: "FINAL_APPROVE_SALE",
    entity: "SalesRecord",
    entityId: parsed.data.id,
    details: { commission: record.commission || record.calculatedCommission, netSales: record.netSales },
  });

  try {
    const { checkEligibility: checkEmpEligibility } = await import("@/lib/actions/commission.actions");
    await checkEmpEligibility(record.employeeId?.toString());
  } catch (eligError) {
    console.error("Failed to check eligibility:", eligError);
  }

  try {
    const employee = await User.findById(record.employeeId);
    const manager = record.managerId ? await User.findById(record.managerId) : null;

    const emailPromises = [];

    if (employee?.email) {
      emailPromises.push(
        sendNotificationEmail(
          employee.email,
          "Sale Final Approved!",
          `Your sale for <strong>${record.companyName}</strong> has been final approved! Commission: ৳${(record.commission || record.calculatedCommission).toLocaleString()}`
        ).catch(err => {
          console.error(`Failed to send email to ${employee.email}:`, err);
        })
      );
    }

    if (manager?.email) {
      emailPromises.push(
        sendNotificationEmail(
          manager.email,
          "Team Sale Final Approved",
          `A team member's sale for <strong>${record.companyName}</strong> has been final approved.`
        ).catch(err => {
          console.error(`Failed to send email to ${manager.email}:`, err);
        })
      );
    }

    await Promise.allSettled(emailPromises);
  } catch (emailError) {
    console.error("Failed to send finance approval email:", emailError);
  }

  try {
    await notifyFinanceApproved(
      record.employeeId?.toString(),
      record.managerId ? record.managerId.toString() : "",
      record.companyName,
      record.commission || record.calculatedCommission
    );
  } catch (notifError) {
    console.error("Failed to send in-app notification:", notifError);
  }

  // Send real-time update via SSE
  const commission = record.commission || record.calculatedCommission;
  sseManager.sendToUser(record.employeeId?.toString(), {
    type: SSE_EVENTS.SALE_APPROVED,
    payload: {
      id: parsed.data.id,
      companyName: record.companyName,
      status: "Approved",
      commission,
      isPaid: true,
    },
  });

  // Notify manager
  if (record.managerId) {
    sseManager.sendToUser(record.managerId.toString(), {
      type: SSE_EVENTS.SALE_UPDATED,
      payload: {
        id: parsed.data.id,
        companyName: record.companyName,
        status: "Approved",
      },
    });
  }

  // Notify wallet update
  sseManager.sendToUser(record.employeeId?.toString(), {
    type: SSE_EVENTS.WALLET_UPDATED,
    payload: {
      employeeId: record.employeeId?.toString(),
      amount: commission,
      salesRecordId: parsed.data.id,
    },
  });

  // Notify dashboards to refresh
  sseManager.sendToRole("salesManager", {
    type: SSE_EVENTS.DASHBOARD_REFRESH,
    payload: { reason: "sale_final_approved" },
  });

  sseManager.sendToRole("accountant", {
    type: SSE_EVENTS.DASHBOARD_REFRESH,
    payload: { reason: "sale_final_approved" },
  });

  return { success: true };
}

interface ProductType {
  unitPrice: number;
  quantity: number;
}

interface SalesRecordType {
  products: ProductType[];
  employeeId: mongoose.Types.ObjectId;
  netSales?: number;
}

interface UserType {
  targetAmount: number;
}

async function calculateCommission(record: SalesRecordType): Promise<number> {
  if (!record.employeeId) return 0;

  const employee = await User.findById(record.employeeId) as UserType | null;

  if (!employee || !employee.targetAmount) return 0;

  // Use precise calculation for product totals
  const grossAmount = record.products.reduce((sum: number, p: ProductType) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0);
  const currentSaleAmount = record.netSales !== undefined && record.netSales !== null ? record.netSales : grossAmount;

  const allApprovedSales = await SalesRecord.find({
    employeeId: record.employeeId,
    financeStatus: "Approved",
  }).lean();

  const totalSales = allApprovedSales.reduce((sum: number, r: { products: ProductType[]; netSales?: number }) => {
    const amount = r.netSales !== undefined && r.netSales !== null ? r.netSales : r.products.reduce((s: number, p: ProductType) => s + calculateProductTotal(p.unitPrice, p.quantity), 0);
    return roundMoney(sum + (amount ?? 0));
  }, currentSaleAmount);

  // Prevent division by zero or negative target amounts
  const achievement = employee.targetAmount > 0 ? roundMoney((totalSales / employee.targetAmount) * 100) : 0;

  const rule = await CommissionRule.findOne({
    targetPercentageFrom: { $lte: achievement },
    targetPercentageTo: { $gte: achievement },
    isActive: true,
  }).sort({ priority: -1 });

  if (!rule) return 0;

  // Use precise percentage calculation
  const commission = calculatePercentage(currentSaleAmount, rule.commissionRate);
  return roundMoney(commission);
}