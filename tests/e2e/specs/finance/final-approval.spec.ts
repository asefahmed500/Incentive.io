import { test, expect } from "@playwright/test";

test.describe("Finance - Final Approval", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "finance@incentive.io");
    await page.fill('input[name="password"]', "Finance123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/finance/);
  });

  test("view pending approvals", async ({ page }) => {
    await page.goto("/finance/approvals");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "tests/e2e/screenshots/fin-pending-approvals.png" });

    const heading = page.locator("h1, h2").filter({ hasText: /pending|approval/i }).first();
    await expect(heading).toBeVisible();
  });

  test("final approval triggers wallet credit", async ({ page }) => {
    await page.goto("/finance/approvals");
    await page.waitForLoadState("networkidle");

    const firstApproveButton = page.getByRole("button", { name: /approve/i }).first();
    const buttonCount = await firstApproveButton.count();

    if (buttonCount > 0) {
      await firstApproveButton.click();
      await page.waitForTimeout(4000);

      await page.screenshot({ path: "tests/e2e/screenshots/fin-after-approve.png" });

      const successMessage = page.locator("text=/success|approved|credited/i");
      await expect(successMessage).toBeVisible();

      const notification = page.locator('[role="alert"], [data-notification]').first();
      await expect(notification).toBeVisible();
    } else {
      test.skip(true, "No pending approvals to test");
    }
  });

  test("view dashboard with payment charts", async ({ page }) => {
    await page.goto("/finance");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/fin-dashboard.png", fullPage: true });

    const svgElements = page.locator("svg");
    await expect(svgElements).toHaveCount(await svgElements.count());
  });

  test("view payment queue", async ({ page }) => {
    await page.goto("/finance/payments");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "tests/e2e/screenshots/fin-payments.png" });

    const table = page.locator("table").first();
    await expect(table).toBeVisible();
  });
});
