import { getSalesRecord, updateSalesRecord, deleteSalesRecord } from "@/lib/actions/sales.actions";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";
import { getStatusCodeForError } from "@/lib/api-error";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  const { id } = await params;
  const record = await getSalesRecord(id);
  
  if (!record) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }
  
  return NextResponse.json(record);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  const { id } = await params;
  const body = await request.json();
  
  const result = await updateSalesRecord(id, body) as { success?: boolean; error?: string };

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  const { id } = await params;
  
  const result = await deleteSalesRecord(id) as { success?: boolean; error?: string };

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
  }

  return NextResponse.json({ success: true });
}
