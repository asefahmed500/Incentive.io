# Incentive.io — Agent Guide

Next.js 16 (App Router), MongoDB/Mongoose 9, NextAuth v5, Tailwind CSS 4, shadcn/ui, Zod v4.
Additional deps: recharts, framer-motion, sonner, zustand, react-hook-form, xlsx, jspdf.
Exhaustive project context is in `CLAUDE.md` (812 lines). This file covers only gotchas and non-obvious conventions.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` |
| Build | `npm run build:webpack` |
| Start | `npm run start` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` (slow — prefer `npx eslint <file>`) |
| Format | `npm run format` |
| Full audit | `npm run audit` (typecheck → lint → test sequential) |
| Seed DB | `npm run seed` |
| Vitest tests | `npm test` |
| Single Vitest test | `npm test -- -t "test name"` |
| Vitest coverage | `npm run test:coverage` |

**Both `dev` and `build` use `--webpack`** — Mongoose native bindings fail with Turbopack. `vercel.json` enforces this via `NEXT_PRIVATE_BUILD_WORKER=webpack`.

**For E2E testing, use production mode** (`npm run build:webpack && npm start`). Pages are precompiled — no lazy compilation delays. Dev mode pages compile on first access (5-20s per page), causing timeouts. Set `NODE_ENV=development` when starting production server on localhost to avoid `secure` cookie issues on HTTP.

### E2E Scripts

`node scripts/<role>-e2e.js` runs end-to-end flows per role. `node scripts/run-all-e2e.js` runs all sequentially. `node scripts/comprehensive-e2e.js` tests all 59 sidebar links across all 6 roles. `node scripts/test-password-reset.js` tests the full password reset flow. Playwright specs exist in `tests/e2e/specs/` but `playwright.config.ts` is incomplete — use the Node scripts.

## Setup

1. `cp .env.example .env.local` — local URI includes `retryWrites=false` (no transaction support on local MongoDB).
2. `.env.local` contains production MongoDB Atlas credentials + real SMTP creds — **do not commit** (in `.gitignore`).
3. `NEXTAUTH_SECRET` >= 32 chars. `NEXTAUTH_URL` must be set.
4. `npm run seed` for demo data (users, teams, products, commission rules).

## Auth (Edge Runtime Split)

- `lib/auth/auth.config.ts` — Pure NextAuth config, no DB imports. Used by middleware (Edge Runtime).
- `lib/auth/auth.ts` — Full NextAuth with DB recheck (Mongoose). Used by server components/actions.
- **Never import `auth()` from `auth.ts` in middleware** — Mongoose is incompatible with Edge Runtime.
- **Logout**: always use `logoutAction()` from `lib/actions/auth.actions.ts` — it redirects to `/api/auth/signout?callbackUrl=/` which properly clears the JWT cookie. Never call `signOut()` directly from a server action.
- **Client auth**: `signIn` from `next-auth/react` in client components only.

## Middleware Behavior

`middleware.ts` (Edge Runtime via `auth.config.ts`):
- Public paths: `/`, `/login`, `/register`, `/reset-password`, `/api/auth`, `/api/health`, `/api/register`, `/api/reset-password`
- CORS on `/api/*` routes — `ALLOWED_ORIGINS` env var
- HTTPS redirect in production (unless localhost)
- Role-to-path enforcement: `administrator` can access all routes; `admin` blocked from `/administrator`; `salesExecutive` restricted to `/sales-dashboard`; etc.

## Data Layer

- **Server actions** (`lib/actions/*.ts`): `"use server"`, Zod v4 validation, return `{ success, data?, error? }`. Audit logging via `logAudit()` on all state changes.
- **API routes** (`app/api/*/route.ts`): Auth via `requireAuth()`, then delegate to server actions. Errors via `handleError()`.
- **Models** (`lib/models/*.ts`): Soft delete hooks auto-filter `deletedAt: null`. Never use `findByIdAndDelete`. Use `findByIdAndUpdate(..., { deletedAt: new Date() })`. AuditLog is the exception.
- **Env validation** (`lib/env.ts`): Validates all env vars at import time. `MONGODB_URI` must start with `mongodb://` or `mongodb+srv://`.
- **Local MongoDB**: No transaction support. Code in `approval.actions.ts` and `wallet.actions.ts` auto-falls back to non-transactional ops.

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

## Code Style

