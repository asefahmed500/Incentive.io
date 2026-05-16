# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth\logout.spec.ts >> Authentication - Logout >> logout from dashboard
- Location: tests\e2e\specs\auth\logout.spec.ts:4:3

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
  3  | test.describe("Authentication - Logout", () => {
  4  |   test("logout from dashboard", async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await page.fill('input[name="email"]', "karim@incentive.io");
  7  |     await page.fill('input[name="password"]', "Executive123!");
  8  |     await page.click('button[type="submit"]');
> 9  |     await page.waitForURL(/sales-dashboard/);
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  10 | 
  11 |     await page.screenshot({ path: "tests/e2e/screenshots/logout-before.png" });
  12 | 
  13 |     const signOutButton = page.getByRole("button", { name: /sign out|logout/i }).first();
  14 |     await signOutButton.click();
  15 | 
  16 |     await page.waitForURL(/\/(login|\?)/);
  17 |     await expect(page).toHaveURL(/\/(login|\?)/);
  18 | 
  19 |     await page.screenshot({ path: "tests/e2e/screenshots/logout-after.png" });
  20 |   });
  21 | 
  22 |   test("logout redirects to home", async ({ page }) => {
  23 |     await page.goto("/login");
  24 |     await page.fill('input[name="email"]', "admin@incentive.io");
  25 |     await page.fill('input[name="password"]', "Admin123!");
  26 |     await page.click('button[type="submit"]');
  27 |     await page.waitForURL(/admin/);
  28 | 
  29 |     const signOutButton = page.getByRole("button", { name: /sign out|logout/i }).first();
  30 |     await signOutButton.click();
  31 | 
  32 |     await page.waitForURL(/\/(login|\?)/);
  33 |     const currentUrl = page.url();
  34 |     expect(currentUrl).toMatch(/\/(login|\?)/);
  35 |   });
  36 | });
  37 | 
```