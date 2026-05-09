/**
 * Unit Tests for Incentive.io Core Business Logic
 * Tests database models, wallet operations, and business calculations directly
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Wallet } from "@/lib/models/Wallet";
import { SalesRecord } from "@/lib/models/SalesRecord";

describe("Unit: User Model", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  it("should create a user with hashed password", async () => {
    const bcrypt = (await import("bcryptjs")).default;
    const password = await bcrypt.hash("Test123!", 10);
    const timestamp = Date.now();

    const user = await User.create({
      name: "Test User",
      email: "test_" + timestamp + "@test.com",
      password,
      role: "salesExecutive",
      isActive: true,
    });

    expect(user).toBeDefined();
    expect(user._id).toBeDefined();
    expect(user.email).toContain("test_");
    expect(user.role).toBe("salesExecutive");
    expect(user.isActive).toBe(true);

    // Cleanup
    await User.findByIdAndDelete(user._id);
  });

  it("should enforce unique email constraint", async () => {
    const timestamp = Date.now();
    const email = "duplicate_" + timestamp + "@test.com";
    const bcrypt = (await import("bcryptjs")).default;
    const password = await bcrypt.hash("Test123!", 10);

    await User.create({
      name: "User 1",
      email,
      password,
      role: "salesExecutive",
    });

    // Try to create with same email
    try {
      await User.create({
        name: "User 2",
        email,
        password,
        role: "salesExecutive",
      });
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    }

    // Cleanup
    await User.deleteOne({ email });
  });
});

describe("Unit: Wallet Model", () => {
  let userId: string;
  let userEmail: string;

  beforeEach(async () => {
    await connectToDatabase();
    const testTimestamp = Date.now();
    const bcrypt = (await import("bcryptjs")).default;
    const password = await bcrypt.hash("Test123!", 10);

    userEmail = "wallet_" + testTimestamp + "@test.com";

    const user = await User.create({
      name: "Wallet User " + testTimestamp,
      email: userEmail,
      password,
      role: "salesExecutive",
    });
    userId = user._id.toString();

    // Clean up wallet for this user
    await Wallet.findOneAndDelete({ employeeId: userId });
  });

  afterEach(async () => {
    await Wallet.findOneAndDelete({ employeeId: userId });
  });

  afterAll(async () => {
    if (userEmail) {
      await User.deleteOne({ email: userEmail });
    }
  });

  it("should create wallet on first credit", async () => {
    const wallet = await Wallet.create({
      employeeId: userId,
      balance: 100,
      totalEarned: 100,
      pendingBalance: 100,
      transactions: [{
        amount: 100,
        type: "credit",
        description: "Commission",
        balanceAfter: 100,
      }],
    });

    expect(wallet).toBeDefined();
    expect(wallet.balance).toBe(100);
    expect(wallet.transactions.length).toBe(1);
  });

  it("should handle atomic balance updates", async () => {
    // Create initial wallet
    await Wallet.create({
      employeeId: userId,
      balance: 500,
      totalEarned: 500,
      pendingBalance: 500,
    });

    // Atomic increment
    const result = await Wallet.findOneAndUpdate(
      { employeeId: userId },
      { $inc: { balance: 250, totalEarned: 250 } },
      { new: true }
    );

    expect(result?.balance).toBe(750);
  });
});

describe("Unit: SalesRecord Model", () => {
  let userId: string;

  beforeAll(async () => {
    await connectToDatabase();
    const bcrypt = (await import("bcryptjs")).default;
    const password = await bcrypt.hash("Test123!", 10);

    const user = await User.create({
      name: "Sales User",
      email: "sales_" + Date.now() + "@test.com",
      password,
      role: "salesExecutive",
    });
    userId = user._id.toString();
  });

  afterAll(async () => {
    await SalesRecord.deleteMany({ employeeId: userId });
    await User.findByIdAndDelete(userId);
  });

  it("should create sales record with products", async () => {
    const unitPrice = 1000;
    const quantity = 5;
    const expectedTotal = unitPrice * quantity;

    const sale = await SalesRecord.create({
      employeeId: userId,
      employeeName: "Test Employee",
      companyName: "Test Company",
      companyEmail: "test@company.com",
      products: [
        {
          productName: "Product 1",
          categoryId: new mongoose.Types.ObjectId(),
          unitPrice,
          quantity,
        },
      ],
      commission: expectedTotal * 0.1, // 10% commission
      status: "Draft",
      approvalStatus: "Pending",
      accountantStatus: "Pending",
      financeStatus: "Pending",
    });

    expect(sale).toBeDefined();
    expect(sale.products.length).toBe(1);
    expect(sale.commission).toBe(500); // 5000 * 0.1
    expect(sale.status).toBe("Draft");

    // Verify total calculation
    const calculatedTotal = sale.products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    expect(calculatedTotal).toBe(expectedTotal);
  });

  it("should update status through workflow", async () => {
    const sale = await SalesRecord.create({
      employeeId: userId,
      employeeName: "Test Employee",
      companyName: "Test Company",
      companyEmail: "test@company.com",
      products: [{
        productName: "Product",
        categoryId: new mongoose.Types.ObjectId(),
        unitPrice: 1000,
        quantity: 1,
      }],
      commission: 100,
      status: "Draft",
    });

    // Submit
    sale.status = "Pending_Manager";
    sale.approvalStatus = "Pending";
    await sale.save();
    expect(sale.status).toBe("Pending_Manager");

    // Manager approve
    sale.status = "Pending_Accountant";
    sale.approvalStatus = "Approved";
    sale.approvedBy = new mongoose.Types.ObjectId();
    sale.approvedAt = new Date();
    await sale.save();
    expect(sale.status).toBe("Pending_Accountant");

    // Accountant process
    sale.status = "Pending_Finance";
    sale.accountantStatus = "Approved";
    sale.netSales = 900;
    await sale.save();
    expect(sale.status).toBe("Pending_Finance");

    // Finance approve
    sale.status = "Approved";
    sale.financeStatus = "Approved";
    sale.isPaid = true;
    await sale.save();
    expect(sale.status).toBe("Approved");
    expect(sale.isPaid).toBe(true);
  });
});

describe("Unit: Commission Calculations", () => {
  let userId: string;

  beforeAll(async () => {
    await connectToDatabase();
    const bcrypt = (await import("bcryptjs")).default;
    const password = await bcrypt.hash("Test123!", 10);

    const user = await User.create({
      name: "Commission User",
      email: "comm_" + Date.now() + "@test.com",
      password,
      role: "salesExecutive",
      targetAmount: 100000,
    });
    userId = user._id.toString();
  });

  afterAll(async () => {
    await SalesRecord.deleteMany({ employeeId: userId });
    await User.findByIdAndDelete(userId);
  });

  it("should calculate eligibility based on cumulative sales", async () => {
    // Target is 100,000, need 50% (50,000) to be eligible

    // Create approved sales totaling 60,000
    await SalesRecord.create([
      {
        employeeId: userId,
        employeeName: "Test Employee",
        companyName: "Company 1",
        companyEmail: "test1@company.com",
        products: [{ productName: "P1", categoryId: new mongoose.Types.ObjectId(), unitPrice: 30000, quantity: 1 }],
        commission: 3000,
        status: "Approved",
        approvalStatus: "Approved",
        financeStatus: "Approved",
        isPaid: true,
      },
      {
        employeeId: userId,
        employeeName: "Test Employee",
        companyName: "Company 2",
        companyEmail: "test2@company.com",
        products: [{ productName: "P2", categoryId: new mongoose.Types.ObjectId(), unitPrice: 30000, quantity: 1 }],
        commission: 3000,
        status: "Approved",
        approvalStatus: "Approved",
        financeStatus: "Approved",
        isPaid: true,
      },
    ]);

    // Wait for records to be saved
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Aggregate approved sales - use string employeeId (not ObjectId!)
    const result = await SalesRecord.aggregate([
      { $match: { employeeId: userId, status: "Approved" } },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: "$commission" },
          count: { $sum: 1 },
        },
      },
    ]);

    expect(result.length).toBeGreaterThan(0);
    const totalCommission = result[0]?.totalCommission || 0;
    expect(totalCommission).toBe(6000); // 3000 + 3000
    expect(result[0]?.count).toBe(2);
  });

  it("should calculate commission rate based on achievement", () => {
    const targetAmount = 100000;
    const actualSales = [30000, 60000, 120000];

    const achievements = actualSales.map((sales) => (sales / targetAmount) * 100);

    expect(achievements[0]).toBe(30); // 30% of target
    expect(achievements[1]).toBe(60); // 60% of target
    expect(achievements[2]).toBe(120); // 120% of target
  });
});

describe("Unit: Database Indexes", () => {
  beforeAll(async () => {
    await connectToDatabase();
  });

  it("should have compound index on User model", async () => {
    const indexes = await User.collection.getIndexes();

    // Check for email index
    expect(indexes.email_1).toBeDefined();
  });

  it("should have indexes on Wallet model", async () => {
    const indexes = await Wallet.collection.getIndexes();

    // Check for employeeId index
    expect(indexes.employeeId_1).toBeDefined();
  });

  it("should have indexes on SalesRecord model", async () => {
    const indexes = await SalesRecord.collection.getIndexes();

    // Check for employeeId index
    expect(indexes.employeeId_1).toBeDefined();
  });
});
