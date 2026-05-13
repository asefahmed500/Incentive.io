"use server";

import { AuditLog } from "@/lib/models/AuditLog";
import { connectToDatabase } from "@/lib/mongodb";
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

const logAuditSchema = z.object({
  userId: z.string().min(1).optional().default("system"),
  userEmail: z.string().email().optional().default("system@incentive.io"),
  userRole: z.string().min(1).optional().default("system"),
  action: z.string().min(1),
  entity: z.string().min(1),
  entityId: z.string().optional(),
  details: z.record(z.string(), z.unknown()).optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

export async function logAudit({
  userId,
  userEmail,
  userRole,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  userId?: string;
  userEmail?: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const parsed = logAuditSchema.safeParse({ userId, userEmail, userRole, action, entity, entityId, details, ipAddress, userAgent });
  if (!parsed.success) {
    console.error("Audit log validation failed:", parsed.error.issues[0].message);
    return { error: "Invalid audit data" };
  }

  await connectToDatabase();

  const auditData: Record<string, unknown> = {
    userEmail: parsed.data.userEmail,
    userRole: parsed.data.userRole,
    action: parsed.data.action,
    entity: parsed.data.entity,
    entityId: parsed.data.entityId,
    details: parsed.data.details,
    ipAddress: parsed.data.ipAddress,
    userAgent: parsed.data.userAgent,
  };

  // Only include userId if it's a valid ObjectId format (not "system" default)
  if (parsed.data.userId && parsed.data.userId !== "system") {
    auditData.userId = parsed.data.userId;
  }

  await AuditLog.create(auditData);

  return { success: true };
}

export async function getAuditLogs({
  userId,
  action,
  entity,
  limit = 50,
}: {
  userId?: string;
  action?: string;
  entity?: string;
  limit?: number;
}) {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (userId) query.userId = userId;
  if (action) query.action = action;
  if (entity) query.entity = entity;

  const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(limit).lean();
  return logs.map((l) => ({
    id: l._id.toString(),
    userId: l.userId,
    userEmail: l.userEmail,
    userRole: l.userRole,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    details: l.details,
    ipAddress: l.ipAddress,
    userAgent: l.userAgent,
    createdAt: l.createdAt,
  }));
}