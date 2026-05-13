import { updateCategory, deleteCategory } from "@/lib/actions/category.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";
import { Category } from "@/lib/models/Category";
import { connectToDatabase } from "@/lib/mongodb";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
});

const categoryIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid category ID format");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = categoryIdSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    await connectToDatabase();
    const category = await Category.findById(parsed.data).lean();
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Convert ObjectId to string
    const response = {
      id: category._id.toString(),
      name: category.name,
      description: category.description,
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await updateCategory({ id, ...parsed.data }) as { success?: boolean; error?: string };
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

    const parsed = categoryIdSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await deleteCategory(parsed.data) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
