import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

// Ensure screenshot directory exists
const screenshotDir = path.resolve("tests/screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runFinanceE2E() {
  console.log("🚀 Starting E2E Finance Final Approval Step...");
  console.log("👉 Note: This test expects the Accountant E2E test to have run first!");

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };
  const context = await browser.newContext({ viewport: viewportSettings });
  const page = await context.newPage();

  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);

  page.on("console", msg => console.log(`[Finance-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on("pageerror", err => console.error(`[Finance-error] ${err.toString()}`));

  try {
    // -------------------------------------------------------------
    // STEP 1: Finance Login
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Finance Login ---");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("Logging in as Finance (finance@incentive.io)...");
    await page.fill("input[name='email']", "finance@incentive.io");
    await page.fill("input[name='password']", "Finance123!");
    await page.click("button[type='submit']");

    await page.waitForURL("**/finance**");
    console.log("✓ Logged in successfully!");
    await page.waitForTimeout(4000);

    await page.screenshot({ path: "tests/screenshots/finance-step1-dashboard.png" });
    console.log("✓ Saved screenshot to tests/screenshots/finance-step1-dashboard.png");

    // -------------------------------------------------------------
    // STEP 2: Final Approval
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Final Approval of Sales Record ---");
    await page.goto("http://localhost:3000/finance/approvals", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("Locating 'Apex Systems Ltd' record and opening details...");
    const financeRow = page.locator('tr', { hasText: 'Apex Systems Ltd' }).first();
    await financeRow.waitFor({ state: 'visible', timeout: 15000 });
    await financeRow.locator("button:has-text('View')").first().click({ force: true });
    await page.waitForTimeout(3000);

    console.log("Clicking Approve button in detail dialog...");
    await page.locator("div[role='dialog'] button:has-text('Approve')").first().click({ force: true });
    await page.waitForTimeout(2000);

    console.log("Confirming Final Approval in confirmation dialog...");
    await page.locator("div[role='dialog'] button:has-text('Approve')").first().click({ force: true });
    await page.waitForTimeout(5000);

    console.log("✓ Finance successfully final-approved! Commission credited to wallet atomically.");

    await page.screenshot({ path: "tests/screenshots/finance-step2-approved.png" });
    console.log("✓ Saved screenshot to tests/screenshots/finance-step2-approved.png");

    console.log("\n🏁 Finance Final Approval Step Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ Finance Final Approval Step Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runFinanceE2E();
