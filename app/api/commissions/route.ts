import { getCommissions, getCommissionsByEmployee, checkEligibility } from "@/lib/actions/commission.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const action = searchParams.get("action");

  if (action === "check-eligibility" && employeeId) {
    const eligibility = await checkEligibility(employeeId);
    return NextResponse.json(eligibility);
  }

  if (employeeId) {
    const commissions = await getCommissionsByEmployee(employeeId);
    return NextResponse.json(commissions);
  }

  const commissions = await getCommissions();
  return NextResponse.json(commissions);
}
