# E2E Testing with Playwright

This directory contains end-to-end tests for the Incentive.io application using Playwright.

## Prerequisites

1. MongoDB must be running at `mongodb://localhost:27017/incentiveio`
2. The application should be running on `http://localhost:3000`
3. Test data should be seeded (run `npm run seed`)

## Installation

```bash
npm install
npx playwright install
```

## Running Tests

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests in headless mode |
| `npm run test:e2e:ui` | Run tests with Playwright UI |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:headed` | Run tests in headed mode (watch browser) |
| `npm run test:e2e:report` | Open HTML test report |

## Test Structure

```
tests/e2e/
├── playwright.config.ts    # Playwright configuration
├── specs/
│   ├── auth/              # Authentication tests
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── sales-executive/   # Sales Executive tests
│   │   ├── dashboard.spec.ts
│   │   └── create-sale.spec.ts
│   ├── sales-manager/     # Sales Manager tests
│   │   └── approval.spec.ts
│   ├── accountant/        # Accountant tests
│   │   └── processing.spec.ts
│   ├── finance/           # Finance tests
│   │   └── final-approval.spec.ts
│   ├── admin/             # Admin tests
│   │   └── user-management.spec.ts
│   ├── administrator/     # Administrator tests
│   │   └── audit-logs.spec.ts
│   └── ui/                # UI tests
│       ├── rbac.spec.ts
│       └── responsive.spec.ts
└── screenshots/           # Test screenshots
```

## Test Coverage

### Authentication
- Login for all 6 user roles
- Logout functionality
- Form validation

### Sales Executive
- Dashboard loading
- Creating sales records
- Form validation

### Sales Manager
- Viewing pending approvals
- Approving sales records
- Rejecting sales records with reasons

### Accountant
- Viewing pending approvals
- Processing sales with tax/VAT
- Dashboard charts

### Finance
- Viewing pending approvals
- Final approval workflow
- Payment queue

### Admin
- Dashboard viewing
- User management
- Search functionality

### Administrator
- Dashboard viewing
- Audit logs
- System health

### UI/UX
- Role-based access control
- Responsive design (mobile, tablet, desktop)
- Cross-role blocking

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Sales Executive | karim@incentive.io | Executive123! |
| Sales Manager | jamal@incentive.io | Manager123! |
| Accountant | accountant@incentive.io | Accountant123! |
| Finance | finance@incentive.io | Finance123! |
| Admin | admin@incentive.io | Admin123! |
| Administrator | superadmin@incentive.io | Superadmin123! |

## Writing New Tests

1. Create a new spec file in the appropriate directory
2. Import test utilities:
   ```typescript
   import { test, expect } from "@playwright/test";
   ```
3. Define test groups:
   ```typescript
   test.describe("Feature Name", () => {
     test.beforeEach(async ({ page }) => {
       // Setup code
     });

     test("test description", async ({ page }) => {
       // Test code
     });
   });
   ```
4. Run the test to verify it works

## CI/CD Integration

These tests can be integrated into GitHub Actions or other CI/CD pipelines. The `playwright.config.ts` is already configured for CI environments.

## Troubleshooting

### Tests fail with "MongoDB not connected"
- Ensure MongoDB is running: `mongod --dbpath /path/to/data`
- Check connection string in `.env.local`

### Tests timeout
- Increase timeout in `playwright.config.ts`
- Check if dev server is running

### Screenshots not saving
- Ensure `tests/e2e/screenshots/` directory exists
- Check file permissions

## Notes

- Tests run in parallel by default for faster execution
- Screenshots are captured on failure and at key steps
- HTML report provides detailed test results
- Tests use real database - ensure proper cleanup or use test database
