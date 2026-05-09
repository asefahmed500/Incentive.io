/**
 * Custom error classes for Incentive.io
 * Provides better error handling and type safety
 */

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

export class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "DatabaseError";
  }
}

export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden: Insufficient permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BusinessLogicError extends Error {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = "BusinessLogicError";
  }
}

export type AppError =
  | AuthError
  | ValidationError
  | DatabaseError
  | ForbiddenError
  | NotFoundError
  | BusinessLogicError;
