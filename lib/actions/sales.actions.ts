"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { SalesRecord } from "@/lib/models/SalesRecord";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { sendNotificationEmail } from "@/lib/email";
import { notifySaleSubmitted } from "@/lib/actions/notification.actions";

export async function getSalesRecords({
  employeeId,
  status,
  search,
}: {
  employeeId?: string;
  status?: string;
  search?: string;
}) {
  await connectToDatabase();

  const query: any = {};
  if (employeeId) query.employeeId = employeeId;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { employeeName: { $regex: search, $options: "i" } },
    ];
  }

  const records = await SalesRecord.find(query)
    .sort({ createdAt: -1 })
    .lean();

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
  await connectToDatabase();
  const record = await SalesRecord.findById(id).lean();
  
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
    totalAmount: records.reduce((sum, r) => sum + r.products.reduce((s: number, p: any) => s + p.unitPrice * p.quantity, 0), 0),
    totalCommission: records.reduce((sum, r) => sum + (r.calculatedCommission || 0), 0),
  };
  
  return stats;
}

export async function getSalesRecordsByManagerId(managerId: string) {
  await connectToDatabase();

  // Get all employees managed by this manager
  const employees = await User.find({ managerId: managerId }).select("_id");
  const employeeIds = employees.map(e => e._id.toString());

  const query: any = {
    $or: [
      { employeeId: { $in: employeeIds } },
      { managerId: managerId }
    ]
  };

  const records = await SalesRecord.find(query)
    .sort({ createdAt: -1 })
    .lean();

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
  await connectToDatabase();

  const query: any = {};
  if (status && status !== "all") query.approvalStatus = status;
  if (search) {
    query.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { employeeName: { $regex: search, $options: "i" } },
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
    employeeName: (r.employeeId as any)?.name || r.employeeName,
    employeeEmail: (r.employeeId as any)?.email || "",
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
  employeeId = "",
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
  products: any[];
  taxEnabled: boolean;
  vatEnabled: boolean;
  proofOfSale?: string[];
}): Promise<{ success?: boolean; error?: string; id?: string }> {
  await connectToDatabase();

  let employee = null;
  if (employeeId) {
    employee = await User.findById(employeeId);
  }

  const record = await SalesRecord.create({
    employeeId,
    employeeName,
    companyName,
    companyEmail: companyEmail.toLowerCase(),
    products,
    taxEnabled,
    vatEnabled,
    proofOfSale,
    managerId: employee?.managerId,
    status: "Draft",
  });

  return { success: true, id: record._id.toString() };
}

export async function submitSalesRecord(id: string) {
  await connectToDatabase();
  const record = await SalesRecord.findById(id);
  
  if (!record) return { error: "Record not found" };
  
  await SalesRecord.findByIdAndUpdate(id, {
    status: "Pending_Manager",
    approvalStatus: "Pending",
  });
  
  // Send email to manager
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
  await connectToDatabase();
  await SalesRecord.findByIdAndDelete(id);
  return { success: true };
}

export async function updateSalesRecord(id: string, data: any) {
  await connectToDatabase();
  await SalesRecord.findByIdAndUpdate(id, data);
  return { success: true };
}
