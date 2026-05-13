/**
 * Zod validation schemas for approval API endpoints
 * Ensures all inputs are validated before processing
 */

import { z } from "zod";

// Manager approval/rejection validation
export const managerActionSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sale record ID format"),
  action: z.enum(["approve", "reject"]),
  reason: z.string().optional(),
  employeeId: z.string().optional(),
  companyName: z.string().optional(),
}).refine(
  (data) => data.action === "approve" || (data.action === "reject" && data.reason && data.reason.trim().length > 0),
  {
    message: "Rejection reason is required when rejecting a sale",
    path: ["reason"],
  }
);

// Accountant processing validation
export const accountantProcessSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sale record ID format"),
  eoBpAmount: z.number().min(0, "EO/BP amount cannot be negative").optional(),
  eoBpReason: z.string().max(500, "EO/BP reason must be less than 500 characters").optional(),
  taxRate: z.number().min(0, "Tax rate cannot be negative").max(100, "Tax rate cannot exceed 100%").optional(),
  vatRate: z.number().min(0, "VAT rate cannot be negative").max(100, "VAT rate cannot exceed 100%").optional(),
  managerId: z.string().optional(),
  companyName: z.string().optional(),
}).refine(
  (data) => {
    // If eoBpAmount is provided, eoBpReason must also be provided
    if (data.eoBpAmount && data.eoBpAmount > 0) {
      return data.eoBpReason && data.eoBpReason.trim().length > 0;
    }
    return true;
  },
  {
    message: "EO/BP reason is required when EO/BP amount is greater than 0",
    path: ["eoBpReason"],
  }
);

// Finance approval validation
export const financeApprovalSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sale record ID format"),
  paidBy: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format for paidBy field"),
  employeeId: z.string().optional(),
  managerId: z.string().optional(),
  companyName: z.string().optional(),
  commission: z.number().optional(),
});
