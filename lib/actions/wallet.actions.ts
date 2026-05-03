"use server";

import { connectToDatabase } from "@/lib/mongodb";
import { Wallet } from "@/lib/models/Wallet";
import { SalesRecord } from "@/lib/models/SalesRecord";
import mongoose from "mongoose";

export async function getWallet(employeeId: string) {
  await connectToDatabase();
  let wallet = await Wallet.findOne({ employeeId: new mongoose.Types.ObjectId(employeeId) }).lean();
  if (!wallet) {
    wallet = await Wallet.findOne({ employeeId }).lean();
  }
  return wallet;
}

export async function getOrCreateWallet(employeeId: string) {
  await connectToDatabase();
  let wallet = await Wallet.findOne({ employeeId: new mongoose.Types.ObjectId(employeeId) }).lean();
  if (!wallet) {
    const newWallet = await Wallet.create({
      employeeId: new mongoose.Types.ObjectId(employeeId),
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
  await connectToDatabase();
  const wallet = await getOrCreateWallet(employeeId);
  const newBalance = wallet.balance + amount;
  const newTotalEarned = wallet.totalEarned + amount;
  const newPendingBalance = wallet.pendingBalance + amount;

  await Wallet.findByIdAndUpdate(wallet._id, {
    balance: newBalance,
    totalEarned: newTotalEarned,
    pendingBalance: newPendingBalance,
    $push: {
      transactions: {
        type: "credit",
        amount,
        salesRecordId: salesRecordId ? new mongoose.Types.ObjectId(salesRecordId) : undefined,
        description,
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
  await connectToDatabase();
  const wallet = await getOrCreateWallet(employeeId);
  const newBalance = wallet.balance - amount;
  const newPendingBalance = wallet.pendingBalance - amount;

  await Wallet.findByIdAndUpdate(wallet._id, {
    balance: newBalance,
    pendingBalance: Math.max(0, newPendingBalance),
    $push: {
      transactions: {
        type: "debit",
        amount,
        salesRecordId: salesRecordId ? new mongoose.Types.ObjectId(salesRecordId) : undefined,
        description,
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
  await connectToDatabase();
  const wallet = await getOrCreateWallet(employeeId);
  const newBalance = wallet.balance + amount;
  const newTotalPaid = wallet.totalPaid + amount;
  const newPendingBalance = wallet.pendingBalance - amount;

  await Wallet.findByIdAndUpdate(wallet._id, {
    balance: newBalance,
    totalPaid: newTotalPaid,
    pendingBalance: Math.max(0, newPendingBalance),
    $push: {
      transactions: {
        type: "credit",
        amount,
        salesRecordId: new mongoose.Types.ObjectId(salesRecordId),
        description: `Commission paid for sale`,
        balanceAfter: newBalance,
        createdAt: new Date(),
      },
    },
  });

  await SalesRecord.findByIdAndUpdate(salesRecordId, {
    isPaid: true,
    paymentStatus: "Paid",
    paymentDate: new Date(),
    paidBy: new mongoose.Types.ObjectId(paidBy),
  });

  return { success: true, newBalance };
}

export async function getAllWallets() {
  await connectToDatabase();
  const wallets = await Wallet.find().populate("employeeId", "name email role").lean();
  return wallets.map((w) => ({
    id: w._id.toString(),
    employeeId: (w.employeeId as any)?._id?.toString(),
    employeeName: (w.employeeId as any)?.name || "Unknown",
    employeeEmail: (w.employeeId as any)?.email || "",
    balance: w.balance,
    pendingBalance: w.pendingBalance,
    totalEarned: w.totalEarned,
    totalPaid: w.totalPaid,
    transactionCount: w.transactions?.length || 0,
  }));
}

export async function getWalletTransactions(employeeId: string, limit = 50) {
  await connectToDatabase();
  const wallet = await Wallet.findOne({ employeeId: new mongoose.Types.ObjectId(employeeId) }).lean();
  if (!wallet) return [];
  return (wallet.transactions || []).slice(-limit).reverse().map((t: any) => ({
    id: t._id?.toString() || "",
    type: t.type,
    amount: t.amount,
    salesRecordId: t.salesRecordId?.toString() || "",
    description: t.description,
    balanceAfter: t.balanceAfter,
    createdAt: t.createdAt,
  }));
}
