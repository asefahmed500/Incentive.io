# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accountant\processing.spec.ts >> Accountant - Processing Workflow >> view pending approvals
- Location: tests\e2e\specs\accountant\processing.spec.ts:14:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
  navigated to "http://127.0.0.1:3000/accountant"
  "domcontentloaded" event fired
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - heading "Incentive.io" [level=2] [ref=e8]
        - paragraph [ref=e9]: Accountant
      - list [ref=e11]:
        - listitem [ref=e12]:
          - link "Dashboard" [ref=e13] [cursor=pointer]:
            - /url: /accountant
            - generic [ref=e14]:
              - img [ref=e15]
              - text: Dashboard
        - listitem [ref=e20]:
          - link "Approvals" [ref=e21] [cursor=pointer]:
            - /url: /accountant/approvals
            - generic [ref=e22]:
              - img [ref=e23]
              - text: Approvals
        - listitem [ref=e26]:
          - link "Commissions" [ref=e27] [cursor=pointer]:
            - /url: /accountant/commissions
            - generic [ref=e28]:
              - img [ref=e29]
              - text: Commissions
        - listitem [ref=e32]:
          - link "Payments" [ref=e33] [cursor=pointer]:
            - /url: /accountant/payments
            - generic [ref=e34]:
              - img [ref=e35]
              - text: Payments
        - listitem [ref=e38]:
          - link "Records" [ref=e39] [cursor=pointer]:
            - /url: /accountant/records
            - generic [ref=e40]:
              - img [ref=e41]
              - text: Records
        - listitem [ref=e44]:
          - link "Analytics" [ref=e45] [cursor=pointer]:
            - /url: /accountant/analytics
            - generic [ref=e46]:
              - img [ref=e47]
              - text: Analytics
        - listitem [ref=e49]:
          - link "Commission Rules" [ref=e50] [cursor=pointer]:
            - /url: /accountant/commission-rules
            - generic [ref=e51]:
              - img [ref=e52]
              - text: Commission Rules
        - listitem [ref=e56]:
          - link "Profile" [ref=e57] [cursor=pointer]:
            - /url: /accountant/profile
            - generic [ref=e58]:
              - img [ref=e59]
              - text: Profile
      - list [ref=e63]:
        - listitem [ref=e64]:
          - button "Sign Out" [ref=e65]:
            - img [ref=e66]
            - text: Sign Out
    - main [ref=e69]:
      - generic [ref=e70]:
        - button "Toggle Sidebar" [ref=e71]:
          - img
          - generic [ref=e72]: Toggle Sidebar
        - button [ref=e75]:
          - img
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Accountant - Processing Workflow", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await page.fill('input[name="email"]', "accountant@incentive.io");
  7  |     await page.fill('input[name="password"]', "Accountant123!");
  8  |     await page.click('button[type="submit"]');
  9  | 
  10 |     // Wait for navigation to accountant dashboard
> 11 |     await page.waitForURL(/accountant/, { timeout: 15000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  12 |   });
  13 | 
  14 |   test("view pending approvals", async ({ page }) => {
  15 |     await page.goto("/accountant/approvals");
  16 |     await page.waitForLoadState("load");
  17 | 
  18 |     await page.screenshot({ path: "tests/e2e/screenshots/acc-pending-approvals.png" });
  19 | 
  20 |     const heading = page.locator("h1, h2").filter({ hasText: /pending|approval/i }).first();
  21 |     await expect(heading).toBeVisible();
  22 |   });
  23 | 
  24 |   test("process sale with tax and VAT", async ({ page }) => {
  25 |     await page.goto("/accountant/approvals");
  26 |     await page.waitForLoadState("load");
  27 | 
  28 |     const firstProcessButton = page.getByRole("button", { name: /process/i }).first();
  29 |     const buttonCount = await firstProcessButton.count();
  30 | 
  31 |     if (buttonCount > 0) {
  32 |       await firstProcessButton.click();
  33 |       await page.waitForTimeout(2000);
  34 | 
  35 |       await page.screenshot({ path: "tests/e2e/screenshots/acc-process-modal.png" });
  36 | 
  37 |       const taxRateInput = page.locator('input[name*="tax" i], input[type="number"]').first();
  38 |       await taxRateInput.fill("10");
  39 | 
  40 |       const vatRateInput = page.locator('input[name*="vat" i], input[type="number"]').nth(1);
  41 |       await vatRateInput.fill("5");
  42 | 
  43 |       await page.screenshot({ path: "tests/e2e/screenshots/acc-process-filled.png" });
  44 | 
  45 |       const forwardButton = page.getByRole("button", { name: /process|forward/i });
  46 |       await forwardButton.click();
  47 | 
  48 |       await page.waitForTimeout(4000);
  49 |       await page.screenshot({ path: "tests/e2e/screenshots/acc-after-process.png" });
  50 | 
  51 |       const successMessage = page.locator("text=/success|forwarded|finance/i");
  52 |       await expect(successMessage).toBeVisible();
  53 |     } else {
  54 |       test.skip(true, "No pending approvals to test");
  55 |     }
  56 |   });
  57 | 
  58 |   test("view dashboard with charts", async ({ page }) => {
  59 |     await page.goto("/accountant");
  60 |     await page.waitForLoadState("load");
  61 |     await page.waitForTimeout(2000);
  62 | 
  63 |     await page.screenshot({ path: "tests/e2e/screenshots/acc-dashboard.png", fullPage: true });
  64 | 
  65 |     const svgElements = page.locator("svg");
  66 |     await expect(svgElements).toHaveCount(await svgElements.count());
  67 |   });
  68 | });
  69 | 
```