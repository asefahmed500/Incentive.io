"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Wallet } from "@/lib/models/Wallet";
import mongoose from "mongoose";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const getWalletSchema = objectIdSchema;
const getOrCreateWalletSchema = objectIdSchema;

const creditWalletSchema = z.object({
  employeeId: objectIdSchema,
  amount: z.number().min(0, "Amount must be non-negative"),
  salesRecordId: objectIdSchema.optional(),
  description: z.string().min(1, "Description is required"),
});

const debitWalletSchema = z.object({
  employeeId: objectIdSchema,
  amount: z.number().min(0, "Amount must be non-negative"),
  salesRecordId: objectIdSchema.optional(),
  description: z.string().min(1, "Description is required"),
});

const markCommissionPaidSchema = z.object({
  employeeId: objectIdSchema,
  amount: z.number().min(0, "Amount must be non-negative"),
  salesRecordId: objectIdSchema,
  paidBy: objectIdSchema,
});

const getWalletTransactionsSchema = z.object({
  employeeId: objectIdSchema,
  limit: z.number().int().min(1).max(200).optional(),
});

function toObjectId(id: string) {
  return new mongoose.Types.ObjectId(id);
}

export async function getWallet(employeeId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id as string;
  const userRole = (session.user as any).role as string;
  if (employeeId !== userId && !["admin", "administrator", "finance"].includes(userRole)) return null;
  const parsed = getWalletSchema.safeParse(employeeId);
  if (!parsed.success) return null;
  await connectToDatabase();
  const wallet = await Wallet.findOne({
    employeeId: toObjectId(parsed.data),
  }).lean();
  return wallet;
}

export async function getOrCreateWallet(employeeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id as string;
  const userRole = (session.user as any).role as string;
  if (employeeId !== userId && !["admin", "administrator", "finance"].includes(userRole)) {
    return { error: "Forbidden: You can only access your own wallet" };
  }
  const parsed = getOrCreateWalletSchema.safeParse(employeeId);
  if (!parsed.success) return null;
  await connectToDatabase();
  const wallet = await Wallet.findOneAndUpdate(
    { employeeId: toObjectId(parsed.data) },
    { $setOnInsert: { balance: 0, pendingBalance: 0, totalEarned: 0, totalPaid: 0, transactions: [] } },
    { upsert: true, new: true }
  ).lean();
  return wallet;
}

