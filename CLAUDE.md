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

**Testing:**
- Jest tests: `npm test` for all tests. Run single test: `npm test -- --testNamePattern="test name"`
- E2E tests: `npm run test:e2e` for Playwright E2E tests
- E2E UI mode: `npm run test:e2e:ui`
- E2E debug: `npm run test:e2e:debug`
- E2E report: `npm run test:e2e:report`

## Setup

1. Copy `.env.example` to `.env.local`
2. MongoDB must run at `mongodb://localhost:27017/incentiveio`
3. `NEXTAUTH_SECRET` must be ≥32 characters
4. Configure email settings (SMTP via Gmail recommended)

## Architecture Overview

### Tech Stack
- **Frontend:** Next.js 16.2.6 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions with MongoDB transactions
- **Database:** MongoDB with Mongoose 9, compound indexes for performance
- **Auth:** NextAuth v5 (JWT with jose verification), 24h maxAge
- **Validation:** Zod v4 (all server actions + API-level validation)
- **Charts:** Recharts 3.8+ (all dashboards)
- **Animations:** Framer Motion 12+ (homepage)
- **Dark Mode:** next-themes (app-wide support)
- **Real-time:** Server-Sent Events (SSE) via `/api/events` endpoint

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

**Critical Security Pattern:** Middleware blocks cross-role access explicitly:
```typescript
if (userRole === "salesExecutive") {
  const blockedPaths = ["/admin", "/administrator", "/sales-manager", "/accountant", "/finance"];
  if (blockedPaths.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL("/sales-dashboard", request.url));
  }
}
```

**Server Action Role Filtering:** Data queries must filter by role:
```typescript
// In lib/actions/commission.actions.ts
if (userRole === "salesExecutive") {
  query.employeeId = userId; // Only own data
} else if (userRole === "salesManager") {
  const teamMembers = await User.find({ managerId: userId });
  query.employeeId = { $in: teamMemberIds }; // Team data only
}
// admin/administrator/accountant/finance see all
```

### Approval Workflow

```
Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved
   (Manager)       (Accountant)        (Finance)
```

Rejection returns record to `Draft` with `rejectionReason` and `rejectedBy` field.

### Notification System

**Real-time Updates** (`lib/sse.ts` + `hooks/use-sse.ts`):
- Server-Sent Events (SSE) for instant dashboard updates
- Events: `SALE_CREATED`, `SALE_APPROVED`, `SALE_REJECTED`, `WALLET_UPDATED`, `DASHBOARD_REFRESH`
- Automatic reconnection with exponential backoff
- Falls back to 60-second polling if SSE fails
- Usage in dashboards: `useSSE({ onSaleUpdate: () => fetchData() })`

**In-app notifications** (`lib/actions/notification.actions.ts`):
- `createNotification()`, `getNotifications()`, `markAsRead()`, `markAllAsRead()`
- Helper functions for each workflow event: `notifySaleSubmitted()`, `notifyManagerApproved()`, `notifyFinanceApproved()`, etc.
- Role-based link validation ensures notification routes match user permissions

**Email notifications** (`lib/email.ts`):
- SMTP via nodemailer
- Triggered on all workflow state changes
- Welcome emails, password resets

### Data Layer Patterns

**Server Actions** (`lib/actions/*.ts`):
- All use `"use server"` directive
- Zod validation on inputs (see `lib/actions/sales.actions.ts` for patterns)
- Return `{ success, data?, error? }` shape
- Auth checks via `auth()` from `@/lib/auth/auth`

**API-Level Validation** (`lib/validations/*.ts`):
- Zod schemas for all API endpoints (defense in depth)
- `approval.validation.ts`: Manager, Accountant, Finance approval schemas
- `sales.validation.ts`: Sales record creation, query parameter schemas
- `wallet.validation.ts`: Credit/debit wallet operations
- `target.validation.ts`: Target assignment and removal
- `commission.validation.ts`: Commission rule CRUD operations
- `audit.validation.ts`: Audit log API validation
- `commissions-api.validation.ts`: Commissions query validation
- `notification.validation.ts`: Notification operations validation
- `settings.validation.ts`: Settings API validation
- `team.validation.ts`: Teams API validation
- `product.validation.ts`: Product API validation with NoSQL injection prevention
- `category.validation.ts`: Category API validation
- `user.validation.ts`: User API validation
- `common.ts`: Shared schemas like `objectIdSchema`
- Applied in API routes before calling server actions

