import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models/AuditLog";
import { requireAdminOrAbove } from "@/lib/auth/role-guard";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { createAuditLogApiSchema, auditLogQuerySchema } from "@/lib/validations/audit.validation";

export async function GET(request: NextRequest) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const queryParams = {
      userId: searchParams.get("userId") || undefined,
      action: searchParams.get("action") || undefined,
      entity: searchParams.get("entity") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    };

    const parsed = auditLogQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { userId, action, entity, limit, offset } = parsed.data;
    const query: Record<string, unknown> = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (entity) query.entity = entity;

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      logs: logs.map(l => ({
        id: l._id.toString(),
        userId: l.userId?.toString(),
        userEmail: l.userEmail,
        userRole: l.userRole,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        ipAddress: l.ipAddress,
        createdAt: l.createdAt,
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await connectToDatabase();
    const body = await request.json();

    const parsed = createAuditLogApiSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { userId, userEmail, userRole, action, entity, entityId, details, ipAddress, userAgent } = parsed.data;

    const logData: Record<string, unknown> = {
      userEmail: userEmail || "",
      userRole: userRole || "",
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent,
    };

    // Only include userId if it's provided (not undefined)
    if (userId) {
      logData.userId = new mongoose.Types.ObjectId(userId);
    }

    const log = await AuditLog.create(logData);

    return NextResponse.json({ success: true, id: log._id.toString() }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
