import { auth } from "@/lib/auth/auth";
import { sseManager } from "@/lib/sse";
import { NextRequest } from "next/server";
import type { AuthUser } from "@/types";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const userRole = (session.user as AuthUser).role;

  try {
    await connectToDatabase();
    const user = await User.findById(userId).select("isActive").lean();
    if (!user || user.isActive === false) {
      return new Response("Account deactivated", { status: 403 });
    }
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = `${userId}-${Date.now()}-${Math.random()}`;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const welcomeMessage = `data: ${JSON.stringify({
        type: "connected",
        payload: { clientId, userId, role: userRole },
      })}\n\n`;
      controller.enqueue(new TextEncoder().encode(welcomeMessage));

      // Add client to SSE manager
      sseManager.addClient({
        id: clientId,
        userId,
        role: userRole,
        controller,
      });

      // Send keepalive every 30 seconds to prevent timeout
      const keepaliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keepalive\n\n"));
        } catch (error) {
          clearInterval(keepaliveInterval);
        }
      }, 30000);

      // Cleanup on connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(keepaliveInterval);
        sseManager.removeClient(clientId, userId);
      });
    },
    cancel() {
      sseManager.removeClient(clientId, userId);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
