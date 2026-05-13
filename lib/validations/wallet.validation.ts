/**
 * Zod validation schemas for wallet API endpoints
 */

import { z } from "zod";

// Credit wallet validation
export const creditWalletSchema = z.object({
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid employee ID format"),
  amount: z.number().positive("Amount must be positive").finite("Amount must be a valid number"),
  salesRecordId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sales record ID format").optional(),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
});

// Debit wallet validation
export const debitWalletSchema = z.object({
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid employee ID format"),
  amount: z.number().positive("Amount must be positive").finite("Amount must be a valid number"),
  salesRecordId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sales record ID format").optional(),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
});

// Wallet operation validation (for API endpoint that supports both)
export const walletOperationSchema = z.object({
  operation: z.enum(["credit", "debit"]),
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid employee ID format"),
  amount: z.number().positive("Amount must be positive").finite("Amount must be a valid number"),
  salesRecordId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sales record ID format").optional(),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
});

// Get wallet validation
export const getWalletSchema = z.object({
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid employee ID format"),
});
