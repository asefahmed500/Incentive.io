"use server";

import { connectToDatabase } from "@/lib/mongodb";
import CommissionRule from "@/lib/models/CommissionRule";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { User } from "@/lib/models/User";
import { sendNotificationEmail } from "@/lib/email";
import { notifyCommissionEligible } from "@/lib/actions/notification.actions";

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
  await connectToDatabase();
  await CommissionRule.create({
    targetPercentageFrom,
    targetPercentageTo,
    commissionRate,
    categoryId: categoryId || undefined,
    priority: priority || 0,
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
  await connectToDatabase();
  const updateData: any = {};
  if (targetPercentageFrom !== undefined) updateData.targetPercentageFrom = targetPercentageFrom;
  if (targetPercentageTo !== undefined) updateData.targetPercentageTo = targetPercentageTo;
  if (commissionRate !== undefined) updateData.commissionRate = commissionRate;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (priority !== undefined) updateData.priority = priority;
  if (isActive !== undefined) updateData.isActive = isActive;
  await CommissionRule.findByIdAndUpdate(id, updateData);
  return { success: true };
}

export async function deleteCommissionRule(id: string) {
  await connectToDatabase();
  await CommissionRule.findByIdAndDelete(id);
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
    employeeId: (r.employeeId as any)?._id?.toString(),
    employeeName: (r.employeeId as any)?.name || r.employeeName,
    commission: r.commission,
    calculatedCommission: r.calculatedCommission,
    status: r.financeStatus,
    isPaid: (r as any).isPaid,
    paymentStatus: (r as any).paymentStatus,
    createdAt: r.createdAt,
  }));
}

export async function getCommissionsByEmployee(employeeId: string) {
  await connectToDatabase();
  const records = await SalesRecord.find({
    employeeId,
    financeStatus: "Approved",
  }).lean();
  
  const totalCommission = records.reduce((sum, r) => sum + (r.calculatedCommission || 0), 0);
  const paidCommission = records.filter(r => (r as any).isPaid).reduce((sum, r) => sum + (r.calculatedCommission || 0), 0);
  const pendingCommission = records.filter(r => !(r as any).isPaid).reduce((sum, r) => sum + (r.calculatedCommission || 0), 0);
  
  return {
    records: records.map((r) => ({
      id: r._id.toString(),
      companyName: r.companyName,
      commission: r.calculatedCommission,
      isPaid: (r as any).isPaid,
      paymentStatus: (r as any).paymentStatus,
      createdAt: r.createdAt,
    })),
    totalCommission,
    paidCommission,
    pendingCommission,
  };
}

export async function checkEligibility(employeeId: string) {
  await connectToDatabase();
  
  const user = await User.findById(employeeId);
  if (!user || !user.targetAmount) {
    return { eligible: false, achievement: 0, message: "No target set" };
  }
  
  const approvedSales = await SalesRecord.find({
    employeeId,
    financeStatus: "Approved",
  });
  
  const totalSales = approvedSales.reduce((sum, r) => {
    return sum + r.products.reduce((s: number, p: any) => s + p.unitPrice * p.quantity, 0);
  }, 0);
  
  const achievement = (totalSales / user.targetAmount) * 100;
  const wasEligible = (user as any).isEligible || false;
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
      await notifyCommissionEligible(employeeId, achievement);
    } catch (notifError) {
      console.error("Failed to send in-app notification:", notifError);
    }
    
    await User.findByIdAndUpdate(employeeId, { isEligible: true });
    
    await reevaluateIneligibleRecords(employeeId, user.targetAmount);
  }
  
  if (!nowEligible && wasEligible) {
    await User.findByIdAndUpdate(employeeId, { isEligible: false });
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
    const recordAmount = record.products.reduce((sum: number, p: any) => sum + p.unitPrice * p.quantity, 0);
    const recordAchievement = (recordAmount / targetAmount) * 100;
    
    if (recordAchievement >= 50) {
      await SalesRecord.findByIdAndUpdate(record._id, { eligibilityStatus: "Eligible" });
    }
  }
}


