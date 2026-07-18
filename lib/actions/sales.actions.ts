"use server";

import { z } from "zod";
import { cache } from "react";
import { connectToDatabase, toObjectId } from "@/lib/mongodb";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { Category } from "@/lib/models/Category";
import { sendNotificationEmail } from "@/lib/email";
import { notifySaleSubmitted } from "@/lib/actions/notification.actions";
import { logAudit } from "@/lib/actions/audit.actions";
import { auth } from "@/lib/auth/auth";
import type { AuthUser, UserRole } from "@/types";
import { sseManager, SSE_EVENTS } from "@/lib/sse";
import { calculateProductTotal } from "@/lib/utils/money";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

/**
 * Helper function to reset all status fields when a sale is rejected or resubmitted
 * This ensures all workflow fields are synchronized
 */
export async function resetSaleStatuses(saleId: string) {
  await connectToDatabase();
  await SalesRecord.findByIdAndUpdate(saleId, {
    status: "Draft",
    approvalStatus: "Pending",
    accountantStatus: "Pending",
    financeStatus: "Pending",
    eligibilityStatus: "Pending",
    $unset: {
      rejectionReason: "",
      rejectedBy: "",
      approvedBy: "",
      approvedAt: "",
      processedAt: "",
      finalApprovedAt: "",
    },
  });
}

/**
 * Check if all products in a sale are from auto-approve categories
 * Returns true if ALL products have categories with autoApprove = true
 */
export async function checkAutoApproveEligibility(products: Array<{ categoryId: string }>): Promise<boolean> {
  if (!products || products.length === 0) return false;

  await connectToDatabase();

  // Get unique category IDs from products
  const categoryIds = [...new Set(products.map(p => p.categoryId).filter(Boolean))];

  if (categoryIds.length === 0) return false;

  // Fetch all categories
  const categories = await Category.find({ _id: { $in: categoryIds } }).lean();

  if (categories.length !== categoryIds.length) return false;

  // Check if ALL categories have autoApprove = true
  return categories.every(c => c.autoApprove === true);
}

const productLineSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  categoryId: z.string().min(1, "Category is required"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  originalPrice: z.number().min(0).optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  dealNotes: z.string().optional(),
});

