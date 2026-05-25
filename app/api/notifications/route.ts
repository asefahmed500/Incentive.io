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

    let { userId } = parsed.data;
    const { action, limit } = parsed.data;
    const authenticatedUserId = authResult.session.user.id as string;
    const userRole = (authResult.session.user as import("@/types").AuthUser).role as string;

    if (!["admin", "administrator", "finance"].includes(userRole)) {
      userId = authenticatedUserId;
    }

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
      let targetUserId = markAllParsed.data.userId;
      const authenticatedUserId = authResult.session.user.id as string;
      const userRole = (authResult.session.user as import("@/types").AuthUser).role as string;

      if (!["admin", "administrator", "finance"].includes(userRole)) {
        targetUserId = authenticatedUserId;
      }

      const result = await markAllAsRead(targetUserId);
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
