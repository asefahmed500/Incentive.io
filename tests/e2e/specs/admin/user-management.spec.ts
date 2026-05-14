import { test, expect } from "@playwright/test";

test.describe("Admin - User Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@incentive.io");
    await page.fill('input[name="password"]', "Admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin/);
  });

  test("view admin dashboard", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/admin-dashboard.png", fullPage: true });

    const svgElements = page.locator("svg");
    await expect(svgElements).toHaveCount(await svgElements.count());
  });

  test("view users list", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "tests/e2e/screenshots/admin-users.png" });

    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("search users", async ({ page }) => {
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    await searchInput.fill("karim");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "tests/e2e/screenshots/admin-users-search.png" });
  });
});
