import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { handleError, ErrorCodes } from "@/lib/api-error";

// Rate limiter: 5 registration attempts per hour per IP
const registerLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 1000,
});

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
    const { isRateLimited, remaining, resetTime } = registerLimiter.check(5, ip);

    if (isRateLimited) {
      return NextResponse.json(
        {
          error: "Too many registration attempts. Please try again later.",
          remaining,
          resetTime: new Date(resetTime!).toISOString(),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(resetTime!).toISOString(),
            "Retry-After": Math.ceil((resetTime! - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Parse JSON body directly (no FormData conversion needed)
    const body = await request.json();

    const { name, email, password, phone } = body;

    // Validate input
    const parsed = registerSchema.safeParse({ name, email, password, phone });
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    await connectToDatabase();

    // Hash password and create user
    // Note: Email has unique constraint in schema, so duplicate emails will be rejected by database
    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

    try {
      await User.create({
        name: parsed.data.name,
        email: parsed.data.email,
        password: hashedPassword,
        phone: parsed.data.phone || "",
        role: "salesExecutive",
        isActive: true,
        isEligible: false,
        targetAmount: 0,
      });
    } catch (createError: unknown) {
      // Handle duplicate key error (MongoError code 11000)
      if (
        createError &&
        typeof createError === "object" &&
        "code" in createError &&
        createError.code === 11000
      ) {
        return NextResponse.json(
          { error: "Email already registered. Please use a different email or sign in." },
          { status: 409 }
        );
      }
      throw createError; // Re-throw other errors
    }

    return NextResponse.json(
      { success: true, message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
