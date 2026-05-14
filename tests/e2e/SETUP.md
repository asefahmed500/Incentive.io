# E2E Testing Setup Summary

## Overview

A comprehensive End-to-End (E2E) testing suite has been created using **Playwright** for the Incentive.io application. This suite tests all user roles, workflows, UI components, API endpoints, and database operations.

## What Was Created

### 1. Test Configuration
- `tests/e2e/playwright.config.ts` - Playwright configuration with multiple browsers and devices
- `tests/e2e/README.md` - Complete testing documentation

### 2. Test Specs (10 test files covering all functionality)

**Authentication Tests** (`specs/auth/`)
- `login.spec.ts` - Tests login for all 6 roles, failed login, form validation
- `logout.spec.ts` - Tests logout functionality

**Sales Executive Tests** (`specs/sales-executive/`)
- `dashboard.spec.ts` - Dashboard loading, charts, tables, notifications
- `create-sale.spec.ts` - Navigate to add record, create sales with products, form validation

**Sales Manager Tests** (`specs/sales-manager/`)
- `approval.spec.ts` - View pending approvals, approve/reject with reasons

**Accountant Tests** (`specs/accountant/`)
- `processing.spec.ts` - View pending approvals, process with tax/VAT, dashboard charts

**Finance Tests** (`specs/finance/`)
- `final-approval.spec.ts` - Final approval workflow, wallet credit, payment queue

**Admin Tests** (`specs/admin/`)
- `user-management.spec.ts` - Dashboard, users list, search functionality

**Administrator Tests** (`specs/administrator/`)
- `audit-logs.spec.ts` - Dashboard, audit logs, system health, filtering

**UI/UX Tests** (`specs/ui/`)
- `rbac.spec.ts` - Role-based access control, cross-route blocking
- `responsive.spec.ts` - Mobile (375x667), tablet (768x1024), desktop (1920x1080) views

### 3. Test Utilities
- `tests/e2e/run-tests.sh` - Interactive test runner script
- `tests/e2e/screenshots/` - Directory for test screenshots

### 4. Agent-Browser Scripts (alternative, if needed)
- `tests/e2e-browser/` directory with bash scripts for agent-browser
- All authentication, workflow, and UI tests

## Prerequisites

### 1. Start MongoDB Server
MongoDB Compass alone is not sufficient - the MongoDB server must be running:

**Windows:**
```bash
# If MongoDB is installed as a service
net start MongoDB

# Or run mongod directly
mongod --dbpath "C:\data\db"
```

**Linux/Mac:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or run directly
mongod --dbpath /path/to/data
```

Verify connection:
```bash
mongosh mongodb://localhost:27017/incentiveio --eval 'db.serverStatus().ok'
# Should return: 1
```

### 2. Environment Setup
Ensure `.env.local` exists with:
```env
MONGODB_URI=mongodb://localhost:27017/incentiveio
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars
NEXTAUTH_URL=http://localhost:3000
```

### 3. Seed Test Data
```bash
npm run seed
```

### 4. Install Dependencies
```bash
npm install
npx playwright install
```

## Running Tests

### Option 1: Using npm scripts

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests (headless) |
| `npm run test:e2e:ui` | Run tests with Playwright UI |
| `npm run test:e2e:debug` | Run tests in debug mode |
| `npm run test:e2e:headed` | Run tests in headed mode |
| `npm run test:e2e:report` | View HTML test report |

### Option 2: Using the interactive script

```bash
bash tests/e2e/run-tests.sh
```

This provides a menu to:
1. Run all tests (headless)
2. Run all tests (headed - watch browser)
3. Run tests with UI mode
4. Run specific test suite
5. Run database verification only
6. Exit

### Option 3: Run specific test suites

```bash
# Authentication tests only
npx playwright test specs/auth/

# Sales Executive tests only
npx playwright test specs/sales-executive/

# Specific test file
npx playwright test specs/auth/login.spec.ts

# Specific test with name
npx playwright test --grep "successful login as salesExecutive"
```

## Test Coverage Summary

### All 6 User Roles Tested
✅ Sales Executive (karim@incentive.io)
✅ Sales Manager (jamal@incentive.io)
✅ Accountant (accountant@incentive.io)
✅ Finance (finance@incentive.io)
✅ Admin (admin@incentive.io)
✅ Administrator (superadmin@incentive.io)

### Complete Workflow Tested
✅ Login → Create Sale → Submit → Manager Approve → Accountant Process → Finance Approve → Wallet Credit

### UI/UX Coverage
✅ Responsive design (mobile, tablet, desktop)
✅ Role-based access control
✅ Cross-route blocking
✅ Form validation
✅ Dashboard charts
✅ Tables and data display

### Database Operations
✅ Data persistence verification
✅ MongoDB connection checks
✅ Record counting and validation

## Expected Results

When all tests pass, you should see:
- All test specs passing with green checkmarks
- Screenshots captured in `tests/e2e/screenshots/`
- HTML report generated in `playwright-report/index.html`

## Troubleshooting

### MongoDB Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Start MongoDB server (see Prerequisites section)

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution:** Stop the dev server or use a different port

### Browser Not Found
```
Error: Executable doesn't exist at...
```
**Solution:** Run `npx playwright install`

### Tests Timeout
**Solution:** Increase timeout in `playwright.config.ts`

## Next Steps

1. **Start MongoDB server** (required for tests to run)
2. **Run the test suite**: `npm run test:e2e`
3. **Review the report**: `npm run test:e2e:report`
4. **Check screenshots** in `tests/e2e/screenshots/`

## Notes

- Tests run in parallel by default for faster execution
- Screenshots are captured at key steps and on failures
- Tests use real database - ensure proper cleanup
- The dev server starts automatically when running tests
- All test data uses seeded accounts from `scripts/seed.ts`
