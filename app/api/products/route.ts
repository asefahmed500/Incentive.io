import { getProducts, createProduct } from "@/lib/actions/product.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("categoryId") || undefined;
  const search = searchParams.get("search") || undefined;
  
  const products = await getProducts({ categoryId, search });
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createProduct(body) as { success?: boolean; error?: string };
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
