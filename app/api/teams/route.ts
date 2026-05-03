import { getTeams, createTeam } from "@/lib/actions/team.actions";
import { NextResponse } from "next/server";

export async function GET() {
  const teams = await getTeams();
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createTeam(body) as { success?: boolean; error?: string };
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
