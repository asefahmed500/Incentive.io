# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sales-executive\create-sale.spec.ts >> Sales Executive - Create Sale >> navigate to add record page
- Location: tests\e2e\specs\sales-executive\create-sale.spec.ts:12:3

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
  3  | test.describe("Sales Executive - Create Sale", () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto("/login");
  6  |     await page.fill('input[name="email"]', "karim@incentive.io");
  7  |     await page.fill('input[name="password"]', "Executive123!");
  8  |     await page.click('button[type="submit"]');
> 9  |     await page.waitForURL(/sales-dashboard/);
     |                ^ TimeoutError: page.waitForURL: Timeout 30000ms exceeded.
  10 |   });
  11 | 
  12 |   test("navigate to add record page", async ({ page }) => {
  13 |     await page.goto("/sales-dashboard/add-record");
  14 |     await page.waitForLoadState("networkidle");
  15 | 
  16 |     await expect(page).toHaveURL(/add-record/);
  17 |     await page.screenshot({ path: "tests/e2e/screenshots/se-add-record-page.png" });
  18 | 
  19 |     const heading = page.locator("h1, h2").filter({ hasText: /add|create|new/i }).first();
  20 |     await expect(heading).toBeVisible();
  21 |   });
  22 | 
  23 |   test("create sales record with products", async ({ page }) => {
  24 |     await page.goto("/sales-dashboard/add-record");
  25 |     await page.waitForLoadState("networkidle");
  26 | 
  27 |     const timestamp = Date.now();
  28 | 
  29 |     await page.fill('input[name="companyName"]', `Test Company ${timestamp}`);
  30 |     await page.fill('input[name="companyEmail"]', `test${timestamp}@company.com`);
  31 | 
  32 |     await page.screenshot({ path: "tests/e2e/screenshots/se-company-info.png" });
  33 | 
  34 |     await page.fill('input[name="products[0][productName]"]', "Wireless Mouse");
  35 |     // Select category by matching "electronics" in the label
  36 |     const categorySelect0 = page.locator('select[name="products[0][categoryId]"]');
  37 |     const options0 = await categorySelect0.locator("option").all();
  38 |     for (const option of options0) {
  39 |       const text = await option.textContent();
  40 |       if (text && /electronics/i.test(text)) {
  41 |         await categorySelect0.selectOption({ label: text });
  42 |         break;
  43 |       }
  44 |     }
  45 |     await page.fill('input[name="products[0][unitPrice]"]', "1500");
  46 |     await page.fill('input[name="products[0][quantity]"]', "5");
  47 | 
  48 |     await page.screenshot({ path: "tests/e2e/screenshots/se-product-1.png" });
  49 | 
  50 |     const addButton = page.getByRole("button", { name: /add product/i });
  51 |     await addButton.click();
  52 |     await page.waitForTimeout(500);
  53 | 
  54 |     await page.fill('input[name="products[1][productName]"]', "USB Keyboard");
  55 |     // Select category by matching "electronics" in the label
  56 |     const categorySelect1 = page.locator('select[name="products[1][categoryId]"]');
  57 |     const options1 = await categorySelect1.locator("option").all();
  58 |     for (const option of options1) {
  59 |       const text = await option.textContent();
  60 |       if (text && /electronics/i.test(text)) {
  61 |         await categorySelect1.selectOption({ label: text });
  62 |         break;
  63 |       }
  64 |     }
  65 |     await page.fill('input[name="products[1][unitPrice]"]', "3000");
  66 |     await page.fill('input[name="products[1][quantity]"]', "2");
  67 | 
  68 |     await page.screenshot({ path: "tests/e2e/screenshots/se-products-filled.png" });
  69 | 
  70 |     const saveDraftButton = page.getByRole("button", { name: /save draft/i });
  71 |     await saveDraftButton.click();
  72 | 
  73 |     await page.waitForTimeout(3000);
  74 |     await page.screenshot({ path: "tests/e2e/screenshots/se-after-draft.png" });
  75 | 
  76 |     const successMessage = page.locator("text=/success|saved|created/i");
  77 |     await expect(successMessage).toBeVisible();
  78 |   });
  79 | 
  80 |   test("form validation on empty fields", async ({ page }) => {
  81 |     await page.goto("/sales-dashboard/add-record");
  82 |     await page.waitForLoadState("networkidle");
  83 | 
  84 |     const submitButton = page.getByRole("button", { name: /submit|save/i }).first();
  85 |     await submitButton.click();
  86 | 
  87 |     await page.waitForTimeout(1000);
  88 |     await page.screenshot({ path: "tests/e2e/screenshots/se-validation-errors.png" });
  89 | 
  90 |     const requiredFields = page.locator('input:invalid, [required]:invalid');
  91 |     expect(await requiredFields.count()).toBeGreaterThan(0);
  92 |   });
  93 | });
  94 | 
```