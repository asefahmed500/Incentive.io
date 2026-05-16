# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sales-manager\approval.spec.ts >> Sales Manager - Approval Workflow >> reject sales record with reason
- Location: tests\e2e\specs\sales-manager\approval.spec.ts:42:3

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
  3  | test.describe("Sales Manager - Approval Workflow", () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto("/login");
     |                ^ TimeoutError: page.goto: Timeout 30000ms exceeded.
  6  |     await page.fill('input[name="email"]', "jamal@incentive.io");
  7  |     await page.fill('input[name="password"]', "Manager123!");
  8  |     await page.click('button[type="submit"]');
  9  |     await page.waitForURL(/sales-manager/);
  10 |   });
  11 | 
  12 |   test("view pending approvals", async ({ page }) => {
  13 |     await page.goto("/sales-manager/pending-approvals");
  14 |     await page.waitForLoadState("networkidle");
  15 | 
  16 |     await page.screenshot({ path: "tests/e2e/screenshots/sm-pending-approvals.png" });
  17 | 
  18 |     const heading = page.locator("h1, h2").filter({ hasText: /pending|approval/i }).first();
  19 |     await expect(heading).toBeVisible();
  20 |   });
  21 | 
  22 |   test("approve sales record", async ({ page }) => {
  23 |     await page.goto("/sales-manager/pending-approvals");
  24 |     await page.waitForLoadState("networkidle");
  25 | 
  26 |     const firstApproveButton = page.getByRole("button", { name: /approve/i }).first();
  27 |     const buttonCount = await firstApproveButton.count();
  28 | 
  29 |     if (buttonCount > 0) {
  30 |       await firstApproveButton.click();
  31 |       await page.waitForTimeout(3000);
  32 | 
  33 |       await page.screenshot({ path: "tests/e2e/screenshots/sm-after-approve.png" });
  34 | 
  35 |       const successMessage = page.locator("text=/success|approved|forwarded/i");
  36 |       await expect(successMessage).toBeVisible();
  37 |     } else {
  38 |       test.skip(true, "No pending approvals to test");
  39 |     }
  40 |   });
  41 | 
  42 |   test("reject sales record with reason", async ({ page }) => {
  43 |     await page.goto("/sales-manager/pending-approvals");
  44 |     await page.waitForLoadState("networkidle");
  45 | 
  46 |     const firstRejectButton = page.getByRole("button", { name: /reject/i }).first();
  47 |     const buttonCount = await firstRejectButton.count();
  48 | 
  49 |     if (buttonCount > 0) {
  50 |       await firstRejectButton.click();
  51 |       await page.waitForTimeout(2000);
  52 | 
  53 |       await page.screenshot({ path: "tests/e2e/screenshots/sm-reject-modal.png" });
  54 | 
  55 |       const reasonTextarea = page.locator("textarea[name*='reason'], textarea").first();
  56 |       await reasonTextarea.fill("Test rejection: Incomplete documentation");
  57 | 
  58 |       await page.screenshot({ path: "tests/e2e/screenshots/sm-reject-filled.png" });
  59 | 
  60 |       const confirmButton = page.getByRole("button", { name: /confirm|reject/i });
  61 |       await confirmButton.click();
  62 | 
  63 |       await page.waitForTimeout(3000);
  64 |       await page.screenshot({ path: "tests/e2e/screenshots/sm-after-reject.png" });
  65 | 
  66 |       const successMessage = page.locator("text=/rejected|returned/i");
  67 |       await expect(successMessage).toBeVisible();
  68 |     } else {
  69 |       test.skip(true, "No pending approvals to test");
  70 |     }
  71 |   });
  72 | });
  73 | 
```