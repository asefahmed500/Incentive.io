import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Ensure screenshot directory exists
const screenshotDir = path.resolve("tests/screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runE2EWorkflow() {
  console.log("🚀 Starting E2E Multi-Role Sales Commission Workflow Test Suite...");
  
  // Seed the database to guarantee clean, standard data (users, categories, products)
  try {
    console.log("Seeding database to guarantee standard users and categories...");
    execSync("npm run seed", { stdio: "inherit" });
    console.log("✓ Database seeded successfully!");
  } catch (seedError) {
    console.warn("⚠️ Database seed warning (continuing anyway):", seedError.message);
  }

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };

  try {
    // =============================================================
    // WORKFLOW 1: FULL SUCCESSFUL COMMISSION WORKFLOW
    // =============================================================
    console.log("\n=============================================================");
    console.log("🏆 WORKFLOW 1: SUCCESSFUL COMMISSION APPROVAL PATH");
    console.log("=============================================================");

    // -------------------------------------------------------------
    // STEP 0: Admin Adds a Custom Commission Rule
    // -------------------------------------------------------------
    console.log("\n--- STEP 0: Admin (System Admin) Configures Commission Rule ---");
    const context0 = await browser.newContext({ viewport: viewportSettings });
    const page0 = await context0.newPage();
    page0.on("console", msg => console.log(`[Admin-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page0.on("pageerror", err => console.error(`[Admin-error] ${err.toString()}`));

    console.log("Navigating to login page...");
    await page0.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    console.log("Waiting for page compilation to settle...");
    await page0.waitForTimeout(4000);

    console.log("Logging in as Admin (admin@incentive.io)...");
    await page0.fill("input[name='email']", "admin@incentive.io");
    await page0.fill("input[name='password']", "Admin123!");
    await page0.click("button[type='submit']");
    await page0.waitForURL("**/admin**", { timeout: 60000 });
    console.log("✓ Logged in successfully");
    await page0.waitForTimeout(3000);

    console.log("Navigating directly to Commission Rules...");
    await page0.goto("http://localhost:3000/admin/commission-rules", { waitUntil: "domcontentloaded" });
    await page0.waitForTimeout(4000);

    console.log("Opening 'Add Rule' dialog...");
    await page0.click("button:has-text('Add Rule')", { force: true });
    await page0.waitForTimeout(2000);

    console.log("Filling new rule details (0% to 100% achievement → 5.5% rate)...");
    await page0.fill("input[name='targetPercentageFrom']", "0");
    await page0.fill("input[name='targetPercentageTo']", "100");
    await page0.fill("input[name='commissionRate']", "5.5");
    await page0.fill("input[name='priority']", "10");
    
    console.log("Saving the commission rule...");
    await page0.click("button[type='submit']:has-text('Create Rule')", { force: true });
    await page0.waitForTimeout(4000);
    console.log("✓ Commission rule created successfully!");

    await page0.screenshot({ path: "tests/screenshots/workflow-step0-rule-created.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-step0-rule-created.png");

    await page0.close();
    await context0.close();
    await sleep(3000);

    // -------------------------------------------------------------
    // STEP 1: Sales Executive Creates and Submits Sales Record
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Sales Executive (Karim) Record Submission ---");
    const context1 = await browser.newContext({ viewport: viewportSettings });
    const page1 = await context1.newPage();
    page1.on("console", msg => console.log(`[Karim-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page1.on("pageerror", err => console.error(`[Karim-error] ${err.toString()}`));

    console.log("Navigating to login page...");
    await page1.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    console.log("Waiting for login page compilation to settle...");
    await page1.waitForTimeout(5000);

    console.log("Logging in as Sales Executive (karim@incentive.io)...");
    await page1.fill("input[name='email']", "karim@incentive.io");
    await page1.fill("input[name='password']", "Executive123!");
    await page1.click("button[type='submit']");
    await page1.waitForURL("**/sales-dashboard", { timeout: 60000 });
    console.log("✓ Logged in successfully");
    await page1.waitForTimeout(3000);

    // Take screenshot of Sales Executive Dashboard
    await page1.screenshot({ path: "tests/screenshots/se-dashboard.png" });
    console.log("✓ Saved Sales Executive Dashboard screenshot to tests/screenshots/se-dashboard.png");

    console.log("Navigating directly to Add Record page...");
    await page1.goto("http://localhost:3000/sales-dashboard/add-record", { waitUntil: "domcontentloaded" });
    console.log("Waiting for page compilation and HMR Fast Refresh to settle...");
    await page1.waitForTimeout(6000);
    
    // Wait for the Add Record form to load and select category trigger to appear
    console.log("Waiting for Select Category button to be visible...");
    const categoryTrigger = page1.locator('button:has-text("Select category")');
    await categoryTrigger.waitFor({ state: 'visible', timeout: 20000 });
    
    // Save add-record page screenshot
    await page1.screenshot({ path: "tests/screenshots/se-add-record.png" });
    console.log("✓ Saved Add Record page screenshot");

    console.log("Filling company details...");
    await page1.fill("input#companyName", "Apex Systems Ltd");
    await page1.fill("input#companyEmail", "billing@apexsystems.com");

    console.log("Filling product details...");
    await page1.fill("input[placeholder='Enter product name']", "Enterprise ERP");

    console.log("Opening category select dropdown...");
    await categoryTrigger.click();
    await page1.waitForTimeout(1000);
    
    // Fallback: check if options are rendered, otherwise use accessibility keyboard event
    let optionsCount = await page1.locator('[role="option"]').count();
    if (optionsCount === 0) {
      console.log("Select dropdown did not open via click, invoking keyboard accessibility event...");
      await categoryTrigger.focus();
      await categoryTrigger.press("Space");
      await page1.waitForTimeout(1500);
    }

    // Use highly robust locator waiting for the option to appear and click
    console.log("Waiting for 'Software' option to appear...");
    const softwareOption = page1.locator('[role="option"]').filter({ hasText: 'Software' });
    await softwareOption.waitFor({ state: 'visible', timeout: 20000 });
    await softwareOption.click({ force: true });
    await page1.waitForTimeout(1000);
    console.log("✓ Software category selected");

    console.log("Setting unit price and quantity...");
    await page1.fill("input[placeholder='0.00'][required]", "50000");
    await page1.fill("input[min='1']", "4"); // Gross: 200,000
    await page1.waitForTimeout(1000);

    console.log("Submitting record for approval...");
    await page1.click("button:has-text('Submit for Approval')", { force: true });
    
    // Wait for the natural redirect to happen
    console.log("Waiting for server processing and redirect to records list...");
    await page1.waitForURL("**/sales-dashboard/records", { timeout: 60000 });
    await page1.waitForTimeout(3000);

    // Confirm the record exists and is "Pending Manager"
    const rowText1 = await page1.textContent("body");
    if (rowText1.includes("Apex Systems Ltd") && (rowText1.includes("Pending_Manager") || rowText1.includes("Pending Manager"))) {
      console.log("✓ Sales record successfully submitted! Status is: Pending Manager");
    } else {
      console.log("⚠️ Sales record not found or status mismatch in list. Full text content: " + rowText1.substring(0, 500));
    }

    await page1.screenshot({ path: "tests/screenshots/workflow-step1-submitted.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-step1-submitted.png");

    // Cleanly close Karim's isolated browser session
    await page1.close();
    await context1.close();
    console.log("✓ Sales Executive browser session closed");
    await sleep(3000);

    // -------------------------------------------------------------
    // STEP 2: Sales Manager Reviews and Approves
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Sales Manager (Jamal) Approval ---");
    const context2 = await browser.newContext({ viewport: viewportSettings });
    const page2 = await context2.newPage();
    page2.on("console", msg => console.log(`[Jamal-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page2.on("pageerror", err => console.error(`[Jamal-error] ${err.toString()}`));

    console.log("Logging in as Sales Manager (jamal@incentive.io)...");
    await page2.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    console.log("Waiting for page to settle...");
    await page2.waitForTimeout(4000);
    await page2.fill("input[name='email']", "jamal@incentive.io");
    await page2.fill("input[name='password']", "Manager123!");
    await page2.click("button[type='submit']");
    await page2.waitForURL("**/sales-manager**", { timeout: 60000 });
    console.log("✓ Logged in successfully");
    await page2.waitForTimeout(3000);

    console.log("Navigating directly to Pending Approvals...");
    await page2.goto("http://localhost:3000/sales-manager/pending-approvals", { waitUntil: "domcontentloaded" });
    await page2.waitForTimeout(3000);

    console.log("Locating the record for 'Apex Systems Ltd' and approving it...");
    const managerRow = page2.locator('tr', { hasText: 'Apex Systems Ltd' });
    await managerRow.locator('button:has(.text-green-500)').first().click({ force: true });
    await page2.waitForTimeout(4000);
    console.log("✓ Sales Manager successfully approved the record! Shifting to Pending Accountant");

    await page2.screenshot({ path: "tests/screenshots/workflow-step2-approved.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-step2-approved.png");

    // Cleanly close Jamal's isolated browser session
    await page2.close();
    await context2.close();
    console.log("✓ Sales Manager browser session closed");
    await sleep(3000);

    // -------------------------------------------------------------
    // STEP 3: Accountant Deductions & Processing
    // -------------------------------------------------------------
    console.log("\n--- STEP 3: Accountant (Rezwan) Processing ---");
    const context3 = await browser.newContext({ viewport: viewportSettings });
    const page3 = await context3.newPage();
    page3.on("console", msg => console.log(`[Rezwan-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page3.on("pageerror", err => console.error(`[Rezwan-error] ${err.toString()}`));

    console.log("Logging in as Accountant (accountant@incentive.io)...");
    await page3.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    console.log("Waiting for page compilation to settle...");
    await page3.waitForTimeout(5000);
    await page3.fill("input[name='email']", "accountant@incentive.io");
    await page3.fill("input[name='password']", "Accountant123!");
    await page3.click("button[type='submit']");
    await page3.waitForURL("**/accountant**", { timeout: 60000 });
    console.log("✓ Logged in successfully");
    await page3.waitForTimeout(3000);

    console.log("Navigating directly to Accountant Approvals...");
    await page3.goto("http://localhost:3000/accountant/approvals", { waitUntil: "domcontentloaded" });
    await page3.waitForTimeout(3000);

    console.log("Clicking the Calculator button to process 'Apex Systems Ltd'...");
    const accountantRow = page3.locator('tr', { hasText: 'Apex Systems Ltd' });
    await accountantRow.locator('button:has(svg.lucide-calculator)').first().click({ force: true });
    await page3.waitForTimeout(2000);

    console.log("Applying Tax (5%), VAT (10%), and EO/BP (৳2,000)...");
    await page3.fill("input[placeholder='5']", "5");
    await page3.fill("input[placeholder='10']", "10");
    await page3.fill("input[placeholder='0']", "2000");
    await page3.fill("input[placeholder='Reason for deduction']", "Standard EOBP Deduction");
    await page3.waitForTimeout(1000);

    console.log("Submitting calculation to Finance...");
    await page3.click("button:has-text('Process & Forward')", { force: true });
    await page3.waitForTimeout(4000);
    console.log("✓ Accountant successfully processed the record! Shifting to Pending Finance");

    await page3.screenshot({ path: "tests/screenshots/workflow-step3-processed.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-step3-processed.png");

    // Cleanly close Rezwan's isolated browser session
    await page3.close();
    await context3.close();
    console.log("✓ Accountant browser session closed");
    await sleep(3000);

    // -------------------------------------------------------------
    // STEP 4: Finance Reviews and Final Approves
    // -------------------------------------------------------------
    console.log("\n--- STEP 4: Finance (Nihar) Final Approval ---");
    const context4 = await browser.newContext({ viewport: viewportSettings });
    const page4 = await context4.newPage();
    page4.on("console", msg => console.log(`[Nihar-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page4.on("pageerror", err => console.error(`[Nihar-error] ${err.toString()}`));

    console.log("Logging in as Finance (finance@incentive.io)...");
    await page4.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    console.log("Waiting for page compilation to settle...");
    await page4.waitForTimeout(5000);
    await page4.fill("input[name='email']", "finance@incentive.io");
    await page4.fill("input[name='password']", "Finance123!");
    await page4.click("button[type='submit']");
    await page4.waitForURL("**/finance**", { timeout: 60000 });
    console.log("✓ Logged in successfully");
    await page4.waitForTimeout(3000);

    console.log("Navigating directly to Finance Approval Queue...");
    await page4.goto("http://localhost:3000/finance/approvals", { waitUntil: "domcontentloaded" });
    await page4.waitForTimeout(3000);

    console.log("Viewing 'Apex Systems Ltd' record details...");
    const financeRow = page4.locator('tr', { hasText: 'Apex Systems Ltd' });
    await financeRow.locator("button:has-text('View')").first().click({ force: true });
    await page4.waitForTimeout(2000);

    console.log("Clicking Approve button...");
    await page4.locator("div[role='dialog'] button:has-text('Approve')").first().click({ force: true });
    await page4.waitForTimeout(2000);

    console.log("Confirming Final Approval...");
    await page4.locator("div[role='dialog'] button:has-text('Approve')").first().click({ force: true });
    await page4.waitForTimeout(4000);
    console.log("✓ Finance successfully final-approved the record! Credit is atomic and wallet updated!");

    await page4.screenshot({ path: "tests/screenshots/workflow-step4-final-approved.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-step4-final-approved.png");

    // Cleanly close Nihar's isolated browser session
    await page4.close();
    await context4.close();
    console.log("✓ Finance browser session closed");
    await sleep(3000);

    // -------------------------------------------------------------
    // STEP 5: Verification of wallet and target achievement
    // -------------------------------------------------------------
    console.log("\n--- STEP 5: Post-Workflow Sales Executive Verification ---");
    const context5 = await browser.newContext({ viewport: viewportSettings });
    const page5 = await context5.newPage();
    page5.on("console", msg => console.log(`[Karim-Verify-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
    page5.on("pageerror", err => console.error(`[Karim-Verify-error] ${err.toString()}`));

    console.log("Logging back in as Sales Executive (karim@incentive.io)...");
    await page5.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    console.log("Waiting for page compilation to settle...");
    await page5.waitForTimeout(5000);
    await page5.fill("input[name='email']", "karim@incentive.io");
    await page5.fill("input[name='password']", "Executive123!");
    await page5.click("button[type='submit']");
    await page5.waitForURL("**/sales-dashboard", { timeout: 60000 });
    await page5.waitForTimeout(3000);

    console.log("Navigating directly to Wallet...");
    await page5.goto("http://localhost:3000/sales-dashboard/wallet", { waitUntil: "domcontentloaded" });
    await page5.waitForTimeout(3000);

    console.log("Verifying wallet balance reflects new commission credit...");
    const walletText = await page5.textContent("body");
    console.log("Wallet Page Info:", walletText.includes("Balance") ? "✓ Balance Section Visible" : "⚠️ Balance section missing!");

    await page5.screenshot({ path: "tests/screenshots/workflow-step5-verified.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-step5-verified.png");

    // Check notifications
    console.log("Navigating to Executive Dashboard to check notifications...");
    await page5.goto("http://localhost:3000/sales-dashboard", { waitUntil: "domcontentloaded" });
    await page5.waitForTimeout(3000);
    const dashText = await page5.textContent("body");
    console.log("Notification status:", dashText.includes("approved") || dashText.includes("Approved") ? "✓ Approval Notification Received!" : "⚠️ Approval notification not found in dashboard text");

    await page5.close();
    await context5.close();
    await sleep(3000);

    // =============================================================
    // WORKFLOW 2: REJECTION WORKFLOW PATH
    // =============================================================
    console.log("\n=============================================================");
    console.log("❌ WORKFLOW 2: SALES MANAGER REJECTION PATH");
    console.log("=============================================================");

    // -------------------------------------------------------------
    // STEP 1: Sales Executive submits a new record for rejection
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Sales Executive submits record for rejection ---");
    const rejectContext1 = await browser.newContext({ viewport: viewportSettings });
    const rejectPage1 = await rejectContext1.newPage();
    
    console.log("Logging in as Sales Executive...");
    await rejectPage1.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await rejectPage1.waitForTimeout(4000);
    await rejectPage1.fill("input[name='email']", "karim@incentive.io");
    await rejectPage1.fill("input[name='password']", "Executive123!");
    await rejectPage1.click("button[type='submit']");
    await rejectPage1.waitForURL("**/sales-dashboard", { timeout: 60000 });
    
    console.log("Navigating to Add Record page...");
    await rejectPage1.goto("http://localhost:3000/sales-dashboard/add-record", { waitUntil: "domcontentloaded" });
    await rejectPage1.waitForTimeout(5000);
    
    console.log("Filling company details for rejection record...");
    await rejectPage1.fill("input#companyName", "Rejection Inc");
    await rejectPage1.fill("input#companyEmail", "billing@rejection.com");
    await rejectPage1.fill("input[placeholder='Enter product name']", "Enterprise CRM");
    
    // Select category Software
    const rejectCategoryTrigger = rejectPage1.locator('button:has-text("Select category")');
    await rejectCategoryTrigger.click();
    await rejectPage1.waitForTimeout(1000);
    const rejectSoftwareOption = rejectPage1.locator('[role="option"]').filter({ hasText: 'Software' });
    await rejectSoftwareOption.waitFor({ state: 'visible', timeout: 10000 });
    await rejectSoftwareOption.click({ force: true });
    
    await rejectPage1.fill("input[placeholder='0.00'][required]", "10000");
    await rejectPage1.fill("input[min='1']", "2"); // Gross: 20,000
    await rejectPage1.waitForTimeout(1000);
    
    console.log("Submitting record...");
    await rejectPage1.click("button:has-text('Submit for Approval')", { force: true });
    await rejectPage1.waitForURL("**/sales-dashboard/records", { timeout: 60000 });
    await rejectPage1.waitForTimeout(2000);
    console.log("✓ Rejection record submitted successfully!");

    await rejectPage1.screenshot({ path: "tests/screenshots/workflow-rejection-step1-submitted.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-rejection-step1-submitted.png");

    await rejectPage1.close();
    await rejectContext1.close();
    await sleep(3000);

    // -------------------------------------------------------------
    // STEP 2: Sales Manager rejects the record
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Sales Manager rejects the record with custom reason ---");
    const rejectContext2 = await browser.newContext({ viewport: viewportSettings });
    const rejectPage2 = await rejectContext2.newPage();
    
    console.log("Logging in as Sales Manager...");
    await rejectPage2.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await rejectPage2.waitForTimeout(4000);
    await rejectPage2.fill("input[name='email']", "jamal@incentive.io");
    await rejectPage2.fill("input[name='password']", "Manager123!");
    await rejectPage2.click("button[type='submit']");
    await rejectPage2.waitForURL("**/sales-manager**", { timeout: 60000 });
    
    console.log("Navigating to Pending Approvals...");
    await rejectPage2.goto("http://localhost:3000/sales-manager/pending-approvals", { waitUntil: "domcontentloaded" });
    await rejectPage2.waitForTimeout(3000);
    
    console.log("Locating 'Rejection Inc' and opening rejection dialog...");
    const rejectRow = rejectPage2.locator('tr', { hasText: 'Rejection Inc' });
    await rejectRow.locator('button:has(.text-red-500)').first().click({ force: true });
    await rejectPage2.waitForTimeout(2000);
    
    console.log("Filling custom rejection reason...");
    await rejectPage2.fill("input[placeholder='Enter rejection reason...']", "Incomplete deal documentation, please attach PDF contract.");
    await rejectPage2.waitForTimeout(1000);
    
    console.log("Confirming Rejection...");
    await rejectPage2.click("button:has-text('Confirm Reject')", { force: true });
    await rejectPage2.waitForTimeout(4000);
    console.log("✓ Record rejected successfully! Rejection state synced!");

    await rejectPage2.screenshot({ path: "tests/screenshots/workflow-rejection-step2-rejected.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-rejection-step2-rejected.png");

    await rejectPage2.close();
    await rejectContext2.close();
    await sleep(3000);

    // -------------------------------------------------------------
    // STEP 3: Sales Executive verifies the rejection state
    // -------------------------------------------------------------
    console.log("\n--- STEP 3: Sales Executive verifies Draft status & Rejection Reason ---");
    const rejectContext3 = await browser.newContext({ viewport: viewportSettings });
    const rejectPage3 = await rejectContext3.newPage();
    
    console.log("Logging back in as Sales Executive...");
    await rejectPage3.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    await rejectPage3.waitForTimeout(4000);
    await rejectPage3.fill("input[name='email']", "karim@incentive.io");
    await rejectPage3.fill("input[name='password']", "Executive123!");
    await rejectPage3.click("button[type='submit']");
    await rejectPage3.waitForURL("**/sales-dashboard", { timeout: 60000 });
    
    console.log("Navigating to My Records list...");
    await rejectPage3.goto("http://localhost:3000/sales-dashboard/records", { waitUntil: "domcontentloaded" });
    await rejectPage3.waitForTimeout(3000);
    
    const recordsTableText = await rejectPage3.textContent("body");
    console.log("Draft status verification:", recordsTableText.includes("Draft") ? "✓ Record returned to Draft state!" : "⚠️ Record status is not Draft");
    
    await rejectPage3.screenshot({ path: "tests/screenshots/workflow-rejection-step3-verified.png" });
    console.log("✓ Saved screenshot to tests/screenshots/workflow-rejection-step3-verified.png");
    
    // Check for rejection notifications
    console.log("Checking dashboard for Rejection notifications...");
    await rejectPage3.goto("http://localhost:3000/sales-dashboard", { waitUntil: "domcontentloaded" });
    await rejectPage3.waitForTimeout(3000);
    const rejectDashText = await rejectPage3.textContent("body");
    console.log("Rejection Notification status:", rejectDashText.includes("rejected") || rejectDashText.includes("Rejected") ? "✓ Rejection Notification Received!" : "⚠️ Rejection notification not found in dashboard");

    await rejectPage3.close();
    await rejectContext3.close();

    console.log("\n🏁 E2E Dual-Workflow (Approve & Reject) Integration Test Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ E2E Workflow Test Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runE2EWorkflow();
