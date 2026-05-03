"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { sendNotificationEmail } from "@/lib/email";
import { notifySaleSubmitted } from "@/lib/actions/notification.actions";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const productLineSchema = z.object({
  productName: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
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

const updateSalesRecordSchema = z.object({
  id: objectIdSchema,
  data: z.record(z.string(), z.any()),
});

export async function getSalesRecords({
  employeeId,
  status,
  search,
}: {
  employeeId?: string;
  status?: string;
  search?: string;
}) {
  const parsed = getSalesRecordsSchema.safeParse({ employeeId, status, search });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (parsed.data.employeeId) query.employeeId = parsed.data.employeeId;
  if (parsed.data.status) query.status = parsed.data.status;
  if (parsed.data.search) {
    query.$or = [
      { companyName: { $regex: parsed.data.search, $options: "i" } },
      { employeeName: { $regex: parsed.data.search, $options: "i" } },
    ];
  }

  const records = await SalesRecord.find(query).sort({ createdAt: -1 }).lean();
  return records.map((r) => ({
    id: r._id.toString(),
    companyName: r.companyName,
    companyEmail: r.companyEmail,
    productCount: r.products.length,
    totalAmount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0),
    status: r.status,
    commission: r.commission,
    createdAt: r.createdAt,
  }));
}

export async function getSalesRecord(id: string) {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) return null;
  await connectToDatabase();
  const record = await SalesRecord.findById(parsed.data).lean();
  if (!record) return null;

  return {
    id: record._id.toString(),
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    companyName: record.companyName,
    companyEmail: record.companyEmail,
    products: record.products,
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
    proofOfSale: record.proofOfSale,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export async function getSalesStats() {
  await connectToDatabase();
  const records = await SalesRecord.find().lean();

  const stats = {
    total: records.length,
    draft: records.filter(r => r.status === "Draft").length,
    pendingManager: records.filter(r => r.status === "Pending_Manager").length,
    pendingAccountant: records.filter(r => r.status === "Pending_Accountant").length,
    pendingFinance: records.filter(r => r.status === "Pending_Finance").length,
    approved: records.filter(r => r.status === "Approved").length,
    rejected: records.filter(r => r.status === "Rejected").length,
    totalAmount: records.reduce((sum, r) => sum + r.products.reduce((s: number, p: { unitPrice: number; quantity: number }) => s + p.unitPrice * p.quantity, 0), 0),
    totalCommission: records.reduce((sum, r) => sum + (r.calculatedCommission || 0), 0),
  };
  return stats;
}

export async function getSalesRecordsByManagerId(managerId: string) {
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
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    companyName: r.companyName,
    productCount: r.products.length,
    totalAmount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0),
    status: r.status,
    commission: r.commission,
    createdAt: r.createdAt,
  }));
}

export async function getAllSalesRecords({
  status,
  search,
}: {
  status?: string;
  search?: string;
}) {
  const parsed = getAllSalesRecordsSchema.safeParse({ status, search });
  if (!parsed.success) return [];
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (parsed.data.status && parsed.data.status !== "all") query.approvalStatus = parsed.data.status;
  if (parsed.data.search) {
    query.$or = [
      { companyName: { $regex: parsed.data.search, $options: "i" } },
      { employeeName: { $regex: parsed.data.search, $options: "i" } },
    ];
  }

  const records = await SalesRecord.find(query)
    .populate("employeeId", "name email")
    .sort({ createdAt: -1 })
    .lean();

  return records.map((r) => ({
    id: r._id.toString(),
    date: r.date,
    companyName: r.companyName,
    companyEmail: r.companyEmail,
    employeeName: (r.employeeId as unknown as { name?: string })?.name || r.employeeName,
    employeeEmail: (r.employeeId as unknown as { email?: string })?.email || "",
    amount: r.products.reduce((sum: number, p: { unitPrice: number; quantity: number }) => sum + p.unitPrice * p.quantity, 0),
    status: r.status,
    approvalStatus: r.approvalStatus,
    accountantStatus: r.accountantStatus,
    financeStatus: r.financeStatus,
    commission: r.commission,
    createdAt: r.createdAt,
  }));
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

  return { success: true, id: record._id.toString() };
}

export async function submitSalesRecord(id: string) {
  const parsed = submitSalesRecordSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();

  const record = await SalesRecord.findById(parsed.data.id);
  if (!record) return { error: "Record not found" };

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

  return { success: true };
}

export async function deleteSalesRecord(id: string) {
  const parsed = deleteSalesRecordSchema.safeParse({ id });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  await SalesRecord.findByIdAndDelete(parsed.data.id);
  return { success: true };
}

export async function updateSalesRecord(id: string, data: unknown) {
  const parsed = updateSalesRecordSchema.safeParse({ id, data });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  await SalesRecord.findByIdAndUpdate(parsed.data.id, parsed.data.data);
  return { success: true };
}