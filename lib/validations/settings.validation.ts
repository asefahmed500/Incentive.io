/**
 * Zod validation schemas for settings API endpoints
 * Provides defense-in-depth validation at the API level
 */

import { z } from "zod";

// Valid setting keys (default settings)
const VALID_SETTING_KEYS = [
  "companyName",
  "currencySymbol",
  "dateFormat",
  "defaultCommissionRate",
  "eligibilityThreshold",
  "sessionTimeout",
  "emailNotifications",
  "inAppNotifications",
] as const;

// Setting value schema (supports different types)
const settingValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

// Update single setting schema
export const updateSettingSchema = z.object({
  key: z.string().min(1).max(100).refine((key) => {
    return VALID_SETTING_KEYS.includes(key as any) || key.startsWith("custom_");
  }, { message: "Invalid setting key. Must be a known setting or start with 'custom_'" }),
  value: settingValueSchema,
});

// Batch update settings schema
export const updateSettingsSchema = z.record(z.string().min(1), settingValueSchema);

// Query parameters for settings (no params needed currently)
export const settingsQuerySchema = z.object({
  // No query parameters for settings GET
});
