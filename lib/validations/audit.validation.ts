/**
 * Zod validation schemas for audit log API endpoints
 * Provides defense-in-depth validation at the API level
 */

import { z } from "zod";
import { objectIdSchema } from "./common";

// Create audit log API schema
export const createAuditLogApiSchema = z.object({
  userId: objectIdSchema.optional(),
  userEmail: z.string().email("Invalid email format").optional(),
  userRole: z.string().min(1, "User role is required").optional(),
  action: z.string().min(1, "Action is required").max(100, "Action is too long"),
  entity: z.string().min(1, "Entity is required").max(100, "Entity is too long"),
  entityId: z.string().optional(),
  details: z.record(z.any(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().max(500, "User agent is too long").optional(),
});

// Query parameters for audit logs
// NoSQL injection prevention: string fields are validated to not contain MongoDB operators
const noSqlSafeString = z.string().refine(
  (val) => !val.startsWith('$'),
  { message: "Invalid characters" }
);

export const auditLogQuerySchema = z.object({
  userId: objectIdSchema.optional(),
  action: noSqlSafeString.optional(),
  entity: noSqlSafeString.optional(),
  limit: z.coerce.number().int().positive().max(500).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
});
