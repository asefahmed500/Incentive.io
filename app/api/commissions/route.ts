import { getCommissions, getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/role-guard";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const action = searchParams.get("action");

    if (action === "check-eligibility" && employeeId) {
      const eligibility = await checkEligibility(employeeId);

      // Handle error response from server action
      if ("error" in eligibility) {
        return NextResponse.json({ error: eligibility.error }, { status: 400 });
      }

      return NextResponse.json(eligibility);
    }

    if (employeeId) {
      const commissions = await getCommissionsByEmployee(employeeId);

      // Handle error response from server action
      if ("error" in commissions) {
        return NextResponse.json({ error: commissions.error }, { status: 400 });
      }

      return NextResponse.json(commissions);
    }

    const commissions = await getCommissions();

    // Handle error response from server action
    if ("error" in commissions) {
      return NextResponse.json({ error: commissions.error }, { status: 400 });
    }

    return NextResponse.json(commissions);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