**Error Handling** (`lib/api-error.ts`):
- `ApiError` class with status code and error code
- `handleError()` function for consistent error responses
- Predefined error codes in `ErrorCodes` object
- Automatic Zod error detection and formatting
- Usage: `throw new ApiError(404, "User not found", ErrorCodes.NOT_FOUND)`

**Monetary Calculations** (`lib/utils/money.ts`):
- **CRITICAL:** Always use for calculations involving money
- `calculatePercentage(amount, rate)` - precise percentage calculation
- `calculateProductTotal(unitPrice, quantity)` - product total with integer math
- `roundMoney(amount)` - round to 2 decimal places
- `toCents(amount)` / `fromCents(cents)` - convert between decimal and cents
- Prevents floating point precision errors

**Rate Limiting** (`lib/rate-limit.ts`):
- In-memory rate limiter using Map cache
- Usage: `const limiter = rateLimit({ interval: 60000, uniqueTokenPerInterval: 100 })`
- Check: `const { isRateLimited, remaining } = limiter.check(5, identifier)`
- Returns proper 429 status with retry headers

**Models** (`lib/models/*.ts`):
- Soft delete via `deletedAt` field with pre-find hooks
- Auto-filter `deletedAt: null` on all queries
- Indexes on common query patterns (see Performance section below)
- References between models (User, Team, Product, Category, etc.)
- **Notification model** (`lib/models/Notification.ts`): Stores in-app notifications with recipientRole filtering and SSE integration

**Database Connection** (`lib/mongodb.ts`):
- Singleton pattern with global cache
- `connectToDatabase()` and `isConnected()` helpers
- `toObjectId(id)` - converts string IDs to MongoDB ObjectIds (use consistently)
- **Local MongoDB**: Automatically adds `retryWrites=false` for localhost/127.0.0.1 connections
- `checkDatabaseConnection()` - returns connection status with latency

**Session Management**:
- JWT with 24h maxAge
- Session revalidation every 60s via `components/session-recheck.tsx`
- Auto-signout when `isActive` becomes false
- **Logout pattern:** Use `logoutAction()` from `lib/actions/auth.actions.ts` to fully clear session and redirect to home

**CORS Configuration** (`next.config.mjs`):
- Configured via `ALLOWED_ORIGINS` environment variable
- Default: `http://localhost:3000`, `http://127.0.0.1:3000`
- Applied to all `/api/*` routes
- Includes credentials support and 24-hour preflight cache

**API Routes** (`app/api/*/route.ts`):
- Health check: `/api/health`
- Sales operations: `/api/sales-records/*` (GET, POST, PATCH, DELETE), `/api/approvals/*`
- Data management: `/api/users/*`, `/api/users/[id]`, `/api/teams/*`, `/api/teams/[id]`, `/api/products/*`, `/api/products/[id]`, `/api/categories/*`, `/api/categories/[id]`
- Financial: `/api/wallets/*`, `/api/wallets/[id]`, `/api/commissions/*`, `/api/commission-rules/*`, `/api/commission-rules/[id]`
- Targets: `/api/targets/*` (GET, POST, DELETE)
- System: `/api/backups/*`, `/api/sync/*`, `/api/settings/*`, `/api/upload/*`, `/api/audit-logs/*`
- Real-time: `/api/notifications/*`, `/api/events` (SSE), `/api/socket/*` (socket.io - unused currently)
- All CRUD operations have complete API coverage (GET, POST, PUT/PATCH, DELETE where applicable)

**API Route Error Handling Pattern** (established during runtime validation):
```typescript
// All API routes must follow this pattern for consistent error handling
export async function GET(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const data = await getSomeData();
    // Handle error response from server action
    if ("error" in data) {
      return NextResponse.json({ error: data.error }, { status: getStatusCodeForError(data.error as string) });
    }
    return NextResponse.json(data);
  } catch (error) {
    return handleError(error); // Uses lib/api-error.ts
  }
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  try {
    const body = await request.json();
    const result = await createData(body) as { success?: boolean; error?: string } | undefined;

    if (result?.error) {
      return NextResponse.json({ error: result.error }, { status: getStatusCodeForError(result.error) });
    }
    if (!result) {
      return NextResponse.json({ error: "Failed to create resource" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error); // Uses lib/api-error.ts
  }
}
```

**Error Type Handling Pattern** (for lib/ files):
```typescript
// Avoid `error: any` — use proper type guards
catch (error) {
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.error("Operation failed:", errorMessage);
  return { success: false, error: errorMessage };
}
```

