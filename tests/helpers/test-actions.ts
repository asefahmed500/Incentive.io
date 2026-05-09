/**
 * Test action helpers
 * Provides wrapped server actions for testing without "use server" directive issues
 */

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";
import { SalesRecord } from "@/lib/models/SalesRecord";
import type { AuthUser } from "@/types";

// Mock admin user for tests (bypasses auth)
export const mockAuthUser: AuthUser = {
  id: "000000000000000000000001",
  name: "Test Admin",
  email: "admin@test.com",
  role: "administrator",
};

// Mock manager user for tests
export const mockManagerUser: AuthUser = {
  id: "000000000000000000000002",
  name: "Test Manager",
  email: "manager@test.com",
  role: "salesManager",
};

// Mock executive user for tests
export const mockExecutiveUser: AuthUser = {
  id: "000000000000000000000003",
  name: "Test Executive",
  email: "exec@test.com",
  role: "salesExecutive",
};

// Mock accountant user for tests
export const mockAccountantUser: AuthUser = {
  id: "000000000000000000000004",
  name: "Test Accountant",
  email: "accountant@test.com",
  role: "accountant",
};

// Mock finance user for tests
export const mockFinanceUser: AuthUser = {
  id: "000000000000000000000005",
  name: "Test Finance",
  email: "finance@test.com",
  role: "finance",
};

/**
 * Helper to create test users with proper IDs
 * Directly uses Mongoose to avoid NextAuth import issues
 */
export async function createTestUser(role: AuthUser["role"], uniqueId: string): Promise<string> {
  await ensureMongoConnection();

  const bcrypt = (await import("bcryptjs")).default;
  const password = await bcrypt.hash("Test123!", 10);

  const user = await User.create({
    name: `Test ${role}`,
    email: `test_${uniqueId}_${Date.now()}@test.com`,
    password,
    role,
    isActive: true,
  });

  return user._id.toString();
}

/**
 * Helper to clean up test data
 */
export async function cleanupTestUser(userId: string) {
  await SalesRecord.deleteMany({ employeeId: userId });
  await Wallet.findOneAndDelete({ employeeId: userId });
  await User.findByIdAndDelete(userId);
}

/**
 * Helper to get a valid MongoDB ObjectId string
 */
export function generateObjectId(): string {
  return new mongoose.Types.ObjectId().toString();
}

/**
 * Helper to check if MongoDB is connected
 */
export async function ensureMongoConnection() {
  const { isConnected } = await import("@/lib/mongodb");
  if (!isConnected()) {
    await connectToDatabase();
  }
}

/**
 * Helper to create a test sales record
 */
export async function createTestSale(employeeId: string, overrides: Record<string, unknown> = {}) {
  const { createSalesRecord } = await import("@/lib/actions/sales.actions");

  return await createSalesRecord({
    employeeId,
    employeeName: "Test Employee",
    companyName: `Test Company ${Date.now()}`,
    companyEmail: `test${Date.now()}@company.com`,
    products: [
      {
        productName: "Test Product",
        categoryId: "000000000000000000000001",
        unitPrice: 1000,
        quantity: 5,
      },
    ],
    taxEnabled: false,
    vatEnabled: false,
    ...overrides,
  });
}
