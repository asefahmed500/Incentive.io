# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accountant\processing.spec.ts >> Accountant - Processing Workflow >> view dashboard with charts
- Location: tests\e2e\specs\accountant\processing.spec.ts:56:3

# Error details

```
Error: page.goto: Page crashed
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Accountant - Processing Workflow", () => {
  4  |   test.beforeEach(async ({ page }) => {
> 5  |     await page.goto("/login");
     |                ^ Error: page.goto: Page crashed
  6  |     await page.fill('input[name="email"]', "accountant@incentive.io");
  7  |     await page.fill('input[name="password"]', "Accountant123!");
  8  |     await page.click('button[type="submit"]');
  9  |     await page.waitForURL(/accountant/);
  10 |   });
  11 | 
  12 |   test("view pending approvals", async ({ page }) => {
  13 |     await page.goto("/accountant/approvals");
  14 |     await page.waitForLoadState("networkidle");
  15 | 
  16 |     await page.screenshot({ path: "tests/e2e/screenshots/acc-pending-approvals.png" });
  17 | 
  18 |     const heading = page.locator("h1, h2").filter({ hasText: /pending|approval/i }).first();
  19 |     await expect(heading).toBeVisible();
  20 |   });
  21 | 
  22 |   test("process sale with tax and VAT", async ({ page }) => {
  23 |     await page.goto("/accountant/approvals");
  24 |     await page.waitForLoadState("networkidle");
  25 | 
  26 |     const firstProcessButton = page.getByRole("button", { name: /process/i }).first();
  27 |     const buttonCount = await firstProcessButton.count();
  28 | 
  29 |     if (buttonCount > 0) {
  30 |       await firstProcessButton.click();
  31 |       await page.waitForTimeout(2000);
  32 | 
  33 |       await page.screenshot({ path: "tests/e2e/screenshots/acc-process-modal.png" });
  34 | 
  35 |       const taxRateInput = page.locator('input[name*="tax" i], input[type="number"]').first();
  36 |       await taxRateInput.fill("10");
  37 | 
  38 |       const vatRateInput = page.locator('input[name*="vat" i], input[type="number"]').nth(1);
  39 |       await vatRateInput.fill("5");
  40 | 
  41 |       await page.screenshot({ path: "tests/e2e/screenshots/acc-process-filled.png" });
  42 | 
  43 |       const forwardButton = page.getByRole("button", { name: /process|forward/i });
  44 |       await forwardButton.click();
  45 | 
  46 |       await page.waitForTimeout(4000);
  47 |       await page.screenshot({ path: "tests/e2e/screenshots/acc-after-process.png" });
  48 | 
  49 |       const successMessage = page.locator("text=/success|forwarded|finance/i");
  50 |       await expect(successMessage).toBeVisible();
  51 |     } else {
  52 |       test.skip(true, "No pending approvals to test");
  53 |     }
  54 |   });
  55 | 
  56 |   test("view dashboard with charts", async ({ page }) => {
  57 |     await page.goto("/accountant");
  58 |     await page.waitForLoadState("networkidle");
  59 |     await page.waitForTimeout(2000);
  60 | 
  61 |     await page.screenshot({ path: "tests/e2e/screenshots/acc-dashboard.png", fullPage: true });
  62 | 
  63 |     const svgElements = page.locator("svg");
  64 |     await expect(svgElements).toHaveCount(await svgElements.count());
  65 |   });
  66 | });
  67 | 
```