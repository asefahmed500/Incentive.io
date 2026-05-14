/**
 * Zod validation schemas for target API endpoints
 */

import { z } from "zod";

// Set/assign target validation
export const setTargetSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
  targetAmount: z.number().positive("Target amount must be positive").max(10000000000, "Target amount cannot exceed 10,000,000,000").finite("Target amount must be a valid number"),
  period: z.string().optional(),
});

// Update target validation (same as set target)
export const updateTargetSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
  targetAmount: z.number().positive("Target amount must be positive").max(10000000000, "Target amount cannot exceed 10,000,000,000").finite("Target amount must be a valid number").optional(),
  period: z.string().optional(),
});

// Remove target validation
export const removeTargetSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
});
