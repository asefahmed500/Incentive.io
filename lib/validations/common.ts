/**
 * Common validation schemas shared across all API endpoints
 * Prevents duplication and ensures consistency
 */

import { z } from "zod";

/**
 * Standard MongoDB ObjectId validation schema
 * Use this for all ObjectId fields to ensure consistency
 */
export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

/**
 * Optional ObjectId field
 */
export const optionalObjectIdSchema = objectIdSchema.optional();

/**
 * Array of ObjectIds
 */
export const objectIdArraySchema = z.array(objectIdSchema);

/**
 * Common query parameter schemas
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const searchQuerySchema = z.object({
  search: z.string().max(100, "Search term is too long").refine(val => !val || !val.startsWith('$'), "Invalid search term").optional(),
});

export const idParamSchema = z.object({
  id: objectIdSchema,
});

/**
 * Date validation schemas
 * Ensures consistent date format validation across the application
 */
export const dateSchema = z.string().refine(
  (date) => !isNaN(Date.parse(date)),
  { message: "Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)" }
);

export const optionalDateSchema = dateSchema.optional();

/**
 * ISO 8601 date string validation (strict format)
 */
export const isoDateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
  { message: "Invalid ISO 8601 date format" }
);

/**
 * Monetary value validation schemas
 * Prevents precision errors and invalid amounts
 */
export const moneySchema = z.number().min(0, "Amount cannot be negative").finite("Amount must be a valid number");

export const positiveMoneySchema = z.number().positive("Amount must be positive").finite("Amount must be a valid number");

export const optionalMoneySchema = moneySchema.optional();

/**
 * Maximum amount validation for large transactions
 * Prevents overflow issues
 */
export const maxAmountSchema = z.number().max(1000000000, "Amount cannot exceed 1,000,000,000");

/**
 * Rate/percentage validation
 * For commission rates, tax rates, etc.
 */
export const rateSchema = z.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%");

export const optionalRateSchema = rateSchema.optional();

/**
 * Email validation with additional security checks
 * Prevents NoSQL injection via email fields
 */
export const secureEmailSchema = z.string().email("Invalid email format").refine(
  (email) => !email.startsWith("$") && !email.includes("{") && !email.includes("}"),
  { message: "Invalid characters in email" }
);
