# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build:webpack` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Audit (all checks) | `npm run audit` |
| Format | `npm run format` |
| Seed demo data | `npm run seed` |

**Critical:** Always use `npm run build:webpack` — Mongoose native bindings fail with Turbopack.

**Testing:** Run `npm test` for all tests. Jest configured for `tests/` directory.

## Setup

1. Copy `.env.example` to `.env.local`
2. MongoDB must run at `mongodb://localhost:27017/incentiveio`
3. `NEXTAUTH_SECRET` must be ≥32 characters
4. Configure email settings (SMTP via Gmail recommended)

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions
- **Database:** MongoDB with Mongoose 9
- **Auth:** NextAuth v5 (JWT strategy, 24h maxAge)
- **Validation:** Zod v4 (all server actions)

### Directory Structure
```
app/
  admin/             # Admin dashboard pages
  administrator/     # Super admin pages (full access)
  sales-dashboard/   # Sales executive pages
  sales-manager/     # Sales manager pages
  accountant/        # Accountant pages
  finance/           # Finance pages
  api/               # API route handlers
  login/             # Auth pages
lib/
  actions/           # Server actions (data layer)
  models/            # Mongoose models
  auth/              # NextAuth configuration
  email.ts           # Email service
  mongodb.ts         # Database connection
  env.ts             # Environment validation
components/
  ui/                # shadcn/ui components
```

### Role-Based Access Control

| Role | Route Access | Key Permissions |
|------|-------------|-----------------|
| `administrator` | `/administrator/*`, all routes | Full system access |
| `admin` | `/admin/*`, most routes | Admin management |
| `salesManager` | `/sales-manager/*`, `/sales-dashboard/*` | Approve/reject team sales |
| `salesExecutive` | `/sales-dashboard/*` | Create own sales records |
| `accountant` | `/accountant/*`, `/sales-dashboard/*` | Process tax/VAT, calculate net |
| `finance` | `/finance/*`, `/sales-dashboard/*` | Final approval, payments |

Route protection is enforced in `middleware.ts` via JWT token inspection.

### Approval Workflow

```
Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved
   (Manager)       (Accountant)        (Finance)
```

Rejection returns record to `Draft` with `rejectionReason` and `rejectedBy` field.

### Notification System

**In-app notifications** (`lib/actions/notification.actions.ts`):
- `createNotification()`, `getNotifications()`, `markAsRead()`, `markAllAsRead()`
- Helper functions for each workflow event: `notifySaleSubmitted()`, `notifyManagerApproved()`, `notifyFinanceApproved()`, etc.
- Polling interval: 30 seconds (see `components/notification-bell.tsx`)

**Email notifications** (`lib/email.ts`):
- SMTP via nodemailer
- Triggered on all workflow state changes
- Welcome emails, password resets

### Data Layer Patterns

**Server Actions** (`lib/actions/*.ts`):
- All use `"use server"` directive
- Zod validation on inputs
- Return `{ success, data?, error? }` shape
- Auth checks via `auth()` from `@/lib/auth/auth`

**Models** (`lib/models/*.ts`):
- Soft delete via `deletedAt` field with pre-find hooks
- Auto-filter `deletedAt: null` on all queries
- Indexes on common query patterns
- References between models (User, Team, Product, Category, etc.)

**Database Connection** (`lib/mongodb.ts`):
- Singleton pattern with global cache
- `connectToDatabase()` and `isConnected()` helpers

**Session Management**:
- JWT with 24h maxAge
- Session revalidation every 60s via `components/session-recheck.tsx`
- Auto-signout when `isActive` becomes false
- **Logout pattern:** Use `logoutAction()` from `lib/actions/auth.actions.ts` to fully clear session and redirect to home

**API Routes** (`app/api/*/route.ts`):
- Health check: `/api/health`
- Backups, sync, uploads, notifications
- Route handlers complement server actions for specific use cases

