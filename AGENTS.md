# Incentive.io — Agent Guide

Sales commission management system. Next.js 16 (App Router), MongoDB/Mongoose 9, NextAuth v5, Tailwind CSS 4, shadcn/ui, Zod v4.

Deep architectural context in `CLAUDE.md`. This file covers only what you'd get wrong without help.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` |
| Build | `npm run build:webpack` |
| Typecheck | `npm run typecheck` |
| Lint | `npx eslint <file>` (full `npm run lint` is slow) |
| Format | `npm run format` |
| Audit | `npm run audit` (typecheck → lint → test sequential) |
| Seed DB | `npm run seed` |
| Tests | `npm test` |
| Single test | `npm test -- -t "test name"` |
| E2E (Node) | `node scripts/<role>-e2e.js` or `node scripts/run-all-e2e.js` |
| Single lint | `npx eslint <file>` (full `npm run lint` times out) |

**Mongoose + Turbopack = crash.** Every command already includes `--webpack`. `vercel.json` enforces `NEXT_PRIVATE_BUILD_WORKER=webpack`.

**E2E:** use production mode (`npm run build:webpack && npm start`). Dev mode compiles each page on first access (5-20s/page) causing timeouts. Set `NODE_ENV=development` over HTTP to avoid `secure` cookie issues.

**E2E scripts** are Node scripts in `scripts/`, not Playwright. Playwright specs exist at `tests/e2e/specs/` but config is incomplete.

## Setup

1. `cp .env.example .env.local` — local URI uses `retryWrites=false` (no transactions on standalone MongoDB)
2. `.env.local` has production Atlas + SMTP creds — **do not commit**
3. `NEXTAUTH_SECRET` >= 32 chars
4. `npm run seed` for demo data (13 users across 6 roles)

## Auth — Edge Runtime Split

- `lib/auth/auth.config.ts` — Pure NextAuth config, no DB. Used by middleware (Edge).
- `lib/auth/auth.ts` — Full NextAuth with DB recheck. Used by server components/actions.
- **Never import `auth()` from `auth.ts` in middleware** — Mongoose is Edge-incompatible.
- **Logout (client)**: `signOut({ callbackUrl: "/login" })` from `next-auth/react` only.
- **Logout (server action)**: `logoutAction()` from `lib/actions/auth.actions.ts`. Never `signOut()` from a server action.
- **Signout infinite loop (FIXED)**: `session-recheck.tsx` uses `useRef` for `session`/`update` (effect deps = `[interval]` only). `auth.ts` jwt callback checks only `trigger === "update"`. Signout route returns fresh `Response` with explicit `Set-Cookie` headers. These three fixes prevent the race condition where an in-flight session request re-issues the JWT after the signout POST clears the cookie.

## Role-Based Access

Roles are camelCase (`salesManager`). Route prefixes are kebab-case (`/sales-manager`).

| Role | Route access |
|------|-------------|
| `administrator` | All routes |
| `admin` | `/admin/*`, `/sales-dashboard/*`, `/sales-manager/*`, `/accountant/*`, `/finance/*` |
| `salesManager` | `/sales-manager/*`, `/sales-dashboard/*` |
| `salesExecutive` | `/sales-dashboard/*` |
| `accountant` | `/accountant/*`, `/sales-dashboard/*` |
| `finance` | `/finance/*`, `/sales-dashboard/*` |

### Actual route paths (not what sidebar labels suggest)
- Admin sales: `/admin/sales` (not `/admin/sales-records`)
- Manager approvals: `/sales-manager/pending-approvals`
- Finance payments: `/finance/payments`
- Admin analytics: `/admin/analytics/wip`
- Administrator sync: `/administrator/sync`, health: `/administrator/health`

## Auth API Route (`app/api/auth/[...nextauth]/route.ts`)

Rate limiter applies to ALL POSTs — **must skip for signout**:
```typescript
const url = new URL(request.url);
if (url.pathname.endsWith("/signout") || url.searchParams.get("nextauth") === "signout") {
  return handlers.POST(request); // bypass rate limit
}
```
Without this, signout returns 429, session cookie never cleared, user stays logged in.

## Middleware (`middleware.ts`)

Edge Runtime via `auth.config.ts`. Public paths: `/`, `/login`, `/register`, `/reset-password`, `/api/auth`, `/api/health`, `/api/register`, `/api/reset-password`. CORS on `/api/*` via `ALLOWED_ORIGINS` env var.

## Approval Workflow

```
Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved
```

- **Auto-approve**: ALL products from `autoApprove: true` categories → skip to `Approved` with immediate commission + wallet credit
- Rejection → `Draft` + `rejectionReason` + `rejectedBy`
- Resubmit resets ALL workflow fields
- Commission on **net** (gross - tax - VAT - EO/BP). Tax and VAT both on gross (not sequential)
- Manager approves only their team's records (`managerId` match)

## Data Layer

- **Server actions** (`lib/actions/*.ts`): `"use server"`, Zod v4 validation, return `{ success, data?, error? }` or array. Always check `Array.isArray()` before mapping, optional chaining for `result?.error`.
- **API routes** (`app/api/*/route.ts`): Auth via `requireAuth()`, delegate to server actions, errors via `handleError()`.
- **Models** (`lib/models/*.ts`): Soft delete (`deletedAt`). Never `findByIdAndDelete` — use `findByIdAndUpdate(..., { deletedAt: new Date() })`. AuditLog is the exception.
- **Local MongoDB**: No transactions. `approval.actions.ts` and `wallet.actions.ts` auto-fall back to non-transactional ops.

