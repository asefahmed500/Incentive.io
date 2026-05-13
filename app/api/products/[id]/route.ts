import { updateProduct, deleteProduct } from "@/lib/actions/product.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";
import { Product } from "@/lib/models/Product";
import { connectToDatabase } from "@/lib/mongodb";

const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sku: z.string().optional(),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid category ID format").optional(),
  price: z.number().positive("Price must be positive").finite("Price must be a valid number").optional(),
  stock: z.number().int("Stock must be a whole number").nonnegative("Stock must be non-negative").optional(),
  image: z.string().url().optional(),
});

const productIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid product ID format");

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { id } = await params;
    const parsed = productIdSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    await connectToDatabase();
    const product = await Product.findById(parsed.data).populate("categoryId", "name").lean();
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

    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await updateProduct({ id, ...parsed.data }) as { success?: boolean; error?: string };
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

    const parsed = productIdSchema.safeParse(id);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await deleteProduct(parsed.data) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
