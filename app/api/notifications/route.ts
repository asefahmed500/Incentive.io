import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/actions/notification.actions";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/role-guard";

export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const action = searchParams.get("action");

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  if (action === "unread-count") {
    const count = await getUnreadCount(userId);
    return NextResponse.json({ count });
  }

  const limit = parseInt(searchParams.get("limit") || "20");
  const notifications = await getNotifications(userId, limit);
  return NextResponse.json(notifications);
}

export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  const body = await request.json();
  const { id, userId, action } = body;

  if (action === "mark-all-read" && userId) {
    const result = await markAllAsRead(userId);
    return NextResponse.json(result);
  }

  if (id) {
    const result = await markAsRead(id);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
