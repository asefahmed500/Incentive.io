/**
 * Zod validation schemas for sales API endpoints
 */

import { z } from "zod";

// Product validation
export const productSchema = z.object({
  productName: z.string().min(1, "Product name is required").max(200, "Product name is too long"),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid category ID format"),
  unitPrice: z.number().positive("Unit price must be positive").max(1000000000, "Unit price cannot exceed 1,000,000,000").finite("Unit price must be a valid number"),
  originalPrice: z.number().min(0, "Original price must be non-negative").optional(),
  quantity: z.number().int("Quantity must be a whole number").positive("Quantity must be positive").max(10000, "Quantity cannot exceed 10,000").finite("Quantity must be a valid number"),
  dealNotes: z.string().max(1000, "Deal notes are too long").optional(),
});

// Submit action validation
export const submitActionSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sale record ID format"),
  action: z.literal("submit"),
});

// Create sales record validation (same as server action for API-level validation)
export const createSalesRecordApiSchema = z.object({
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid employee ID format").optional(),
  employeeName: z.string().min(1, "Employee name is required").max(200, "Employee name is too long"),
  companyName: z.string().min(1, "Company name is required").max(500, "Company name is too long"),
  companyEmail: z.string().email("Invalid company email format").max(200, "Email is too long"),
  products: z.array(productSchema).min(1, "At least one product is required").max(20, "Cannot add more than 20 products at once"),
  taxEnabled: z.boolean().optional(),
  vatEnabled: z.boolean().optional(),
  proofOfSale: z.array(z.string()).optional(),
});

// Delete action validation
export const deleteSalesRecordSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sale record ID format"),
});

// Query parameter validation for GET requests
export const salesQuerySchema = z.object({
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid employee ID format").optional(),
  status: z.enum(["Draft", "Pending_Manager", "Pending_Accountant", "Pending_Finance", "Approved", "Rejected"]).optional(),
  search: z.string().max(100, "Search term is too long").refine(val => !val.startsWith('$'), "Invalid search term").optional(),
});
