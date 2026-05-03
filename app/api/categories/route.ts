import { getCategories, createCategory } from "@/lib/actions/category.actions";
import { NextResponse } from "next/server";

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createCategory(body) as { success?: boolean; error?: string };
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
