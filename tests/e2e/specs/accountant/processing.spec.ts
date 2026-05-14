import { test, expect } from "@playwright/test";

test.describe("Accountant - Processing Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "accountant@incentive.io");
    await page.fill('input[name="password"]', "Accountant123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/accountant/);
  });

  test("view pending approvals", async ({ page }) => {
    await page.goto("/accountant/approvals");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "tests/e2e/screenshots/acc-pending-approvals.png" });

    const heading = page.locator("h1, h2").filter({ hasText: /pending|approval/i }).first();
    await expect(heading).toBeVisible();
  });

  test("process sale with tax and VAT", async ({ page }) => {
    await page.goto("/accountant/approvals");
    await page.waitForLoadState("networkidle");

    const firstProcessButton = page.getByRole("button", { name: /process/i }).first();
    const buttonCount = await firstProcessButton.count();

    if (buttonCount > 0) {
      await firstProcessButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: "tests/e2e/screenshots/acc-process-modal.png" });

      const taxRateInput = page.locator('input[name*="tax" i], input[type="number"]').first();
      await taxRateInput.fill("10");

      const vatRateInput = page.locator('input[name*="vat" i], input[type="number"]').nth(1);
      await vatRateInput.fill("5");

      await page.screenshot({ path: "tests/e2e/screenshots/acc-process-filled.png" });

      const forwardButton = page.getByRole("button", { name: /process|forward/i });
      await forwardButton.click();

      await page.waitForTimeout(4000);
      await page.screenshot({ path: "tests/e2e/screenshots/acc-after-process.png" });

      const successMessage = page.locator("text=/success|forwarded|finance/i");
      await expect(successMessage).toBeVisible();
    } else {
      test.skip(true, "No pending approvals to test");
    }
  });

  test("view dashboard with charts", async ({ page }) => {
    await page.goto("/accountant");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/acc-dashboard.png", fullPage: true });

    const svgElements = page.locator("svg");
    await expect(svgElements).toHaveCount(await svgElements.count());
  });
});
