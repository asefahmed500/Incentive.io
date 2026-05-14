import { test, expect } from "@playwright/test";

test.describe("Sales Manager - Approval Workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "jamal@incentive.io");
    await page.fill('input[name="password"]', "Manager123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/sales-manager/);
  });

  test("view pending approvals", async ({ page }) => {
    await page.goto("/sales-manager/pending-approvals");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "tests/e2e/screenshots/sm-pending-approvals.png" });

    const heading = page.locator("h1, h2").filter({ hasText: /pending|approval/i }).first();
    await expect(heading).toBeVisible();
  });

  test("approve sales record", async ({ page }) => {
    await page.goto("/sales-manager/pending-approvals");
    await page.waitForLoadState("networkidle");

    const firstApproveButton = page.getByRole("button", { name: /approve/i }).first();
    const buttonCount = await firstApproveButton.count();

    if (buttonCount > 0) {
      await firstApproveButton.click();
      await page.waitForTimeout(3000);

      await page.screenshot({ path: "tests/e2e/screenshots/sm-after-approve.png" });

      const successMessage = page.locator("text=/success|approved|forwarded/i");
      await expect(successMessage).toBeVisible();
    } else {
      test.skip(true, "No pending approvals to test");
    }
  });

  test("reject sales record with reason", async ({ page }) => {
    await page.goto("/sales-manager/pending-approvals");
    await page.waitForLoadState("networkidle");

    const firstRejectButton = page.getByRole("button", { name: /reject/i }).first();
    const buttonCount = await firstRejectButton.count();

    if (buttonCount > 0) {
      await firstRejectButton.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: "tests/e2e/screenshots/sm-reject-modal.png" });

      const reasonTextarea = page.locator("textarea[name*='reason'], textarea").first();
      await reasonTextarea.fill("Test rejection: Incomplete documentation");

      await page.screenshot({ path: "tests/e2e/screenshots/sm-reject-filled.png" });

      const confirmButton = page.getByRole("button", { name: /confirm|reject/i });
      await confirmButton.click();

      await page.waitForTimeout(3000);
      await page.screenshot({ path: "tests/e2e/screenshots/sm-after-reject.png" });

      const successMessage = page.locator("text=/rejected|returned/i");
      await expect(successMessage).toBeVisible();
    } else {
      test.skip(true, "No pending approvals to test");
    }
  });
});
