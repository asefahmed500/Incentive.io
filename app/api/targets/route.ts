import { getTargets, assignTarget, removeTarget } from "@/lib/actions/target.actions";
import { handleError } from "@/lib/api-error";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";

const assignTargetSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
  targetAmount: z.number().positive("Target amount must be positive").finite("Target amount must be a valid number"),
  period: z.string().optional(),
});

const removeTargetSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
});

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const targets = await getTargets();
    return NextResponse.json(targets);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = assignTargetSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await assignTarget({
      userId: parsed.data.userId,
      targetAmount: parsed.data.targetAmount,
      period: parsed.data.period,
    }) as { success?: boolean; error?: string };

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const parsed = removeTargetSchema.safeParse({ userId });
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await removeTarget(parsed.data.userId) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
