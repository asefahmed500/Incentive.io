import { getTeams, createTeam } from "@/lib/actions/team.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { createTeamApiSchema } from "@/lib/validations/team.validation";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";

export async function GET() {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const teams = await getTeams();

    // Handle error response from server action
    if ("error" in teams) {
      return NextResponse.json({ error: teams.error }, { status: getStatusCodeForError(teams.error as string) });
    }

    return NextResponse.json(teams);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = createTeamApiSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await createTeam(parsed.data) as { success?: boolean; error?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
