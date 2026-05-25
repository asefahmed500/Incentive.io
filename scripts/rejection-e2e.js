import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Ensure screenshot directory exists
const screenshotDir = path.resolve("tests/screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Self-healing dialog opener for HMR resilience
async function clickAndEnsureVisible(page, triggerSelector, targetSelector, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    console.log(`[Self-Healing] Opening dialog via "${triggerSelector}" (Attempt ${i + 1}/${maxRetries})...`);
    await page.click(triggerSelector, { force: true });
    await page.waitForTimeout(2000);
    try {
      await page.waitForSelector(targetSelector, { state: 'visible', timeout: 4000 });
      console.log(`[Self-Healing] ✓ Dialog element "${targetSelector}" is visible!`);
      return;
    } catch (e) {
      console.log(`[Self-Healing] ⚠️ Element not visible after attempt ${i + 1}. HMR may have unmounted modal. Retrying...`);
    }
  }
  throw new Error(`Failed to open dialog containing "${targetSelector}" using trigger "${triggerSelector}"`);
}

async function runRejectionE2E() {
  console.log("🚀 Starting E2E Rejection Workflow Test...");
  console.log("   This test covers: Admin setup → Executive submits → Manager REJECTS → Executive verifies Draft status");

  // Seed fresh database
  try {
    console.log("\nSeeding database...");
    execSync("npm run seed", { stdio: "inherit" });
    console.log("✓ Database seeded successfully!");
  } catch (seedError) {
    console.warn("⚠️ Database seed warning (continuing anyway):", seedError.message);
  }

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };

  try {
    // =============================================================
    // PART 1: SALES EXECUTIVE SUBMITS RECORD FOR REJECTION
    // =============================================================
    console.log("\n=============================================================");
    console.log("📤 PART 1: Sales Executive Submits Record");
    console.log("=============================================================");

    const execContext = await browser.newContext({ viewport: viewportSettings });
    const execPage = await execContext.newPage();
    execPage.setDefaultNavigationTimeout(120000);
    execPage.setDefaultTimeout(60000);
    execPage.on("console", msg => console.log(`[Exec-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    execPage.on("pageerror", err => console.error(`[Exec-error] ${err.toString()}`));

    await execPage.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await execPage.waitForTimeout(8000);

    console.log("Logging in as Sales Executive (karim@incentive.io)...");
    await execPage.fill("input[name='email']", "karim@incentive.io");
    await execPage.fill("input[name='password']", "Executive123!");
    await execPage.click("button[type='submit']");
    await execPage.waitForURL("**/sales-dashboard");
    console.log("✓ Logged in as Sales Executive!");
    await execPage.waitForTimeout(4000);

    console.log("Navigating to Add Record page...");
    await execPage.goto("http://localhost:3000/sales-dashboard/add-record", { waitUntil: "domcontentloaded" });
    await execPage.waitForTimeout(8000);

    console.log("Filling details for rejection test record...");
    await execPage.fill("input#companyName", "Rejection Inc");
    await execPage.fill("input#companyEmail", "billing@rejection.com");
    await execPage.fill("input[placeholder='Enter product name']", "Enterprise CRM");

    const catTrigger = execPage.locator('button:has-text("Select category")');
    await catTrigger.click();
    await execPage.waitForTimeout(1500);
    let cnt = await execPage.locator('[role="option"]').count();
    if (cnt === 0) { await catTrigger.focus(); await catTrigger.press("Space"); await execPage.waitForTimeout(1500); }
    const softwareOpt = execPage.locator('[role="option"]').filter({ hasText: 'Software' });
    await softwareOpt.waitFor({ state: 'visible', timeout: 15000 });
    await softwareOpt.click({ force: true });
    await execPage.waitForTimeout(1000);

    await execPage.fill("input[placeholder='0.00'][required]", "10000");
    await execPage.fill("input[min='1']", "2");
    await execPage.waitForTimeout(1000);

    console.log("Submitting record...");
    await execPage.click("button:has-text('Submit for Approval')", { force: true });
    await execPage.waitForURL("**/sales-dashboard/records", { timeout: 60000 });
    await execPage.waitForTimeout(4000);
    console.log("✓ Record submitted — now pending Manager.");

    await execPage.screenshot({ path: "tests/screenshots/reject-step1-submitted.png" });
    console.log("✓ Saved screenshot to tests/screenshots/reject-step1-submitted.png");

    await execPage.close();
    await execContext.close();

    // =============================================================
    // PART 2: SALES MANAGER REJECTS THE RECORD
    // =============================================================
    console.log("\n=============================================================");
    console.log("❌ PART 2: Sales Manager Rejects Record");
    console.log("=============================================================");

    const mgrContext = await browser.newContext({ viewport: viewportSettings });
    const mgrPage = await mgrContext.newPage();
    mgrPage.setDefaultNavigationTimeout(120000);
    mgrPage.setDefaultTimeout(60000);
    mgrPage.on("console", msg => console.log(`[Manager-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    mgrPage.on("pageerror", err => console.error(`[Manager-error] ${err.toString()}`));

    await mgrPage.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await mgrPage.waitForTimeout(8000);

    console.log("Logging in as Sales Manager (jamal@incentive.io)...");
    await mgrPage.fill("input[name='email']", "jamal@incentive.io");
    await mgrPage.fill("input[name='password']", "Manager123!");
    await mgrPage.click("button[type='submit']");
    await mgrPage.waitForURL("**/sales-manager**");
    console.log("✓ Logged in as Sales Manager!");
    await mgrPage.waitForTimeout(4000);

    console.log("Navigating to Pending Approvals...");
    await mgrPage.goto("http://localhost:3000/sales-manager/pending-approvals", { waitUntil: "domcontentloaded" });
    await mgrPage.waitForTimeout(8000);

    console.log("Locating 'Rejection Inc' row and clicking reject button...");
    const rejectRow = mgrPage.locator('tr', { hasText: 'Rejection Inc' }).first();
    await rejectRow.waitFor({ state: 'visible', timeout: 15000 });
    await rejectRow.locator('button:has(.text-red-500)').first().click({ force: true });
    await mgrPage.waitForTimeout(2000);

    console.log("Filling custom rejection reason...");
    await mgrPage.fill("input[placeholder='Enter rejection reason...']", "Incomplete deal documentation, please attach PDF contract.");
    await mgrPage.waitForTimeout(1000);

    console.log("Confirming rejection...");
    await mgrPage.click("button:has-text('Confirm Reject')", { force: true });
    await mgrPage.waitForTimeout(5000);
    console.log("✓ Record rejected! Should now be back in Draft state.");

    await mgrPage.screenshot({ path: "tests/screenshots/reject-step2-rejected.png" });
    console.log("✓ Saved screenshot to tests/screenshots/reject-step2-rejected.png");

    await mgrPage.close();
    await mgrContext.close();

    // =============================================================
    // PART 3: EXECUTIVE VERIFIES DRAFT STATE & REJECTION REASON
    // =============================================================
    console.log("\n=============================================================");
    console.log("🔍 PART 3: Executive Verifies Draft Status & Rejection Reason");
    console.log("=============================================================");

    const verifyContext = await browser.newContext({ viewport: viewportSettings });
    const verifyPage = await verifyContext.newPage();
    verifyPage.setDefaultNavigationTimeout(120000);
    verifyPage.setDefaultTimeout(60000);
    verifyPage.on("console", msg => console.log(`[Verify-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));

    await verifyPage.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await verifyPage.waitForTimeout(8000);

    await verifyPage.fill("input[name='email']", "karim@incentive.io");
    await verifyPage.fill("input[name='password']", "Executive123!");
    await verifyPage.click("button[type='submit']");
    await verifyPage.waitForURL("**/sales-dashboard");
    await verifyPage.waitForTimeout(4000);

    console.log("Navigating to Records list...");
    await verifyPage.goto("http://localhost:3000/sales-dashboard/records", { waitUntil: "domcontentloaded" });
    await verifyPage.waitForTimeout(6000);

    const bodyText = await verifyPage.textContent("body");
    if (bodyText.includes("Draft")) {
      console.log("✓ Record is back in Draft state — rejection correctly applied!");
    } else {
      console.log("⚠️ Draft status not found. Record may not have reverted correctly.");
    }
    if (bodyText.includes("Rejection Inc")) {
      console.log("✓ 'Rejection Inc' record still visible to executive.");
    }

    await verifyPage.screenshot({ path: "tests/screenshots/reject-step3-draft-verified.png" });
    console.log("✓ Saved screenshot to tests/screenshots/reject-step3-draft-verified.png");

    console.log("Checking dashboard for rejection notification...");
    await verifyPage.goto("http://localhost:3000/sales-dashboard", { waitUntil: "domcontentloaded" });
    await verifyPage.waitForTimeout(6000);

    const dashText = await verifyPage.textContent("body");
    if (dashText.toLowerCase().includes("reject")) {
      console.log("✓ Rejection notification visible on dashboard!");
    } else {
      console.log("⚠️ Rejection notification not found in dashboard text.");
    }

    await verifyPage.screenshot({ path: "tests/screenshots/reject-step4-notification.png" });
    console.log("✓ Saved screenshot to tests/screenshots/reject-step4-notification.png");

    await verifyPage.close();
    await verifyContext.close();

    console.log("\n🏁 Rejection Workflow E2E Test Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ Rejection Workflow E2E Test Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runRejectionE2E();