**Dashboard Layout Pattern:**
- All role dashboards use `SidebarProvider` + `SidebarInset` pattern
- Notification bell rendered in header (not sidebar)
- Header includes `SidebarTrigger`, `Separator`, and `NotificationBell`
- Sign out uses `logoutAction()` server action

## Critical Gotchas

1. **Sales amount calculation:** Use `products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)` — no `saleAmount` field exists
2. **Category reference:** Schema uses `categoryId`, not `category`
3. **Dual status fields:** `status` = workflow stage, but `approvalStatus`/`accountantStatus`/`financeStatus` also exist
4. **Draft-only operations:** Only `Draft` records can be submitted/deleted
5. **Reject stage guards:** `rejectSale` can only reject at specific stages (manager→Pending_Manager, etc.)
6. **Net sales calculation:** Commission calculated on net (not gross) after accountant processing
7. **Eligibility:** Boolean `isEligible` on User model, based on cumulative approved sales vs target (50% threshold)
8. **Soft delete:** All models use soft delete (`deletedAt`), never use `findByIdAndDelete`
9. **Session auth:** All server actions return `{ error: "Unauthorized" }` on auth failure
10. **Wallet operations:** Use atomic `$inc` to prevent race conditions
11. **Tax/VAT rate checks:** Use `!== undefined && !== null` since `0` is valid but falsy
12. **Role names:** Use camelCase (`salesManager`, not `sales_manager`)
13. **ObjectId serialization:** MongoDB `ObjectId` fields (like `_id`, `categoryId`) cannot be passed directly to client components. Always convert to strings using `.toString()` before returning from server actions. See `getSalesRecord()` for the pattern.
14. **Mongoose duplicate indexes:** Never define indexes both in schema (`unique: true`) AND via `schema.index()`. Choose one method to avoid duplicate index warnings.
15. **Client vs Server auth:** Use `signIn` from `"next-auth/react"` in client components only. For server-side operations, use `auth()` from `@/lib/auth/auth`. Server actions cannot call client-side `signIn`.

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` | Sales CRUD with ownership checks, ObjectId serialization handling |
| `lib/actions/approval.actions.ts` | Multi-stage approve/reject/process |
| `lib/actions/wallet.actions.ts` | Atomic credit/debit operations with MongoDB sessions |
| `lib/actions/auth.actions.ts` | Logout action (use for all signout flows) |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()` helpers |
| `middleware.ts` | Route-level RBAC enforcement with jose JWT verification |
| `lib/auth/auth.ts` | NextAuth v5 config with JWT, exports `signOut` |
| `app/login/login-form.tsx` | Client-side login form using `signIn` from next-auth/react |
| `scripts/seed.ts` | Demo data (13 users, teams, products, sales) |
| `lib/monitoring.ts` | Metric logging for key operations |
| `types/index.ts` | Comprehensive TypeScript type definitions |
| `hooks/useNotifications.ts` | Unified notification hook using sonner toast |

## Test Accounts

Primary accounts (from `scripts/seed.ts`):
| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| superadmin@incentive.io | Superadmin123! | administrator |
| jamal@incentive.io | Manager123! | salesManager (Alpha Team) |
| fatima@incentive.io | Manager123! | salesManager (Beta Team) |
| karim@incentive.io | Executive123! | salesExecutive |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |

Additional accounts (all use `Executive123!`):
- nasrin@incentive.io, rahim@incentive.io, sabina@incentive.io, mizanur@incentive.io, anika@incentive.io (salesExecutives)
- inactive@incentive.io / Inactive123! (blocked: isActive=false)

## App Name

The application is named **Incentive.io** (not "incentiveio" or "IncentiveIO").

## Code Style

- Prettier: no semicolons, double quotes, trailing comma es5
- `@/*` path alias maps to `./*` (no `src/` prefix)
- Icon components: Lucide React only
- Currency formatting: `(amount || 0).toLocaleString()`

## Code Quality Status

- **TypeScript:** Zero type errors — comprehensive types in `types/index.ts`
- **ESLint:** Zero critical errors — all `as any` usages replaced with proper types
- **Tests:** Integration, E2E, performance, and security test suites available
- **Security:** JWT verification with jose library, atomic wallet transactions, npm vulnerabilities patched

