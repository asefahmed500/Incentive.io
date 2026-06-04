import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/lib/actions/user.actions";
import { handleError } from "@/lib/api-error";

// Rate limiter: 15 attempts per 15 minutes per IP
const resetConfirmLimiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 100,
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
    const { isRateLimited, remaining } = resetConfirmLimiter.check(15, ip);

    if (isRateLimited) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": remaining.toString(),
            "Retry-After": "3600",
          },
        }
      );
    }

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const result = await resetPasswordWithToken(parsed.data.token, parsed.data.newPassword);

    if ("error" in result) {
      return handleError(result.error);
    }

    return NextResponse.json({ success: true, message: "Password has been reset successfully. You can now log in with your new password." });
  } catch (error) {
    return handleError(error);
  }
}
