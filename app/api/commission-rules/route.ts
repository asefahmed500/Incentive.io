import { getCommissionRules, createCommissionRule } from "@/lib/actions/commission.actions";
import { NextResponse } from "next/server";

export async function GET() {
  const rules = await getCommissionRules();
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createCommissionRule(body) as { success?: boolean; error?: string };
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
