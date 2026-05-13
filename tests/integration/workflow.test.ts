/**
 * Integration tests for Incentive.io
 * Tests complete workflows across all 6 roles
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { User, SalesRecord } from "@/lib/models";
import { createTestUser, cleanupTestUser, createTestSale, ensureMongoConnection } from "../helpers/test-actions";

describe("Approval Workflow Integration Tests", () => {
  let salesExecutiveId: string;
  let salesManagerId: string;
  let accountantId: string;
  let financeId: string;

  beforeAll(async () => {
    await ensureMongoConnection();

    // Create test users
    salesExecutiveId = await createTestUser("salesExecutive", "exec");
    salesManagerId = await createTestUser("salesManager", "mgr");
    accountantId = await createTestUser("accountant", "acct");
    financeId = await createTestUser("finance", "fin");
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestUser(salesExecutiveId);
    await cleanupTestUser(salesManagerId);
    await cleanupTestUser(accountantId);
    await cleanupTestUser(financeId);
  });

  it("should complete full approval workflow: Draft → Approved", async () => {
    const { createSalesRecord, submitSalesRecord } = await import("@/lib/actions/sales.actions");
    const { approveSale, processByAccountant, finalApproveByFinance } = await import("@/lib/actions/approval.actions");

    // 1. Create sale
    const sale = await createTestSale(salesExecutiveId);

    expect(sale).toBeDefined();
    expect(sale.success).toBe(true);
    expect(sale.id).toBeDefined();

    if (!sale.id) {
      throw new Error("Sale creation failed");
    }

    // 2. Submit - should move to Pending_Manager
    const submitResult = await submitSalesRecord(sale.id);
    expect(submitResult).toBeDefined();
    expect(submitResult.success).toBe(true);

    const submittedRecord = await SalesRecord.findById(sale.id).lean();
    expect(submittedRecord?.status).toBe("Pending_Manager");

    // 3. Manager approve - should move to Pending_Accountant
    const approveResult = await approveSale(sale.id);
    expect(approveResult).toBeDefined();
    expect(approveResult.success).toBe(true);

    const managerApproved = await SalesRecord.findById(sale.id).lean();
    expect(managerApproved?.status).toBe("Pending_Accountant");

    // 4. Accountant process - should move to Pending_Finance
    const processResult = await processByAccountant({
      id: sale.id,
      taxRate: 10,
      vatRate: 5,
      eoBpAmount: 100,
      eoBpReason: "Test deduction",
    });

    expect(processResult).toBeDefined();
    expect(processResult.success).toBe(true);

    const processed = await SalesRecord.findById(sale.id).lean();
    expect(processed?.status).toBe("Pending_Finance");

    // 5. Finance final approve - should be Approved
    const finalResult = await finalApproveByFinance(sale.id, financeId);
    expect(finalResult).toBeDefined();
    if (finalResult?.error) {
      console.error("Finance approval error:", finalResult.error);
    }
    expect(finalResult.success).toBe(true);

    const final = await SalesRecord.findById(sale.id).lean();
    expect(final?.status).toBe("Approved");
    expect(final?.financeStatus).toBe("Approved");
    expect(final?.isPaid).toBe(true);
  });

  it("should handle rejection and return to Draft", async () => {
    const { createSalesRecord, submitSalesRecord } = await import("@/lib/actions/sales.actions");
    const { rejectSale } = await import("@/lib/actions/approval.actions");

    // Create and submit sale
    const sale = await createTestSale(salesExecutiveId);

    if (!sale.id) throw new Error("Sale creation failed");

    await submitSalesRecord(sale.id);

    // Manager rejects
    const rejectResult = await rejectSale(sale.id, "Insufficient documentation", "manager");
    expect(rejectResult).toBeDefined();
    expect(rejectResult.success).toBe(true);

    const rejected = await SalesRecord.findById(sale.id).lean();
    expect(rejected?.status).toBe("Draft");
    expect(rejected?.approvalStatus).toBe("Rejected");
    expect(rejected?.rejectionReason).toBe("Insufficient documentation");
    expect(rejected?.rejectedBy).toBe("manager");
  });

  it("should prevent unauthorized access across roles", async () => {
    const { createSalesRecord, submitSalesRecord } = await import("@/lib/actions/sales.actions");
    const { processByAccountant } = await import("@/lib/actions/approval.actions");

    // Sales executive should not be able to approve
    const sale = await createTestSale(salesExecutiveId);

    if (!sale.id) throw new Error("Sale creation failed");

    await submitSalesRecord(sale.id);

    // Try to approve as accountant (should fail - still at manager stage)
    const result = await processByAccountant({
      id: sale.id,
      taxRate: 10,
    });

    // Accountant should fail because sale is at Pending_Manager, not Pending_Accountant
    expect(result?.error).toBeDefined();
  });
});

describe("Wallet Operations Integration Tests", () => {
  let userId: string;

  beforeAll(async () => {
    await ensureMongoConnection();
    userId = await createTestUser("salesExecutive", "wallet");
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
  });

  it("should handle concurrent credit operations atomically", async () => {
    const { creditWallet, getWallet } = await import("@/lib/actions/wallet.actions");

    // Create multiple concurrent credit operations
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        creditWallet({
          employeeId: userId,
          amount: 100,
          description: `Concurrent test ${i}`,
        })
      );
    }

    const results = await Promise.all(promises);

    // All should succeed
    results.forEach((result, index) => {
      if (result?.error) {
        console.error(`Credit ${index} error:`, result.error);
      }
      expect(result?.success).toBe(true);
      expect(result?.error).toBeUndefined();
    });

    // Verify final balance
    const wallet = await getWallet(userId);

    expect(wallet?.balance).toBe(1000);
  });

  it("should prevent double credit for same sale", async () => {
    const { markCommissionPaid } = await import("@/lib/actions/wallet.actions");
    const mongoose = await import("mongoose");

    // Generate valid ObjectId
    const salesRecordId = new mongoose.Types.ObjectId().toString();

    const result1 = await markCommissionPaid({
      employeeId: userId,
      amount: 500,
      salesRecordId,
      paidBy: userId,
    });

    expect(result1?.success).toBe(true);

    // Second attempt should fail
    const result2 = await markCommissionPaid({
      employeeId: userId,
      amount: 500,
      salesRecordId,
      paidBy: userId,
    });

    expect(result2).toBeDefined();
    if (result2 && "error" in result2) {
      expect(result2.error).toContain("already paid");
    } else {
      throw new Error("Expected error but got success");
    }
  });
});
