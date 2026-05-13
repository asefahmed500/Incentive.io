import { handlers } from "@/lib/auth/auth";
import { rateLimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

// Rate limiter: 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 1000,
});

export async function GET(request: NextRequest) {
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  // Get IP from headers for rate limiting
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
  const { isRateLimited, remaining, resetTime } = loginLimiter.check(10, ip);

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