/**
 * Runtime type guard utilities for type-safe data checking
 * These functions help ensure data integrity at runtime without sacrificing type safety
 */

import type { UserRole, SaleStatus, ApprovalStatus, TransactionType } from "@/types";

/**
 * Type guard to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard to check if a value is a positive number
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value) && value > 0;
}

/**
 * Type guard to check if a value is a non-negative number
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value) && value >= 0;
}

/**
 * Type guard to check if a value is a valid UserRole
 */
export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    ["admin", "administrator", "salesManager", "salesExecutive", "accountant", "finance"].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid SaleStatus
 */
export function isSaleStatus(value: unknown): value is SaleStatus {
  return (
    typeof value === "string" &&
    ["Draft", "Pending_Manager", "Pending_Accountant", "Pending_Finance", "Approved", "Rejected"].includes(
      value
    )
  );
}

/**
 * Type guard to check if a value is a valid ApprovalStatus
 */
export function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return typeof value === "string" && ["Pending", "Approved", "Rejected"].includes(value);
}

/**
 * Type guard to check if a value is a valid TransactionType
 */
export function isTransactionType(value: unknown): value is TransactionType {
  return typeof value === "string" && ["credit", "debit"].includes(value);
}

/**
 * Type guard to check if a value is a valid ISO 8601 date string
 */
export function isIsoDateString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
  return isoDateRegex.test(value) && !isNaN(Date.parse(value));
}

/**
 * Type guard to check if a value is a valid MongoDB ObjectId string
 */
export function isObjectIdString(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends string>(
  obj: unknown,
  property: T
): obj is Record<T, unknown> & Record<string, unknown> {
  return typeof obj === "object" && obj !== null && property in obj;
}

/**
 * Type guard to check if an object is an ActionResult (success or error)
 */
export function isActionResult(value: unknown): value is { success?: boolean; error?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    ("success" in value || "error" in value)
  );
}

/**
 * Type guard to check if an ActionResult is successful
 */
export function isActionSuccess<T>(
  value: unknown
): value is { success: true; data?: T; id?: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === true
  );
}

/**
 * Type guard to check if an ActionResult is an error
 */
export function isActionError(value: unknown): value is { success: false; error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "success" in value &&
    value.success === false &&
    "error" in value &&
    typeof value.error === "string"
  );
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if a value is a non-empty array
 */
export function isNonEmptyArray<T>(value: unknown): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

/**
 * Type guard to check if a value is a plain object (not null, not array)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Type guard for wallet transaction data
 */
export function isWalletTransaction(value: unknown): value is {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  balanceAfter: number;
  createdAt: Date;
} {
  if (!isPlainObject(value)) return false;
  return (
    isNonEmptyString(value.id) &&
    isTransactionType(value.type) &&
    isNonNegativeNumber(value.amount) &&
    isNonEmptyString(value.description) &&
    isNonNegativeNumber(value.balanceAfter)
  );
}

/**
 * Type guard for sale product data
 */
export function isSaleProduct(value: unknown): value is {
  productName: string;
  categoryId: string;
  unitPrice: number;
  quantity: number;
} {
  if (!isPlainObject(value)) return false;
  return (
    isNonEmptyString(value.productName) &&
    isObjectIdString(value.categoryId) &&
    isPositiveNumber(value.unitPrice) &&
    isPositiveNumber(value.quantity)
  );
}

/**
 * Asserts that a value is defined at runtime
 * Throws an error if the value is null or undefined
 */
export function assertDefined<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value was null or undefined");
  }
}

/**
 * Asserts that a value is of a specific type at runtime
 * Throws an error if the type guard fails
 */
export function assertType<T>(
  value: unknown,
  guard: (v: unknown) => v is T,
  message?: string
): asserts value is T {
  if (!guard(value)) {
    throw new Error(message || `Type assertion failed: value did not match expected type`);
  }
}

/**
 * Safe type casting with fallback
 * Returns the fallback value if the type guard fails
 */
export function castOrDefault<T>(value: unknown, guard: (v: unknown) => v is T, fallback: T): T {
  return guard(value) ? value : fallback;
}

/**
 * Null-safe array access
 * Returns empty array if value is not an array
 */
export function asArray<T>(value: unknown): T[] {
  return isArray(value) ? (value as T[]) : [];
}

/**
 * Null-safe object access
 * Returns empty object if value is not a plain object
 */
export function asObject(value: unknown): Record<string, unknown> {
  return isPlainObject(value) ? value : {};
}
