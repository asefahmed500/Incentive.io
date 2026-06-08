import { handlers } from "@/lib/auth/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const loginLimiter = rateLimit({
  interval: 15 * 60 * 1000,
  uniqueTokenPerInterval: 1000,
});

const SESSION_COOKIE_NAMES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);

  if (
    url.pathname.endsWith("/signout") ||
    url.searchParams.get("nextauth") === "signout"
  ) {
    const response = await handlers.POST(request);
    for (const name of SESSION_COOKIE_NAMES) {
      response.headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`
      );
      response.headers.append(
        "Set-Cookie",
        `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`
      );
    }
    return response;
  }

  const ip =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "anonymous";
  const { isRateLimited, remaining, resetTime } = loginLimiter.check(20, ip);

  if (isRateLimited) {
    return new Response(
      JSON.stringify({
        error: "Too many login attempts. Please try again later.",
        remaining,
        resetTime: new Date(resetTime!).toISOString(),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(resetTime!).toISOString(),
          "Retry-After": Math.ceil((resetTime! - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return handlers.POST(request);
}