import { processByAccountant } from "@/lib/actions/approval.actions";
import { notifyAccountantProcessed } from "@/lib/actions/notification.actions";
import { handleError } from "@/lib/api-error";
import { accountantProcessSchema } from "@/lib/validations/approval.validation";
import { NextResponse } from "next/server";
import { requireAccountantOrAbove } from "@/lib/auth/role-guard";

export async function POST(request: Request) {
  const authResult = await requireAccountantOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = accountantProcessSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { id, eoBpAmount, eoBpReason, taxRate, vatRate, managerId, companyName } = parsed.data;

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
    if (managerId && companyName) {
      await notifyAccountantProcessed(managerId, companyName);
    }

    return NextResponse.json({
      success: true,
      netSales: result.netSales,
    });
  } catch (error) {
    return handleError(error);
  }
}
