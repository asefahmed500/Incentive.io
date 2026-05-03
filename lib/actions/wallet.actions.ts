"use server";

import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Wallet } from "@/lib/models/Wallet";
import { SalesRecord } from "@/lib/models/SalesRecord";
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

export async function getWallet(employeeId: string) {
  const parsed = getWalletSchema.safeParse(employeeId);
  if (!parsed.success) return null;
  await connectToDatabase();
  let wallet = await Wallet.findOne({ employeeId: new mongoose.Types.ObjectId(parsed.data) }).lean();
  if (!wallet) {
    wallet = await Wallet.findOne({ employeeId: parsed.data }).lean();
  }
  return wallet;
}

export async function getOrCreateWallet(employeeId: string) {
  const parsed = getOrCreateWalletSchema.safeParse(employeeId);
  if (!parsed.success) return null;
  await connectToDatabase();
  const wallet = await Wallet.findOne({ employeeId: new mongoose.Types.ObjectId(parsed.data) }).lean();
  if (!wallet) {
    const newWallet = await Wallet.create({
      employeeId: new mongoose.Types.ObjectId(parsed.data),
      balance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      totalPaid: 0,
      transactions: [],
    });
    return newWallet.toObject();
  }
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
  const parsed = creditWalletSchema.safeParse({ employeeId, amount, salesRecordId, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const wallet = await getOrCreateWallet(parsed.data.employeeId);
  if (!wallet) return { error: "Wallet not found" };
  const newBalance = wallet.balance + parsed.data.amount;
  const newTotalEarned = wallet.totalEarned + parsed.data.amount;
  const newPendingBalance = wallet.pendingBalance + parsed.data.amount;

  await Wallet.findByIdAndUpdate(wallet._id, {
    balance: newBalance,
    totalEarned: newTotalEarned,
    pendingBalance: newPendingBalance,
    $push: {
      transactions: {
        type: "credit",
        amount: parsed.data.amount,
        salesRecordId: parsed.data.salesRecordId ? new mongoose.Types.ObjectId(parsed.data.salesRecordId) : undefined,
        description: parsed.data.description,
        balanceAfter: newBalance,
        createdAt: new Date(),
      },
    },
  });

  return { success: true, newBalance };
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
  const parsed = debitWalletSchema.safeParse({ employeeId, amount, salesRecordId, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const wallet = await getOrCreateWallet(parsed.data.employeeId);
  if (!wallet) return { error: "Wallet not found" };
  const newBalance = wallet.balance - parsed.data.amount;
  const newPendingBalance = wallet.pendingBalance - parsed.data.amount;

  await Wallet.findByIdAndUpdate(wallet._id, {
    balance: newBalance,
    pendingBalance: Math.max(0, newPendingBalance),
    $push: {
      transactions: {
        type: "debit",
        amount: parsed.data.amount,
        salesRecordId: parsed.data.salesRecordId ? new mongoose.Types.ObjectId(parsed.data.salesRecordId) : undefined,
        description: parsed.data.description,
        balanceAfter: newBalance,
        createdAt: new Date(),
      },
    },
  });

  return { success: true, newBalance };
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
  const parsed = markCommissionPaidSchema.safeParse({ employeeId, amount, salesRecordId, paidBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await connectToDatabase();
  const wallet = await getOrCreateWallet(parsed.data.employeeId);
  if (!wallet) return { error: "Wallet not found" };
  const newBalance = wallet.balance + parsed.data.amount;
  const newTotalPaid = wallet.totalPaid + parsed.data.amount;
  const newPendingBalance = wallet.pendingBalance - parsed.data.amount;

  await Wallet.findByIdAndUpdate(wallet._id, {
    balance: newBalance,
    totalPaid: newTotalPaid,
    pendingBalance: Math.max(0, newPendingBalance),
    $push: {
      transactions: {
        type: "credit",
        amount: parsed.data.amount,
        salesRecordId: new mongoose.Types.ObjectId(parsed.data.salesRecordId),
        description: `Commission paid for sale`,
        balanceAfter: newBalance,
        createdAt: new Date(),
      },
    },
  });

  await SalesRecord.findByIdAndUpdate(parsed.data.salesRecordId, {
    isPaid: true,
    paymentStatus: "Paid",
    paymentDate: new Date(),
    paidBy: new mongoose.Types.ObjectId(parsed.data.paidBy),
  });

  return { success: true, newBalance };
}

export async function getAllWallets() {
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
  const parsed = getWalletTransactionsSchema.safeParse({ employeeId, limit });
  if (!parsed.success) return [];
  await connectToDatabase();
  const wallet = await Wallet.findOne({ employeeId: new mongoose.Types.ObjectId(parsed.data.employeeId) }).lean();
  if (!wallet) return [];
  return (wallet.transactions || []).slice(-(parsed.data.limit || 50)).reverse().map((t: unknown) => {
    const tx = t as { _id?: { toString?: () => string }; type: string; amount: number; salesRecordId?: { toString?: () => string }; description: string; balanceAfter: number; createdAt: Date };
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