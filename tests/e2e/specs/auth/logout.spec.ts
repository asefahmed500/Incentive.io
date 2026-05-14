import { test, expect } from "@playwright/test";

test.describe("Authentication - Logout", () => {
  test("logout from dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "karim@incentive.io");
    await page.fill('input[name="password"]', "Executive123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/sales-dashboard/);

    await page.screenshot({ path: "tests/e2e/screenshots/logout-before.png" });

    const signOutButton = page.getByRole("button", { name: /sign out|logout/i }).first();
    await signOutButton.click();

    await page.waitForURL(/\/(login|\?)/);
    await expect(page).toHaveURL(/\/(login|\?)/);

    await page.screenshot({ path: "tests/e2e/screenshots/logout-after.png" });
  });

  test("logout redirects to home", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@incentive.io");
    await page.fill('input[name="password"]', "Admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/admin/);

    const signOutButton = page.getByRole("button", { name: /sign out|logout/i }).first();
    await signOutButton.click();

    await page.waitForURL(/\/(login|\?)/);
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(login|\?)/);
  });
});