- `@/*` maps to `./*` (no `src/` prefix in tsconfig paths). Scripts using `tsx` won't resolve `@/*` — use relative paths.
- Prettier: no semis, double quotes, trailing comma es5, printWidth 80, `prettier-plugin-tailwindcss`
- Icons: Lucide React only
- Toasts: sonner via `useNotifications` hook (`hooks/useNotifications.ts`)
- Monetary math: always use `lib/utils/money.ts` (`calculatePercentage`, `calculateProductTotal`, `roundMoney`) — cents-based integer math, never raw `*` for currency

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
3. **Dual status fields** — `status` (workflow stage: Draft/Pending_Manager/...) and `approvalStatus`/`accountantStatus`/`financeStatus` (per-role: Pending/Approved/Rejected). Both exist and must be checked independently.
4. **Draft-only ops** — only `Draft` records can be submitted, edited, or deleted. Server guards enforce.
5. **Reject stage guards** — manager rejects `Pending_Manager` only, accountant rejects `Pending_Accountant` only, finance rejects `Pending_Finance` only
6. **Eligibility is boolean** — 50% threshold of cumulative approved sales vs target. Crossing 50% triggers re-evaluation of all previous NOT_ELIGIBLE records.
7. **Wallet uses atomic `$inc`** — prevents race conditions. Local MongoDB lacks transactions, code auto-falls back.
8. **Tax/VAT rate checks** — use `!== undefined && !== null` because `0` is valid but falsy
9. **Ownership required** — sales record ops check `employeeId`; managers approve only their `managerId` team
10. **ObjectId serialization** — use `lib/utils/serialization.ts` helpers (`serializeId`, `serializeDocument`, `serializeForClient`)
11. **Server action return types** — may return `data`, `{ error }`, or `undefined`. Always check with optional chaining, use `Array.isArray()` before mapping.
12. **Net sales < 0** — accountant processing rejects this
13. **Zod v4** (`^4.4.2`) — not v3. API differences in `.refine()` chaining and error shape.
14. **Stale `.next/` cache** — if typecheck fails on files in `.next/dev/types/`, delete `.next/` and rebuild
15. **Middleware is Edge** — only import `auth.config.ts`, never `auth.ts` (Mongoose breaks Edge Runtime)
16. **`lib/utils.ts` ≠ `lib/utils/`** — `lib/utils.ts` is the `cn()` classname utility (tailwind-merge + clsx). The `lib/utils/` directory contains specialized utilities: `money.ts`, `password.ts`, `serialization.ts`, `export.ts`, `type-guards.ts`.
17. **Building for production** — 3 pages need `export const dynamic = "force-dynamic"` to avoid `useState` SSR crash: `/finance/analytics`, `/sales-dashboard/commissions`, `/admin/wallets`. If new client pages fail at build, add this export.

## Testing

**Vitest** (`npm test`): Unit/integration tests. Timeout 10s (overridden to 30s in setup). jsdom. Coverage via v8.
- Requires MongoDB running locally
- `tests/setup.ts` auto-creates commission rules and mocks NextAuth + email
- Server actions with `"use server"` cannot be imported directly — use `tests/helpers/test-actions.ts` or test via API routes
- ObjectIds must be exactly 24 hex chars

**CI** (`.github/workflows/audit.yml`): Typecheck, lint, test, and build:webpack as parallel jobs on push to master/main.
**CI** (`.github/workflows/pre-deploy.yml`): Sequential audit + npm audit + security scan on push/PR to main.

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` | Sales CRUD, submit, delete, ownership checks, auto-approve check |
| `lib/actions/approval.actions.ts` | Multi-stage approve/reject with atomic transactions + auto-approval |
| `lib/actions/wallet.actions.ts` | Atomic credit/debit with MongoDB sessions, local fallback |
| `lib/actions/auth.actions.ts` | `logoutAction()` — redirects to signout endpoint |
| `lib/actions/commission.actions.ts` | Commission calculation, eligibility checks, target change detection |
| `lib/actions/user.actions.ts` | Password reset (request + confirm), admin password reset |
| `lib/utils/money.ts` | Cents-based monetary calculations (no float arithmetic) |
| `lib/utils/serialization.ts` | ObjectId → string helpers |
| `lib/mongodb.ts` | DB singleton, `toObjectId()`, `checkDatabaseConnection()` |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()`, `requireAdminOrAbove()` |
| `lib/validations/*.ts` | Zod v4 validation schemas (14 files) |
| `middleware.ts` | Route-level RBAC + CORS + HTTPS redirect (Edge, uses `authConfig`) |
| `lib/api-error.ts` | `ApiError` class + `handleError()` |
| `lib/email.ts` | SMTP via nodemailer — `sendPasswordResetEmail` included |
| `components/file-preview.tsx` | Image/PDF/document preview with download/view buttons |
| `app/reset-password/page.tsx` | Self-service password reset (forgot → email link → reset form) |

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
