import { getProducts, createProduct } from "@/lib/actions/product.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { productQuerySchema, createProductApiSchema } from "@/lib/validations/product.validation";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      categoryId: searchParams.get("categoryId") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const parsed = productQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const products = await getProducts(parsed.data);

    // Handle error response from server action
    if ("error" in products) {
      return NextResponse.json({ error: products.error }, { status: getStatusCodeForError(products.error) });
    }

    return NextResponse.json(products);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = createProductApiSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await createProduct(parsed.data) as { success?: boolean; error?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
