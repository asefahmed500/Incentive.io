"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { connectToDatabase, toObjectId } from "@/lib/mongodb";
import { CommissionRule } from "@/lib/models/CommissionRule";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { User } from "@/lib/models/User";
import { sendNotificationEmail } from "@/lib/email";
import { notifyCommissionEligible } from "@/lib/actions/notification.actions";
import { calculateProductTotal } from "@/lib/utils/money";
import type { AuthUser, UserRole } from "@/types";

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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
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
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = deleteCommissionRuleSchema.safeParse(id);
  if (!parsed.success) {
    return { error: "Invalid ID format" };
  }
  await connectToDatabase();
  await CommissionRule.findByIdAndUpdate(parsed.data, { deletedAt: new Date() });
  return { success: true };
}

export async function getCommissions() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  const userId = session.user.id;

  await connectToDatabase();

  // Build query based on role
  let query: Record<string, unknown> = {
    approvalStatus: "Approved",
    accountantStatus: "Approved",
    financeStatus: "Approved",
  };

  // Role-based filtering
  if (userRole === "salesExecutive") {
    query.employeeId = toObjectId(userId);
  } else if (userRole === "salesManager") {
    const teamMembers = await User.find({ managerId: toObjectId(userId) }).select("_id").lean();
    const teamMemberIds = teamMembers.map((u) => u._id.toString());
    query.employeeId = { $in: teamMemberIds };
  }
  // Admin, administrator, accountant, finance can see all commissions

  const records = await SalesRecord.find(query).populate("employeeId", "name isEligible").lean();

  const employeeIds = [...new Set(records.map((r) => (r.employeeId as unknown as { _id?: { toString: () => string } })?._id?.toString()).filter(Boolean))];
  const users = await User.find({ _id: { $in: employeeIds } }, { isEligible: 1 }).lean();
  const eligibilityMap = new Map(users.map((u) => [u._id.toString(), u.isEligible || false]));

  return records.map((r) => {
    const empId = (r.employeeId as unknown as { _id?: { toString: () => string } })?._id?.toString();
    return {
      id: r._id.toString(),
      employeeId: empId,
      employeeName: (r.employeeId as unknown as { name?: string })?.name || r.employeeName,
      commission: r.commission,
      calculatedCommission: r.calculatedCommission,
      status: r.status,
      isEligible: empId ? eligibilityMap.get(empId) || false : false,
      isPaid: (r as unknown as { isPaid?: boolean }).isPaid,
      paymentStatus: (r as unknown as { paymentStatus?: string }).paymentStatus,
      createdAt: r.createdAt,
    };
  });
}

export async function getCommissionsByEmployee(employeeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { records: [], totalCommission: 0, paidCommission: 0, pendingCommission: 0 };
  const userRole = (session.user as AuthUser).role;
  const userId = session.user.id;

  const parsed = getCommissionsByEmployeeSchema.safeParse(employeeId);
  if (!parsed.success) {
    return { records: [], totalCommission: 0, paidCommission: 0, pendingCommission: 0 };
  }

  // Role-based access check
  if (userRole === "salesExecutive" && parsed.data !== userId) {
    return { error: "Forbidden: You can only view your own commissions" };
  }

  if (userRole === "salesManager") {
    const teamMember = await User.findOne({ _id: parsed.data, managerId: userId }).lean();
    if (!teamMember) {
      return { error: "Forbidden: Employee is not in your team" };
    }
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
  const session = await auth();
  if (!session?.user?.id) return { eligible: false, achievement: 0, message: "Unauthorized" };
  const parsed = checkEligibilitySchema.safeParse(employeeId);
  if (!parsed.success) {
    return { eligible: false, achievement: 0, message: "Invalid employee ID" };
  }
  await connectToDatabase();

  const user = await User.findById(parsed.data);
  if (!user || !user.targetAmount) {
    return { eligible: false, achievement: 0, message: "No target set" };
  }

  // Detect target changes and re-evaluate if target changed
  const previousTarget = (user as unknown as { previousTargetAmount?: number }).previousTargetAmount;
  const targetChanged = previousTarget !== undefined && previousTarget !== user.targetAmount;

  const approvedSales = await SalesRecord.find({
    employeeId: parsed.data,
    financeStatus: "Approved",
  });

  const totalSales = approvedSales.reduce((sum, r) => {
    return sum + r.products.reduce((s: number, p: { unitPrice: number; quantity: number }) => s + calculateProductTotal(p.unitPrice, p.quantity), 0);
  }, 0);

  // Prevent division by zero or negative target amounts
  const achievement = user.targetAmount > 0 ? (totalSales / user.targetAmount) * 100 : 0;
  const wasEligible = (user as unknown as { isEligible?: boolean }).isEligible || false;
  const nowEligible = achievement >= 50;

  // If target changed, re-evaluate all commission eligibility
  if (targetChanged) {
    await SalesRecord.updateMany(
      { employeeId: parsed.data, financeStatus: "Approved" },
      {
        eligibilityStatus: nowEligible ? "Eligible" : "Not_Eligible",
      }
    );

    // Store previous target for next comparison
    await User.findByIdAndUpdate(parsed.data, {
      previousTargetAmount: user.targetAmount,
      isEligible: nowEligible,
    });
  }

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
    await reevaluateIneligibleRecords(parsed.data);
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

export async function reevaluateIneligibleRecords(employeeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await connectToDatabase();

  const employee = await User.findById(employeeId).lean();
  if (!employee) return { error: "Employee not found" };

  const totalApprovedSales = await SalesRecord.find({
    employeeId,
    financeStatus: "Approved",
  });

  const totalSales = totalApprovedSales.reduce((sum, r) => {
    const amount = r.netSales !== undefined && r.netSales !== null ? r.netSales : r.products.reduce((s: number, p: { unitPrice: number; quantity: number }) => s + calculateProductTotal(p.unitPrice, p.quantity), 0);
    return sum + amount;
  }, 0);

  const achievement = employee.targetAmount > 0 ? (totalSales / employee.targetAmount) * 100 : 0;
  const isEligible = achievement >= 50;

  await User.findByIdAndUpdate(employeeId, { isEligible });

  if (isEligible) {
    await SalesRecord.updateMany(
      { employeeId, financeStatus: "Approved", eligibilityStatus: { $ne: "Eligible" } },
      { eligibilityStatus: "Eligible" }
    );
  }

  return { success: true, isEligible, achievement };
}