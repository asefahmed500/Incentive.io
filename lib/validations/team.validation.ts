/**
 * Zod validation schemas for team API endpoints
 * Provides defense-in-depth validation at the API level
 */

import { z } from "zod";
import { objectIdSchema } from "./common";

// Create team API schema
export const createTeamApiSchema = z.object({
  name: z.string().min(1, "Team name is required").max(200, "Team name is too long"),
  managerId: objectIdSchema,
});

// Update team API schema
export const updateTeamApiSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  managerId: objectIdSchema.optional(),
});
