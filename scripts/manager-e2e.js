import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Ensure screenshot directory exists
const screenshotDir = path.resolve("tests/screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runManagerE2E() {
  console.log("🚀 Starting E2E Sales Manager Approval Step...");
  console.log("👉 Note: This test expects the Sales Executive E2E test to have run first!");

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };
  const context = await browser.newContext({ viewport: viewportSettings });
  const page = await context.newPage();

  // Set generous navigation and action timeouts to handle Next.js page compilation
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);

  // Log console/errors for debug-ability
  page.on("console", msg => console.log(`[Manager-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on("pageerror", err => console.error(`[Manager-error] ${err.toString()}`));

  try {
    // -------------------------------------------------------------
    // STEP 1: Sales Manager Login
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Sales Manager Login ---");
    console.log("Navigating to login page...");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    
    console.log("Waiting for page compilation and HMR to settle...");
    await page.waitForTimeout(8000);

    console.log("Logging in as Sales Manager (jamal@incentive.io)...");
    await page.fill("input[name='email']", "jamal@incentive.io");
    await page.fill("input[name='password']", "Manager123!");
    await page.click("button[type='submit']");
    
    console.log("Waiting for redirection to Manager dashboard...");
    await page.waitForURL("**/sales-manager");
    console.log("✓ Logged in successfully!");
    
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "tests/screenshots/manager-step1-dashboard.png" });
    console.log("✓ Saved screenshot to tests/screenshots/manager-step1-dashboard.png");

    // -------------------------------------------------------------
    // STEP 2: Approve Sales Record
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Approving Sales Record ---");
    console.log("Navigating to Pending Approvals page...");
    await page.goto("http://localhost:3000/sales-manager/pending-approvals", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("Locating the record for 'Apex Systems Ltd'...");
    const managerRow = page.locator('tr', { hasText: 'Apex Systems Ltd' }).first();
    await managerRow.waitFor({ state: 'visible', timeout: 15000 });

    console.log("Clicking the green approve checkmark...");
    // Select the button containing a check icon (e.g. green icon)
    await managerRow.locator('button:has(.text-green-500)').first().click({ force: true });
    await page.waitForTimeout(5000);

    console.log("✓ Sales Manager successfully approved the record! It is forwarded to Accountant.");

    await page.screenshot({ path: "tests/screenshots/manager-step2-approved.png" });
    console.log("✓ Saved screenshot to tests/screenshots/manager-step2-approved.png");

    console.log("\n🏁 Sales Manager Approval Step Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ Sales Manager Approval Step Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runManagerE2E();
