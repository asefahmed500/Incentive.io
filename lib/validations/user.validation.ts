import { z } from "zod";
import { objectIdSchema, optionalObjectIdSchema } from "./common";

// User role enum
const userRoleEnum = z.enum(["administrator", "admin", "salesManager", "salesExecutive", "accountant", "finance"]);

// Password requirements: 12+ chars with uppercase, lowercase, number, special character
const passwordSchema = z.string()
  .min(12, "Password must be at least 12 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Create user API schema (for /api/users POST)
export const createUserApiSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  role: userRoleEnum.default("salesExecutive"),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  teamId: optionalObjectIdSchema,
  managerId: optionalObjectIdSchema,
  targetAmount: z.number().min(0, "Target amount must be positive").optional(),
  targetPeriod: z.string().optional(),
});

// Update user API schema (for /api/users/[id] PATCH)
export const updateUserApiSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  password: passwordSchema.optional(),
  role: userRoleEnum.optional(),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  teamId: optionalObjectIdSchema,
  managerId: optionalObjectIdSchema,
  targetAmount: z.number().min(0).optional(),
  targetPeriod: z.string().optional(),
  previousTargetAmount: z.number().min(0).optional(),
});

// Change password schema
export const changePasswordApiSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

// Reset password schema (for admin/forgot password)
export const resetPasswordApiSchema = z.object({
  password: passwordSchema,
  token: z.string().min(1, "Reset token is required"),
});

// User query parameters schema
export const userQuerySchema = z.object({
  search: z.string().optional(),
  role: z.enum(["administrator", "admin", "salesManager", "salesExecutive", "accountant", "finance", "all"]).optional(),
  teamId: optionalObjectIdSchema,
  managerId: optionalObjectIdSchema,
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// Bulk user action schema (activate/deactivate/delete)
export const bulkUserActionSchema = z.object({
  userIds: z.array(objectIdSchema).min(1, "At least one user ID is required"),
  action: z.enum(["activate", "deactivate", "delete"]),
});

// Assign manager schema
export const assignManagerSchema = z.object({
  employeeIds: z.array(objectIdSchema).min(1, "At least one employee ID is required"),
  managerId: objectIdSchema,
});

// Set target schema
export const setTargetApiSchema = z.object({
  userId: objectIdSchema,
  targetAmount: z.number().min(0, "Target amount must be positive"),
  targetPeriod: z.string().optional(),
});

// Remove target schema
export const removeTargetApiSchema = z.object({
  userId: objectIdSchema,
});
