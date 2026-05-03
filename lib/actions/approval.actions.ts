"use server";

import mongoose from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { User } from "@/lib/models/User";
import CommissionRule from "@/lib/models/CommissionRule";
import { sendNotificationEmail } from "@/lib/email";
import { notifyManagerApproved, notifyManagerRejected, notifyAccountantProcessed, notifyFinanceApproved, notifyFinanceRejected } from "@/lib/actions/notification.actions";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const approveSaleSchema = z.object({
  id: objectIdSchema,
  paidBy: z.string().optional(),
});

const rejectSaleSchema = z.object({
  id: objectIdSchema,
  reason: z.string().min(1, "Rejection reason is required").max(1000),
  rejectedBy: z.enum(["manager", "finance"]).optional(),
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
  await connectToDatabase();
  const records = await SalesRecord.find({ status: "Pending_Manager" })
    .populate("managerId", "name")
    .lean();
  
  return records.map((r) => ({
    id: r._id.toString(),
    employeeName: r.employeeName,
    companyName: r.companyName,
    productCount: r.products.length,
    totalAmount: r.products.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0),
    commission: r.calculatedCommission,
    createdAt: r.createdAt,
  }));
}

export async function approveSale(id: string, paidBy?: string) {
  const parsed = approveSaleSchema.safeParse({ id, paidBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(id);
  if (!record) return { error: "Record not found" };
  
  if (record.status !== "Pending_Manager") {
    return { error: "Record is not pending manager approval" };
  }
  
  record.status = "Pending_Accountant";
  record.approvalStatus = "Approved";
  record.approvedBy = record.managerId;
  record.approvedAt = new Date();
  
  const commission = await calculateCommission(record);
  record.calculatedCommission = commission;
  record.commission = commission;
  
  await record.save();
  
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

export async function rejectSale(id: string, reason: string, rejectedBy?: "manager" | "finance") {
  const parsed = rejectSaleSchema.safeParse({ id, reason, rejectedBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findByIdAndUpdate(id, {
    status: "Draft",
    approvalStatus: "Rejected",
    rejectionReason: reason,
  });
  
  if (record) {
    try {
      const employee = await User.findById(record.employeeId);
      if (employee?.email) {
        const rejectorLabel = rejectedBy === "finance" ? "Finance" : "Manager";
        await sendNotificationEmail(
          employee.email,
          "Sale Rejected",
          `Your sale for <strong>${record.companyName}</strong> has been rejected by ${rejectorLabel}. Reason: ${reason}`
        );
      }
    } catch (emailError) {
      console.error("Failed to send rejection email:", emailError);
    }
    try {
      await notifyManagerRejected(record.employeeId.toString(), record.companyName, reason);
    } catch (notifError) {
      console.error("Failed to send in-app notification:", notifError);
    }
  }
  
  return { success: true };
}

export async function getPendingAccountantApprovals() {
  await connectToDatabase();
  const records = await SalesRecord.find({ 
    status: "Pending_Accountant",
    approvalStatus: "Approved"
  })
    .populate("employeeId", "name")
    .lean();
  
  return records.map((r) => ({
    id: r._id.toString(),
    employeeId: (r.employeeId as any)?._id?.toString(),
    employeeName: (r.employeeId as any)?.name || r.employeeName,
    companyName: r.companyName,
    products: r.products,
    totalAmount: r.products.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0),
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
  const parsed = processByAccountantSchema.safeParse({ id, eoBpAmount, eoBpReason, taxRate, vatRate });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(id);
  if (!record) return { error: "Record not found" };
  
  if (record.status !== "Pending_Accountant" || record.approvalStatus !== "Approved") {
    return { error: "Record is not pending accountant processing" };
  }
  
  const grossAmount = record.products.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0);
  
  let taxAmount = 0;
  if (taxRate && !record.taxEnabled) {
    taxAmount = grossAmount * (taxRate / 100);
    record.taxRate = taxRate;
    record.taxAmount = taxAmount;
  }
  
  let vatAmount = 0;
  if (vatRate && !record.vatEnabled) {
    vatAmount = grossAmount * (vatRate / 100);
    record.vatRate = vatRate;
    record.vatAmount = vatAmount;
  }
  
  record.eoBpAmount = eoBpAmount || 0;
  record.eoBpReason = eoBpReason || "";
  
  const netSales = grossAmount - taxAmount - vatAmount - (eoBpAmount || 0);
  record.netSales = netSales;
  
  record.status = "Pending_Finance";
  record.accountantStatus = "Approved";
  record.processedAt = new Date();
  
  await record.save();
  
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
  await connectToDatabase();
  const records = await SalesRecord.find({ 
    status: "Pending_Finance",
    accountantStatus: "Approved"
  })
    .populate("employeeId", "name")
    .lean();
  
  return records.map((r) => ({
    id: r._id.toString(),
    employeeId: (r.employeeId as any)?._id?.toString(),
    employeeName: (r.employeeId as any)?.name || r.employeeName,
    companyName: r.companyName,
    netSales: r.netSales || r.products.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0),
    commission: r.calculatedCommission,
    eoBpAmount: r.eoBpAmount,
    eoBpReason: r.eoBpReason,
    createdAt: r.createdAt,
  }));
}

export async function finalApproveByFinance(id: string, paidBy: string) {
  const parsed = finalApproveByFinanceSchema.safeParse({ id, paidBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(id);
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
  record.paidBy = new mongoose.Types.ObjectId(paidBy);
  
  await record.save();
  
  try {
    const { markCommissionPaid } = await import("@/lib/actions/wallet.actions");
    await markCommissionPaid({
      employeeId: record.employeeId.toString(),
      amount: record.commission || record.calculatedCommission,
      salesRecordId: id,
      paidBy,
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

async function calculateCommission(record: any) {
  const employee = await User.findById(record.employeeId);
  
  if (!employee || !employee.targetAmount) return 0;
  
  const currentSaleAmount = record.products.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0);
  
  const allApprovedSales = await SalesRecord.find({
    employeeId: record.employeeId,
    financeStatus: "Approved",
  }).lean();
  
  const cumulativeSales = allApprovedSales.reduce((sum: number, r: any) => {
    return sum + r.products.reduce((s: number, p: any) => s + p.unitPrice * p.quantity, 0);
  }, 0);
  
  const totalSales = cumulativeSales + currentSaleAmount;
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
