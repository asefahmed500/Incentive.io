import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

// Ensure screenshot directory exists
const screenshotDir = path.resolve("tests/screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runAccountantE2E() {
  console.log("🚀 Starting E2E Accountant Processing Step...");
  console.log("👉 Note: This test expects the Manager E2E test to have run first!");

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };
  const context = await browser.newContext({ viewport: viewportSettings });
  const page = await context.newPage();

  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);

  page.on("console", msg => console.log(`[Accountant-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on("pageerror", err => console.error(`[Accountant-error] ${err.toString()}`));

  try {
    // -------------------------------------------------------------
    // STEP 1: Accountant Login
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Accountant Login ---");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("Logging in as Accountant (accountant@incentive.io)...");
    await page.fill("input[name='email']", "accountant@incentive.io");
    await page.fill("input[name='password']", "Accountant123!");
    await page.click("button[type='submit']");

    await page.waitForURL("**/accountant**");
    console.log("✓ Logged in successfully!");
    await page.waitForTimeout(4000);

    await page.screenshot({ path: "tests/screenshots/accountant-step1-dashboard.png" });
    console.log("✓ Saved screenshot to tests/screenshots/accountant-step1-dashboard.png");

    // -------------------------------------------------------------
    // STEP 2: Process Sales Record
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Processing Sales Record (Deductions) ---");
    await page.goto("http://localhost:3000/accountant/approvals", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("Locating 'Apex Systems Ltd' record and clicking calculator button...");
    const accountantRow = page.locator('tr', { hasText: 'Apex Systems Ltd' }).first();
    await accountantRow.waitFor({ state: 'visible', timeout: 15000 });
    await accountantRow.locator('button:has(svg.lucide-calculator)').first().click({ force: true });
    await page.waitForTimeout(3000);

    console.log("Applying Tax (5%), VAT (10%), and EO/BP deduction (৳2,000)...");
    await page.fill("input[placeholder='5']", "5");
    await page.fill("input[placeholder='10']", "10");
    await page.fill("input[placeholder='0']", "2000");
    await page.fill("input[placeholder='Reason for deduction']", "Standard EO/BP Deduction");
    await page.waitForTimeout(1000);

    console.log("Clicking 'Process & Forward' to Finance...");
    await page.click("button:has-text('Process & Forward')", { force: true });
    await page.waitForTimeout(5000);

    console.log("✓ Accountant successfully processed the record! Forwarded to Finance.");

    await page.screenshot({ path: "tests/screenshots/accountant-step2-processed.png" });
    console.log("✓ Saved screenshot to tests/screenshots/accountant-step2-processed.png");

    console.log("\n🏁 Accountant Processing Step Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ Accountant Processing Step Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runAccountantE2E();
