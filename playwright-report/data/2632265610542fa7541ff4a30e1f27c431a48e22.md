# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sales-executive\dashboard.spec.ts >> Sales Executive - Dashboard >> dashboard loads correctly
- Location: tests\e2e\specs\sales-executive\dashboard.spec.ts:12:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Incentive.io" [level=1] [ref=e5]
      - paragraph [ref=e6]: Sign in to your account
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: you@example.com
            - text: karim@incentive.io
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]: Executive123!
      - button "Sign in" [ref=e15]
    - paragraph [ref=e16]:
      - text: Don't have an account?
      - link "Register" [ref=e17] [cursor=pointer]:
        - /url: /register
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e23] [cursor=pointer]:
    - generic [ref=e26]:
      - text: Compiling
      - generic [ref=e27]:
        - generic [ref=e28]: .
        - generic [ref=e29]: .
        - generic [ref=e30]: .
  - alert [ref=e31]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Sales Executive - Dashboard", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await page.fill('input[name="email"]', "karim@incentive.io");
  7  |     await page.fill('input[name="password"]', "Executive123!");
  8  |     await page.click('button[type="submit"]');
> 9  |     await page.waitForURL(/sales-dashboard/);
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  10 |   });
  11 | 
  12 |   test("dashboard loads correctly", async ({ page }) => {
  13 |     await expect(page).toHaveURL(/sales-dashboard/);
  14 | 
  15 |     await page.waitForLoadState("networkidle");
  16 |     await page.screenshot({ path: "tests/e2e/screenshots/se-dashboard.png", fullPage: true });
  17 | 
  18 |     const sidebar = page.locator("[data-sidebar], nav, aside").first();
  19 |     await expect(sidebar).toBeVisible();
  20 | 
  21 |     const mainContent = page.locator("main").first();
  22 |     await expect(mainContent).toBeVisible();
  23 |   });
  24 | 
  25 |   test("dashboard displays charts", async ({ page }) => {
  26 |     await page.waitForLoadState("networkidle");
  27 |     await page.waitForTimeout(2000);
  28 | 
  29 |     const svgElements = page.locator("svg");
  30 |     await expect(svgElements).toHaveCount(await svgElements.count());
  31 | 
  32 |     await page.screenshot({ path: "tests/e2e/screenshots/se-dashboard-charts.png" });
  33 |   });
  34 | 
  35 |   test("dashboard displays sales records table", async ({ page }) => {
  36 |     await page.waitForLoadState("networkidle");
  37 | 
  38 |     const table = page.locator("table").first();
  39 |     await expect(table).toBeVisible();
  40 | 
  41 |     await page.screenshot({ path: "tests/e2e/screenshots/se-dashboard-table.png" });
  42 |   });
  43 | 
  44 |   test("notification bell is present", async ({ page }) => {
  45 |     await page.waitForLoadState("networkidle");
  46 | 
  47 |     const notificationBell = page.locator('button[aria-label*="notification" i], button[aria-label*="Notification" i]').first();
  48 |     await expect(notificationBell).toBeVisible();
  49 |   });
  50 | });
  51 | 
```