## Type System

**Type definitions** (`types/index.ts`):
- `UserRole`, `SaleStatus`, `ApprovalStatus` enums
- `AuthUser` interface for session.user
- `SaleRecord`, `WalletTransaction` interfaces
- Use `(session.user as AuthUser)` instead of `(session.user as any)`

**Custom errors** (`types/errors.ts`):
- `AuthError`, `ValidationError`, `DatabaseError`, `ForbiddenError`, `NotFoundError`, `BusinessLogicError`
- Import and throw for specific error handling

## UI/UX Patterns

**Notifications** (`hooks/useNotifications.ts`):
```typescript
const { showSuccess, showError, showPromise } = useNotifications();
showSuccess("Operation completed");
showError(error); // Handles unknown types gracefully
showPromise(promise, { loading: "Saving...", success: "Saved!", error: "Failed" });
```

**Loading states** (`components/loading/dashboard-skeleton.tsx`):
- `DashboardSkeleton` — full dashboard loading state
- `TableSkeleton` — table with configurable rows
- `CardSkeleton` — card placeholder

**Error boundaries** (`components/error-boundary.tsx`):
- Wrap dashboard content with `<ErrorBoundary>`
- Graceful fallback UI with retry functionality

## Monitoring

**Metric logging** (`lib/monitoring.ts`):
```typescript
import { logMetric, logPerformance, logError, logBusinessEvent } from "@/lib/monitoring";

logMetric("WALLET_CREDIT", { employeeId, amount, balanceAfter });
logPerformance("COMMISSION_CALC", duration, { employeeId });
logError("WALLET_DEBIT", error, { employeeId, amount });
logBusinessEvent("SALE_APPROVED", { saleId, approverRole });
```

Metrics stored in AuditLog collection for observability.

## Testing

**Important:** Server Actions with `"use server"` directive cannot be tested directly with Jest due to Next.js's proprietary RPC layer. Use these alternatives:
- Test via API routes (`app/api/*/route.ts`) with supertest
- Test business logic functions directly (models, utilities)
- E2E testing with Playwright

Test infrastructure in place:
- `jest.config.js` — TypeScript ESM config
- `tests/setup.ts` — Environment loading, NextAuth mock
- `tests/helpers/test-actions.ts` — Test user creation, cleanup helpers

Test suites in `tests/`:
- `tests/integration/workflow.test.ts` — Approval workflows, wallet atomicity
- `tests/e2e/role-workflows.spec.ts` — End-to-end for all 6 roles  
- `tests/performance/load-test.ts` — Concurrency and query performance
- `tests/security/auth-security.test.ts` — JWT tampering, injection prevention

**Test data ObjectId format:** Use `new mongoose.Types.ObjectId()` or valid 24-char hex strings for categoryId references.

## Pre-Deployment

**GitHub Actions** (`.github/workflows/pre-deploy.yml`):
- TypeScript check
- ESLint validation
- npm audit (moderate level)
- Build verification
- Test suite execution

Run manually with `act` or automatically on push to main.

## Recent Fixes

- **notification.actions.ts line 378** — Fixed invalid template literal (`\`\${}` → `${}`)
- **models/index.ts** — Created barrel export for all Mongoose models
- **middleware.ts** — Added named export `middlewareHandler` for testing
- **Jest dependencies** — Added jest@30.4.0, ts-jest@29.4.9 for test infrastructure
- **User model duplicate indexes** — Removed explicit `index()` calls for fields with `unique: true` or `sparse: true`
- **Login form client-side error** — Created `login-form.tsx` client component to properly use `signIn` from next-auth/react
- **Signout redirect** — Created `logoutAction()` in auth.actions.ts for full session clear and home redirect
- **Notification bell placement** — Moved from sidebar header to dashboard header across all 6 dashboards
- **ObjectId serialization** — Fixed `getSalesRecord()` to convert MongoDB ObjectIds to strings before client serialization
