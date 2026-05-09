/**
 * Monitoring and metrics logging for Incentive.io
 * Tracks key operations for observability and debugging
 */

import { AuditLog } from "@/lib/models/AuditLog";

export interface MetricData {
  amount?: number;
  employeeId?: string;
  balanceAfter?: number;
  commissionRate?: number;
  achievement?: number;
  duration?: number;
  [key: string]: unknown;
}

export async function logMetric(
  event: string,
  data: MetricData = {}
): Promise<void> {
  try {
    await AuditLog.create({
      action: `METRIC_${event.toUpperCase()}`,
      entity: "System",
      details: data,
      userId: data.employeeId || "system",
      userEmail: "system",
      userRole: "system",
    });
  } catch (error) {
    // Don't throw errors from logging
    console.error("Failed to log metric:", error);
  }
}

export async function logPerformance(
  operation: string,
  duration: number,
  details: Record<string, unknown> = {}
): Promise<void> {
  await logMetric(`PERF_${operation}`, {
    duration,
    ...details,
  });
}

export async function logError(
  operation: string,
  error: unknown,
  details: Record<string, unknown> = {}
): Promise<void> {
  await logMetric(`ERROR_${operation}`, {
    error: error instanceof Error ? error.message : String(error),
    ...details,
  });
}

export async function logBusinessEvent(
  event: string,
  details: Record<string, unknown> = {}
): Promise<void> {
  await logMetric(`BUSINESS_${event}`, details);
}
