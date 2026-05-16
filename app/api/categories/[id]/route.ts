import { updateCategory, deleteCategory, toggleCategoryAutoApprove } from "@/lib/actions/category.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { updateCategoryApiSchema, toggleAutoApproveApiSchema } from "@/lib/validations/category.validation";
import { objectIdSchema } from "@/lib/validations/common";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";
import { Category } from "@/lib/models/Category";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = objectIdSchema.safeParse(id);
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
      autoApprove: category.autoApprove || false,
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

    // Check if this is a toggle auto-approve request (only contains autoApprove field)
    if (Object.keys(body).length === 1 && "autoApprove" in body) {
      const parsed = toggleAutoApproveApiSchema.safeParse(body);
      if (!parsed.success) {
        return handleError(parsed.error);
      }

      const result = await toggleCategoryAutoApprove({ id, ...parsed.data }) as { success?: boolean; error?: string; autoApprove?: boolean } | undefined;
      if (result?.error) {
        return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
      }
      return NextResponse.json({ success: true, autoApprove: result?.autoApprove });
    }

    // General category update
    const parsed = updateCategoryApiSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await updateCategory({ id, ...parsed.data }) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
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

    const parsed = objectIdSchema.safeParse(id);
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
