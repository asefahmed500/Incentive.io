import { updateProduct, deleteProduct } from "@/lib/actions/product.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { updateProductApiSchema, deleteProductSchema } from "@/lib/validations/product.validation";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";
import { Product } from "@/lib/models/Product";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = deleteProductSchema.safeParse({ id });
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    await connectToDatabase();
    const product = await Product.findById(parsed.data.id).populate("categoryId", "name").lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Convert ObjectId to string
    const response = {
      id: product._id.toString(),
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId?.toString() || "",
      categoryName: (product.categoryId as unknown as { name?: string })?.name || "",
      price: product.price,
      stock: product.stock,
      image: product.image,
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

    const parsed = updateProductApiSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await updateProduct({ id, ...parsed.data }) as { success?: boolean; error?: string };
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

    const parsed = deleteProductSchema.safeParse({ id });
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await deleteProduct(parsed.data.id) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
