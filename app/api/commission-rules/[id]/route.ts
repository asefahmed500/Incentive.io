import { updateCommissionRule, deleteCommissionRule } from "@/lib/actions/commission.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { updateCommissionRuleSchema, deleteCommissionRuleSchema } from "@/lib/validations/commission.validation";
import { NextResponse } from "next/server";
import { requireAdminOrAbove } from "@/lib/auth/role-guard";
import { CommissionRule } from "@/lib/models/CommissionRule";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = deleteCommissionRuleSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    await connectToDatabase();
    const rule = await CommissionRule.findById(parsed.data);
    if (!rule) {
      return NextResponse.json({ error: "Commission rule not found" }, { status: 404 });
    }

    // Convert ObjectId to string
    const response = {
      ...rule.toObject(),
      _id: rule._id.toString(),
      categoryId: rule.categoryId?.toString(),
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
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = updateCommissionRuleSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await updateCommissionRule({ id, ...parsed.data }) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;

    const parsed = deleteCommissionRuleSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await deleteCommissionRule(parsed.data) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
