import { updateTeam, deleteTeam, getTeamMembers } from "@/lib/actions/team.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { updateTeamApiSchema } from "@/lib/validations/team.validation";
import { objectIdSchema } from "@/lib/validations/common";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";
import { Team } from "@/lib/models/Team";
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
    const team = await Team.findById(parsed.data).populate("managerId", "name email").lean();
    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    // Get team members
    const members = await getTeamMembers(parsed.data);

    // Convert ObjectId to string
    const response = {
      id: team._id.toString(),
      name: team.name,
      managerId: team.managerId?.toString() || "",
      managerName: (team.managerId as unknown as { name?: string })?.name || "",
      members,
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

    const parsed = updateTeamApiSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await updateTeam({ id, ...parsed.data }) as { success?: boolean; error?: string };
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

    const result = await deleteTeam(parsed.data) as { success?: boolean; error?: string };
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
