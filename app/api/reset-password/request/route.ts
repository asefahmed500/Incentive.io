import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/lib/actions/user.actions";
import { handleError } from "@/lib/api-error";

// Rate limiter: 10 requests per 15 minutes per IP
const resetLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 100,
});

const requestResetSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
    const { isRateLimited, remaining } = resetLimiter.check(10, ip);

    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": remaining.toString(),
            "Retry-After": "3600",
          },
        }
      );
    }

    const body = await request.json();
    const parsed = requestResetSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await requestPasswordReset(parsed.data.email);

    if ("error" in result) {
      return handleError(result.error);
    }

    return NextResponse.json({ success: true, message: "If an account exists with this email, a password reset link has been sent." });
  } catch (error) {
    return handleError(error);
  }
}
