import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().url("Invalid MongoDB URI"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("Invalid NEXTAUTH_URL"),
  EMAIL_HOST: z.string().min(1),
  EMAIL_PORT: z.coerce.number().int().min(1).max(65535),
  EMAIL_SECURE: z.enum(["true", "false"]).transform(v => v === "true"),
  EMAIL_USER: z.string().email(),
  EMAIL_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
});

export function validateEnv() {
  const result = envSchema.safeParse({
    MONGODB_URI: process.env.MONGODB_URI,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_PORT: process.env.EMAIL_PORT,
    EMAIL_SECURE: process.env.EMAIL_SECURE,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
  });

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.issues.forEach(issue => {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    });
    throw new Error("Invalid environment configuration");
  }

  return result.data;
}

export const env = validateEnv();