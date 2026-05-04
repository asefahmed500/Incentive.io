import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { AuditLog } from "@/lib/models/AuditLog";
import { requireAdminOrAbove } from "@/lib/auth/role-guard";

export async function GET(request: NextRequest) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const entity = searchParams.get("entity");
    
    const query: Record<string, any> = {};
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
        userId: l.userId.toString(),
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  try {
    await connectToDatabase();
    const body = await request.json();
    const { userId, userEmail, userRole, action, entity, entityId, details, ipAddress, userAgent } = body;
    
    if (!userId || !action || !entity) {
      return NextResponse.json({ error: "userId, action, and entity are required" }, { status: 400 });
    }
    
    const log = await AuditLog.create({
      userId: new mongoose.Types.ObjectId(userId),
      userEmail: userEmail || "",
      userRole: userRole || "",
      action,
      entity,
      entityId,
      details,
      ipAddress,
      userAgent,
    });
    
    return NextResponse.json({ success: true, id: log._id.toString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
