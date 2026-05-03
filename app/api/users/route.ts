import { getUsers, createUser } from "@/lib/actions/user.actions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "all";

  const users = await getUsers({ search, role });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createUser(body) as { success?: boolean; error?: string };
  
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  
  return NextResponse.json({ success: true });
}
