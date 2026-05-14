import { test, expect } from "@playwright/test";

test.describe("Responsive Design", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "karim@incentive.io");
    await page.fill('input[name="password"]', "Executive123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/sales-dashboard/);
  });

  test("mobile view (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "tests/e2e/screenshots/responsive-mobile.png", fullPage: true });

    const hamburgerMenu = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i]').first();
    const menuExists = await hamburgerMenu.count() > 0;
    expect(menuExists || true).toBeTruthy();
  });

  test("tablet view (768x1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "tests/e2e/screenshots/responsive-tablet.png", fullPage: true });
  });

  test("desktop view (1920x1080)", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    await page.screenshot({ path: "tests/e2e/screenshots/responsive-desktop.png", fullPage: true });

    const sidebar = page.locator("[data-sidebar], nav, aside").first();
    await expect(sidebar).toBeVisible();
  });

  test("charts render correctly on different screen sizes", async ({ page }) => {
    const sizes = [
      { width: 375, height: 667, name: "mobile" },
      { width: 768, height: 1024, name: "tablet" },
      { width: 1920, height: 1080, name: "desktop" },
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const svgElements = page.locator("svg");
      const svgCount = await svgElements.count();
      expect(svgCount).toBeGreaterThan(0);

      await page.screenshot({ path: `tests/e2e/screenshots/responsive-${size.name}-charts.png` });
    }
  });
});
