/**
 * Standardized API error handling
 * Provides consistent error responses across all API endpoints
 */

import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Predefined error codes for common scenarios
 */
export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Resources
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",

  // Business Logic
  OPERATION_NOT_ALLOWED: "OPERATION_NOT_ALLOWED",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  INVALID_STATE: "INVALID_STATE",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",

  // Server Errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Standard error response structure
 */
interface ErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Handle errors and return standardized NextResponse
 */
export function handleError(error: unknown, context?: { requestId?: string }): NextResponse {
  console.error("API Error:", error);

  // ApiError instances
  if (error instanceof ApiError) {
    const response: ErrorResponse = {
      error: error.message,
      requestId: context?.requestId,
    };

    if (error.code) {
      response.code = error.code;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Zod validation errors
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ message: string; path?: Array<string | number> }> };
    return NextResponse.json(
      {
        error: "Validation failed",
        code: ErrorCodes.VALIDATION_ERROR,
        details: zodError.issues.map((issue) => ({
          field: issue.path?.join(".") || "unknown",
          message: issue.message,
        })),
        requestId: context?.requestId,
      },
      { status: 400 }
    );
  }

  // Mongoose duplicate key error
  if (error && typeof error === "object" && "code" in error && error.code === 11000) {
    return NextResponse.json(
      {
        error: "A record with this information already exists",
        code: ErrorCodes.ALREADY_EXISTS,
        requestId: context?.requestId,
      },
      { status: 409 }
    );
  }

  // Mongoose validation error
  if (error && typeof error === "object" && "name" in error && error.name === "ValidationError") {
    return NextResponse.json(
      {
        error: "Database validation failed",
        code: ErrorCodes.VALIDATION_ERROR,
        requestId: context?.requestId,
      },
      { status: 400 }
    );
  }

  // Generic Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message || "An unexpected error occurred",
        code: ErrorCodes.INTERNAL_ERROR,
        requestId: context?.requestId,
      },
      { status: 500 }
    );
  }

  // Unknown error types
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: ErrorCodes.INTERNAL_ERROR,
      requestId: context?.requestId,
    },
    { status: 500 }
  );
}

/**
 * Helper functions for common error responses
 */
export const errorResponses = {
  unauthorized: (message = "Unauthorized") => {
    throw new ApiError(401, message, ErrorCodes.UNAUTHORIZED);
  },

  forbidden: (message = "Forbidden: Insufficient permissions") => {
    throw new ApiError(403, message, ErrorCodes.FORBIDDEN);
  },

  notFound: (resource = "Resource") => {
    throw new ApiError(404, `${resource} not found`, ErrorCodes.NOT_FOUND);
  },

  badRequest: (message: string, code = ErrorCodes.INVALID_INPUT) => {
    throw new ApiError(400, message, code);
  },

  conflict: (message: string) => {
    throw new ApiError(409, message, ErrorCodes.CONFLICT);
  },

  rateLimited: (retryAfter?: number) => {
    throw new ApiError(429, "Too many requests. Please try again later.", ErrorCodes.RATE_LIMIT_EXCEEDED);
  },

  internalError: (message = "Internal server error") => {
    throw new ApiError(500, message, ErrorCodes.INTERNAL_ERROR);
  },
};

/**
 * Map error message to appropriate HTTP status code
 * Use this for server action results that return error strings
 */
export function getStatusCodeForError(error: string): number {
  const lowerError = error.toLowerCase();

  if (lowerError === "unauthorized" || lowerError.includes("unauthenticated")) {
    return 401;
  }

  if (lowerError === "forbidden" || lowerError.includes("insufficient permissions") || lowerError.includes("only delete your own") || lowerError.includes("can only access")) {
    return 403;
  }

  if (lowerError.includes("not found") || lowerError.includes("does not exist")) {
    return 404;
  }

  if (lowerError.includes("already exists") || lowerError.includes("duplicate")) {
    return 409;
  }

  // Default to 400 for validation and business logic errors
  return 400;
}
