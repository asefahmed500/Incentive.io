# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: administrator\audit-logs.spec.ts >> Administrator - Audit Logs >> view system health
- Location: tests\e2e\specs\administrator\audit-logs.spec.ts:57:3

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
            - text: superadmin@incentive.io
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]: Superadmin123!
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
  3  | test.describe("Administrator - Audit Logs", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await page.fill('input[name="email"]', "superadmin@incentive.io");
  7  |     await page.fill('input[name="password"]', "Superadmin123!");
  8  |     await page.click('button[type="submit"]');
> 9  |     await page.waitForURL(/administrator/);
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  10 |   });
  11 | 
  12 |   test("view administrator dashboard", async ({ page }) => {
  13 |     await page.goto("/administrator");
  14 |     await page.waitForLoadState("networkidle");
  15 |     await page.waitForTimeout(2000);
  16 | 
  17 |     await page.screenshot({ path: "tests/e2e/screenshots/superadmin-dashboard.png", fullPage: true });
  18 | 
  19 |     const svgElements = page.locator("svg");
  20 |     await expect(svgElements).toHaveCount(await svgElements.count());
  21 |   });
  22 | 
  23 |   test("view audit logs", async ({ page }) => {
  24 |     await page.goto("/administrator/audit-logs");
  25 |     await page.waitForLoadState("networkidle");
  26 | 
  27 |     await page.screenshot({ path: "tests/e2e/screenshots/superadmin-audit-logs.png" });
  28 | 
  29 |     const table = page.locator("table").first();
  30 |     await expect(table).toBeVisible();
  31 | 
  32 |     const tableRows = page.locator("table tbody tr");
  33 |     const rowCount = await tableRows.count();
  34 |     expect(rowCount).toBeGreaterThan(0);
  35 |   });
  36 | 
  37 |   test("filter audit logs by action", async ({ page }) => {
  38 |     await page.goto("/administrator/audit-logs");
  39 |     await page.waitForLoadState("networkidle");
  40 | 
  41 |     const filterSelect = page.locator("select").first();
  42 |     if (await filterSelect.count() > 0) {
  43 |       const options = await filterSelect.locator("option").all();
  44 |       for (const option of options) {
  45 |         const text = await option.textContent();
  46 |         if (text && /login|user|create/i.test(text)) {
  47 |           await filterSelect.selectOption({ label: text });
  48 |           break;
  49 |         }
  50 |       }
  51 |       await page.waitForTimeout(1000);
  52 | 
  53 |       await page.screenshot({ path: "tests/e2e/screenshots/superadmin-audit-logs-filtered.png" });
  54 |     }
  55 |   });
  56 | 
  57 |   test("view system health", async ({ page }) => {
  58 |     await page.goto("/administrator/system-health");
  59 |     await page.waitForLoadState("networkidle");
  60 | 
  61 |     await page.screenshot({ path: "tests/e2e/screenshots/superadmin-system-health.png" });
  62 | 
  63 |     const healthIndicators = page.locator("text=/healthy|connected|active/i");
  64 |     await expect(healthIndicators).toBeVisible();
  65 |   });
  66 | });
  67 | 
```