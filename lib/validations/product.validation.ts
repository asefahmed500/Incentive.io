/**
 * Zod validation schemas for product API endpoints
 * Provides defense-in-depth validation at the API level
 */

import { z } from "zod";
import { objectIdSchema } from "./common";

// Product query parameters schema
export const productQuerySchema = z.object({
  categoryId: objectIdSchema.optional(),
  search: z.string().max(100, "Search term is too long").optional(),
});

// Create product API schema
export const createProductApiSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200, "Product name is too long"),
  sku: z.string().min(1, "SKU is required").max(100, "SKU is too long"),
  categoryId: objectIdSchema,
  price: z.number().min(0, "Price must be non-negative").finite("Price must be a valid number"),
  stock: z.number().int().min(0, "Stock must be non-negative").optional(),
  image: z.string().max(500, "Image URL is too long").optional(),
});

// Update product API schema
export const updateProductApiSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().min(1).max(100).optional(),
  categoryId: objectIdSchema.optional(),
  price: z.number().min(0).finite().optional(),
  stock: z.number().int().min(0).optional(),
  image: z.string().max(500).optional(),
});

// Delete product schema
export const deleteProductSchema = z.object({
  id: objectIdSchema,
});
