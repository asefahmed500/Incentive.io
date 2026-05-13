import { updateCommissionRule, deleteCommissionRule } from "@/lib/actions/commission.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdminOrAbove } from "@/lib/auth/role-guard";
import CommissionRule from "@/lib/models/CommissionRule";
import { connectToDatabase } from "@/lib/mongodb";

const updateCommissionRuleSchema = z.object({
  targetPercentageFrom: z.number().min(0).optional(),
  targetPercentageTo: z.number().max(999).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  priority: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

const deleteCommissionRuleSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid commission rule ID format");

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
