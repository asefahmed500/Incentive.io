# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\login.spec.ts >> Authentication - Login >> successful login as accountant
- Location: tests\e2e\specs\auth\login.spec.ts:18:5

# Error details

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://localhost:3000/"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e9] [cursor=pointer]:
    - generic [ref=e12]:
      - text: Compiling
      - generic [ref=e13]:
        - generic [ref=e14]: .
        - generic [ref=e15]: .
        - generic [ref=e16]: .
  - alert [ref=e17]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const testUsers = [
  4  |   { email: "karim@incentive.io", password: "Executive123!", role: "salesExecutive", expectedPath: /sales-dashboard/ },
  5  |   { email: "jamal@incentive.io", password: "Manager123!", role: "salesManager", expectedPath: /sales-manager/ },
  6  |   { email: "accountant@incentive.io", password: "Accountant123!", role: "accountant", expectedPath: /accountant/ },
  7  |   { email: "finance@incentive.io", password: "Finance123!", role: "finance", expectedPath: /finance/ },
  8  |   { email: "admin@incentive.io", password: "Admin123!", role: "admin", expectedPath: /admin/ },
  9  |   { email: "superadmin@incentive.io", password: "Superadmin123!", role: "administrator", expectedPath: /administrator/ },
  10 | ];
  11 | 
  12 | test.describe("Authentication - Login", () => {
  13 |   test.beforeEach(async ({ page }) => {
  14 |     await page.goto("/login");
  15 |   });
  16 | 
  17 |   testUsers.forEach(({ email, password, role, expectedPath }) => {
  18 |     test(`successful login as ${role}`, async ({ page }) => {
  19 |       await page.fill('input[name="email"]', email);
  20 |       await page.fill('input[name="password"]', password);
  21 |       await page.click('button[type="submit"]');
  22 | 
> 23 |       await page.waitForURL(expectedPath);
     |                  ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  24 |       await expect(page).toHaveURL(expectedPath);
  25 | 
  26 |       await page.screenshot({ path: `tests/e2e/screenshots/login-${role}-success.png` });
  27 |     });
  28 |   });
  29 | 
  30 |   test("failed login with invalid credentials", async ({ page }) => {
  31 |     await page.fill('input[name="email"]', "test@example.com");
  32 |     await page.fill('input[name="password"]', "wrongpassword");
  33 |     await page.click('button[type="submit"]');
  34 | 
  35 |     await page.waitForTimeout(2000);
  36 | 
  37 |     const content = await page.content();
  38 |     expect(content.toLowerCase()).toMatch(/invalid|error|failed/);
  39 | 
  40 |     await page.screenshot({ path: "tests/e2e/screenshots/login-failure.png" });
  41 |   });
  42 | 
  43 |   test("login form validation", async ({ page }) => {
  44 |     await page.click('button[type="submit"]');
  45 |     await page.waitForTimeout(1000);
  46 | 
  47 |     const emailInput = page.locator('input[name="email"]');
  48 |     await expect(emailInput).toBeFocused();
  49 | 
  50 |     await page.screenshot({ path: "tests/e2e/screenshots/login-validation.png" });
  51 |   });
  52 | });
  53 | 
```