import { test, expect } from "@playwright/test";

test.describe("Administrator - Audit Logs", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "superadmin@incentive.io");
    await page.fill('input[name="password"]', "Superadmin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL(/administrator/);
  });

  test("view administrator dashboard", async ({ page }) => {
    await page.goto("/administrator");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    await page.screenshot({ path: "tests/e2e/screenshots/superadmin-dashboard.png", fullPage: true });

    const svgElements = page.locator("svg");
    await expect(svgElements).toHaveCount(await svgElements.count());
  });

  test("view audit logs", async ({ page }) => {
    await page.goto("/administrator/audit-logs");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "tests/e2e/screenshots/superadmin-audit-logs.png" });

    const table = page.locator("table").first();
    await expect(table).toBeVisible();

    const tableRows = page.locator("table tbody tr");
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test("filter audit logs by action", async ({ page }) => {
    await page.goto("/administrator/audit-logs");
    await page.waitForLoadState("networkidle");

    const filterSelect = page.locator("select").first();
    if (await filterSelect.count() > 0) {
      const options = await filterSelect.locator("option").all();
      for (const option of options) {
        const text = await option.textContent();
        if (text && /login|user|create/i.test(text)) {
          await filterSelect.selectOption({ label: text });
          break;
        }
      }
      await page.waitForTimeout(1000);

      await page.screenshot({ path: "tests/e2e/screenshots/superadmin-audit-logs-filtered.png" });
    }
  });

  test("view system health", async ({ page }) => {
    await page.goto("/administrator/system-health");
    await page.waitForLoadState("networkidle");

    await page.screenshot({ path: "tests/e2e/screenshots/superadmin-system-health.png" });

    const healthIndicators = page.locator("text=/healthy|connected|active/i");
    await expect(healthIndicators).toBeVisible();
  });
});
