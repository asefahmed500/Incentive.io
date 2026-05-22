# Incentive.io — Agent Guide

Next.js 16 (App Router), MongoDB/Mongoose 9, NextAuth v5, Tailwind CSS 4, shadcn/ui.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` (uses `--webpack` flag) |
| Build | `npm run build:webpack` |
| Start | `npm run start` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Full audit | `npm run audit` (typecheck + lint + test, sequential) |
| Seed DB | `npm run seed` |
| Vitest tests | `npm test` |
| Single Vitest test | `npm test -- -t "test name"` |
| Vitest coverage | `npm run test:coverage` |
| Dev tunnel | `npm run share` |

**Must use `npm run build:webpack`** — Mongoose native bindings fail with Turbopack. `vercel.json` enforces this via `buildCommand` + `NEXT_PRIVATE_BUILD_WORKER=webpack`.

## Setup

1. `cp .env.example .env.local`
2. MongoDB at `mongodb://localhost:27017/incentiveio` (`retryWrites=false` auto-added for localhost in `lib/mongodb.ts`)
3. `NEXTAUTH_SECRET` >= 32 chars
4. `npm run seed` for demo data (13 users, teams, products, sales records)

## Architecture

### Auth Config Split (Edge Runtime)

- `lib/auth/auth.config.ts` — Pure NextAuth config, no DB. Used by middleware (Edge Runtime).
- `lib/auth/auth.ts` — Full NextAuth with DB recheck. Used by server components/actions.
- **Never import `auth()` from `auth.ts` in middleware** — Mongoose is incompatible with Edge Runtime.

### Data Layer

- **Server actions** (`lib/actions/*.ts`): `"use server"`, Zod validation, return `{ success, data?, error? }`. Audit logging via `lib/actions/audit.actions.ts` on all state changes.
- **API routes** (`app/api/*/route.ts`): Auth check via `requireAuth()`, then call server actions. Try-catch with `handleError()` from `lib/api-error.ts`.
- **Role guards** (`lib/auth/role-guard.ts`): `requireAuth()`, `requireRole()`, `requireAdminOrAbove()`, `requireFinanceOrAbove()`.
- **Models** (`lib/models/*.ts`): Soft delete hooks auto-filter `deletedAt: null`. Never use `findByIdAndDelete`. AuditLog is the exception (no soft delete).
- **Models barrel**: `lib/models/index.ts` exports all models.
- **Env validation** (`lib/env.ts`): Validates all env vars at import time. `MONGODB_URI` must start with `mongodb://` or `mongodb+srv://`.
- **Logout**: always use `logoutAction()` from `lib/actions/auth.actions.ts` — never call `signOut()` directly.
- **Local MongoDB**: No transaction support. Code in `approval.actions.ts` and `wallet.actions.ts` auto-falls back to non-transactional ops.

### Approval Workflow

```
Draft -> Pending_Manager -> Pending_Accountant -> Pending_Finance -> Approved
         (Manager)          (Accountant)          (Finance)
```

**Auto-approve:** When ALL products are from `autoApprove: true` categories, sale skips straight to `Approved` with immediate commission + wallet credit.

Rejection -> `Draft` + `rejectionReason` + `rejectedBy` (one of `"manager"`, `"accountant"`, `"finance"`).

### Real-Time Updates

- SSE via `lib/sse.ts` + `hooks/use-sse.ts` (not Socket.IO — socket deps exist but unused)
- Events: `SALE_CREATED`, `SALE_APPROVED`, `SALE_REJECTED`, `WALLET_UPDATED`, `DASHBOARD_REFRESH`
- Dashboards poll every 30s as fallback

## Role-Based Access

| Role | Route Prefix | Notes |
|------|-------------|-------|
| `administrator` | `/administrator/*` + all routes | Full system access |
| `admin` | `/admin/*` + most routes | Cannot access `/administrator` |
| `salesManager` | `/sales-manager/*`, `/sales-dashboard/*` | Team data only |
| `salesExecutive` | `/sales-dashboard/*` | Own data only |
| `accountant` | `/accountant/*`, `/sales-dashboard/*` | Tax/VAT processing |
| `finance` | `/finance/*`, `/sales-dashboard/*` | Final approval + payments |

Role names are camelCase: `salesManager`, `salesExecutive`, etc. (not snake_case).

Enforced in `middleware.ts` via JWT inspection using `authConfig` (not full `auth()`).

## Critical Gotchas

