/**
 * Zod validation schemas for notification API endpoints
 * Provides defense-in-depth validation at the API level
 */

import { z } from "zod";
import { objectIdSchema } from "./common";

// Query parameters for notifications
export const notificationQuerySchema = z.object({
  userId: objectIdSchema,
  action: z.enum(["unread-count"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Mark notification as read schema
export const markAsReadSchema = z.object({
  id: objectIdSchema,
  userId: objectIdSchema.optional(),
  action: z.string().optional(),
});

// Mark all as read schema
export const markAllAsReadSchema = z.object({
  userId: objectIdSchema,
  action: z.literal("mark-all-read"),
});
