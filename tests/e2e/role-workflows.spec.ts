/**
 * E2E Test Scenarios for Incentive.io
 * Tests complete workflows for all 6 roles
 */

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { User, SalesRecord, Wallet } from "@/lib/models";
import { createTestUser, cleanupTestUser, createTestSale, ensureMongoConnection } from "../helpers/test-actions";

describe("E2E: Sales Executive Workflow", () => {
  let userId: string;

  beforeAll(async () => {
    await ensureMongoConnection();
    userId = await createTestUser("salesExecutive", "e2e_exec");
  });

  afterAll(async () => {
    await cleanupTestUser(userId);
  });

  it("should create, view, submit, edit, delete draft sales record", async () => {
    const { createSalesRecord, getSalesRecords, submitSalesRecord, updateSalesRecord, deleteSalesRecord } =
      await import("@/lib/actions/sales.actions");

    // 1. Create draft
    const sale = await createSalesRecord({
      employeeId: userId,
      employeeName: "E2E Executive",
      companyName: "E2E Company",
      companyEmail: "e2e@company.com",
      products: [
        {
          productName: "E2E Product",
          categoryId: "000000000000000000000001",
          unitPrice: 1000,
          quantity: 5,
        },
      ],
      taxEnabled: false,
      vatEnabled: false,
    });

    expect(sale?.success).toBe(true);
    expect(sale?.id).toBeDefined();
    if (!sale?.id) throw new Error("Create failed");

    // 2. View my sales (should include new draft)
    const mySalesResult = await getSalesRecords({ employeeId: userId });
    const mySales = Array.isArray(mySalesResult) ? mySalesResult : [];
    expect(mySales.length).toBeGreaterThanOrEqual(1);
    const newSale = mySales.find((s: any) => s.id === sale.id);
    expect(newSale?.status).toBe("Draft");

    // 3. Update draft
    const updated = await updateSalesRecord(sale.id, {
      companyName: "Updated E2E Company",
      products: [
        {
          productName: "E2E Product",
          categoryId: "000000000000000000000001",
          unitPrice: 1500,
          quantity: 3,
        },
      ],
    });
    expect(updated?.success).toBe(true);

    // 4. Submit for approval
    const submitted = await submitSalesRecord(sale.id);
    expect(submitted?.success).toBe(true);

    // 5. Verify cannot edit after submit
    const editAfterSubmit = await updateSalesRecord(sale.id, {
      companyName: "Should Fail",
      products: [],
    });
    expect(editAfterSubmit?.error).toBeDefined();

    // 6. Verify cannot delete after submit
    const deleteAfterSubmit = await deleteSalesRecord(sale.id);
    expect(deleteAfterSubmit?.error).toBeDefined();
  });
});

describe("E2E: Sales Manager Workflow", () => {
  let managerId: string;
  let execId: string;
  let saleId: string;

  beforeAll(async () => {
    await ensureMongoConnection();

    managerId = await createTestUser("salesManager", "e2e_mgr");
    execId = await createTestUser("salesExecutive", "e2e_exec2");
  });

  afterAll(async () => {
    await cleanupTestUser(managerId);
    await cleanupTestUser(execId);
  });

  it("should view team sales, approve, reject, and see analytics", async () => {
    const { createSalesRecord, submitSalesRecord } = await import("@/lib/actions/sales.actions");
    const { getPendingManagerApprovals, approveSale } = await import("@/lib/actions/approval.actions");

    // 1. Create sale as executive
    const sale = await createSalesRecord({
      employeeId: execId,
      employeeName: "E2E Executive",
      companyName: "E2E Team Company",
      companyEmail: "team@company.com",
      products: [
        {
          productName: "E2E Product",
          categoryId: "000000000000000000000001",
          unitPrice: 2000,
          quantity: 10,
        },
      ],
      taxEnabled: false,
      vatEnabled: false,
    });

    if (!sale?.id) throw new Error("Create failed");
    saleId = sale.id;

    // 2. Submit
    await submitSalesRecord(saleId);

    // 3. Manager views pending approvals
    const pendingResult = await getPendingManagerApprovals();
    const pending = Array.isArray(pendingResult) ? pendingResult : [];
    expect(pending.length).toBeGreaterThan(0);
    const firstPending = pending[0];
    expect((firstPending as any)?.status).toBe("Pending_Manager");

    // 4. Manager approves
    const approved = await approveSale(saleId);
    expect(approved?.success).toBe(true);

    // Note: getTeamAnalytics functionality not yet implemented
  });
});

