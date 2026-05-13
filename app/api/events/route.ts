import { auth } from "@/lib/auth/auth";
import { sseManager } from "@/lib/sse";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id as string;
  const userRole = (session.user as any).role;

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
