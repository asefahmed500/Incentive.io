# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\responsive.spec.ts >> Responsive Design >> mobile view (375x667)
- Location: tests\e2e\specs\ui\responsive.spec.ts:12:3

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
      - text: Rendering
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
  3  | test.describe("Responsive Design", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await page.fill('input[name="email"]', "karim@incentive.io");
  7  |     await page.fill('input[name="password"]', "Executive123!");
  8  |     await page.click('button[type="submit"]');
> 9  |     await page.waitForURL(/sales-dashboard/);
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  10 |   });
  11 | 
  12 |   test("mobile view (375x667)", async ({ page }) => {
  13 |     await page.setViewportSize({ width: 375, height: 667 });
  14 |     await page.waitForLoadState("networkidle");
  15 |     await page.waitForTimeout(1000);
  16 | 
  17 |     await page.screenshot({ path: "tests/e2e/screenshots/responsive-mobile.png", fullPage: true });
  18 | 
  19 |     const hamburgerMenu = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i]').first();
  20 |     const menuExists = await hamburgerMenu.count() > 0;
  21 |     expect(menuExists || true).toBeTruthy();
  22 |   });
  23 | 
  24 |   test("tablet view (768x1024)", async ({ page }) => {
  25 |     await page.setViewportSize({ width: 768, height: 1024 });
  26 |     await page.waitForLoadState("networkidle");
  27 |     await page.waitForTimeout(1000);
  28 | 
  29 |     await page.screenshot({ path: "tests/e2e/screenshots/responsive-tablet.png", fullPage: true });
  30 |   });
  31 | 
  32 |   test("desktop view (1920x1080)", async ({ page }) => {
  33 |     await page.setViewportSize({ width: 1920, height: 1080 });
  34 |     await page.waitForLoadState("networkidle");
  35 |     await page.waitForTimeout(1000);
  36 | 
  37 |     await page.screenshot({ path: "tests/e2e/screenshots/responsive-desktop.png", fullPage: true });
  38 | 
  39 |     const sidebar = page.locator("[data-sidebar], nav, aside").first();
  40 |     await expect(sidebar).toBeVisible();
  41 |   });
  42 | 
  43 |   test("charts render correctly on different screen sizes", async ({ page }) => {
  44 |     const sizes = [
  45 |       { width: 375, height: 667, name: "mobile" },
  46 |       { width: 768, height: 1024, name: "tablet" },
  47 |       { width: 1920, height: 1080, name: "desktop" },
  48 |     ];
  49 | 
  50 |     for (const size of sizes) {
  51 |       await page.setViewportSize({ width: size.width, height: size.height });
  52 |       await page.waitForLoadState("networkidle");
  53 |       await page.waitForTimeout(1000);
  54 | 
  55 |       const svgElements = page.locator("svg");
  56 |       const svgCount = await svgElements.count();
  57 |       expect(svgCount).toBeGreaterThan(0);
  58 | 
  59 |       await page.screenshot({ path: `tests/e2e/screenshots/responsive-${size.name}-charts.png` });
  60 |     }
  61 |   });
  62 | });
  63 | 
```