import { getUsers, createUser } from "@/lib/actions/user.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { userQuerySchema, createUserApiSchema } from "@/lib/validations/user.validation";
import { NextResponse } from "next/server";
import { requireAuth, requireAdminOrAbove } from "@/lib/auth/role-guard";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      teamId: searchParams.get("teamId") || undefined,
      managerId: searchParams.get("managerId") || undefined,
      isActive: searchParams.get("isActive") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const parsed = userQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const users = await getUsers(parsed.data);

    // Handle error response from server action
    if ("error" in users) {
      return NextResponse.json({ error: users.error }, { status: getStatusCodeForError(users.error) });
    }

    return NextResponse.json(users);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdminOrAbove();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const parsed = createUserApiSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await createUser(parsed.data) as { success?: boolean; error?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }

    if (!result) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
