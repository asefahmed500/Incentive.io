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
  paidBy: z.string().min(1, "paidBy is required"),
});

export async function getPendingManagerApprovals() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["salesManager", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const records = await SalesRecord.find({ status: "Pending_Manager" })
    .populate("managerId", "name")
    .lean();

  return records.map((r) => {
    const totalAmount = r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0);
    return {
      id: r._id.toString(),
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
  const userRole = (session.user as any).role as string;
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
    userId: record.managerId?.toString() || "",
    userEmail: "",
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
    await notifyManagerApproved(record.employeeId.toString(), record.companyName);
  } catch (notifError) {
    console.error("Failed to send in-app notification:", notifError);
  }

  return { success: true };
}

export async function rejectSale(id: string, reason: string, rejectedBy?: "manager" | "accountant" | "finance") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
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

  record.status = "Draft";
  record.approvalStatus = "Rejected";
  record.rejectionReason = parsed.data.reason;
  record.rejectedBy = parsed.data.rejectedBy;
  await record.save();

  {
    await logAudit({
      userId: record.managerId?.toString() || "",
      userEmail: "",
      userRole: rejectedBy === "finance" ? "finance" : rejectedBy === "accountant" ? "accountant" : "salesManager",
      action: "REJECT_SALE",
      entity: "SalesRecord",
      entityId: parsed.data.id,
      details: { reason: parsed.data.reason, rejectedBy },
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
      const employeeId = record.employeeId.toString();
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
  }

  return { success: true };
}

export async function getPendingAccountantApprovals() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
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
    employeeId: (r.employeeId as unknown as { _id?: { toString: () => string } })?._id?.toString(),
    employeeName: (r.employeeId as unknown as { name?: string })?.name || r.employeeName,
    companyName: r.companyName,
    products: r.products,
    totalAmount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0),
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
  const userRole = (session.user as any).role as string;
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

  const grossAmount = record.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0);

  let taxAmount = 0;
  if (parsed.data.taxRate !== undefined && parsed.data.taxRate !== null && !record.taxEnabled) {
    taxAmount = grossAmount * (parsed.data.taxRate / 100);
    record.taxRate = parsed.data.taxRate;
    record.taxAmount = taxAmount;
  }

  let vatAmount = 0;
  if (parsed.data.vatRate !== undefined && parsed.data.vatRate !== null && !record.vatEnabled) {
    vatAmount = grossAmount * (parsed.data.vatRate / 100);
    record.vatRate = parsed.data.vatRate;
    record.vatAmount = vatAmount;
  }

  record.eoBpAmount = parsed.data.eoBpAmount || 0;
  record.eoBpReason = parsed.data.eoBpReason || "";

  const netSales = grossAmount - taxAmount - vatAmount - (parsed.data.eoBpAmount || 0);
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
    userId: "",
    userEmail: "",
    userRole: "accountant",
    action: "PROCESS_SALE",
    entity: "SalesRecord",
    entityId: parsed.data.id,
    details: { eoBpAmount: parsed.data.eoBpAmount, taxRate: parsed.data.taxRate, vatRate: parsed.data.vatRate, netSales },
  });

  try {
    const financeUsers = await User.find({ role: "finance", isActive: true });
    for (const financeUser of financeUsers) {
      if (financeUser.email) {
        await sendNotificationEmail(
          financeUser.email,
          "Sale Processed by Accountant",
          `A sale for <strong>${record.companyName}</strong> has been processed by the accountant and is awaiting your final approval. Net Sales: ৳${netSales.toLocaleString()}`
        );
      }
    }
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

  return { success: true, netSales };
}

export async function getPendingFinanceApprovals() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const records = await SalesRecord.find({
    status: "Pending_Finance",
    accountantStatus: "Approved"
  })
    .populate("employeeId", "name")
    .lean();

  return records.map((r) => {
    const grossAmount = r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0)
    return {
      id: r._id.toString(),
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
  const userRole = (session.user as any).role as string;
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

  await record.save();

  await logAudit({
    userId: parsed.data.paidBy,
    userEmail: "",
    userRole: "finance",
    action: "FINAL_APPROVE_SALE",
    entity: "SalesRecord",
    entityId: parsed.data.id,
    details: { commission: record.commission || record.calculatedCommission, netSales: record.netSales },
  });

  try {
    const { markCommissionPaid } = await import("@/lib/actions/wallet.actions");
    await markCommissionPaid({
      employeeId: record.employeeId.toString(),
      amount: record.commission || record.calculatedCommission,
      salesRecordId: parsed.data.id,
      paidBy: parsed.data.paidBy,
    });
  } catch (walletError) {
    console.error("Failed to credit wallet:", walletError);
  }

  try {
    const { checkEligibility: checkEmpEligibility } = await import("@/lib/actions/commission.actions");
    await checkEmpEligibility(record.employeeId.toString());
  } catch (eligError) {
    console.error("Failed to check eligibility:", eligError);
  }

  try {
    const employee = await User.findById(record.employeeId);
    if (employee?.email) {
      await sendNotificationEmail(
        employee.email,
        "Sale Final Approved!",
        `Your sale for <strong>${record.companyName}</strong> has been final approved! Commission: ৳${(record.commission || record.calculatedCommission).toLocaleString()}`
      );
    }

    if (record.managerId) {
      const manager = await User.findById(record.managerId);
      if (manager?.email) {
        await sendNotificationEmail(
          manager.email,
          "Team Sale Final Approved",
          `A team member's sale for <strong>${record.companyName}</strong> has been final approved.`
        );
      }
    }
  } catch (emailError) {
    console.error("Failed to send finance approval email:", emailError);
  }

  try {
    await notifyFinanceApproved(
      record.employeeId.toString(),
      record.managerId ? record.managerId.toString() : "",
      record.companyName,
      record.commission || record.calculatedCommission
    );
  } catch (notifError) {
    console.error("Failed to send in-app notification:", notifError);
  }

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

  const grossAmount = record.products.reduce((sum: number, p: ProductType) => sum + p.unitPrice * p.quantity, 0);
  const currentSaleAmount = record.netSales && record.netSales > 0 ? record.netSales : grossAmount;

  const allApprovedSales = await SalesRecord.find({
    employeeId: record.employeeId,
    financeStatus: "Approved",
  }).lean();

  const totalSales = allApprovedSales.reduce((sum: number, r: { products: ProductType[]; netSales?: number }) => {
    const amount = (r.netSales ?? 0) > 0 ? (r.netSales ?? 0) : r.products.reduce((s: number, p: ProductType) => s + p.unitPrice * p.quantity, 0);
    return sum + (amount ?? 0);
  }, 0) + currentSaleAmount;
  const achievement = (totalSales / employee.targetAmount) * 100;

  const rule = await CommissionRule.findOne({
    targetPercentageFrom: { $lte: achievement },
    targetPercentageTo: { $gte: achievement },
    isActive: true,
  }).sort({ priority: -1 });

  if (!rule) return 0;

  const commission = (currentSaleAmount * rule.commissionRate) / 100;
  return commission;
}