**Dashboard Layout Pattern:**
- All role dashboards use `SidebarProvider` + `SidebarInset` pattern
- Notification bell rendered in header (not sidebar)
- Header includes `SidebarTrigger`, `Separator`, and `NotificationBell`
- Sign out uses `logoutAction()` server action
- All dashboards have Recharts visualizations with SSE real-time updates
- Refresh button in header for manual data reload

### Performance Optimizations

**Database Indexes** (added during comprehensive audit):
- `User`: `{ isEligible: 1 }`, `{ isEligible: 1, targetAmount: 1 }`, `{ role: 1, isActive: 1 }`, `{ managerId: 1, isActive: 1 }`
- `SalesRecord`: `{ employeeId: 1, createdAt: -1 }`, `{ createdAt: -1, status: 1 }`, `{ paymentStatus: 1, isPaid: 1 }`, `{ companyEmail: 1 }`
- `Wallet`: `{ balance: 1 }`, `{ employeeId: 1, balance: 1 }`, `{ "transactions.createdAt": -1 }` (note: employeeId has unique index)
- `Team`: `{ managerId: 1 }`, `{ members: 1 }`, `{ deletedAt: 1 }`
- `Product`: `{ deletedAt: 1 }`, `{ categoryId: 1 }`
- `Notification`: `{ userId: 1, createdAt: -1 }`, `{ userId: 1, isRead: 1 }`, `{ recipientRole: 1, createdAt: -1 }`
- `CommissionRule`: `{ targetPercentageTo: 1, targetPercentageFrom: -1 }` for range queries

**Atomic Transactions:**
- Commission approval + wallet credit wrapped in single MongoDB session
- Prevents race conditions where sale is marked paid but wallet isn't credited
- See `lib/actions/approval.actions.ts:finalApproveByFinance()` for implementation

**Transaction Fallback for Local MongoDB:**
- Local MongoDB doesn't support transactions (requires replica set)
- Code automatically falls back to non-transactional operations for localhost
- Pattern: Catch transaction errors (retryable writes, replica set errors), retry without session
- See `lib/actions/approval.actions.ts:finalApproveByFinance()` and `lib/actions/wallet.actions.ts:creditWallet()` for examples

**Aggregation Pipeline Optimization:**
- Commission calculations use aggregation with soft delete filters
- Eliminates N+1 query problems for cumulative sales totals

**Recharts Pattern** (used in all dashboards):
```typescript
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area } from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444"];

// Polling pattern
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, [session?.user?.id]);

// Null-safe tooltip formatter
<Tooltip formatter={(value) => `৳${(value || 0).toLocaleString()}`} />
```

## Critical Gotchas

