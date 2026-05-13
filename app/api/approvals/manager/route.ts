import { approveSale, rejectSale } from "@/lib/actions/approval.actions";
import { notifyManagerApproved, notifyManagerRejected } from "@/lib/actions/notification.actions";
import { handleError } from "@/lib/api-error";
import { managerActionSchema } from "@/lib/validations/approval.validation";
import { NextResponse } from "next/server";
import { requireManagerOrAbove } from "@/lib/auth/role-guard";

export async function POST(request: Request) {
  const authResult = await requireManagerOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = managerActionSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { id, action, reason, employeeId, companyName } = parsed.data;

    if (action === "approve") {
      const result = await approveSale(id) as { success?: boolean; error?: string };

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Notify executive
      if (employeeId && companyName) {
        await notifyManagerApproved(employeeId, companyName);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const result = await rejectSale(id, reason || "") as { success?: boolean; error?: string };

      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      // Notify executive
      if (employeeId && companyName) {
        await notifyManagerRejected(employeeId, companyName, reason || "");
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action. Use 'approve' or 'reject'" }, { status: 400 });
  } catch (error) {
    return handleError(error);
  }
}
