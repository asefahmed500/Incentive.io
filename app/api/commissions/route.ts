import { getCommissions, getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { commissionsQuerySchema } from "@/lib/validations/commissions-api.validation";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/role-guard";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      employeeId: searchParams.get("employeeId") || undefined,
      action: searchParams.get("action") || undefined,
    };

    const parsed = commissionsQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { employeeId, action } = parsed.data;

    if (action === "check-eligibility" && employeeId) {
      const eligibility = await checkEligibility(employeeId);

      if ("error" in eligibility) {
        return NextResponse.json({ error: eligibility.error }, { status: getStatusCodeForError(eligibility.error as string) });
      }

      return NextResponse.json(eligibility);
    }

    if (employeeId) {
      const commissions = await getCommissionsByEmployee(employeeId);

      if ("error" in commissions) {
        return NextResponse.json({ error: commissions.error }, { status: getStatusCodeForError(commissions.error as string) });
      }

      return NextResponse.json(commissions);
    }

    const commissions = await getCommissions();

    if ("error" in commissions) {
      return NextResponse.json({ error: commissions.error }, { status: getStatusCodeForError(commissions.error as string) });
    }

    return NextResponse.json(commissions);
  } catch (error) {
    return handleError(error);
  }
}
