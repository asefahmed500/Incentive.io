"use server";

import { auth } from "@/lib/auth/auth";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { Wallet } from "@/lib/models/Wallet";
import mongoose, { ClientSession } from "mongoose";
import type { AuthUser, UserRole } from "@/types";
import { logAudit } from "@/lib/actions/audit.actions";

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
  const userRole = (session.user as AuthUser).role;
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
  const userRole = (session.user as AuthUser).role;
  if (employeeId !== userId && !["admin", "administrator", "finance"].includes(userRole)) {
    return { error: "Forbidden: You can only access your own wallet" };
  }
  const parsed = getOrCreateWalletSchema.safeParse(employeeId);
  if (!parsed.success) return null;
  await connectToDatabase();
  const wallet = await Wallet.findOneAndUpdate(
    { employeeId: toObjectId(parsed.data) },
    { $setOnInsert: { balance: 0, pendingBalance: 0, totalEarned: 0, totalPaid: 0, transactions: [] } },
    { upsert: true, returnDocument: "after" }
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
  const userRole = (session.user as AuthUser).role;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = creditWalletSchema.safeParse({ employeeId, amount, salesRecordId, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.amount === 0) return { success: true, newBalance: 0 };

  await connectToDatabase();

  const empOid = toObjectId(parsed.data.employeeId);

  // Try transaction first, fall back to non-transactional for local MongoDB
  try {
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      const wallet = await Wallet.findOneAndUpdate(
        { employeeId: empOid },
        {
          $inc: { balance: parsed.data.amount, totalEarned: parsed.data.amount, pendingBalance: parsed.data.amount },
          $setOnInsert: { transactions: [] },
        },
        { upsert: true, returnDocument: "after", session: dbSession }
      );

      if (!wallet) {
        await dbSession.abortTransaction();
        return { error: "Failed to create or update wallet" };
      }

      const balanceAfter = wallet.balance + parsed.data.amount;

      await Wallet.findByIdAndUpdate(
        wallet._id,
        {
          $push: {
            transactions: {
              type: "credit",
              amount: parsed.data.amount,
              salesRecordId: parsed.data.salesRecordId ? toObjectId(parsed.data.salesRecordId) : undefined,
              description: parsed.data.description,
              balanceAfter,
              createdAt: new Date(),
            },
          },
        },
        { session: dbSession }
      );

      await dbSession.commitTransaction();

      // Audit logging for wallet credit
      await logAudit({
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        userRole,
        action: "wallet.credit",
        entity: "Wallet",
        entityId: empOid.toString(),
        details: {
          amount: parsed.data.amount,
          balanceAfter,
          description: parsed.data.description,
          salesRecordId: parsed.data.salesRecordId,
        },
      });

      return { success: true, newBalance: balanceAfter };
    } catch (error) {
      await dbSession.abortTransaction();
      throw error;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    // Check if it's a transaction error (local MongoDB doesn't support transactions)
    const errorMessage = error instanceof Error ? error.message : "";
    if (errorMessage.includes("retryable writes") || errorMessage.includes("replica set") || errorMessage.includes("Transaction numbers")) {
      // Fall back to non-transactional operation
      const wallet = await Wallet.findOneAndUpdate(
        { employeeId: empOid },
        {
          $inc: { balance: parsed.data.amount, totalEarned: parsed.data.amount, pendingBalance: parsed.data.amount },
          $setOnInsert: { transactions: [] },
        },
        { upsert: true, returnDocument: "after" }
      );

      if (!wallet) {
        return { error: "Failed to create or update wallet" };
      }

      const balanceAfter = wallet.balance + parsed.data.amount;

      await Wallet.findByIdAndUpdate(
        wallet._id,
        {
          $push: {
            transactions: {
              type: "credit",
              amount: parsed.data.amount,
              salesRecordId: parsed.data.salesRecordId ? toObjectId(parsed.data.salesRecordId) : undefined,
              description: parsed.data.description,
              balanceAfter,
              createdAt: new Date(),
            },
          },
        },
      );

      // Audit logging for wallet credit (fallback path)
      await logAudit({
        userId: session.user.id,
        userEmail: session.user.email || undefined,
        userRole,
        action: "wallet.credit",
        entity: "Wallet",
        entityId: empOid.toString(),
        details: {
          amount: parsed.data.amount,
          balanceAfter,
          description: parsed.data.description,
          salesRecordId: parsed.data.salesRecordId,
          fallback: true,
        },
      });

      return { success: true, newBalance: balanceAfter };
    }

    return { error: "Transaction failed: " + errorMessage };
  }
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
  const userRole = (session.user as AuthUser).role;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = debitWalletSchema.safeParse({ employeeId, amount, salesRecordId, description });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.amount === 0) return { success: true, newBalance: 0 };

  await connectToDatabase();

  const empOid = toObjectId(parsed.data.employeeId);

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const wallet = await Wallet.findOneAndUpdate(
      { employeeId: empOid, balance: { $gte: parsed.data.amount } },
      { $inc: { balance: -parsed.data.amount, totalPaid: parsed.data.amount, pendingBalance: -parsed.data.amount } },
      { returnDocument: "after", session: dbSession }
    );

    if (!wallet) {
      await dbSession.abortTransaction();
      return { error: "Insufficient balance or wallet not found" };
    }

    const balanceAfter = wallet.balance;

    await Wallet.findByIdAndUpdate(
      wallet._id,
      {
        $push: {
          transactions: {
            type: "debit",
            amount: parsed.data.amount,
            salesRecordId: parsed.data.salesRecordId ? toObjectId(parsed.data.salesRecordId) : undefined,
            description: parsed.data.description,
            balanceAfter,
            createdAt: new Date(),
          },
        },
      },
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    // Audit logging for wallet debit
    await logAudit({
      userId: session.user.id,
      userEmail: session.user.email || undefined,
      userRole,
      action: "wallet.debit",
      entity: "Wallet",
      entityId: empOid.toString(),
      details: {
        amount: parsed.data.amount,
        balanceAfter,
        description: parsed.data.description,
        salesRecordId: parsed.data.salesRecordId,
      },
    });

    return { success: true, newBalance: balanceAfter };
  } catch (error) {
    await dbSession.abortTransaction();
    return { error: "Transaction failed: " + (error instanceof Error ? error.message : "Unknown error") };
  } finally {
    dbSession.endSession();
  }
}