export async function creditWallet({
  employeeId,
  amount,
  salesRecordId,
  description,
}: {
  employeeId: string;
  amount: number;
  salesRecordId?: string;
  description: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = creditWalletSchema.safeParse({ employeeId, amount, salesRecordId, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.amount === 0) return { success: true, newBalance: 0 };

  await connectToDatabase();

  const empOid = toObjectId(parsed.data.employeeId);

  const wallet = await Wallet.findOneAndUpdate(
    { employeeId: empOid },
    {
      $inc: { balance: parsed.data.amount, totalEarned: parsed.data.amount, pendingBalance: parsed.data.amount },
      $setOnInsert: { transactions: [] },
    },
    { upsert: true, new: true }
  );

  wallet.transactions.push({
    type: "credit",
    amount: parsed.data.amount,
    salesRecordId: parsed.data.salesRecordId ? toObjectId(parsed.data.salesRecordId) : undefined,
    description: parsed.data.description,
    balanceAfter: wallet.balance,
    createdAt: new Date(),
  });

  await wallet.save();

  return { success: true, newBalance: wallet.balance };
}

export async function debitWallet({
  employeeId,
  amount,
  salesRecordId,
  description,
}: {
  employeeId: string;
  amount: number;
  salesRecordId?: string;
  description: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = debitWalletSchema.safeParse({ employeeId, amount, salesRecordId, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.amount === 0) return { success: true, newBalance: 0 };

  await connectToDatabase();

  const empOid = toObjectId(parsed.data.employeeId);

  const wallet = await Wallet.findOneAndUpdate(
    { employeeId: empOid, balance: { $gte: parsed.data.amount } },
    { $inc: { balance: -parsed.data.amount, totalPaid: parsed.data.amount, pendingBalance: -parsed.data.amount } },
    { new: true }
  );

  if (!wallet) {
    return { error: "Insufficient balance or wallet not found" };
  }

  wallet.transactions.push({
    type: "debit",
    amount: parsed.data.amount,
    salesRecordId: parsed.data.salesRecordId ? toObjectId(parsed.data.salesRecordId) : undefined,
    description: parsed.data.description,
    balanceAfter: wallet.balance,
    createdAt: new Date(),
  });

  await wallet.save();

  return { success: true, newBalance: wallet.balance };
}

export async function markCommissionPaid({
  employeeId,
  amount,
  salesRecordId,
  paidBy,
}: {
  employeeId: string;
  amount: number;
  salesRecordId: string;
  paidBy: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = markCommissionPaidSchema.safeParse({ employeeId, amount, salesRecordId, paidBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.amount === 0) return { success: true, newBalance: 0 };

  await connectToDatabase();

  const empOid = toObjectId(parsed.data.employeeId);
  const srOid = toObjectId(parsed.data.salesRecordId);

  const existingCredit = await Wallet.exists({
    employeeId: empOid,
    "transactions.salesRecordId": srOid,
    "transactions.type": "credit",
  });

  if (existingCredit) {
    return { error: "Commission already paid for this sale" };
  }

  const wallet = await Wallet.findOneAndUpdate(
    { employeeId: empOid },
    {
      $inc: { balance: parsed.data.amount, totalPaid: parsed.data.amount, pendingBalance: -parsed.data.amount },
      $setOnInsert: { transactions: [] },
    },
    { upsert: true, new: true }
  );

  wallet.transactions.push({
    type: "credit",
    amount: parsed.data.amount,
    salesRecordId: srOid,
    description: "Commission paid for sale",
    balanceAfter: wallet.balance,
    createdAt: new Date(),
  });

  await wallet.save();

  return { success: true, newBalance: wallet.balance };
}

export async function getAllWallets() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as any).role as string;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const wallets = await Wallet.find().populate("employeeId", "name email role").lean();
  return wallets.map((w) => ({
    id: w._id.toString(),
    employeeId: (w.employeeId as unknown as { _id?: { toString: () => string } })?._id?.toString() || "",
    employeeName: (w.employeeId as unknown as { name?: string })?.name || "Unknown",
    employeeEmail: (w.employeeId as unknown as { email?: string })?.email || "",
    balance: w.balance,
    pendingBalance: w.pendingBalance,
    totalEarned: w.totalEarned,
    totalPaid: w.totalPaid,
    transactionCount: w.transactions?.length || 0,
  }));
}

export async function getWalletTransactions(employeeId: string, limit = 50) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id as string;
  const userRole = (session.user as any).role as string;
  if (employeeId !== userId && !["admin", "administrator", "finance"].includes(userRole)) {
    return { error: "Forbidden: You can only access your own wallet transactions" };
  }
  const parsed = getWalletTransactionsSchema.safeParse({ employeeId, limit });
  if (!parsed.success) return [];
  await connectToDatabase();
  const wallet = await Wallet.findOne({
    employeeId: toObjectId(parsed.data.employeeId),
  }).lean();
  if (!wallet) return [];
  const txLimit = parsed.data.limit || 50;
  return (wallet.transactions || [])
    .slice(-txLimit)
    .reverse()
    .map((t: unknown) => {
      const tx = t as {
        _id?: { toString?: () => string };
        type: string;
        amount: number;
        salesRecordId?: { toString?: () => string };
        description: string;
        balanceAfter: number;
        createdAt: Date;
      };
      return {
        id: tx._id?.toString?.() || "",
        type: tx.type,
        amount: tx.amount,
        salesRecordId: tx.salesRecordId?.toString?.() || "",
        description: tx.description,
        balanceAfter: tx.balanceAfter,
        createdAt: tx.createdAt,
      };
    });
}