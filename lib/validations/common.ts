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
  search: z.string().max(100, "Search term is too long").optional(),
});

export const idParamSchema = z.object({
  id: objectIdSchema,
});