1. **No `saleAmount` field** — calculate from products: use `calculateProductTotal()` from `lib/utils/money.ts`, never raw `p.unitPrice * p.quantity`
2. **Monetary math** — always use `lib/utils/money.ts` functions (`calculatePercentage`, `calculateProductTotal`, `roundMoney`, `subtractAmounts`). Avoid float arithmetic.
3. **Schema uses `categoryId`**, not `category` — it's an ObjectId ref
4. **Dual status fields** — `status` = workflow stage; `approvalStatus`/`accountantStatus`/`financeStatus` = per-role flags. Both exist.
5. **Draft-only ops** — only `Draft` records can be submitted or deleted. Server guards enforce.
6. **Reject stage guards** — manager rejects `Pending_Manager` only, accountant rejects `Pending_Accountant` only
7. **Resubmit resets ALL workflow fields** — accountantStatus, financeStatus, netSales, tax, commission, rejectionReason, rejectedBy
8. **Commission on net, not gross** — Net = gross - tax - VAT - EO/BP (both tax and VAT calculated on gross)
9. **Eligibility is boolean** — `isEligible` on User model, based on cumulative approved sales vs target (50% threshold)
10. **Soft delete everywhere** — `deletedAt` field + pre-find hooks. Never `findByIdAndDelete`. AuditLog is the exception.
11. **Wallet uses atomic `$inc`** — prevents race conditions. Local MongoDB lacks transactions, code auto-falls back.
12. **Tax/VAT rate checks** — use `!== undefined && !== null` because `0` is valid but falsy
13. **Ownership required** — sales record ops check `employeeId`; managers approve only their `managerId` team
14. **ObjectId serialization** — MongoDB `ObjectId` cannot be passed to client components. Always `.toString()` before returning from server actions
15. **`changePassword`** derives userId from session — never trust client input for userId
16. **Server action return types** — may return data, `{ error: string }`, or `undefined`. Always check `result?.error` with optional chaining, use `Array.isArray()` before mapping
17. **Client vs server auth** — `signIn` from `next-auth/react` in client components only. Server-side: `auth()` from `@/lib/auth/auth`
18. **NoSQL injection** — reject strings starting with `$` in validation schemas; escape regex special chars in search
19. **API-level validation required** — all new API endpoints need Zod schemas in `lib/validations/*.ts`
20. **Net sales < 0** — accountant processing rejects this
21. **`npm run build` == `npm run build:webpack`** — both use `--webpack`; `build:webpack` is the canonical name
22. **`npm run share`** — opens dev tunnel via `scripts/dev-tunnel.js`
23. **Zod v4** — this repo uses Zod v4 (`^4.4.2`), not v3. Some API differences (e.g., `.refine()` chaining, error shape).

## Code Style

- Prettier: no semicolons, double quotes, trailing comma es5, printWidth 80, `tailwind-plugin-tailwindcss` with `tailwindStylesheet: "app/globals.css"`
- `@/*` maps to `./*` (no `src/` prefix)
- Icons: Lucide React only
- Currency: `(amount || 0).toLocaleString()` or `formatCurrency()` from `lib/utils/money.ts`
- `no-explicit-any` is `warn`, not error
- Unused vars with `_` prefix are allowed (`argsIgnorePattern: "^_"`)

## Testing

**Vitest** (`npm test`): Unit/integration tests. 30s timeout (overridden in `tests/setup.ts`), jsdom env. Coverage via v8.
- `jest.config.js` is a leftover — `npm test` uses vitest.
- Setup: `tests/setup.ts` auto-creates commission rules and mocks NextAuth. Requires MongoDB running.
- Test users need `targetAmount` for commission calc.
- Server actions with `"use server"` cannot be imported directly — test business logic or via API routes.
- ObjectIds must be exactly 24 hex chars.
- Exclude patterns: `tests/e2e/specs/**`, `.next/**`, `.claude/**`, `.agents/**`.

**E2E (Playwright):** Tests in `tests/e2e/specs/`.
- `playwright.config.ts` does not exist at repo root — E2E setup may be incomplete/stale.
- Prerequisites: MongoDB running, `npm run seed`, dev server on port 3000.
- Trace + screenshot on failure, video retained on failure.

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` | Sales CRUD, submit, delete, ownership checks, auto-approve check |
| `lib/actions/approval.actions.ts` | Multi-stage approve/reject with atomic transactions + auto-approve |
| `lib/actions/wallet.actions.ts` | Atomic credit/debit with MongoDB sessions, local fallback |
| `lib/actions/audit.actions.ts` | Audit logging on all state changes |
| `lib/actions/auth.actions.ts` | `logoutAction()` — always use this, never `signOut()` directly |
| `lib/actions/commission.actions.ts` | Commission calculation, eligibility checks |
| `lib/utils/money.ts` | Precise monetary calculations (cents-based integer math) |
| `lib/mongodb.ts` | DB singleton, `toObjectId()`, `checkDatabaseConnection()` |
| `lib/env.ts` | Env validation at import time |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()`, `requireAdminOrAbove()` |
| `lib/sse.ts` | Server-Sent Events manager |
| `lib/api-error.ts` | `ApiError` class + `handleError()` |
| `lib/validations/*.ts` | 14 Zod v4 validation schemas for API boundary |
| `middleware.ts` | Route-level RBAC via `authConfig` (Edge Runtime) |
| `types/index.ts` | `UserRole`, `SaleStatus`, `AuthUser`, `SaleRecord` types |

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| superadmin@incentive.io | Superadmin123! | administrator |
| jamal@incentive.io | Manager123! | salesManager |
| fatima@incentive.io | Manager123! | salesManager |
| karim@incentive.io | Executive123! | salesExecutive |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |
| inactive@incentive.io | Inactive123! | salesExecutive (disabled) |

Additional executives: nasrin, rahim, sabina, mizanur, anika@incentive.io — all use `Executive123!`.