// Internal function that accepts an external session for transaction consistency
async function _markCommissionPaidWithSession(
  employeeId: string,
  amount: number,
  salesRecordId: string,
  externalSession?: ClientSession
) {
  const empOid = toObjectId(employeeId);
  const srOid = toObjectId(salesRecordId);

  // Validate amount is not negative
  if (amount < 0) {
    return { error: "Commission amount cannot be negative" };
  }

  const useOwnSession = !externalSession;
  const dbSession = externalSession || await mongoose.startSession();

  if (useOwnSession) dbSession.startTransaction();

  try {
    const existingCredit = await Wallet.exists({
      employeeId: empOid,
      "transactions.salesRecordId": srOid,
      "transactions.type": "credit",
    }).session(dbSession);

    if (existingCredit) {
      if (useOwnSession) await dbSession.abortTransaction();
      return { error: "Commission already paid for this sale" };
    }

    const wallet = await Wallet.findOneAndUpdate(
      { employeeId: empOid },
      {
        $inc: { balance: amount, totalPaid: amount, pendingBalance: -amount },
        $setOnInsert: { transactions: [] },
      },
      { upsert: true, returnDocument: "after", session: dbSession }
    );

    if (!wallet) {
      if (useOwnSession) await dbSession.abortTransaction();
      return { error: "Failed to create or update wallet" };
    }

    const balanceAfter = wallet.balance + amount;

    await Wallet.findByIdAndUpdate(
      wallet._id,
      {
        $push: {
          transactions: {
            type: "credit",
            amount: amount,
            salesRecordId: srOid,
            description: "Commission paid for sale",
            balanceAfter,
            createdAt: new Date(),
          },
        },
      },
      { session: dbSession }
    );

    if (useOwnSession) await dbSession.commitTransaction();
    return { success: true, newBalance: balanceAfter, usedSession: dbSession };
  } catch (error) {
    if (useOwnSession) {
      await dbSession.abortTransaction();

      // Check if it's a transaction error (local MongoDB doesn't support transactions)
      const errorMessage = error instanceof Error ? error.message : "";
      if (errorMessage.includes("retryable writes") || errorMessage.includes("replica set") || errorMessage.includes("Transaction numbers")) {
        // Fall back to non-transactional operation
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
            $inc: { balance: amount, totalPaid: amount, pendingBalance: -amount },
            $setOnInsert: { transactions: [] },
          },
          { upsert: true, returnDocument: "after" }
        );

        if (!wallet) {
          return { error: "Failed to create or update wallet" };
        }

        const balanceAfter = wallet.balance + amount;

        await Wallet.findByIdAndUpdate(
          wallet._id,
          {
            $push: {
              transactions: {
                type: "credit",
                amount: amount,
                salesRecordId: srOid,
                description: "Commission paid for sale",
                balanceAfter,
                createdAt: new Date(),
              },
            },
          },
        );

        return { success: true, newBalance: balanceAfter };
      }

      return { error: "Transaction failed: " + errorMessage };
    }
    return { error: "Transaction failed: " + (error instanceof Error ? error.message : "Unknown error") };
  } finally {
    if (useOwnSession) dbSession.endSession();
  }
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
  const userRole = (session.user as AuthUser).role;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  const parsed = markCommissionPaidSchema.safeParse({ employeeId, amount, salesRecordId, paidBy });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  if (parsed.data.amount === 0) return { success: true, newBalance: 0 };

  await connectToDatabase();

  return await _markCommissionPaidWithSession(
    parsed.data.employeeId,
    parsed.data.amount,
    parsed.data.salesRecordId
  );
}

// Export the internal function for use in transactions
export { _markCommissionPaidWithSession };

export async function getAllWallets() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userRole = (session.user as AuthUser).role;
  if (!["finance", "admin", "administrator"].includes(userRole)) return { error: "Forbidden: Insufficient permissions" };
  await connectToDatabase();
  const wallets = await Wallet.find().populate("employeeId", "name email role").lean();
  return wallets.map((w: any) => ({
    id: w._id.toString(),
    employeeId: w.employeeId?._id?.toString() || "",
    employeeName: w.employeeId?.name || "Unknown",
    employeeEmail: w.employeeId?.email || "",
    balance: w.balance,
    pendingBalance: w.pendingBalance,
    totalEarned: w.totalEarned,
    totalPaid: w.totalPaid,
    transactionCount: Array.isArray(w.transactions) ? w.transactions.length : 0,
  }));
}

export async function getWalletTransactions(employeeId: string, limit = 50) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const userId = session.user.id as string;
  const userRole = (session.user as AuthUser).role;
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