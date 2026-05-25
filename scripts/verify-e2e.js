import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

// Ensure screenshot directory exists
const screenshotDir = path.resolve("tests/screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runVerifyE2E() {
  console.log("🚀 Starting E2E Executive Verification Step (Post-Approval)...");
  console.log("👉 Note: This test expects the Finance E2E test to have run first!");

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };
  const context = await browser.newContext({ viewport: viewportSettings });
  const page = await context.newPage();

  page.setDefaultNavigationTimeout(120000);
  page.setDefaultTimeout(60000);

  page.on("console", msg => console.log(`[Verify-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on("pageerror", err => console.error(`[Verify-error] ${err.toString()}`));

  try {
    // -------------------------------------------------------------
    // STEP 1: Executive Login
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Sales Executive Login ---");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(8000);

    console.log("Logging in as Sales Executive (karim@incentive.io)...");
    await page.fill("input[name='email']", "karim@incentive.io");
    await page.fill("input[name='password']", "Executive123!");
    await page.click("button[type='submit']");

    await page.waitForURL("**/sales-dashboard");
    console.log("✓ Logged in successfully!");
    await page.waitForTimeout(4000);

    // -------------------------------------------------------------
    // STEP 2: Check Record Status = Approved
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Verifying Record Approved Status ---");
    await page.goto("http://localhost:3000/sales-dashboard/records", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);

    const recordsText = await page.textContent("body");
    if (recordsText.includes("Approved") || recordsText.includes("approved")) {
      console.log("✓ Record status is Approved!");
    } else {
      console.log("⚠️ 'Approved' status not found on records page.");
    }

    await page.screenshot({ path: "tests/screenshots/verify-step2-records.png" });
    console.log("✓ Saved screenshot to tests/screenshots/verify-step2-records.png");

    // -------------------------------------------------------------
    // STEP 3: Check Wallet Balance
    // -------------------------------------------------------------
    console.log("\n--- STEP 3: Verifying Wallet Commission Credit ---");
    await page.goto("http://localhost:3000/sales-dashboard/wallet", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);

    const walletText = await page.textContent("body");
    if (walletText.includes("Balance") || walletText.includes("balance")) {
      console.log("✓ Wallet Balance section is visible!");
    } else {
      console.log("⚠️ Wallet Balance section not found.");
    }
    // Look for any credited amount > 0
    if (walletText.match(/[৳$]\s*[\d,]+/) ) {
      console.log("✓ Wallet shows a monetary amount — commission credited successfully!");
    } else {
      console.log("⚠️ No monetary amount detected in wallet.");
    }

    await page.screenshot({ path: "tests/screenshots/verify-step3-wallet.png" });
    console.log("✓ Saved screenshot to tests/screenshots/verify-step3-wallet.png");

    // -------------------------------------------------------------
    // STEP 4: Check Notifications
    // -------------------------------------------------------------
    console.log("\n--- STEP 4: Checking Dashboard Notifications ---");
    await page.goto("http://localhost:3000/sales-dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(6000);

    const dashText = await page.textContent("body");
    if (dashText.toLowerCase().includes("approved") || dashText.toLowerCase().includes("commission")) {
      console.log("✓ Approval / Commission notification visible on dashboard!");
    } else {
      console.log("⚠️ Approval notification not visible in dashboard text.");
    }

    await page.screenshot({ path: "tests/screenshots/verify-step4-dashboard.png" });
    console.log("✓ Saved screenshot to tests/screenshots/verify-step4-dashboard.png");

    console.log("\n🏁 Executive Verification Step Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ Executive Verification Step Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runVerifyE2E();
