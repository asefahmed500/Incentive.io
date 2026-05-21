/**
 * Test setup file for Vitest
 * Configures test environment, loads environment variables, sets up mocks
 */

import { config } from "dotenv";
import { vi, beforeEach, beforeAll, expect } from "vitest";

// Load environment variables
config({ path: ".env.local" });

// Fallback to .env.example if .env.local doesn't exist
if (!process.env.MONGODB_URI) {
  config({ path: ".env.example" });
}

// Extend Vitest timeout for database operations
vi.setConfig({ testTimeout: 30000, hookTimeout: 30000 });

// Mock NextAuth for server action tests
vi.mock("@/lib/auth/auth", () => ({
  auth: vi.fn(() => Promise.resolve({
    user: {
      id: "000000000000000000000001",
      name: "Test Admin",
      email: "admin@test.com",
      role: "administrator",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })),
  handlers: {},
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Setup test data before all tests
beforeAll(async () => {
  const { connectToDatabase } = await import("@/lib/mongodb");
  const { CommissionRule } = await import("@/lib/models/CommissionRule");

  await connectToDatabase();

  // Create commission rules if they don't exist
  const existingRules = await CommissionRule.countDocuments();
  if (existingRules === 0) {
    await CommissionRule.create([
      { targetPercentageFrom: 0, targetPercentageTo: 80, commissionRate: 2.0, priority: 1, isActive: true },
      { targetPercentageFrom: 81, targetPercentageTo: 100, commissionRate: 3.0, priority: 2, isActive: true },
      { targetPercentageFrom: 101, targetPercentageTo: 150, commissionRate: 4.5, priority: 3, isActive: true },
      { targetPercentageFrom: 151, targetPercentageTo: 999, commissionRate: 5.0, priority: 4, isActive: true },
    ]);
    console.log("✓ Commission rules created for tests");
  }
});

// Console log test environment start
console.log("✓ Vitest test environment configured");
console.log(`  MongoDB: ${process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio"}`);
console.log(`  Node Env: ${process.env.NODE_ENV}`);
