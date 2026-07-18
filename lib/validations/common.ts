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
 * Rate/percentage validation
 * For commission rates, tax rates, etc.
 */
export const rateSchema = z.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%");
