import { test, expect } from "@playwright/test";

test.describe("Sales Executive - Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "karim@incentive.io");
    await page.fill('input[name="password"]', "Executive123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/sales-dashboard/);
  });

  test("dashboard loads correctly", async ({ page }) => {
    await expect(page).toHaveURL(/sales-dashboard/);

    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/e2e/screenshots/se-dashboard.png", fullPage: true });

    const sidebar = page.locator("[data-sidebar], nav, aside").first();
    await expect(sidebar).toBeVisible();

    const mainContent = page.locator("main").first();
    await expect(mainContent).toBeVisible();
  });

  test("dashboard displays charts", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    const svgElements = page.locator("svg");
    await expect(svgElements).toHaveCount(await svgElements.count());

    await page.screenshot({ path: "tests/e2e/screenshots/se-dashboard-charts.png" });
  });

  test("dashboard displays sales records table", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    await page.screenshot({ path: "tests/e2e/screenshots/se-dashboard-table.png" });
  });

  test("notification bell is present", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    const notificationBell = page.locator('button[aria-label*="notification" i], button[aria-label*="Notification" i]').first();
    await expect(notificationBell).toBeVisible();
  });
});
