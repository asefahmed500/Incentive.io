"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import CommissionRule from "@/lib/models/CommissionRule";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { User } from "@/lib/models/User";
import { sendNotificationEmail } from "@/lib/email";
import { notifyCommissionEligible } from "@/lib/actions/notification.actions";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const createCommissionRuleSchema = z.object({
  targetPercentageFrom: z.number().min(0).max(1000),
  targetPercentageTo: z.number().min(0).max(1000),
  commissionRate: z.number().min(0).max(100),
  categoryId: objectIdSchema.optional(),
  priority: z.number().int().optional(),
});

const updateCommissionRuleSchema = z.object({
  id: objectIdSchema,
  targetPercentageFrom: z.number().min(0).max(1000).optional(),
  targetPercentageTo: z.number().min(0).max(1000).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  categoryId: objectIdSchema.optional(),
  priority: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const deleteCommissionRuleSchema = objectIdSchema;

const getCommissionsByEmployeeSchema = objectIdSchema;

const checkEligibilitySchema = objectIdSchema;

export async function getCommissionRules() {
  await connectToDatabase();
  const rules = await CommissionRule.find().sort({ priority: -1 }).lean();
  return rules.map((r) => ({
    id: r._id.toString(),
    targetPercentageFrom: r.targetPercentageFrom,
    targetPercentageTo: r.targetPercentageTo,
    commissionRate: r.commissionRate,
    categoryId: r.categoryId?.toString(),
    priority: r.priority,
    isActive: r.isActive,
    createdAt: r.createdAt,
  }));
}

export async function createCommissionRule({
  targetPercentageFrom,
  targetPercentageTo,
  commissionRate,
  categoryId,
  priority,
}: {
  targetPercentageFrom: number;
  targetPercentageTo: number;
  commissionRate: number;
  categoryId?: string;
  priority?: number;
}) {
  const parsed = createCommissionRuleSchema.safeParse({ targetPercentageFrom, targetPercentageTo, commissionRate, categoryId, priority });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  await CommissionRule.create({
    targetPercentageFrom: parsed.data.targetPercentageFrom,
    targetPercentageTo: parsed.data.targetPercentageTo,
    commissionRate: parsed.data.commissionRate,
    categoryId: parsed.data.categoryId || undefined,
    priority: parsed.data.priority || 0,
  });
  return { success: true };
}

export async function updateCommissionRule({
  id,
  targetPercentageFrom,
  targetPercentageTo,
  commissionRate,
  categoryId,
  priority,
  isActive,
}: {
  id: string;
  targetPercentageFrom?: number;
  targetPercentageTo?: number;
  commissionRate?: number;
  categoryId?: string;
  priority?: number;
  isActive?: boolean;
}) {
  const parsed = updateCommissionRuleSchema.safeParse({ id, targetPercentageFrom, targetPercentageTo, commissionRate, categoryId, priority, isActive });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const updateData: Record<string, unknown> = {};
  if (parsed.data.targetPercentageFrom !== undefined) updateData.targetPercentageFrom = parsed.data.targetPercentageFrom;
  if (parsed.data.targetPercentageTo !== undefined) updateData.targetPercentageTo = parsed.data.targetPercentageTo;
  if (parsed.data.commissionRate !== undefined) updateData.commissionRate = parsed.data.commissionRate;
  if (parsed.data.categoryId !== undefined) updateData.categoryId = parsed.data.categoryId;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  await CommissionRule.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}

export async function deleteCommissionRule(id: string) {
  const parsed = deleteCommissionRuleSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await CommissionRule.findByIdAndDelete(parsed.data);
  return { success: true };
}

export async function getCommissions() {
  await connectToDatabase();
  const records = await SalesRecord.find({
    approvalStatus: "Approved",
    accountantStatus: "Approved",
    financeStatus: "Approved",
  }).populate("employeeId", "name").lean();

  return records.map((r) => ({
    id: r._id.toString(),
    employeeId: (r.employeeId as unknown as { _id?: { toString: () => string } })?._id?.toString(),
    employeeName: (r.employeeId as unknown as { name?: string })?.name || r.employeeName,
    commission: r.commission,
    calculatedCommission: r.calculatedCommission,
    status: r.financeStatus,
    isPaid: (r as unknown as { isPaid?: boolean }).isPaid,
    paymentStatus: (r as unknown as { paymentStatus?: string }).paymentStatus,
    createdAt: r.createdAt,
  }));
}

export async function getCommissionsByEmployee(employeeId: string) {
  const parsed = getCommissionsByEmployeeSchema.safeParse(employeeId);
  if (!parsed.success) {
    return { records: [], totalCommission: 0, paidCommission: 0, pendingCommission: 0 };
  }
  await connectToDatabase();
  const records = await SalesRecord.find({
    employeeId: parsed.data,
    financeStatus: "Approved",
  }).lean();

  const totalCommission = records.reduce((sum, r) => sum + (r.calculatedCommission || 0), 0);
  const paidCommission = records.filter(r => (r as unknown as { isPaid?: boolean }).isPaid).reduce((sum, r) => sum + (r.calculatedCommission || 0), 0);
  const pendingCommission = records.filter(r => !(r as unknown as { isPaid?: boolean }).isPaid).reduce((sum, r) => sum + (r.calculatedCommission || 0), 0);

  return {
    records: records.map((r) => ({
      id: r._id.toString(),
      companyName: r.companyName,
      commission: r.calculatedCommission,
      isPaid: (r as unknown as { isPaid?: boolean }).isPaid,
      paymentStatus: (r as unknown as { paymentStatus?: string }).paymentStatus,
      createdAt: r.createdAt,
    })),
    totalCommission,
    paidCommission,
    pendingCommission,
  };
}

export async function checkEligibility(employeeId: string) {
  const parsed = checkEligibilitySchema.safeParse(employeeId);
  if (!parsed.success) {
    return { eligible: false, achievement: 0, message: "Invalid employee ID" };
  }
  await connectToDatabase();

  const user = await User.findById(parsed.data);
  if (!user || !user.targetAmount) {
    return { eligible: false, achievement: 0, message: "No target set" };
  }

  const approvedSales = await SalesRecord.find({
    employeeId: parsed.data,
    financeStatus: "Approved",
  });

  const totalSales = approvedSales.reduce((sum, r) => {
    return sum + r.products.reduce((s: number, p: { unitPrice: number; quantity: number }) => s + p.unitPrice * p.quantity, 0);
  }, 0);

  const achievement = (totalSales / user.targetAmount) * 100;
  const wasEligible = (user as unknown as { isEligible?: boolean }).isEligible || false;
  const nowEligible = achievement >= 50;

  if (nowEligible && !wasEligible && user.email) {
    try {
      await sendNotificationEmail(
        user.email,
        "Commission Eligible!",
        `Congratulations! You have reached ${achievement.toFixed(1)}% of your target and are now eligible for commissions on all approved sales.`
      );
    } catch (emailError) {
      console.error("Failed to send eligibility email:", emailError);
    }

    try {
      await notifyCommissionEligible(parsed.data, achievement);
    } catch (notifError) {
      console.error("Failed to send in-app notification:", notifError);
    }

    await User.findByIdAndUpdate(parsed.data, { isEligible: true });
    await reevaluateIneligibleRecords(parsed.data, user.targetAmount);
  }

  if (!nowEligible && wasEligible) {
    await User.findByIdAndUpdate(parsed.data, { isEligible: false });
  }

  return {
    eligible: nowEligible,
    achievement,
    totalSales,
    targetAmount: user.targetAmount,
    message: nowEligible ? "Eligible for commission" : `Need ${(50 - achievement).toFixed(1)}% more achievement`,
  };
}

async function reevaluateIneligibleRecords(employeeId: string, targetAmount: number) {
  const pendingRecords = await SalesRecord.find({
    employeeId,
    financeStatus: "Approved",
    isPaid: false,
  }).lean();

  for (const record of pendingRecords) {
    const recordAmount = record.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0);
    const recordAchievement = (recordAmount / targetAmount) * 100;

    if (recordAchievement >= 50) {
      await SalesRecord.findByIdAndUpdate(record._id, { eligibilityStatus: "Eligible" });
    }
  }
}