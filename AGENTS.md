# Incentive.io — Agent Guide

Next.js 16 (App Router), MongoDB/Mongoose 9, NextAuth v5, Tailwind CSS 4, shadcn/ui, Zod v4.
**Additional deps:** recharts (charts), framer-motion (animations), sonner (toasts via `useNotifications` hook), zustand (client state), react-hook-form + @hookform/resolvers (forms), xlsx (Excel export), jspdf (PDF).

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` |
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
| Debug prod data | `node scripts/check-prod-data.js` |
| Debug prod users | `node scripts/check-prod-users.js` |
| Debug prod API | `node scripts/test-production-api.js` (13 endpoint tests) |

**Both `dev` and `build` use `--webpack`** — Mongoose native bindings fail with Turbopack. `vercel.json` enforces this via `NEXT_PRIVATE_BUILD_WORKER=webpack`.

**Lint is slow** — ESLint v9 flat config (`eslint.config.mjs`), takes 180s+ on full codebase. Prefer `npx eslint <single-file>`.

**Only `build:webpack` is used in CI/Vercel.** The bare `build` script exists but mirrors the same command.

**For E2E testing, use production mode** (`npm run build:webpack && npm start`). Pages are precompiled — no lazy compilation delays. Dev mode pages compile on first access (5-20s per page), causing timeouts in automated tests. Set `NODE_ENV=development` when starting production server on localhost to avoid `secure` cookie issues.

### E2E Scripts

`node scripts/<role>-e2e.js` runs end-to-end flows per role (admin, executive, manager, accountant, finance, rejection, verify). `node scripts/run-all-e2e.js` runs all sequentially. `node scripts/comprehensive-e2e.js` tests all 59 sidebar links across all 6 roles plus workflow + API consistency. Playwright specs exist in `tests/e2e/specs/` but `playwright.config.ts` is incomplete — use the Node scripts for E2E.

## Setup

1. `cp .env.example .env.local` — local URI includes `retryWrites=false` (no transaction support on local MongoDB).
2. `.env.local` contains production MongoDB Atlas credentials + real SMTP creds — **do not commit** (in `.gitignore`).
3. `NEXTAUTH_SECRET` >= 32 chars. `NEXTAUTH_URL` must be set.
4. `npm run seed` for demo data (users, teams, products, commission rules).

## Auth (Edge Runtime Split)

- `lib/auth/auth.config.ts` — Pure NextAuth config, no DB imports. Used by middleware (Edge Runtime).
- `lib/auth/auth.ts` — Full NextAuth with DB recheck (Mongoose). Used by server components/actions.
- **Never import `auth()` from `auth.ts` in middleware** — Mongoose is incompatible with Edge Runtime.
- **Logout**: always use `logoutAction()` from `lib/actions/auth.actions.ts` — never call `signOut()` directly.
- **Client auth**: `signIn` from `next-auth/react` in client components only.

## Middleware Behavior

`middleware.ts` (Edge Runtime via `auth.config.ts`):
- CORS on `/api/*` routes — `ALLOWED_ORIGINS` env var (defaults to localhost:3000)
- HTTPS redirect in production (unless localhost)
- Publically accessible: `/`, `/login`, `/register`, `/api/auth`, `/api/health`, `/api/register`, `/api/reset-password`
- Role-to-path enforcement: `administrator` can access all routes; `admin` blocked from `/administrator`; `salesExecutive` restricted to `/sales-dashboard`; etc.

## Data Layer

- **Server actions** (`lib/actions/*.ts`): `"use server"`, Zod v4 validation, return `{ success, data?, error? }`. Audit logging via `logAudit()` on all state changes.
- **API routes** (`app/api/*/route.ts`): Auth via `requireAuth()`, then delegate to server actions. Errors via `handleError()` from `lib/api-error.ts`.
- **Role guards** (`lib/auth/role-guard.ts`): `requireAuth()`, `requireRole()`, `requireAdminOrAbove()`, `requireFinanceOrAbove()`.
- **Models** (`lib/models/*.ts`): Soft delete hooks auto-filter `deletedAt: null`. Never use `findByIdAndDelete`. Use `findByIdAndUpdate(..., { deletedAt: new Date() })`. AuditLog is the exception (no soft delete).
- **Barrel export**: `lib/models/index.ts` exports all models.
- **Env validation** (`lib/env.ts`): Validates all env vars at import time (throws if missing). `MONGODB_URI` must start with `mongodb://` or `mongodb+srv://`.
- **Local MongoDB**: No transaction support. Code in `approval.actions.ts` and `wallet.actions.ts` auto-falls back to non-transactional ops. `lib/mongodb.ts` sets `retryWrites: false` for localhost connections.

## Approval Workflow

```
Draft -> Pending_Manager -> Pending_Accountant -> Pending_Finance -> Approved
         (Manager)          (Accountant)          (Finance)
```

- **Auto-approve**: When ALL products are from `autoApprove: true` categories, sale skips straight to `Approved` with immediate commission + wallet credit.
- Rejection → `Draft` + `rejectionReason` + `rejectedBy` (one of `"manager"`, `"accountant"`, `"finance"`).
- Resubmit resets ALL workflow fields (status, per-role statuses, netSales, tax, commission, rejection).
- Commission on **net** (gross - tax - VAT - EO/BP). Both tax and VAT calculated on gross (not sequential).
- Manager approves only their team's records (`managerId` match).

## Real-Time Updates

SSE via `lib/sse.ts` + `hooks/use-sse.ts`. Dashboards poll every 30s as fallback.

## Code Style

- `@/*` maps to `./*` (no `src/` prefix in tsconfig paths)
- Prettier: no semis, double quotes, trailing comma es5, printWidth 80, `prettier-plugin-tailwindcss` with `tailwindFunctions: ["cn", "cva"]`
- Icons: Lucide React only
- Toasts: sonner via `useNotifications` hook (`hooks/useNotifications.ts`) — `showSuccess`, `showError`, `showPromise`
- `no-explicit-any` is `warn`; unused vars with `_` prefix allowed
- Monetary math: always use `lib/utils/money.ts` (`calculatePercentage`, `calculateProductTotal`, `roundMoney`, `subtractAmounts`) — cents-based integer math, never raw float arithmetic
- Password hashing: `lib/utils/password.ts` — bcrypt with 12 rounds

## Role-Based Access

| Role | Route Prefixes |
|------|---------------|
| `administrator` | All routes |
| `admin` | `/admin/*`, `/sales-dashboard/*`, `/sales-manager/*`, `/accountant/*`, `/finance/*` (blocked from `/administrator`) |
| `salesManager` | `/sales-manager/*`, `/sales-dashboard/*` |
| `salesExecutive` | `/sales-dashboard/*` |
| `accountant` | `/accountant/*`, `/sales-dashboard/*` |
| `finance` | `/finance/*`, `/sales-dashboard/*` |

Role names in DB are camelCase (`salesManager`, `salesExecutive`). Route prefixes use kebab-case (`/sales-manager`, `/sales-dashboard`).

## Critical Gotchas

1. **No `saleAmount` field** — use `calculateProductTotal(unitPrice, quantity)` from `lib/utils/money.ts`, never `p.unitPrice * p.quantity`
2. **Schema uses `categoryId`** (ObjectId ref), not `category` string
3. **Dual status fields** — `status` (workflow stage: Draft/Pending_Manager/...) and `approvalStatus`/`accountantStatus`/`financeStatus` (per-role: Pending/Approved/Rejected). Both exist.
4. **Draft-only ops** — only `Draft` records can be submitted, edited, or deleted. Server guards enforce.
5. **Reject stage guards** — manager rejects `Pending_Manager` only, accountant rejects `Pending_Accountant` only, finance rejects `Pending_Finance` only
6. **Eligibility is boolean** (`isEligible` on User model) — 50% threshold of cumulative approved sales vs target. Crossing 50% triggers re-evaluation of all previous NOT_ELIGIBLE records.
7. **Wallet uses atomic `$inc`** — prevents race conditions. Local MongoDB lacks transactions, code auto-falls back.
8. **Tax/VAT rate checks** — use `!== undefined && !== null` because `0` is valid but falsy
9. **Ownership required** — sales record ops check `employeeId`; managers approve only their `managerId` team
10. **ObjectId serialization** — always `.toString()` before returning from server actions to client. Use `lib/utils/serialization.ts` helpers (`serializeId`, `serializeDocument`, etc.) for consistent conversion.
11. **Server action return types** — may return `data`, `{ error: string }`, or `undefined`. Always check with optional chaining, use `Array.isArray()` before mapping.
12. **NoSQL injection** — reject strings starting with `$` in validation schemas; escape regex special chars in search
13. **Net sales < 0** — accountant processing rejects this
14. **Zod v4** (`^4.4.2`) — not v3. Some API differences (e.g., `.refine()` chaining, error shape).
15. **Stale `.next/` cache** — if typecheck fails on auto-generated files in `.next/dev/types/`, delete `.next/` and rebuild
16. **Middleware is Edge** — only import `auth.config.ts`, never `auth.ts` (Mongoose breaks Edge Runtime)
17. **`lib/utils.ts` ≠ `lib/utils/`** — `lib/utils.ts` is the `cn()` classname utility (tailwind-merge + clsx). The `lib/utils/` directory contains specialized utilities: `money.ts`, `password.ts`, `serialization.ts`, `export.ts`, `type-guards.ts`. Do not confuse the two.
18. **Building for production** — 3 pages need `export const dynamic = "force-dynamic"` to avoid `useState` SSR crash during pre-rendering: `/finance/analytics`, `/sales-dashboard/commissions`, `/admin/wallets`. If new client pages fail at build, add this export.
19. **Logout** — `logoutAction()` in `lib/actions/auth.actions.ts` redirects to `/api/auth/signout?callbackUrl=/`. The NextAuth signout endpoint properly clears JWT cookies. Never call `signOut()` directly from server actions — it can't set response cookies there.

## Testing

**Vitest** (`npm test`): Unit/integration tests. Timeout 10s config, 30s overridden in `tests/setup.ts`. jsdom. Coverage via v8.
- Requires MongoDB running locally (defaults to `mongodb://localhost:27017/incentiveio`)
- `tests/setup.ts` auto-creates commission rules and mocks NextAuth + email
- Server actions with `"use server"` cannot be imported directly — use test helpers (`tests/helpers/test-actions.ts`) or test via API routes
- Test helpers create non-auto-approve categories for standard workflow testing
- ObjectIds must be exactly 24 hex chars
- Exclude patterns: `tests/e2e/specs/**`, `.next/**`, `.claude/**`, `.agents/**`
- Playwright E2E: `tests/e2e/specs/` exist but `playwright.config.ts` is missing — E2E setup is incomplete

**CI** (`.github/workflows/audit.yml`): Runs typecheck, lint, test, and build:webpack as parallel jobs on push to master/main.
**CI** (`.github/workflows/pre-deploy.yml`): Sequential audit (typecheck + lint + test) + npm audit + security scan on push/PR to main.

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` | Sales CRUD, submit, delete, ownership checks, auto-approve check |
| `lib/actions/approval.actions.ts` | Multi-stage approve/reject with atomic transactions + auto-approval |
| `lib/actions/wallet.actions.ts` | Atomic credit/debit with MongoDB sessions, local fallback |
| `lib/actions/audit.actions.ts` | Audit logging on all state changes |
| `lib/actions/auth.actions.ts` | `logoutAction()` — always use this, never `signOut()` directly |
| `lib/actions/commission.actions.ts` | Commission calculation, eligibility checks, target change detection |
| `lib/utils/money.ts` | Cents-based monetary calculations (no float arithmetic) |
| `lib/utils/serialization.ts` | ObjectId → string helpers (`serializeId`, `serializeDocument`, `serializeForClient`) |
| `lib/mongodb.ts` | DB singleton, `toObjectId()`, `checkDatabaseConnection()` |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()`, `requireAdminOrAbove()` |
| `lib/validations/*.ts` | Zod v4 validation schemas for API boundary (14 schemas) |
| `middleware.ts` | Route-level RBAC + CORS + HTTPS redirect via `authConfig` (Edge Runtime) |
| `lib/rate-limit.ts` | In-memory rate limiter for public endpoints |
| `lib/sse.ts` | Server-Sent Events manager for real-time updates |
| `lib/monitoring.ts` | Metric logging (stores in AuditLog) |
| `lib/api-error.ts` | `ApiError` class + `handleError()` for consistent API error responses |
| `types/index.ts` | `UserRole`, `SaleStatus`, `AuthUser`, `SaleRecord`, `Wallet` types |

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
