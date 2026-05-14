import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/actions/notification.actions";
import { handleError, getStatusCodeForError } from "@/lib/api-error";
import { notificationQuerySchema, markAsReadSchema, markAllAsReadSchema } from "@/lib/validations/notification.validation";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/role-guard";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      userId: searchParams.get("userId") || "",
      action: searchParams.get("action") || undefined,
      limit: searchParams.get("limit") || undefined,
    };

    const parsed = notificationQuerySchema.safeParse(queryParams);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const { userId, action, limit } = parsed.data;

    if (action === "unread-count") {
      const count = await getUnreadCount(userId);
      return NextResponse.json({ count });
    }

    const notifications = await getNotifications(userId, limit);
    return NextResponse.json(notifications);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();

    // Try mark all as read schema first
    const markAllParsed = markAllAsReadSchema.safeParse(body);
    if (markAllParsed.success) {
      const result = await markAllAsRead(markAllParsed.data.userId);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error as string) });
      }
      return NextResponse.json(result);
    }

    // Try mark as read schema
    const markParsed = markAsReadSchema.safeParse(body);
    if (!markParsed.success) {
      return handleError(markParsed.error);
    }

    const result = await markAsRead(markParsed.data.id);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error as string) });
    }
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
