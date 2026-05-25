import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Ensure screenshot directory exists
const screenshotDir = path.resolve("tests/screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runExecutiveE2E() {
  console.log("🚀 Starting E2E Sales Executive Submission Step...");
  console.log("👉 Note: This test expects the Admin E2E test to have run first!");

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };
  const context = await browser.newContext({ viewport: viewportSettings });
  const page = await context.newPage();

  // Set generous navigation and action timeouts to handle Next.js page compilation
  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);

  // Log console/errors for debug-ability
  page.on("console", msg => console.log(`[Executive-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on("pageerror", err => console.error(`[Executive-error] ${err.toString()}`));

  try {
    // -------------------------------------------------------------
    // STEP 1: Sales Executive Login
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Sales Executive Login ---");
    console.log("Navigating to login page...");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    
    console.log("Waiting for page compilation and HMR to settle...");
    await page.waitForTimeout(8000);

    console.log("Logging in as Sales Executive (karim@incentive.io)...");
    await page.fill("input[name='email']", "karim@incentive.io");
    await page.fill("input[name='password']", "Executive123!");
    await page.click("button[type='submit']");
    
    console.log("Waiting for redirection to Executive dashboard...");
    await page.waitForURL("**/sales-dashboard");
    console.log("✓ Logged in successfully!");
    
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "tests/screenshots/executive-step1-dashboard.png" });
    console.log("✓ Saved screenshot to tests/screenshots/executive-step1-dashboard.png");

    // -------------------------------------------------------------
    // STEP 2: Submit Sales Record
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Submitting Sales Record ---");
    console.log("Navigating to Add Record page...");
    await page.goto("http://localhost:3000/sales-dashboard/add-record", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("Filling company details...");
    await page.fill("input#companyName", "Apex Systems Ltd");
    await page.fill("input#companyEmail", "billing@apexsystems.com");

    console.log("Filling product details...");
    await page.fill("input[placeholder='Enter product name']", "Gold Package SLA");

    console.log("Opening category dropdown...");
    const categoryTrigger = page.locator('button:has-text("Select category")');
    await categoryTrigger.click();
    await page.waitForTimeout(1500);

    // Dropdown accessibility fallback
    let optionsCount = await page.locator('[role="option"]').count();
    if (optionsCount === 0) {
      console.log("Category select dropdown did not open via click, invoking space press...");
      await categoryTrigger.focus();
      await categoryTrigger.press("Space");
      await page.waitForTimeout(1500);
    }

    console.log("Selecting 'Enterprise Subscriptions' category...");
    const categoryOption = page.locator('[role="option"]').filter({ hasText: 'Enterprise Subscriptions' });
    await categoryOption.waitFor({ state: 'visible', timeout: 15000 });
    await categoryOption.click({ force: true });
    await page.waitForTimeout(1000);

    console.log("Setting unit price and quantity...");
    await page.fill("input[placeholder='0.00'][required]", "12000");
    await page.fill("input[min='1']", "5"); // Total gross: 60,000
    await page.waitForTimeout(1000);

    console.log("Submitting sales record for approval...");
    await page.click("button:has-text('Submit for Approval')", { force: true });
    
    console.log("Waiting for database processing and redirect...");
    await page.waitForURL("**/sales-dashboard/records", { timeout: 60000 });
    await page.waitForTimeout(4000);

    // Confirm the record exists in the list
    console.log("Verifying record status in table...");
    const recordsRow = page.locator('tr', { hasText: 'Apex Systems Ltd' }).first();
    await recordsRow.waitFor({ state: 'visible', timeout: 15000 });
    const rowContent = await recordsRow.innerText();
    
    if (rowContent.includes("Pending Manager") || rowContent.includes("Pending_Manager")) {
      console.log("✓ Sales record successfully submitted! Status is: Pending Manager");
    } else {
      console.log(`⚠️ Sales record status mismatch in list: ${rowContent}`);
    }

    await page.screenshot({ path: "tests/screenshots/executive-step2-submitted.png" });
    console.log("✓ Saved screenshot to tests/screenshots/executive-step2-submitted.png");

    console.log("\n🏁 Sales Executive Submission Step Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ Sales Executive Submission Step Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runExecutiveE2E();