## Code Style

- `@/*` maps to `./*` (no `src/`). Scripts using `tsx` need relative paths.
- Prettier: no semis, double quotes, trailing comma es5, printWidth 80, `prettier-plugin-tailwindcss`
- Icons: Lucide React only
- Toasts: sonner via `useNotifications` hook
- Monetary math: always `lib/utils/money.ts` — cents-based integer math, never raw `*` on currency
- `lib/utils.ts` = `cn()` (tailwind-merge). `lib/utils/` = money, password, serialization, export helpers.

## Critical Gotchas

1. **No `saleAmount` field** — use `calculateProductTotal(unitPrice, quantity)` from `lib/utils/money.ts`. Never `p.unitPrice * p.quantity`.
2. **`categoryId`** is ObjectId ref, not string `category`.
3. **Dual status fields** — `status` (workflow) AND `approvalStatus`/`accountantStatus`/`financeStatus` (per-role). Check both independently.
4. **Draft-only ops** — only `Draft` records can be submitted, edited, or deleted.
5. **Reject stage guards** — manager rejects `Pending_Manager` only, accountant rejects `Pending_Accountant` only, etc.
6. **Eligibility** — 50% threshold. Crossing it triggers re-evaluation of all NOT_ELIGIBLE records in period.
7. **Wallet uses atomic `$inc`** — prevents race conditions.
8. **Tax/VAT rate checks** — use `!== undefined && !== null` because `0` is valid but falsy.
9. **Ownership required** — ops check `employeeId`; managers approve only their `managerId` team.
10. **ObjectId serialization** — use `lib/utils/serialization.ts` (`serializeId`, `serializeDocument`, `serializeForClient`).
11. **Server action returns** — may return `data`, `{ error }`, or `undefined`. Always optional chaining, `Array.isArray()` before mapping.
12. **Zod v4** (`^4.4.2`) — different `.refine()` chaining and error shape from v3.
13. **Stale `.next/` cache** — if typecheck fails on `.next/dev/types/`, delete `.next/` and rebuild.
14. **Middleware is Edge** — only import `auth.config.ts`, never `auth.ts`.
15. **`force-dynamic` pages** — `/finance/analytics`, `/sales-dashboard/commissions`, `/admin/wallets` need `export const dynamic = "force-dynamic"` or SSR crashes.
16. **`employeeId` on SalesRecord is String** — `.populate("employeeId")` does nothing. Look up User via `User.findById(record.employeeId)` separately if you need user data.
17. **`ICategory`/`IProduct` extend `Document`** — never treat them as plain interfaces.
18. **`User.employeeId` is optional** (`employeeId?: string`) — schema has `sparse: true` so some users won't have one.
19. **`SystemSettings.value` type** — `Record<string, unknown> | string | number | boolean`, not `any`.
20. **Rate limiter on `[...nextauth]`** — must skip signout POSTs or user stays logged in (gotcha #20 in Signout section above).
21. **Signout cookie race** — never use `fetch("/api/auth/signout")` + redirect from client. Always use `signOut({ callbackUrl: "/login" })` from `next-auth/react`.

## Testing

**Vitest** (`npm test`): jsdom, 10s timeout. Coverage via v8.
- Requires MongoDB running at `mongodb://localhost:27017/incentiveio`
- `tests/setup.ts` auto-creates commission rules, mocks NextAuth + email
- Server actions (`"use server"`) can't be imported directly — use `tests/helpers/test-actions.ts` or test via API routes
- ObjectIds must be exactly 24 hex chars
- CI (`.github/workflows/audit.yml`): typecheck, lint, test, build as parallel jobs on push to master/main

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` | Sales CRUD, submit, delete, ownership, auto-approve |
| `lib/actions/approval.actions.ts` | Multi-stage approve/reject + auto-approval |
| `lib/actions/wallet.actions.ts` | Atomic credit/debit with session fallback |
| `lib/actions/commission.actions.ts` | Commission calculation, eligibility, re-evaluation |
| `lib/actions/notification.actions.ts` | 14 notification types, SSE integration |
| `lib/utils/money.ts` | Cents-based monetary math |
| `lib/utils/serialization.ts` | ObjectId → string helpers |
| `lib/mongodb.ts` | DB singleton, `toObjectId()` |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()` |
| `lib/validations/common.ts` | Shared `objectIdSchema` + `rateSchema` |
| `lib/api-error.ts` | `ApiError` class + `handleError()` |
| `lib/rate-limit.ts` | In-memory rate limiter for public endpoints |
| `lib/sse.ts` | SSE manager for real-time updates |
| `middleware.ts` | RBAC + CORS (Edge, uses `authConfig`) |

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
| nasrin, rahim, sabina, mizanur, anika@incentive.io — all `Executive123!` |

## Production

- URL: `https://incentiveio.vercel.app`
- Deploy: `vercel --prod` (project linked via `.vercel/repo.json`)
- Vercel project ID: `prj_GVhPGHTt5LSrEskBMUEgyAqAIeUJ`
- `vercel.json` forces webpack build
- Production MongoDB Atlas uses `retryWrites=true` (unlike local `retryWrites=false`)
