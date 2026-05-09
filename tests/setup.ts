/**
 * Test setup file
 * Configures test environment, loads environment variables, sets up mocks
 */

import { config } from "dotenv";

// Load environment variables
config({ path: ".env.local" });

// Fallback to .env.example if .env.local doesn't exist
if (!process.env.MONGODB_URI) {
  config({ path: ".env.example" });
}

// Set test environment
process.env.NODE_ENV = "test";

// Extend Jest timeout for database operations
jest.setTimeout(30000);

// Mock NextAuth for server action tests
jest.mock("@/lib/auth/auth", () => ({
  auth: jest.fn(() => Promise.resolve({
    user: {
      id: "000000000000000000000001",
      name: "Test Admin",
      email: "admin@test.com",
      role: "administrator",
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })),
  handlers: {},
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Console log test environment start
console.log("✓ Test environment configured");
console.log(`  MongoDB: ${process.env.MONGODB_URI || "mongodb://localhost:27017/incentiveio"}`);
console.log(`  Node Env: ${process.env.NODE_ENV}`);
