import { getWallet, creditWallet, debitWallet } from "@/lib/actions/wallet.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAuth, requireFinanceOrAbove } from "@/lib/auth/role-guard";

const walletIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid wallet ID format");

const updateWalletSchema = z.object({
  operation: z.enum(["credit", "debit"]),
  amount: z.number().positive("Amount must be positive").finite("Amount must be a valid number"),
  salesRecordId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid sales record ID format").optional(),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = walletIdSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const wallet = await getWallet(parsed.data);
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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireFinanceOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const body = await request.json();

    const parsedId = walletIdSchema.safeParse(id);
    if (!parsedId.success) {
      return handleError(parsedId.error);
    }

    const parsedBody = updateWalletSchema.safeParse(body);
    if (!parsedBody.success) {
      return handleError(parsedBody.error);
    }

    const { operation, amount, salesRecordId, description } = parsedBody.data;

    let result;
    if (operation === "credit") {
      result = await creditWallet({
        employeeId: parsedId.data,
        amount,
        salesRecordId,
        description,
      }) as { success?: boolean; error?: string; newBalance?: number };
    } else {
      result = await debitWallet({
        employeeId: parsedId.data,
        amount,
        salesRecordId,
        description,
      }) as { success?: boolean; error?: string; newBalance?: number };
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    return NextResponse.json({ success: true, newBalance: result.newBalance });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireFinanceOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;

    const parsed = walletIdSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    // For wallets, we don't actually delete them, but we could zero out the balance
    // This is a safeguard - actual deletion should be rare
    return NextResponse.json({ error: "Wallets cannot be deleted. Use credit/debit operations to adjust balance." }, { status: 400 });
  } catch (error) {
    return handleError(error);
  }
}
