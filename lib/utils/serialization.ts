/**
 * Serialization utilities for consistent data transformation between MongoDB and client
 * These utilities handle ObjectId conversion, populated field serialization, and client-safe data formatting
 */

import type { ObjectId } from "mongoose";

/**
 * Safely converts an ObjectId or string to a string
 * Handles both ObjectId instances and strings (already converted)
 */
export function serializeId(id: ObjectId | string | undefined | null): string {
  if (!id) return "";
  // Handle ObjectId with toString method
  if (typeof id === "object" && "toString" in id && typeof id.toString === "function") {
    return id.toString();
  }
  // Handle plain strings
  if (typeof id === "string") {
    return id;
  }
  return "";
}

/**
 * Serializes a populated field (ObjectId or populated object)
 * Returns the string ID if populated, or empty string if not
 */
export function serializePopulatedId(
  field: ObjectId | string | { _id: ObjectId | string } | undefined | null
): string {
  if (!field) return "";
  // Handle populated object with _id
  if (typeof field === "object" && "_id" in field && field._id) {
    return serializeId(field._id);
  }
  // Handle direct ObjectId or string
  return serializeId(field as ObjectId | string);
}

/**
 * Serializes a populated field and extracts a named property if populated
 * Returns the property value if populated, or undefined if not
 */
export function serializePopulatedField<T extends string>(
  field: ObjectId | string | { _id: ObjectId | string; [key: string]: unknown } | undefined | null,
  propertyName: T
): string | undefined {
  if (!field || typeof field !== "object" || !("_id" in field)) {
    return undefined;
  }
  const value = (field as Record<string, unknown>)[propertyName];
  return typeof value === "string" ? value : undefined;
}

/**
 * Transforms an entire document for client consumption
 * Converts all ObjectId fields to strings and handles populated fields
 */
export function serializeDocument<T extends Record<string, unknown>>(
  doc: T & { _id: ObjectId }
): Omit<T, "_id"> & { id: string } {
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as Omit<T, "_id"> & { id: string };
}

/**
 * Transforms an array of documents for client consumption
 */
export function serializeDocuments<T extends Record<string, unknown>>(
  docs: Array<T & { _id: ObjectId }>
): Array<Omit<T, "_id"> & { id: string }> {
  return docs.map(serializeDocument);
}

/**
 * Safely serializes transaction data with salesRecordId handling
 */
export function serializeTransaction(transaction: {
  salesRecordId?: ObjectId | string | { _id: ObjectId | string };
  [key: string]: unknown;
}): { salesRecordId?: string; [key: string]: unknown } {
  const { salesRecordId, ...rest } = transaction;
  const result: { salesRecordId?: string; [key: string]: unknown } = { ...rest };
  if (salesRecordId) {
    result.salesRecordId = serializePopulatedId(salesRecordId);
  }
  return result;
}

/**
 * Product serialization helper
 * Handles categoryId transformation (ObjectId or populated Category object)
 */
export function serializeProduct(product: {
  _id: ObjectId;
  categoryId: ObjectId | string | { _id: ObjectId | string; name?: string };
  [key: string]: unknown;
}): {
  id: string;
  categoryId: string;
  categoryName: string | undefined;
  [key: string]: unknown;
} {
  return {
    ...product,
    id: product._id.toString(),
    categoryId: serializePopulatedId(product.categoryId),
    categoryName: serializePopulatedField(product.categoryId, "name"),
  };
}

/**
 * User serialization helper
 * Handles teamId and managerId transformations
 */
export function serializeUser(user: {
  _id: ObjectId;
  teamId?: ObjectId | string | { _id: ObjectId | string; name?: string };
  managerId?: ObjectId | string | { _id: ObjectId | string; name?: string };
  [key: string]: unknown;
}): {
  id: string;
  teamId?: string;
  managerId?: string;
  teamName?: string;
  managerName?: string;
  [key: string]: unknown;
} {
  return {
    ...user,
    id: user._id.toString(),
    teamId: user.teamId ? serializePopulatedId(user.teamId) : undefined,
    managerId: user.managerId ? serializePopulatedId(user.managerId) : undefined,
    teamName: user.teamId ? serializePopulatedField(user.teamId, "name") : undefined,
    managerName: user.managerId ? serializePopulatedField(user.managerId, "name") : undefined,
  };
}

/**
 * Type guard to check if a value is a populated object (has _id property)
 */
export function isPopulatedObject(value: unknown): value is { _id: ObjectId | string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "_id" in value &&
    (typeof value._id === "string" || (typeof value._id === "object" && value._id !== null))
  );
}

/**
 * Generic serialization for any Mongoose document
 * Use this when specific serializers aren't available
 */
export function serializeForClient<T extends Record<string, unknown>>(
  data: T
): T {
  // Handle null/undefined
  if (!data) return data;

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) =>
      item && typeof item === "object" && "_id" in item
        ? { ...item, id: (item._id as ObjectId).toString(), _id: undefined }
        : item
    ) as unknown as T;
  }

  // Handle single documents with _id
  if (typeof data === "object" && "_id" in data && data._id) {
    const { _id, ...rest } = data;
    return { ...rest, id: (data._id as ObjectId).toString() } as unknown as T;
  }

  return data;
}
