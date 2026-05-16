# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui\rbac.spec.ts >> Role-Based Access Control >> Accountant cannot access administrator routes
- Location: tests\e2e\specs\ui\rbac.spec.ts:34:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.waitForTimeout: Test timeout of 60000ms exceeded.
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
  - button "Open Next.js Dev Tools" [ref=e121] [cursor=pointer]:
    - generic [ref=e124]:
      - text: Compiling
      - generic [ref=e125]:
        - generic [ref=e126]: .
        - generic [ref=e127]: .
        - generic [ref=e128]: .
  - alert [ref=e129]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("Role-Based Access Control", () => {
  4  |   test("Sales Executive cannot access admin routes", async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await page.fill('input[name="email"]', "karim@incentive.io");
  7  |     await page.fill('input[name="password"]', "Executive123!");
  8  |     await page.click('button[type="submit"]');
  9  |     await page.waitForURL(/sales-dashboard/);
  10 | 
  11 |     await page.goto("/admin");
  12 |     await page.waitForTimeout(2000);
  13 | 
  14 |     await page.screenshot({ path: "tests/e2e/screenshots/rbac-se-blocked-from-admin.png" });
  15 | 
  16 |     await expect(page).toHaveURL(/sales-dashboard/);
  17 |   });
  18 | 
  19 |   test("Sales Manager cannot access finance routes", async ({ page }) => {
  20 |     await page.goto("/login");
  21 |     await page.fill('input[name="email"]', "jamal@incentive.io");
  22 |     await page.fill('input[name="password"]', "Manager123!");
  23 |     await page.click('button[type="submit"]');
  24 |     await page.waitForURL(/sales-manager/);
  25 | 
  26 |     await page.goto("/finance");
  27 |     await page.waitForTimeout(2000);
  28 | 
  29 |     await page.screenshot({ path: "tests/e2e/screenshots/rbac-sm-blocked-from-finance.png" });
  30 | 
  31 |     await expect(page).toHaveURL(/sales-manager/);
  32 |   });
  33 | 
  34 |   test("Accountant cannot access administrator routes", async ({ page }) => {
  35 |     await page.goto("/login");
  36 |     await page.fill('input[name="email"]', "accountant@incentive.io");
  37 |     await page.fill('input[name="password"]', "Accountant123!");
  38 |     await page.click('button[type="submit"]');
  39 |     await page.waitForURL(/accountant/);
  40 | 
  41 |     await page.goto("/administrator");
> 42 |     await page.waitForTimeout(2000);
     |                ^ Error: page.waitForTimeout: Test timeout of 60000ms exceeded.
  43 | 
  44 |     await page.screenshot({ path: "tests/e2e/screenshots/rbac-acc-blocked-from-superadmin.png" });
  45 | 
  46 |     await expect(page).toHaveURL(/accountant/);
  47 |   });
  48 | 
  49 |   test("unauthenticated user redirected to login", async ({ page }) => {
  50 |     await page.goto("/sales-dashboard");
  51 |     await page.waitForTimeout(2000);
  52 | 
  53 |     await expect(page).toHaveURL(/login/);
  54 |   });
  55 | });
  56 | 
```