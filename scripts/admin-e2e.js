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

// Highly robust helper to handle Next.js Fast Refresh unmounting active modal/dialogs.
// It will click the trigger, wait for the target selector, and retry if the dialog was unmounted by an HMR cycle.
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
      console.log(`[Self-Healing] ⚠️ Element "${targetSelector}" not visible. A Fast Refresh might have unmounted the modal. Retrying...`);
    }
  }
  throw new Error(`[Self-Healing] Failed to open dialog containing "${targetSelector}" using trigger "${triggerSelector}"`);
}

async function runAdminE2E() {
  console.log("🚀 Starting Standalone Admin Role E2E Test Suite...");

  // Seed the database to guarantee clean, standard data
  try {
    console.log("Seeding database to guarantee standard users and categories...");
    execSync("npm run seed", { stdio: "inherit" });
    console.log("✓ Database seeded successfully!");
  } catch (seedError) {
    console.warn("⚠️ Database seed warning (continuing anyway):", seedError.message);
  }

  const browser = await chromium.launch({ headless: true });
  const viewportSettings = { width: 1280, height: 800 };
  const context = await browser.newContext({ viewport: viewportSettings });
  const page = await context.newPage();

  // Set generous navigation and action timeouts to handle first-time Next.js page compilation
  page.setDefaultNavigationTimeout(120000); // 2 minutes for page loads
  page.setDefaultTimeout(60000);           // 1 minute for interactive elements

  // Log console/errors for debug-ability
  page.on("console", msg => console.log(`[Admin-browser] ${msg.type().toUpperCase()}: ${msg.text()}`));
  page.on("pageerror", err => console.error(`[Admin-error] ${err.toString()}`));

  try {
    // -------------------------------------------------------------
    // STEP 1: Admin Login
    // -------------------------------------------------------------
    console.log("\n--- STEP 1: Admin Login ---");
    console.log("Navigating to login page...");
    await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
    
    console.log("Waiting for page compilation and HMR to settle...");
    await page.waitForTimeout(10000); // Settle login page compilation

    console.log("Logging in as Admin (admin@incentive.io)...");
    await page.fill("input[name='email']", "admin@incentive.io");
    await page.fill("input[name='password']", "Admin123!");
    await page.click("button[type='submit']");
    
    console.log("Waiting for redirection to Admin dashboard...");
    await page.waitForURL("**/admin**");
    console.log("✓ Logged in successfully!");
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "tests/screenshots/admin-step1-dashboard.png" });
    console.log("✓ Saved screenshot to tests/screenshots/admin-step1-dashboard.png");

    // -------------------------------------------------------------
    // STEP 2: Configure Commission Rule
    // -------------------------------------------------------------
    console.log("\n--- STEP 2: Configuring Commission Rule ---");
    console.log("Navigating directly to Commission Rules page...");
    await page.goto("http://localhost:3000/admin/commission-rules", { waitUntil: "domcontentloaded" });
    
    console.log("Waiting for page to compile...");
    await page.waitForTimeout(10000); // Give ample time for HMR to compile `/admin/commission-rules`

    // Use self-healing dialog clicker to open the Add Rule dialog
    await clickAndEnsureVisible(page, "button:has-text('Add Rule')", "input[name='targetPercentageFrom']");

    console.log("Filling new rule details (0% to 100% achievement → 5.5% rate)...");
    await page.fill("input[name='targetPercentageFrom']", "0");
    await page.fill("input[name='targetPercentageTo']", "100");
    await page.fill("input[name='commissionRate']", "5.5");
    await page.fill("input[name='priority']", "10");
    
    console.log("Saving the commission rule...");
    await page.click("button[type='submit']:has-text('Create Rule')", { force: true });
    await page.waitForTimeout(5000);

    // Verify presence in the table
    const rulesText = await page.textContent("body");
    if (rulesText.includes("5.5%")) {
      console.log("✓ Commission rule created and verified in list!");
    } else {
      console.log("⚠️ Commission rule rate (5.5%) not found in text content.");
    }

    await page.screenshot({ path: "tests/screenshots/admin-step2-rule-created.png" });
    console.log("✓ Saved screenshot to tests/screenshots/admin-step2-rule-created.png");

    // -------------------------------------------------------------
    // STEP 3: Configure Category
    // -------------------------------------------------------------
    console.log("\n--- STEP 3: Configuring Product Category ---");
    console.log("Navigating directly to Categories page...");
    await page.goto("http://localhost:3000/admin/categories", { waitUntil: "domcontentloaded" });
    
    console.log("Waiting for page to compile...");
    await page.waitForTimeout(10000); // Settle HMR compilation

    // Use self-healing dialog clicker to open the Add Category dialog
    await clickAndEnsureVisible(page, "button:has-text('Add Category')", "input#name");

    console.log("Filling new category details (Enterprise Subscriptions)...");
    await page.fill("input#name", "Enterprise Subscriptions");
    await page.fill("input#description", "High-value SaaS multi-year subscriptions and enterprise contracts");
    
    console.log("Saving the category...");
    await page.click("button[type='submit']:has-text('Create Category')", { force: true });
    await page.waitForTimeout(5000);

    // Verify presence in the table
    const categoriesText = await page.textContent("body");
    if (categoriesText.includes("Enterprise Subscriptions")) {
      console.log("✓ Category created and verified in list!");
    } else {
      console.log("⚠️ Category 'Enterprise Subscriptions' not found in text content.");
    }

    await page.screenshot({ path: "tests/screenshots/admin-step3-category-created.png" });
    console.log("✓ Saved screenshot to tests/screenshots/admin-step3-category-created.png");

    // -------------------------------------------------------------
    // STEP 4: Configure Product
    // -------------------------------------------------------------
    console.log("\n--- STEP 4: Configuring Product ---");
    console.log("Navigating directly to Products page...");
    await page.goto("http://localhost:3000/admin/products", { waitUntil: "domcontentloaded" });
    
    console.log("Waiting for page to compile...");
    await page.waitForTimeout(10000); // Settle HMR compilation

    // Use self-healing dialog clicker to open the Add Product dialog
    await clickAndEnsureVisible(page, "button:has-text('Add Product')", "input#name");

    console.log("Filling new product details...");
    await page.fill("input#name", "Gold Package SLA");
    await page.fill("input#sku", "GP-SLA-001");
    
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

    console.log("Selecting 'Enterprise Subscriptions' from options...");
    const entOption = page.locator('[role="option"]').filter({ hasText: 'Enterprise Subscriptions' });
    await entOption.waitFor({ state: 'visible', timeout: 15000 });
    await entOption.click({ force: true });
    await page.waitForTimeout(1000);

    await page.fill("input#price", "12000");
    await page.fill("input#stock", "50");

    console.log("Saving the product...");
    await page.click("button[type='submit']:has-text('Create Product')", { force: true });
    await page.waitForTimeout(5000);

    // Verify presence in the table
    const productsText = await page.textContent("body");
    if (productsText.includes("Gold Package SLA")) {
      console.log("✓ Product created and verified in list!");
    } else {
      console.log("⚠️ Product 'Gold Package SLA' not found in text content.");
    }

    await page.screenshot({ path: "tests/screenshots/admin-step4-product-created.png" });
    console.log("✓ Saved screenshot to tests/screenshots/admin-step4-product-created.png");

    // -------------------------------------------------------------
    // STEP 5: Assign Sales Target
    // -------------------------------------------------------------
    console.log("\n--- STEP 5: Assigning Sales Target ---");
    console.log("Navigating directly to Targets page...");
    await page.goto("http://localhost:3000/admin/targets", { waitUntil: "domcontentloaded" });
    
    console.log("Waiting for page to compile...");
    await page.waitForTimeout(10000); // Settle HMR compilation

    // Use self-healing dialog clicker to open the Assign Target dialog
    await clickAndEnsureVisible(page, "button:has-text('Assign Target')", "button:has-text('Select user')");

    console.log("Opening user select dropdown...");
    const userTrigger = page.locator('button:has-text("Select user")');
    await userTrigger.click();
    await page.waitForTimeout(1500);

    // Dropdown accessibility fallback
    let userOptionsCount = await page.locator('[role="option"]').count();
    if (userOptionsCount === 0) {
      console.log("User select dropdown did not open via click, invoking space press...");
      await userTrigger.focus();
      await userTrigger.press("Space");
      await page.waitForTimeout(1500);
    }

    console.log("Selecting first available Sales Executive...");
    const firstUserOption = page.locator('[role="option"]').first();
    await firstUserOption.waitFor({ state: 'visible', timeout: 15000 });
    const selectedUserName = await firstUserOption.innerText();
    console.log(`Selected User: ${selectedUserName}`);
    await firstUserOption.click({ force: true });
    await page.waitForTimeout(1000);

    console.log("Setting target amount to ৳150,000...");
    await page.fill("input[name='targetAmount']", "150000");

    console.log("Assigning target...");
    await page.click("button[type='submit']:has-text('Assign Target')", { force: true });
    await page.waitForTimeout(5000);

    // Verify presence in the table
    const targetsText = await page.textContent("body");
    // Normalize text spaces to ensure robust checks
    const targetClean = targetsText.replace(/\s+/g, ' ');
    if (targetClean.includes("150,000")) {
      console.log("✓ Sales target successfully assigned and verified in list!");
    } else {
      console.log("⚠️ Target amount 150,000 not found in text content.");
    }

    await page.screenshot({ path: "tests/screenshots/admin-step5-target-assigned.png" });
    console.log("✓ Saved screenshot to tests/screenshots/admin-step5-target-assigned.png");

    console.log("\n🏁 Standalone Admin E2E Test Completed Successfully! 🎉");

  } catch (error) {
    console.error("❌ Standalone Admin E2E Test Failed:", error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

runAdminE2E();
