import { test, expect } from "@playwright/test";

test.describe("Sales Executive - Create Sale", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "karim@incentive.io");
    await page.fill('input[name="password"]', "Executive123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/sales-dashboard/);
  });

  test("navigate to add record page", async ({ page }) => {
    await page.goto("/sales-dashboard/add-record");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/add-record/);
    await page.screenshot({ path: "tests/e2e/screenshots/se-add-record-page.png" });

    const heading = page.locator("h1, h2").filter({ hasText: /add|create|new/i }).first();
    await expect(heading).toBeVisible();
  });

  test("create sales record with products", async ({ page }) => {
    await page.goto("/sales-dashboard/add-record");
    await page.waitForLoadState("networkidle");

    const timestamp = Date.now();

    await page.fill('input[name="companyName"]', `Test Company ${timestamp}`);
    await page.fill('input[name="companyEmail"]', `test${timestamp}@company.com`);

    await page.screenshot({ path: "tests/e2e/screenshots/se-company-info.png" });

    await page.fill('input[name="products[0][productName]"]', "Wireless Mouse");
    await page.selectOption('select[name="products[0][categoryId]"]', { label: /electronics/i });
    await page.fill('input[name="products[0][unitPrice]"]', "1500");
    await page.fill('input[name="products[0][quantity]"]', "5");

    await page.screenshot({ path: "tests/e2e/screenshots/se-product-1.png" });

    const addButton = page.getByRole("button", { name: /add product/i });
    await addButton.click();
    await page.waitForTimeout(500);

    await page.fill('input[name="products[1][productName]"]', "USB Keyboard");
    await page.selectOption('select[name="products[1][categoryId]"]', { label: /electronics/i });
    await page.fill('input[name="products[1][unitPrice]"]', "3000");
    await page.fill('input[name="products[1][quantity]"]', "2");

    await page.screenshot({ path: "tests/e2e/screenshots/se-products-filled.png" });

    const saveDraftButton = page.getByRole("button", { name: /save draft/i });
    await saveDraftButton.click();

    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/e2e/screenshots/se-after-draft.png" });

    const successMessage = page.locator("text=/success|saved|created/i");
    await expect(successMessage).toBeVisible();
  });

  test("form validation on empty fields", async ({ page }) => {
    await page.goto("/sales-dashboard/add-record");
    await page.waitForLoadState("networkidle");

    const submitButton = page.getByRole("button", { name: /submit|save/i }).first();
    await submitButton.click();

    await page.waitForTimeout(1000);
    await page.screenshot({ path: "tests/e2e/screenshots/se-validation-errors.png" });

    const requiredFields = page.locator('input:invalid, [required]:invalid');
    expect(await requiredFields.count()).toBeGreaterThan(0);
  });
});
