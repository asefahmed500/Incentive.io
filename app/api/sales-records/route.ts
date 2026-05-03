import { getSalesRecords, createSalesRecord, submitSalesRecord } from "@/lib/actions/sales.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId") || undefined;
  const status = searchParams.get("status") || undefined;
  const search = searchParams.get("search") || undefined;

  const records = await getSalesRecords({ employeeId, status, search });
  return NextResponse.json(records);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createSalesRecord(body) as { success?: boolean; error?: string };
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, action } = body;

  if (action === "submit") {
    const result = await submitSalesRecord(id) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