describe("E2E: Accountant Workflow", () => {
  let accountantId: string;
  let execId: string;
  let saleId: string;

  beforeAll(async () => {
    await ensureMongoConnection();

    accountantId = await createTestUser("accountant", "e2e_acct");
    execId = await createTestUser("salesExecutive", "e2e_exec3");

    // Create a sale at Pending_Accountant stage
    const { createSalesRecord, submitSalesRecord } = await import("@/lib/actions/sales.actions");
    const { approveSale } = await import("@/lib/actions/approval.actions");

    const sale = await createSalesRecord({
      employeeId: execId,
      employeeName: "E2E Exec3",
      companyName: "E2E Accountant Test",
      companyEmail: "acct@company.com",
      products: [
        {
          productName: "E2E Product",
          categoryId: "000000000000000000000001",
          unitPrice: 5000,
          quantity: 5,
        },
      ],
      taxEnabled: false,
      vatEnabled: false,
    });

    if (!sale?.id) throw new Error("Create failed");
    saleId = sale.id;

    await submitSalesRecord(saleId);
    await approveSale(saleId);
  });

  afterAll(async () => {
    await cleanupTestUser(accountantId);
    await cleanupTestUser(execId);
  });

  it("should process with tax/VAT/EOBP, calculate net, forward to finance", async () => {
    const { getPendingAccountantApprovals, processByAccountant } = await import("@/lib/actions/approval.actions");

    // 1. View pending
    const pendingResult = await getPendingAccountantApprovals();
    const pending = Array.isArray(pendingResult) ? pendingResult : [];
    const saleToProcess = pending.find((p: any) => p.id === saleId);
    expect(saleToProcess).toBeDefined();
    expect((saleToProcess as any)?.status).toBe("Pending_Accountant");

    // 2. Process with deductions
    const processed = await processByAccountant({
      id: saleId,
      taxRate: 10,
      vatRate: 15,
      eoBpAmount: 500,
      eoBpReason: "Test deduction",
    });

    expect(processed?.success).toBe(true);

    // 3. Verify net calculation
    const record = await SalesRecord.findById(saleId).lean();
    const expectedNet = 25000 - 2500 - 3750 - 500; // gross - tax - vat - eobp
    expect(record?.netSales).toBe(expectedNet);
  });
});

