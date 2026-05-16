# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\rbac.spec.ts >> Role-Based Access Control >> Sales Executive cannot access admin routes
- Location: tests\e2e\specs\ui\rbac.spec.ts:4:3

# Error details

```
TimeoutError: page.goto: Timeout 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Role-Based Access Control", () => {
  4  |   test("Sales Executive cannot access admin routes", async ({ page }) => {
> 5  |     await page.goto("/login");
     |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  6  |     await page.fill('input[name="email"]', "karim@incentive.io");
  7  |     await page.fill('input[name="password"]', "Executive123!");
  8  |     await page.click('button[type="submit"]');
  9  |     await page.waitForURL(/sales-dashboard/);
  10 | 
  11 |     await page.goto("/admin");
  12 |     await page.waitForTimeout(2000);
  13 | 
  14 |     await page.screenshot({ path: "tests/e2e/screenshots/rbac-se-blocked-from-admin.png" });
  15 | 
  16 |     await expect(page).toHaveURL(/sales-dashboard/);
  17 |   });
  18 | 
  19 |   test("Sales Manager cannot access finance routes", async ({ page }) => {
  20 |     await page.goto("/login");
  21 |     await page.fill('input[name="email"]', "jamal@incentive.io");
  22 |     await page.fill('input[name="password"]', "Manager123!");
  23 |     await page.click('button[type="submit"]');
  24 |     await page.waitForURL(/sales-manager/);
  25 | 
  26 |     await page.goto("/finance");
  27 |     await page.waitForTimeout(2000);
  28 | 
  29 |     await page.screenshot({ path: "tests/e2e/screenshots/rbac-sm-blocked-from-finance.png" });
  30 | 
  31 |     await expect(page).toHaveURL(/sales-manager/);
  32 |   });
  33 | 
  34 |   test("Accountant cannot access administrator routes", async ({ page }) => {
  35 |     await page.goto("/login");
  36 |     await page.fill('input[name="email"]', "accountant@incentive.io");
  37 |     await page.fill('input[name="password"]', "Accountant123!");
  38 |     await page.click('button[type="submit"]');
  39 |     await page.waitForURL(/accountant/);
  40 | 
  41 |     await page.goto("/administrator");
  42 |     await page.waitForTimeout(2000);
  43 | 
  44 |     await page.screenshot({ path: "tests/e2e/screenshots/rbac-acc-blocked-from-superadmin.png" });
  45 | 
  46 |     await expect(page).toHaveURL(/accountant/);
  47 |   });
  48 | 
  49 |   test("unauthenticated user redirected to login", async ({ page }) => {
  50 |     await page.goto("/sales-dashboard");
  51 |     await page.waitForTimeout(2000);
  52 | 
  53 |     await expect(page).toHaveURL(/login/);
  54 |   });
  55 | });
  56 | 
```