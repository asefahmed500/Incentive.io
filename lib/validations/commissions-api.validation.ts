/**
 * Zod validation schemas for commissions API endpoints
 * Provides defense-in-depth validation at the API level
 */

import { z } from "zod";
import { objectIdSchema } from "./common";

// Query parameters for commissions
export const commissionsQuerySchema = z.object({
  employeeId: objectIdSchema.optional(),
  action: z.enum(["check-eligibility"]).optional(),
});