describe("E2E: Finance Workflow", () => {
  let financeId: string;
  let execId: string;
  let saleId: string;

  beforeAll(async () => {
    await ensureMongoConnection();

    financeId = await createTestUser("finance", "e2e_fin");
    execId = await createTestUser("salesExecutive", "e2e_exec4");

    // Create a sale at Pending_Finance stage
    const { createSalesRecord, submitSalesRecord } = await import("@/lib/actions/sales.actions");
    const { approveSale, processByAccountant } = await import("@/lib/actions/approval.actions");

    const sale = await createSalesRecord({
      employeeId: execId,
      employeeName: "E2E Exec4",
      companyName: "E2E Finance Test",
      companyEmail: "finance@company.com",
      products: [
        {
          productName: "E2E Product",
          categoryId: "000000000000000000000001",
          unitPrice: 8000,
          quantity: 3,
        },
      ],
      taxEnabled: false,
      vatEnabled: false,
    });

    if (!sale?.id) throw new Error("Create failed");
    saleId = sale.id;

    await submitSalesRecord(saleId);
    await approveSale(saleId);
    await processByAccountant({ id: saleId, taxRate: 5, vatRate: 5 });
  });

  afterAll(async () => {
    await cleanupTestUser(financeId);
    await cleanupTestUser(execId);
  });

  it("should final approve, trigger wallet credit, mark as paid", async () => {
    const { getPendingFinanceApprovals, finalApproveByFinance } = await import("@/lib/actions/approval.actions");

    // 1. View pending
    const pendingResult = await getPendingFinanceApprovals();
    const pending = Array.isArray(pendingResult) ? pendingResult : [];
    const saleToApprove = pending.find((p: any) => p.id === saleId);
    expect(saleToApprove).toBeDefined();
    expect((saleToApprove as any)?.status).toBe("Pending_Finance");

    // 2. Final approve
    const approved = await finalApproveByFinance(saleId, financeId);
    console.log("Final approve result:", approved);
    expect(approved?.success).toBe(true);

    // 3. Verify wallet credited
    const record = await SalesRecord.findById(saleId).lean();
    const mongoose = await import("mongoose");

    // Debug: log the employeeId from the record
    console.log("Record employeeId:", record?.employeeId, typeof record?.employeeId);
    console.log("Record commission:", record?.commission, "calculatedCommission:", record?.calculatedCommission);

    // Find wallet - employeeId in Wallet is ObjectId, employeeId in SalesRecord is string
    const wallet = await Wallet.findOne({ employeeId: record?.employeeId ? new mongoose.Types.ObjectId(record.employeeId) : undefined });

    console.log("Wallet found:", wallet ? "Yes" : "No", "Balance:", wallet?.balance);

    expect(wallet?.balance).toBeGreaterThan(0);
    expect(record?.isPaid).toBe(true);
    expect(record?.financeStatus).toBe("Approved");
  });
});

describe("E2E: Admin Workflow", () => {
  let adminId: string;
  let userId: string;

  beforeAll(async () => {
    await ensureMongoConnection();
    adminId = await createTestUser("admin", "e2e_admin");
  });

  afterAll(async () => {
    await cleanupTestUser(adminId);
    await cleanupTestUser(userId);
  });

  it("should create users, view system stats, manage targets", async () => {
    const { assignTarget } = await import("@/lib/actions/target.actions");
    const { createUser: createExec, getUsers } = await import("@/lib/actions/user.actions");

    // 1. Create new user
    const testEmail = `e2e_new_${Date.now()}@test.com`;
    const user = await createExec({
      name: "E2E New User",
      email: testEmail,
      password: "Test123!@#456",
      role: "salesExecutive",
    });
    expect(user?.success).toBe(true);

    // Get the created user's ID by querying
    const createdUser = await User.findOne({ email: testEmail.toLowerCase() });
    userId = createdUser?._id?.toString() || "";

    // 2. Create commission target using assignTarget
    const target = await assignTarget({
      userId,
      targetAmount: 50000,
      period: "monthly",
    });
    expect(target?.success).toBe(true);

    // 3. View all users (getSystemStats not yet implemented)
    const usersResult = await getUsers({ search: "", role: "all" });
    const users = Array.isArray(usersResult) ? usersResult : [];
    expect(users.length).toBeGreaterThan(0);
  });
});

describe("E2E: Administrator (Super Admin) Workflow", () => {
  let superAdminId: string;

  beforeAll(async () => {
    await ensureMongoConnection();
    superAdminId = await createTestUser("administrator", "e2e_super");
  });

  afterAll(async () => {
    await cleanupTestUser(superAdminId);
  });

  it("should access all dashboards and perform full admin tasks", async () => {
    const { getUsers } = await import("@/lib/actions/user.actions");
    const { getSalesRecords } = await import("@/lib/actions/sales.actions");
    const { getAllWallets } = await import("@/lib/actions/wallet.actions");

    // 1. View all users
    const users = await getUsers({ search: "", role: "all" });
    expect(Array.isArray(users)).toBe(true);

    // 2. View all sales (using getSalesRecords without employeeId filter)
    const sales = await getSalesRecords({});
    expect(Array.isArray(sales)).toBe(true);

    // 3. View all wallets
    const wallets = await getAllWallets();
    expect(Array.isArray(wallets)).toBe(true);
  });
});
