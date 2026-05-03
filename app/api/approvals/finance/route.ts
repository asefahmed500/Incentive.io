import { finalApproveByFinance } from "@/lib/actions/approval.actions";
import { notifyFinanceApproved } from "@/lib/actions/notification.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { id, employeeId, managerId, companyName, commission, paidBy } = body;

  const result = await finalApproveByFinance(id, paidBy || "") as { success?: boolean; error?: string };

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await notifyFinanceApproved(employeeId, managerId, companyName, commission);

  return NextResponse.json({ success: true });
}
