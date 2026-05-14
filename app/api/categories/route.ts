import { getCategories, createCategory } from "@/lib/actions/category.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { createCategoryApiSchema } from "@/lib/validations/category.validation";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const categories = await getCategories();

    // Handle error response from server action
    if ("error" in categories) {
      return NextResponse.json({ error: categories.error }, { status: getStatusCodeForError(categories.error as string) });
    }

    return NextResponse.json(categories);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = createCategoryApiSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await createCategory(parsed.data) as { success?: boolean; error?: string; id?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: result.id }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
