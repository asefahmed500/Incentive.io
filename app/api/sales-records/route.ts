import { getSalesRecords, createSalesRecord, submitSalesRecord } from "@/lib/actions/sales.actions";
import { handleError } from "@/lib/api-error";
import { salesQuerySchema, createSalesRecordApiSchema, submitActionSchema } from "@/lib/validations/sales.validation";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/role-guard";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      employeeId: searchParams.get("employeeId") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const parsed = salesQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const records = await getSalesRecords(parsed.data);
    return NextResponse.json(records);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = createSalesRecordApiSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await createSalesRecord({
      ...parsed.data,
      taxEnabled: parsed.data.taxEnabled ?? false,
      vatEnabled: parsed.data.vatEnabled ?? false,
    }) as { success?: boolean; error?: string; id?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = submitActionSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { id } = parsed.data;
    const result = await submitSalesRecord(id) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
