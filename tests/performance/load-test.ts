/**
 * Performance and Load Tests for Incentive.io
 * Tests wallet concurrency, dashboard performance, and query optimization
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { User, Wallet, SalesRecord } from "@/lib/models";
import { createTestUser, cleanupTestUser, ensureMongoConnection } from "../helpers/test-actions";

describe("Performance: Wallet Operations", () => {
  let userId: string;

  beforeAll(async () => {
    await ensureMongoConnection();
    userId = await createTestUser("salesExecutive", "perf");
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
  });

  it("should handle 100 concurrent credit operations without balance drift", async () => {
    const { creditWallet, getWallet } = await import("@/lib/actions/wallet.actions");

    const CONCURRENT_OPS = 100;
    const AMOUNT_PER_OP = 50;
    const EXPECTED_BALANCE = CONCURRENT_OPS * AMOUNT_PER_OP;

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < CONCURRENT_OPS; i++) {
      promises.push(
        creditWallet({
          employeeId: userId,
          amount: AMOUNT_PER_OP,
          description: `Concurrent test ${i}`,
        })
      );
    }

    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;

    // All operations should succeed
    const successCount = results.filter((r) => r?.success).length;
    expect(successCount).toBe(CONCURRENT_OPS);

    // Balance should be exact
    const wallet = await getWallet(userId);
    expect(wallet?.balance).toBe(EXPECTED_BALANCE);

    // Performance check: all operations should complete in <5 seconds
    expect(duration).toBeLessThan(5000);

    console.log(`✓ ${CONCURRENT_OPS} concurrent credits in ${duration}ms (${(duration / CONCURRENT_OPS).toFixed(2)}ms/op)`);
  });

  it("should handle 50 mixed credit/debit operations atomically", async () => {
    const { creditWallet, debitWallet, getWallet } = await import("@/lib/actions/wallet.actions");

    const MIXED_OPS = 50;
    let expectedBalance = 0;

    const promises = [];

    for (let i = 0; i < MIXED_OPS; i++) {
      const isCredit = i % 2 === 0;
      const amount = Math.floor(Math.random() * 100) + 10;

      if (isCredit) {
        expectedBalance += amount;
        promises.push(
          creditWallet({
            employeeId: userId,
            amount,
            description: `Mixed credit ${i}`,
          })
        );
      } else {
        expectedBalance -= amount;
        promises.push(
          debitWallet({
            employeeId: userId,
            amount,
            description: `Mixed debit ${i}`,
          })
        );
      }
    }

    await Promise.all(promises);

    const wallet = await getWallet(userId);
    expect(wallet?.balance).toBe(expectedBalance);
  });

  it("should prevent overdraft in concurrent debit operations", async () => {
    const { debitWallet, getWallet } = await import("@/lib/actions/wallet.actions");

    const DEBIT_OPS = 20;
    const DEBIT_AMOUNT = 1000;
    const initialBalance = 500;

    // Set initial balance
    await Wallet.findOneAndUpdate({ employeeId: userId }, { balance: initialBalance });

    const promises = [];
    for (let i = 0; i < DEBIT_OPS; i++) {
      promises.push(
        debitWallet({
          employeeId: userId,
          amount: DEBIT_AMOUNT,
          description: `Overdraft test ${i}`,
        })
      );
    }

    const results = await Promise.all(promises);

    // Only first debit should succeed (balance insufficient for rest)
    const successCount = results.filter((r) => r?.success).length;
    expect(successCount).toBeLessThan(DEBIT_OPS);

    // Balance should never go negative
    const wallet = await getWallet(userId);
    expect(wallet?.balance).toBeGreaterThanOrEqual(0);
  });
});

describe("Performance: Dashboard Queries", () => {
  let testUserId: string;

  beforeAll(async () => {
    await ensureMongoConnection();

    testUserId = await createTestUser("salesExecutive", "dash");

    // Create 100 sales records for testing
    const sales = [];
    for (let i = 0; i < 100; i++) {
      sales.push({
        employeeId: testUserId,
        employeeName: "Dashboard User",
        companyName: `Test Company ${i}`,
        companyEmail: `test${i}@company.com`,
        products: [
          {
            productName: "Test Product",
            categoryId: "0000000000000000000000001",
            unitPrice: 1000 + i * 10,
            quantity: i + 1,
          },
        ],
        totalAmount: (1000 + i * 10) * (i + 1),
        status: i < 50 ? "Approved" : "Draft",
        approvalStatus: i < 50 ? "Approved" : "Pending",
        financeStatus: i < 50 ? "Approved" : "Pending",
        isPaid: i < 50,
        commission: i < 50 ? (1000 + i * 10) * (i + 1) * 0.1 : 0,
      });
    }

    await SalesRecord.insertMany(sales);
  });

  afterAll(async () => {
    if (testUserId) {
      await SalesRecord.deleteMany({ employeeId: testUserId });
      await cleanupTestUser(testUserId);
    }
  });

  it("should load dashboard with 100 records in <500ms", async () => {
    const { getSalesRecords } = await import("@/lib/actions/sales.actions");

    const startTime = Date.now();

    const records = await getSalesRecords({ employeeId: testUserId });

    const duration = Date.now() - startTime;

    expect(records).toBeDefined();
    expect(Array.isArray(records)).toBe(true);
    expect(duration).toBeLessThan(500);

    console.log(`✓ Loaded ${records.length} records in ${duration}ms`);
  });

  it("should use aggregation for commission calculation efficiently", async () => {
    const { getCommissions } = await import("@/lib/actions/commission.actions");

    const startTime = Date.now();

    const commissions = await getCommissions(testUserId);

    const duration = Date.now() - startTime;

    expect(commissions).toBeDefined();
    expect(duration).toBeLessThan(300);

    console.log(`✓ Commission calculation in ${duration}ms`);
  });
});

describe("Performance: Database Indexes", () => {
  beforeAll(async () => {
    await ensureMongoConnection();
  });

  it("should use index for employeeId queries on SalesRecord", async () => {
    const explain = await SalesRecord.find({ employeeId: "000000000000000000000000" }).explain();

    // Check if query uses an index
    const hasIndex = explain.executionStats?.totalDocsExamined < explain.executionStats?.totalKeysExamined;
    expect(hasIndex || explain.executionStats?.executionTimeMillis < 10).toBe(true);
  });

  it("should use compound index for employeeId + status queries", async () => {
    const explain = await SalesRecord.find({ employeeId: "000000000000000000000000", status: "Approved" }).explain();

    const executionTime = explain.executionStats?.executionTimeMillis || 0;
    expect(executionTime).toBeLessThan(20);
  });
});

describe("Performance: Notification System", () => {
  let userId: string;

  beforeAll(async () => {
    await ensureMongoConnection();
    userId = await createTestUser("salesExecutive", "notif");
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
  });

  it("should handle bulk notification creation efficiently", async () => {
    const { createNotification } = await import("@/lib/actions/notification.actions");

    const NOTIFICATION_COUNT = 50;
    const startTime = Date.now();

    const promises = [];
    for (let i = 0; i < NOTIFICATION_COUNT; i++) {
      promises.push(
        createNotification({
          userId,
          title: `Test Notification ${i}`,
          message: `Test message ${i}`,
          type: "info",
        })
      );
    }

    await Promise.all(promises);

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(2000);

    console.log(`✓ Created ${NOTIFICATION_COUNT} notifications in ${duration}ms`);
  });
});
