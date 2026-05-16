# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: finance\final-approval.spec.ts >> Finance - Final Approval >> view dashboard with payment charts
- Location: tests\e2e\specs\finance\final-approval.spec.ts:45:3

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
  3  | test.describe("Finance - Final Approval", () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto("/login");
     |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  6  |     await page.fill('input[name="email"]', "finance@incentive.io");
  7  |     await page.fill('input[name="password"]', "Finance123!");
  8  |     await page.click('button[type="submit"]');
  9  |     await page.waitForURL(/finance/);
  10 |   });
  11 | 
  12 |   test("view pending approvals", async ({ page }) => {
  13 |     await page.goto("/finance/approvals");
  14 |     await page.waitForLoadState("networkidle");
  15 | 
  16 |     await page.screenshot({ path: "tests/e2e/screenshots/fin-pending-approvals.png" });
  17 | 
  18 |     const heading = page.locator("h1, h2").filter({ hasText: /pending|approval/i }).first();
  19 |     await expect(heading).toBeVisible();
  20 |   });
  21 | 
  22 |   test("final approval triggers wallet credit", async ({ page }) => {
  23 |     await page.goto("/finance/approvals");
  24 |     await page.waitForLoadState("networkidle");
  25 | 
  26 |     const firstApproveButton = page.getByRole("button", { name: /approve/i }).first();
  27 |     const buttonCount = await firstApproveButton.count();
  28 | 
  29 |     if (buttonCount > 0) {
  30 |       await firstApproveButton.click();
  31 |       await page.waitForTimeout(4000);
  32 | 
  33 |       await page.screenshot({ path: "tests/e2e/screenshots/fin-after-approve.png" });
  34 | 
  35 |       const successMessage = page.locator("text=/success|approved|credited/i");
  36 |       await expect(successMessage).toBeVisible();
  37 | 
  38 |       const notification = page.locator('[role="alert"], [data-notification]').first();
  39 |       await expect(notification).toBeVisible();
  40 |     } else {
  41 |       test.skip(true, "No pending approvals to test");
  42 |     }
  43 |   });
  44 | 
  45 |   test("view dashboard with payment charts", async ({ page }) => {
  46 |     await page.goto("/finance");
  47 |     await page.waitForLoadState("networkidle");
  48 |     await page.waitForTimeout(2000);
  49 | 
  50 |     await page.screenshot({ path: "tests/e2e/screenshots/fin-dashboard.png", fullPage: true });
  51 | 
  52 |     const svgElements = page.locator("svg");
  53 |     await expect(svgElements).toHaveCount(await svgElements.count());
  54 |   });
  55 | 
  56 |   test("view payment queue", async ({ page }) => {
  57 |     await page.goto("/finance/payments");
  58 |     await page.waitForLoadState("networkidle");
  59 | 
  60 |     await page.screenshot({ path: "tests/e2e/screenshots/fin-payments.png" });
  61 | 
  62 |     const table = page.locator("table").first();
  63 |     await expect(table).toBeVisible();
  64 |   });
  65 | });
  66 | 
```