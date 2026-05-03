import { approveSale, rejectSale } from "@/lib/actions/approval.actions";
import { notifyManagerApproved, notifyManagerRejected } from "@/lib/actions/notification.actions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { id, action, reason } = body;

  if (action === "approve") {
    const result = await approveSale(id) as { success?: boolean; error?: string };
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // Notify executive
    await notifyManagerApproved(body.employeeId, body.companyName);
    
    return NextResponse.json({ success: true });
  }

  if (action === "reject") {
    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }
    
    const result = await rejectSale(id, reason) as { success?: boolean; error?: string };
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    // Notify executive
    await notifyManagerRejected(body.employeeId, body.companyName, reason);
    
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
}
