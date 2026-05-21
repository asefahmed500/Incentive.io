import { getSalesRecord, updateSalesRecord, deleteSalesRecord } from "@/lib/actions/sales.actions";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";
import { getStatusCodeForError, handleError } from "@/lib/api-error";
import { z } from "zod";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ID format");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid record ID format" }, { status: 400 });
    }

    const record = await getSalesRecord(parsed.data);

    if (!record || ("error" in (record as object))) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid record ID format" }, { status: 400 });
    }

    const body = await request.json();

    const result = await updateSalesRecord(parsed.data, body) as { success?: boolean; error?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = objectIdSchema.safeParse(id);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid record ID format" }, { status: 400 });
    }

    const result = await deleteSalesRecord(parsed.data) as { success?: boolean; error?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