const getSalesRecordsSchema = z.object({
  employeeId: objectIdSchema.optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

const getAllSalesRecordsSchema = z.object({
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

const createSalesRecordSchema = z.object({
  employeeId: objectIdSchema.optional(),
  employeeName: z.string().min(1, "Employee name is required").max(200),
  companyName: z.string().min(1, "Company name is required").max(500),
  companyEmail: z.string().email("Invalid email format"),
  products: z.array(productLineSchema).min(1, "At least one product is required").max(20, "Maximum 20 products allowed"),
  taxEnabled: z.boolean(),
  vatEnabled: z.boolean(),
  proofOfSale: z.array(z.string()).optional(),
});

const submitSalesRecordSchema = z.object({
  id: objectIdSchema,
});

const deleteSalesRecordSchema = z.object({
  id: objectIdSchema,
});

const updateSalesRecordDataSchema = z.object({
  companyName: z.string().min(1).optional(),
  companyEmail: z.string().email().optional(),
  products: z.array(productLineSchema).optional(),
  taxEnabled: z.boolean().optional(),
  vatEnabled: z.boolean().optional(),
  date: z.string().optional(),
  proofOfSale: z.array(z.string()).optional(),
});

const updateSalesRecordSchema = z.object({
  id: objectIdSchema,
  data: updateSalesRecordDataSchema,
});

async function getSalesRecordsImpl({
  employeeId,
  status,
  search,
}: {
  employeeId?: string;
  status?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  const userId = session.user.id as string;
  const parsed = getSalesRecordsSchema.safeParse({ employeeId, status, search });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  const roleFilter: Record<string, unknown> = {};
  if (userRole === "salesExecutive") {
    roleFilter.employeeId = userId;
  } else if (userRole === "salesManager") {
    if (parsed.data.employeeId) {
      roleFilter.employeeId = parsed.data.employeeId;
    } else {
      const employees = await User.find({ managerId: userId }).select("_id").lean();
      const employeeIds = employees.map(e => e._id.toString());
      roleFilter.$or = [
        { employeeId: { $in: employeeIds } },
        { managerId: userId },
      ];
    }
  } else if (parsed.data.employeeId) {
    roleFilter.employeeId = parsed.data.employeeId;
  }
  if (parsed.data.status) roleFilter.status = parsed.data.status;

  if (parsed.data.search) {
    const escapedSearch = parsed.data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const searchFilter = {
      $or: [
        { companyName: { $regex: escapedSearch, $options: "i" } },
        { employeeName: { $regex: escapedSearch, $options: "i" } },
      ],
    };
    Object.assign(query, roleFilter, searchFilter);
  } else {
    Object.assign(query, roleFilter);
  }

  const records = await SalesRecord.find(query).sort({ createdAt: -1 }).lean();
  return records.map((r) => ({
    id: r._id.toString(),
    companyName: r.companyName,
    companyEmail: r.companyEmail,
    productCount: r.products.length,
    totalAmount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0),
    status: r.status,
    commission: r.commission,
    createdAt: r.createdAt,
    autoApproved: r.autoApproved || false,
  }));
}

// Export cached version for per-request deduplication (server-cache-react)
export const getSalesRecords = cache(getSalesRecordsImpl);

export async function getSalesRecord(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) return null;
  await connectToDatabase();
  const record = await SalesRecord.findById(parsed.data).lean();
  if (!record) return null;

  // Fetch all category names for the products in this record
  const catIds = Array.isArray(record.products)
    ? record.products.map((p: any) => p.categoryId?.toString()).filter(Boolean)
    : []
  const categories = catIds.length > 0
    ? await Category.find({ _id: { $in: catIds } }).select("name").lean()
    : []
  const categoryMap = new Map(categories.map((c: any) => [c._id.toString(), c.name]))

  // Convert products to plain objects with string IDs and category names
  const products = Array.isArray(record.products) ? record.products.map((p: any) => ({
    productName: p.productName,
    categoryId: p.categoryId?.toString() || "",
    categoryName: categoryMap.get(p.categoryId?.toString()) || "",
    unitPrice: p.unitPrice,
    originalPrice: p.originalPrice,
    quantity: p.quantity,
    dealNotes: p.dealNotes,
  })) : [];

  return {
    id: record._id.toString(),
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    companyName: record.companyName,
    companyEmail: record.companyEmail,
    products,
    taxEnabled: record.taxEnabled,
    vatEnabled: record.vatEnabled,
    taxRate: record.taxRate,
    taxAmount: record.taxAmount,
    vatRate: record.vatRate,
    vatAmount: record.vatAmount,
    eoBpAmount: record.eoBpAmount,
    eoBpReason: record.eoBpReason,
    netSales: record.netSales,
    status: record.status,
    approvalStatus: record.approvalStatus,
    accountantStatus: record.accountantStatus,
    financeStatus: record.financeStatus,
    commission: record.commission,
    calculatedCommission: record.calculatedCommission,
    rejectionReason: record.rejectionReason,
    rejectedBy: record.rejectedBy,
    eligibilityStatus: record.eligibilityStatus,
    proofOfSale: record.proofOfSale,
    managerId: record.managerId?.toString(),
    approvedBy: record.approvedBy?.toString(),
    approvedAt: record.approvedAt,
    processedAt: record.processedAt,
    finalApprovedAt: record.finalApprovedAt,
    paidBy: record.paidBy?.toString(),
    isPaid: record.isPaid,
    paymentStatus: record.paymentStatus,
    paymentDate: record.paymentDate,
    autoApproved: record.autoApproved,
    autoApprovedAt: record.autoApprovedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getSalesStats() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const records = await SalesRecord.find().lean();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: records.length,
    draft: records.filter(r => r.status === "Draft").length,
    pendingManager: records.filter(r => r.status === "Pending_Manager").length,
    pendingAccountant: records.filter(r => r.status === "Pending_Accountant").length,
    pendingFinance: records.filter(r => r.status === "Pending_Finance").length,
    approved: records.filter(r => r.status === "Approved").length,
    rejected: records.filter(r => r.approvalStatus === "Rejected").length,
    totalAmount: records.reduce((sum, r) => sum + r.products.reduce((s: number, p: { unitPrice: number; quantity: number }) => s + calculateProductTotal(p.unitPrice, p.quantity), 0), 0),
    totalCommission: records.reduce((sum, r) => sum + (r.calculatedCommission || 0), 0),
    approvedToday: records.filter(r => r.status === "Approved" && r.finalApprovedAt && new Date(r.finalApprovedAt) >= today).length,
    processedToday: records.filter(r => r.accountantStatus === "Approved" && r.processedAt && new Date(r.processedAt) >= today).length,
    pendingPayments: records.filter(r => r.status === "Approved" && !r.isPaid).length,
    totalDeductions: records.reduce((sum, r) => sum + (r.eoBpAmount || 0) + (r.taxAmount || 0) + (r.vatAmount || 0), 0),
  };
  return stats;
}

async function getSalesRecordsByManagerIdImpl(managerId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const parsed = objectIdSchema.safeParse(managerId);
  if (!parsed.success) return [];
  await connectToDatabase();

  const employees = await User.find({ managerId: parsed.data }).select("_id");
  const employeeIds = employees.map(e => e._id.toString());

  const query: Record<string, unknown> = {
    $or: [
      { employeeId: { $in: employeeIds } },
      { managerId: parsed.data },
    ],
  };

  const records = await SalesRecord.find(query).sort({ createdAt: -1 }).lean();
  return records.map((r) => ({
    id: r._id.toString(),
    employeeId: r.employeeId?.toString() || "",
    employeeName: r.employeeName,
    companyName: r.companyName,
    productCount: r.products.length,
    totalAmount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0),
    status: r.status,
    commission: r.commission || 0,
    createdAt: r.createdAt,
    managerId: r.managerId?.toString() || "",
  }));
}

// Export cached version for per-request deduplication (server-cache-react)
export const getSalesRecordsByManagerId = cache(getSalesRecordsByManagerIdImpl);

export async function getAllSalesRecords({
  status,
  search,
  page,
  limit,
}: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["admin", "administrator", "accountant", "finance", "salesManager", "salesExecutive"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = getAllSalesRecordsSchema.safeParse({ status, search, page, limit });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (parsed.data.status && parsed.data.status !== "all") query.status = parsed.data.status;
  if (parsed.data.search) {
    const escapedSearch = parsed.data.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { companyName: { $regex: escapedSearch, $options: "i" } },
      { employeeName: { $regex: escapedSearch, $options: "i" } },
    ];
  }

  const records = await SalesRecord.find(query)
    .sort({ createdAt: -1 })
    .lean();

  const items = records.map((r) => ({
    id: r._id.toString(),
    date: r.createdAt,
    companyName: r.companyName,
    companyEmail: r.companyEmail,
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    employeeEmail: "",
    amount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + calculateProductTotal(p.unitPrice, p.quantity), 0),
    productCount: r.products?.length || 0,
    status: r.status,
    approvalStatus: r.approvalStatus,
    accountantStatus: r.accountantStatus,
    financeStatus: r.financeStatus,
    commission: r.commission,
    createdAt: r.createdAt,
  }));

  return items;
}

export async function createSalesRecord({
  employeeId,
  employeeName,
  companyName,
  companyEmail,
  products,
  taxEnabled,
  vatEnabled,
  proofOfSale = [],
}: {
  employeeId?: string;
  employeeName: string;
  companyName: string;
  companyEmail: string;
  products: unknown[];
  taxEnabled: boolean;
  vatEnabled: boolean;
  proofOfSale?: string[];
}): Promise<{ success?: boolean; error?: string; id?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["salesExecutive", "salesManager", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = createSalesRecordSchema.safeParse({
    employeeId,
    employeeName,
    companyName,
    companyEmail,
    products,
    taxEnabled,
    vatEnabled,
    proofOfSale,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (userRole === "salesExecutive") {
    if (!parsed.data.employeeId || parsed.data.employeeId !== session.user.id) {
      return { error: "Forbidden: You can only create sales records for yourself" };
    }
  }

  await connectToDatabase();

  let employee = null;
  if (parsed.data.employeeId) {
    employee = await User.findById(parsed.data.employeeId);
  }

  const record = await SalesRecord.create({
    employeeId: parsed.data.employeeId || "",
    employeeName: parsed.data.employeeName,
    companyName: parsed.data.companyName,
    companyEmail: parsed.data.companyEmail.toLowerCase(),
    products: parsed.data.products,
    taxEnabled: parsed.data.taxEnabled,
    vatEnabled: parsed.data.vatEnabled,
    proofOfSale: parsed.data.proofOfSale,
    managerId: employee?.managerId,
    status: "Draft",
  });

  // Audit logging for sales record creation
  await logAudit({
    userId: session.user.id,
    userEmail: session.user.email || undefined,
    userRole,
    action: "sales.created",
    entity: "SalesRecord",
    entityId: record._id.toString(),
    details: {
      employeeName: parsed.data.employeeName,
      companyName: parsed.data.companyName,
      productCount: parsed.data.products.length,
      taxEnabled: parsed.data.taxEnabled,
      vatEnabled: parsed.data.vatEnabled,
    },
  });

  return { success: true, id: record._id.toString() };
}

export async function submitSalesRecord(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  const parsed = submitSalesRecordSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };
  if (record.deletedAt) return { error: "Record not found" };
  if (record.employeeId.toString() !== userId && !["admin", "administrator", "salesManager"].includes(userRole)) {
    return { error: "Forbidden: You can only submit your own records" };
  }
  if (record.status !== "Draft") return { error: "Only draft records can be submitted" };

  // If this was a rejected record being resubmitted, reset all status fields first
  if (record.approvalStatus === "Rejected" || record.accountantStatus === "Rejected" || record.financeStatus === "Rejected") {
    await resetSaleStatuses(parsed.data.id);
  }

  // Check if all products are from auto-approve categories
  const isAutoApproveEligible = await checkAutoApproveEligibility(record.products);

  if (isAutoApproveEligible) {
    // Process auto-approval
    const { processAutoApproval } = await import("@/lib/actions/approval.actions");
    const result = await processAutoApproval(parsed.data.id);

    if (result?.error) {
      return { error: result.error };
    }

    return { success: true, autoApproved: true, commission: result.commission };
  }

  // Normal workflow: submit to manager
  await SalesRecord.findByIdAndUpdate(parsed.data.id, {
    status: "Pending_Manager",
    approvalStatus: "Pending",
  });

  try {
    if (record.managerId) {
      const manager = await User.findById(record.managerId);
      if (manager?.email) {
        await sendNotificationEmail(
          manager.email,
          "New Sale Pending Approval",
          `${record.employeeName} has submitted a sale for <strong>${record.companyName}</strong> awaiting your approval.`
        );
      }
    }
  } catch (emailError) {
    console.error("Failed to send submission email:", emailError);
  }

  try {
    if (record.managerId) {
      await notifySaleSubmitted(record.employeeId, record.managerId.toString(), record.companyName);
    }
  } catch (notifError) {
    console.error("Failed to send in-app notification:", notifError);
  }

  // Send real-time update via SSE
  sseManager.sendToUser(record.employeeId, {
    type: SSE_EVENTS.SALE_CREATED,
    payload: {
      id: parsed.data.id,
      companyName: record.companyName,
      status: "Pending_Manager",
    },
  });

  // Notify manager dashboard
  if (record.managerId) {
    sseManager.sendToUser(record.managerId.toString(), {
      type: SSE_EVENTS.DASHBOARD_REFRESH,
      payload: { reason: "new_sale_submitted" },
    });
  }

  return { success: true };
}

export async function deleteSalesRecord(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  const parsed = deleteSalesRecordSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };
  if (record.employeeId.toString() !== userId && !["admin", "administrator", "salesManager"].includes(userRole)) {
    return { error: "Forbidden: You can only delete your own records" };
  }
  if (record.status !== "Draft") return { error: "Only draft records can be deleted" };

  // Audit logging before deletion
  await logAudit({
    userId: session.user.id,
    userEmail: session.user.email || undefined,
    userRole,
    action: "sales.deleted",
    entity: "SalesRecord",
    entityId: parsed.data.id,
    details: {
      employeeName: record.employeeName,
      companyName: record.companyName,
      status: record.status,
      productCount: record.products.length,
    },
  });

  await SalesRecord.findByIdAndUpdate(parsed.data.id, { deletedAt: new Date() });
  return { success: true };
}

export async function updateSalesRecord(id: string, data: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
  const parsed = updateSalesRecordSchema.safeParse({ id, data });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };
  if (record.employeeId.toString() !== userId && !["admin", "administrator", "salesManager"].includes(userRole)) {
    return { error: "Forbidden: You can only update your own records" };
  }
  if (record.status !== "Draft") {
    return { error: "Only draft records can be edited" };
  }

  const updateData: Record<string, unknown> = {};
  const { companyName, companyEmail, products, taxEnabled, vatEnabled, date, proofOfSale } = parsed.data.data;
  if (companyName !== undefined) updateData.companyName = companyName;
  if (companyEmail !== undefined) updateData.companyEmail = companyEmail;
  if (products !== undefined) updateData.products = products;
  if (taxEnabled !== undefined) updateData.taxEnabled = taxEnabled;
  if (vatEnabled !== undefined) updateData.vatEnabled = vatEnabled;
  if (date !== undefined) updateData.date = date;
  if (proofOfSale !== undefined) updateData.proofOfSale = proofOfSale;

  await SalesRecord.findByIdAndUpdate(parsed.data.id, updateData);
  return { success: true };
}
