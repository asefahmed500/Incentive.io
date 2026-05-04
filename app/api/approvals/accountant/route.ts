import { processByAccountant } from "@/lib/actions/approval.actions";
import { notifyAccountantProcessed } from "@/lib/actions/notification.actions";
import { NextResponse } from "next/server";
import { requireAccountantOrAbove } from "@/lib/auth/role-guard";

export async function POST(request: Request) {
  const authResult = await requireAccountantOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  const body = await request.json();
  const {
    id,
    eoBpAmount,
    eoBpReason,
    taxRate,
    vatRate,
  } = body;

  const result = await processByAccountant({
    id,
    eoBpAmount,
    eoBpReason,
    taxRate,
    vatRate,
  }) as { success?: boolean; error?: string; netSales?: number };

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Notify manager
  await notifyAccountantProcessed(body.managerId, body.companyName);

  return NextResponse.json({
    success: true,
    netSales: result.netSales,
  });
}
