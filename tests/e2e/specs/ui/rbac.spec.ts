import { test, expect } from "@playwright/test";

test.describe("Role-Based Access Control", () => {
  test("Sales Executive cannot access admin routes", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "karim@incentive.io");
    await page.fill('input[name="password"]', "Executive123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/sales-dashboard/);

    await page.goto("/admin");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/rbac-se-blocked-from-admin.png" });

    await expect(page).toHaveURL(/sales-dashboard/);
  });

  test("Sales Manager cannot access finance routes", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "jamal@incentive.io");
    await page.fill('input[name="password"]', "Manager123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/sales-manager/);

    await page.goto("/finance");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/rbac-sm-blocked-from-finance.png" });

    await expect(page).toHaveURL(/sales-manager/);
  });

  test("Accountant cannot access administrator routes", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "accountant@incentive.io");
    await page.fill('input[name="password"]', "Accountant123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/accountant/);

    await page.goto("/administrator");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/rbac-acc-blocked-from-superadmin.png" });

    await expect(page).toHaveURL(/accountant/);
  });

  test("unauthenticated user redirected to login", async ({ page }) => {
    await page.goto("/sales-dashboard");
    await page.waitForTimeout(2000);

    await expect(page).toHaveURL(/login/);
  });
});
