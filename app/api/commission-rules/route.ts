import { getCommissionRules, createCommissionRule } from "@/lib/actions/commission.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { createCommissionRuleSchema } from "@/lib/validations/commission.validation";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const rules = await getCommissionRules();
    return NextResponse.json(rules);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = createCommissionRuleSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await createCommissionRule(parsed.data) as { success?: boolean; error?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to create commission rule" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
