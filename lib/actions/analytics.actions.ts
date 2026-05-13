"use server";

import { connectToDatabase, toObjectId } from "@/lib/mongodb";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { User } from "@/lib/models/User";
import { auth } from "@/lib/auth/auth";
import type { AuthUser } from "@/types";

// Helper function to get month name from number
function getMonthName(monthNumber: number): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months[monthNumber - 1] || "Unknown";
}

// Get sales trends for an employee over specified months
export async function getSalesTrends(employeeId: string, months: number = 6) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;

  // Sales executives can only see their own data
  if (userRole === "salesExecutive" && session.user.id !== employeeId) {
    return { error: "Forbidden: You can only view your own data" };
  }

  try {
    await connectToDatabase();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const trends = await SalesRecord.aggregate([
      {
        $match: {
          employeeId: toObjectId(employeeId),
          createdAt: { $gte: startDate },
          status: "Approved",
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: { $multiply: ["$$product.unitPrice", "$$product.quantity"] }
              }
            }
          },
          totalCommission: { $sum: { $ifNull: ["$calculatedCommission", 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    return trends.map((t: { _id: { year: number; month: number }; totalSales: number; totalCommission: number }) => ({
      month: getMonthName(t._id.month),
      sales: t.totalSales || 0,
      commission: t.totalCommission || 0,
    }));
  } catch (error) {
    console.error("Error fetching sales trends:", error);
    return { error: "Failed to fetch sales trends" };
  }
}

// Get commission progress vs target
export async function getCommissionProgress(employeeId: string, months: number = 6) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;

  if (userRole === "salesExecutive" && session.user.id !== employeeId) {
    return { error: "Forbidden: You can only view your own data" };
  }

  try {
    await connectToDatabase();
    const user = await User.findById(toObjectId(employeeId)).lean();
    if (!user) return { error: "User not found" };

    const targetAmount = user.targetAmount || 0;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const progress = await SalesRecord.aggregate([
      {
        $match: {
          employeeId: toObjectId(employeeId),
          createdAt: { $gte: startDate },
          status: "Approved",
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          earned: { $sum: { $ifNull: ["$calculatedCommission", 0] } },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    return progress.map((p: { _id: { year: number; month: number }; earned: number }) => ({
      month: getMonthName(p._id.month),
      earned: p.earned || 0,
      target: targetAmount,
    }));
  } catch (error) {
    console.error("Error fetching commission progress:", error);
    return { error: "Failed to fetch commission progress" };
  }
}

// Get team sales trends for manager
export async function getTeamSalesTrends(managerId: string, months: number = 6) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;

  if (userRole === "salesExecutive") {
    return { error: "Forbidden: Insufficient permissions" };
  }

  try {
    await connectToDatabase();
    const teamMembers = await User.find({ managerId: toObjectId(managerId), isActive: true, deletedAt: null })
      .select("_id")
      .lean();

    const teamMemberIds = teamMembers.map((m) => m._id);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const trends = await SalesRecord.aggregate([
      {
        $match: {
          employeeId: { $in: teamMemberIds },
          createdAt: { $gte: startDate },
          status: "Approved",
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalSales: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: { $multiply: ["$$product.unitPrice", "$$product.quantity"] }
              }
            }
          },
          totalCommission: { $sum: { $ifNull: ["$calculatedCommission", 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    return trends.map((t: { _id: { year: number; month: number }; totalSales: number; totalCommission: number }) => ({
      month: getMonthName(t._id.month),
      sales: t.totalSales || 0,
      commission: t.totalCommission || 0,
    }));
  } catch (error) {
    console.error("Error fetching team sales trends:", error);
    return { error: "Failed to fetch team sales trends" };
  }
}

// Get deduction breakdown for accountant
export async function getDeductionBreakdown(months: number = 6) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;

  if (!["accountant", "admin", "administrator"].includes(userRole)) {
    return { error: "Forbidden: Insufficient permissions" };
  }

  try {
    await connectToDatabase();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const breakdown = await SalesRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "Approved",
          deletedAt: null,
          "accountantDeductions.type": { $exists: true, $ne: null },
        },
      },
      {
        $unwind: "$accountantDeductions",
      },
      {
        $group: {
          _id: "$accountantDeductions.type",
          amount: { $sum: { $ifNull: ["$accountantDeductions.amount", 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);

    return breakdown.map((b: { _id: string; amount: number; count: number }) => ({
      type: b._id,
      amount: b.amount || 0,
      count: b.count || 0,
    }));
  } catch (error) {
    console.error("Error fetching deduction breakdown:", error);
    return { error: "Failed to fetch deduction breakdown" };
  }
}

// Get finance approval trends
export async function getFinanceApprovalTrends(months: number = 6) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;

  if (!["finance", "admin", "administrator"].includes(userRole)) {
    return { error: "Forbidden: Insufficient permissions" };
  }

  try {
    await connectToDatabase();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setHours(0, 0, 0, 0);

    const trends = await SalesRecord.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "Approved",
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          approvedAmount: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: { $multiply: ["$$product.unitPrice", "$$product.quantity"] }
              }
            }
          },
          commissionPaid: { $sum: { $ifNull: ["$calculatedCommission", 0] } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    return trends.map((t: { _id: { year: number; month: number }; approvedAmount: number; commissionPaid: number }) => ({
      month: getMonthName(t._id.month),
      approvedAmount: t.approvedAmount || 0,
      commissionPaid: t.commissionPaid || 0,
    }));
  } catch (error) {
    console.error("Error fetching finance approval trends:", error);
    return { error: "Failed to fetch finance approval trends" };
  }
}

// Get system-wide stats for admin dashboard
export async function getSystemStats() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;

  if (!["admin", "administrator"].includes(userRole)) {
    return { error: "Forbidden: Insufficient permissions" };
  }

  try {
    await connectToDatabase();

    const [totalUsers, activeUsers, totalSales, totalCommission, pendingApprovals] = await Promise.all([
      User.countDocuments({ deletedAt: null }),
      User.countDocuments({ isActive: true, deletedAt: null }),
      SalesRecord.countDocuments({ status: "Approved", deletedAt: null }),
      SalesRecord.countDocuments({ status: "Approved", paymentStatus: "Paid", deletedAt: null }),
      SalesRecord.countDocuments({
        status: { $in: ["Pending_Manager", "Pending_Accountant", "Pending_Finance"] },
        deletedAt: null,
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalSales,
      totalCommission,
      pendingApprovals,
    };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return { error: "Failed to fetch system stats" };
  }
}