1. **Sales amount calculation:** Use `calculateProductTotal()` from `lib/utils/money.ts` — NEVER use direct multiplication `p.unitPrice * p.quantity` due to floating-point precision errors. No `saleAmount` field exists in the schema.
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
16. **Recharts null-safety:** All tooltip `formatter` callbacks must handle undefined values: `formatter={(value) => (value || 0).toLocaleString()}`. Pie chart `label` callbacks also need `percent || 0`.
17. **Monetary calculations:** Always use functions from `lib/utils/money.ts` for calculations involving money. Avoid direct arithmetic on floats to prevent precision errors. Use `calculatePercentage()`, `calculateProductTotal()`, `roundMoney()`.
18. **ObjectId type consistency:** Use `toObjectId()` from `lib/mongodb` when converting string IDs to ObjectId for database queries. This ensures consistent type handling.
19. **Atomic transactions:** The commission approval + wallet credit flow uses MongoDB transactions (`lib/actions/approval.actions.ts:finalApproveByFinance`). Both operations succeed or both fail together.
20. **Rate limiting:** Public endpoints (`/api/register`, `/api/auth/[...nextauth]`) have rate limiting. Use `rateLimit` from `lib/rate-limit.ts` for new public endpoints.
21. **SSE retry logic:** The `useSSE` hook's retry mechanism inlines connection logic to avoid React hooks dependency violations. Do not extract the retry function to a separate callback.
22. **Server action return types:** Server actions may return data arrays, error objects, or undefined. Always check for `error` property first: `if ("error" in data) return error`. Use `Array.isArray()` before mapping. Use optional chaining `result?.error` when casting.
23. **API route null safety:** When casting server action results, always handle undefined: `const result = await action() as { success?: boolean; error?: string } | undefined`. Check `result?.error` not `result.error`.
24. **Local MongoDB transactions:** Local MongoDB (localhost/127.0.0.1) doesn't support transactions. Code automatically detects this and falls back to non-transactional operations. Connection string uses `retryWrites=false` automatically.
25. **Test ObjectId format:** Must be exactly 24 hex characters (e.g., `new mongoose.Types.ObjectId().toString()` or valid 24-char hex string). 25-character strings will fail validation.
26. **Commission rules in tests:** Tests require commission rules to exist. `tests/setup.ts` automatically creates them if missing. Users need `targetAmount` set for commission calculation (see `tests/helpers/test-actions.ts`).
27. **Health check pattern:** Use `checkDatabaseConnection()` from `lib/mongodb` for health endpoints. Returns `{ connected, message, latency }` and triggers connection if needed.
28. **API-level validation required:** All new API endpoints must have validation schemas in `lib/validations/*.ts` (defense-in-depth). Never trust client input at the API boundary alone.
29. **Error type safety:** In lib/ files, avoid `catch (error: any)` — use `error instanceof Error ? error.message : "Unknown error"` pattern for type safety.

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` | Sales CRUD with ownership checks, ObjectId serialization handling |
| `lib/actions/approval.actions.ts` | Multi-stage approve/reject/process with atomic transactions + local MongoDB fallback |
| `lib/actions/wallet.actions.ts` | Atomic credit/debit operations with MongoDB sessions + local MongoDB fallback |
| `lib/actions/notification.actions.ts` | Notification creation, retrieval, role-based link validation |
| `lib/actions/auth.actions.ts` | Logout action (use for all signout flows) |
| `lib/utils/money.ts` | Precise monetary calculations (use for all currency operations) |
| `lib/rate-limit.ts` | In-memory rate limiting for public API endpoints |
| `lib/api-error.ts` | Standardized error handling with ApiError class and handleError |
| `lib/validations/*.ts` | API-level Zod validation schemas (14 files: approval, audit, category, commission, commissions-api, common, notification, product, sales, settings, target, team, user, wallet) |
| `lib/sse.ts` | Server-Sent Events manager for real-time updates |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()`, `requireAdminOrAbove()`, `requireFinanceOrAbove()` helpers |
| `middleware.ts` | Route-level RBAC enforcement with jose JWT verification |
| `lib/auth/auth.ts` | NextAuth v5 config with JWT, exports `signOut` |
| `lib/mongodb.ts` | Database connection singleton, exports `toObjectId()` and `checkDatabaseConnection()` helpers |
| `lib/models/Notification.ts` | Notification model with SSE integration and soft delete |
| `app/login/login-form.tsx` | Client-side login form using `signIn` from next-auth/react |
| `scripts/seed.ts` | Demo data (13 users, teams, products, sales) |
| `lib/monitoring.ts` | Metric logging for key operations |
| `types/index.ts` | Comprehensive TypeScript type definitions |
| `hooks/useNotifications.ts` | Unified notification hook using sonner toast |
| `hooks/use-sse.ts` | SSE hook for real-time dashboard updates |
| `components/theme-provider.tsx` | Dark mode theme provider wrapper |
| `components/error-boundary.tsx` | Error boundary for graceful crash recovery |
| `components/loading/dashboard-skeleton.tsx` | Consistent loading skeleton (used across all dashboards) |
| `components/ui/empty-state.tsx` | Consistent empty state UI component |
| `components/home/` | Homepage components (enhanced-hero, testimonials, social-proof, interactive-demo) |

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| superadmin@incentive.io | Superadmin123! | administrator |
| jamal@incentive.io | Jamal123! | salesExecutive |
| manager@incentive.io | Manager123! | salesManager |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |

Additional test accounts use `Executive123!`:
- Multiple sales executives for team testing

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
- **Tests:** Integration, E2E, performance, and security test suites available — 35/35 passing
- **Security:** JWT verification with jose library, atomic wallet transactions, rate limiting, npm vulnerabilities patched
- **Performance:** Optimized database indexes, aggregation pipelines, precise monetary calculations
- **Reliability:** Error boundaries on all dashboards, standardized error handling, atomic transactions with local MongoDB fallback

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

**Homepage Components** (`components/home/`):
- `enhanced-hero.tsx` — Animated hero section with Framer Motion, gradients, floating elements
- `testimonials.tsx` — Customer testimonials carousel with stats counter
- `social-proof.tsx` — Trust badges and company logos
- `interactive-demo.tsx` — Tabbed dashboard preview for 3 roles with real mock data
- All homepage components support dark mode via `next-themes`

**Dark Mode**:
- `ThemeProvider` wraps app in `app/layout.tsx`
- `ThemeToggle` component available on homepage navigation (not in dashboard layouts)
- Use `useTheme()` hook to access current theme
- All chart colors work in both light/dark modes

**Notifications** (`hooks/useNotifications.ts`):
```typescript
const { showSuccess, showError, showPromise } = useNotifications();
showSuccess("Operation completed");
showError(error); // Handles unknown types gracefully
showPromise(promise, { loading: "Saving...", success: "Saved!", error: "Failed" });
```

**Loading states** (`components/loading/dashboard-skeleton.tsx`):
- `DashboardSkeleton` — full dashboard loading state (used consistently across all dashboards)
- `TableSkeleton` — table with configurable rows
- `CardSkeleton` — card placeholder

**Empty states** (`components/ui/empty-state.tsx`):
- `EmptyState` — consistent empty state UI with optional icon, title, description, and action button
- Use for displaying "no data" scenarios across dashboards

**Error boundaries** (`components/error-boundary.tsx`):
- Wrap dashboard content with `<ErrorBoundary>`
- Graceful fallback UI with retry functionality

**Accessibility**:
- All interactive buttons should include `aria-label` attributes for screen reader support
- Navigation buttons use descriptive labels like `aria-label="Navigate to add new sale page"`

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
- `tests/setup.ts` — Environment loading, NextAuth mock, commission rules creation
- `tests/helpers/test-actions.ts` — Test user creation with targetAmount, cleanup helpers

Test suites in `tests/`:
- `tests/integration/workflow.test.ts` — Approval workflows, wallet atomicity
- `tests/e2e/role-workflows.spec.ts` — End-to-end for all 6 roles
- `tests/performance/load-test.ts` — Concurrency and query performance
- `tests/security/auth-security.test.ts` — JWT tampering, injection prevention

**Test data ObjectId format:** Use `new mongoose.Types.ObjectId()` or valid 24-char hex strings for categoryId references.

**Test setup requirements:**
- Commission rules are automatically created in `tests/setup.ts` if missing
- Test users created via `createTestUser()` now have `targetAmount: 50000` for commission calculations
- Local MongoDB connection uses `retryWrites=false` automatically

**E2E Testing with Playwright:**
- Configuration: `playwright.config.ts` in project root
- Test specs: `tests/e2e/specs/` organized by feature (auth, sales-executive, sales-manager, accountant, finance, admin, administrator, ui)
- Screenshots: `tests/e2e/screenshots/` for test artifacts
- Coverage: All 6 user roles, complete approval workflow, RBAC, responsive design
- Prerequisites: MongoDB running, database seeded (`npm run seed`)
- Run specific suite: `npx playwright test specs/auth/`
- Run specific file: `npx playwright test specs/auth/login.spec.ts`
- Run with single worker: `npx playwright test --workers=1` (use if parallel tests timeout)

## Pre-Deployment

**GitHub Actions** (`.github/workflows/pre-deploy.yml`):
- TypeScript check
- ESLint validation
- npm audit (moderate level)
- Build verification
- Test suite execution

Run manually with `act` or automatically on push to main.

## Important Architectural Patterns

**Homepage Architecture:**
- `components/home/enhanced-hero.tsx` — Framer Motion animations, gradient effects, social proof stats
- `components/home/testimonials.tsx` — 6 customer reviews with company stats (500+ companies, 50K+ users, $2B+ paid)
- `components/home/social-proof.tsx` — Trust badges, certifications, company logos
- `components/home/interactive-demo.tsx` — Tabbed dashboard preview for 3 roles (executive/manager/admin)
- Dark mode toggle available via `ThemeToggle` component in homepage navigation (not in dashboard layouts)

**Dashboard Visualization Pattern (all 5 dashboards):**
- Recharts with 30-second real-time polling
- Manual refresh button in all dashboard headers
- Null-safe tooltip formatters: `formatter={(value) => (value || 0).toLocaleString()}`
- Sales Executive: Pie (records status), Area (sales vs commission), Bar (progress vs target)
- Sales Manager: Pie (team sales), Line (monthly trends), Bar (team member performance)
- Accountant: Pie (processing status), Bar (deduction breakdown), Area (processing volume)
- Finance: Pie (payment status), Area (commission flow), Bar (approval trends)
- Admin: Pie (sales by status), Line (sales trends), Bar (commission by role)

**Security Architecture:**
- Middleware cross-role blocking — Each role explicitly blocked from other role routes (no blanket API bypass)
- Server action role filtering — Data queries filter by role (`salesExecutive` sees own data only, `salesManager` sees team data, others see all)
- JWT verification with jose library in middleware.ts

**Local MongoDB Transaction Fallback Pattern:**
```typescript
// Pattern used in lib/actions/approval.actions.ts and lib/actions/wallet.actions.ts
try {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();
  
  // ... transactional operations ...
  
  await dbSession.commitTransaction();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : "";
  // Check for local MongoDB transaction errors
  if (errorMessage.includes("retryable writes") || errorMessage.includes("replica set") || errorMessage.includes("Transaction numbers")) {
    // Fall back to non-transactional operations
    // ... perform operations without session ...
  } else {
    throw error;
  }
} finally {
  dbSession?.endSession();
}
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB connection fails | Ensure MongoDB is running at `mongodb://localhost:27017/incentiveio` |
| "Only plain objects can be passed to Client Components" error | Convert MongoDB ObjectIds to strings with `.toString()` before returning from server actions (see gotcha #13) |
| "signIn is on the client" error | Use `signIn` from `next-auth/react` in client components only. For server-side, use `auth()` from `@/lib/auth/auth` |
| Turbopack build fails with Mongoose errors | Use `npm run build:webpack` instead — Mongoose native bindings fail with Turbopack |
| Tests fail with "Cannot find module" | Run `npm install` to ensure all dev dependencies are installed |
| Rate limit errors (429 status) | Wait for the retry period or use a different IP address (development only) |
| Commission calculation seems off | Ensure you're using functions from `lib/utils/money.ts` - floating point errors accumulate |
| "Transaction numbers are only allowed on a replica set member" | Normal for local MongoDB — code automatically falls back to non-transactional operations |
| Commission returns 0 in tests | Ensure test users have `targetAmount` set (done automatically in `tests/helpers/test-actions.ts`) |
| "Cast to ObjectId failed" in tests | Ensure ObjectId strings are exactly 24 hex characters (use `new mongoose.Types.ObjectId().toString()`) |

## Security Hardening (Applied During Audit)

- **Rate limiting**: Public endpoints (register, login) protected against DDoS and brute force
- **Strong passwords**: Registration requires 12+ chars with uppercase, lowercase, number, special character
- **CORS protection**: Configurable allowed origins with credentials support
- **Input validation**: All API endpoints have Zod validation at both API and server action level
- **Standardized errors**: Consistent error response structure across all endpoints
- **Atomic transactions**: Commission approval + wallet credit in single MongoDB transaction with fallback for local MongoDB
- **Precise calculations**: Integer-based monetary math prevents floating point errors
- **API error handling**: All API routes have try-catch blocks with proper error responses
- **Path traversal protection**: File upload/delete endpoints validate for both Unix (`/`) and Windows (`\\`) path separators
- **NoSQL injection prevention**: Regex patterns for search escape special characters with `.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")`

## Runtime Validation Best Practices

When validating application behavior (not just code review), check these critical areas:

**API Layer:**
- All routes have try-catch blocks
- Server action results checked for `error` property before use
- Null checks with optional chaining (`result?.error`)
- Consistent response structure across endpoints

**Data Transformation:**
- MongoDB ObjectIds converted to strings before returning to UI
- Populated fields safely typed (avoid `as unknown as`)
- Date fields formatted or left as Date objects (not strings)
- Monetary values use proper formatting functions

**UI Rendering:**
- `Array.isArray()` checks before mapping over arrays
- Optional chaining for nested property access (`record?.totalAmount`)
- Loading states prevent premature rendering
- Empty states handled gracefully

**User Flows:**
- Complete workflows tested end-to-end
- Role-based access verified at each step
- State transitions work correctly
- Error recovery handled properly

## Environment Variables (.env.example)

```
MONGODB_URI=mongodb://localhost:27017/incentiveio?retryWrites=false
NEXTAUTH_SECRET=your-super-secret-key-change-in-production (min 32 chars)
NEXTAUTH_URL=http://localhost:3000
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Incentive.io <your-email@gmail.com>"
```

**Note:** For local development, `retryWrites=false` is automatically added to localhost/127.0.0.1 connections in `lib/mongodb.ts`.

**MongoDB Compass:** The database is fully compatible with MongoDB Compass for GUI access. Connect to `mongodb://localhost:27017/incentiveio` to view collections, run queries, and monitor data in real-time. All collections use soft delete (`deletedAt` field), so filter `{ deletedAt: null }` to see active records.
