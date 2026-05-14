import { test, expect } from "@playwright/test";

const testUsers = [
  { email: "karim@incentive.io", password: "Executive123!", role: "salesExecutive", expectedPath: /sales-dashboard/ },
  { email: "jamal@incentive.io", password: "Manager123!", role: "salesManager", expectedPath: /sales-manager/ },
  { email: "accountant@incentive.io", password: "Accountant123!", role: "accountant", expectedPath: /accountant/ },
  { email: "finance@incentive.io", password: "Finance123!", role: "finance", expectedPath: /finance/ },
  { email: "admin@incentive.io", password: "Admin123!", role: "admin", expectedPath: /admin/ },
  { email: "superadmin@incentive.io", password: "Superadmin123!", role: "administrator", expectedPath: /administrator/ },
];

test.describe("Authentication - Login", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  testUsers.forEach(({ email, password, role, expectedPath }) => {
    test(`successful login as ${role}`, async ({ page }) => {
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');

      await page.waitForURL(expectedPath);
      await expect(page).toHaveURL(expectedPath);

      await page.screenshot({ path: `tests/e2e/screenshots/login-${role}-success.png` });
    });
  });

  test("failed login with invalid credentials", async ({ page }) => {
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    const content = await page.content();
    expect(content.toLowerCase()).toMatch(/invalid|error|failed/);

    await page.screenshot({ path: "tests/e2e/screenshots/login-failure.png" });
  });

  test("login form validation", async ({ page }) => {
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toBeFocused();

    await page.screenshot({ path: "tests/e2e/screenshots/login-validation.png" });
  });
});
