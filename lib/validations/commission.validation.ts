/**
 * Zod validation schemas for commission API endpoints
 */

import { z } from "zod";

// Create commission rule validation
export const createCommissionRuleSchema = z.object({
  targetPercentageFrom: z.number().min(0).nonnegative("Target percentage from must be non-negative").finite("Target percentage from must be a valid number"),
  targetPercentageTo: z.number().max(999).nonnegative("Target percentage to must be non-negative").finite("Target percentage to must be a valid number"),
  commissionRate: z.number().min(0).max(100).nonnegative("Commission rate must be between 0 and 100").finite("Commission rate must be a valid number"),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid category ID format").optional(),
  priority: z.number().int("Priority must be a whole number").positive("Priority must be positive").finite("Priority must be a valid number"),
  isActive: z.boolean().optional(),
});

// Update commission rule validation
export const updateCommissionRuleSchema = z.object({
  targetPercentageFrom: z.number().min(0).nonnegative("Target percentage from must be non-negative").finite("Target percentage from must be a valid number").optional(),
  targetPercentageTo: z.number().max(999).nonnegative("Target percentage to must be non-negative").finite("Target percentage to must be a valid number").optional(),
  commissionRate: z.number().min(0).max(100).nonnegative("Commission rate must be between 0 and 100").finite("Commission rate must be a valid number").optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid category ID format").optional(),
  priority: z.number().int("Priority must be a whole number").positive("Priority must be positive").finite("Priority must be a valid number").optional(),
  isActive: z.boolean().optional(),
});

// Delete commission rule validation
export const deleteCommissionRuleSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid commission rule ID format");
