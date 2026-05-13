import { finalApproveByFinance } from "@/lib/actions/approval.actions";
import { notifyFinanceApproved } from "@/lib/actions/notification.actions";
import { handleError } from "@/lib/api-error";
import { financeApprovalSchema } from "@/lib/validations/approval.validation";
import { NextResponse } from "next/server";
import { requireFinanceOrAbove } from "@/lib/auth/role-guard";

export async function POST(request: Request) {
  const authResult = await requireFinanceOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = financeApprovalSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { id, paidBy } = parsed.data;

    const result = await finalApproveByFinance(id, paidBy) as { success?: boolean; error?: string };

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Note: Notification is handled internally by finalApproveByFinance now

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
