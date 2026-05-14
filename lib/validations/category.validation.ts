/**
 * Zod validation schemas for category API endpoints
 * Provides defense-in-depth validation at the API level
 */

import { z } from "zod";

// Create category API schema
export const createCategoryApiSchema = z.object({
  name: z.string().min(1, "Category name is required").max(200, "Category name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
});

// Update category API schema
export const updateCategoryApiSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
});
