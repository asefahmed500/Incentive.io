import { getWallet, creditWallet, debitWallet } from "@/lib/actions/wallet.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAuth, requireFinanceOrAbove } from "@/lib/auth/role-guard";

const walletOperationSchema = z.object({
  operation: z.enum(["credit", "debit"]),
  employeeId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid employee ID format"),
  amount: z.number().positive("Amount must be positive").finite("Amount must be a valid number"),
  salesRecordId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sales record ID format").optional(),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
});

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId parameter is required" }, { status: 400 });
    }

    const wallet = await getWallet(employeeId);
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    // Convert ObjectId to string
    const response = {
      ...wallet,
      _id: wallet._id.toString(),
      employeeId: wallet.employeeId.toString(),
      transactions: wallet.transactions?.map((t: { salesRecordId?: { toString: () => string }; [key: string]: unknown }) => ({
        ...t,
        salesRecordId: t.salesRecordId?.toString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireFinanceOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = walletOperationSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { operation, employeeId, amount, salesRecordId, description } = parsed.data;

    let result;
    if (operation === "credit") {
      result = await creditWallet({
        employeeId,
        amount,
        salesRecordId,
        description,
      }) as { success?: boolean; error?: string; newBalance?: number };
    } else {
      result = await debitWallet({
        employeeId,
        amount,
        salesRecordId,
        description,
      }) as { success?: boolean; error?: string; newBalance?: number };
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    return NextResponse.json({ success: true, newBalance: result.newBalance }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
