# Incentive.io — Agent Guide

Sales commission management system. Next.js 16 (App Router), MongoDB/Mongoose 9, NextAuth v5, Tailwind CSS 4, shadcn/ui, Zod v4. Deep architectural context lives in `CLAUDE.md` — this file covers only what an agent would get wrong without help.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` |
| Build | `npm run build:webpack` |
| Start | `npm run start` |
| Typecheck | `npm run typecheck` |
| Lint | `npx eslint <file>` (full `npm run lint` is slow) |
| Format | `npm run format` |
| Audit | `npm run audit` (typecheck → lint → test sequential) |
| Seed DB | `npm run seed` |
| Tests | `npm test` |
| Single test | `npm test -- -t "test name"` |
| Coverage | `npm run test:coverage` |

**Mongoose + Turbopack = crash.** All commands already include `--webpack`. `vercel.json` enforces `NEXT_PRIVATE_BUILD_WORKER=webpack`.

**E2E: use production mode** (`npm run build:webpack && npm start`). Dev pages compile on first access (5-20s/page) causing timeouts. Set `NODE_ENV=development` on localhost to avoid `secure` cookie issues over HTTP.

**E2E scripts** are Node (not Playwright): `node scripts/<role>-e2e.js`, `node scripts/run-all-e2e.js`, `node scripts/comprehensive-e2e.js`. Playwright specs exist in `tests/e2e/specs/` but config is incomplete.

## Setup

1. `cp .env.example .env.local` — local URI has `retryWrites=false` (no transactions on standalone MongoDB).
2. `.env.local` has production Atlas + SMTP creds — **do not commit**.
3. `NEXTAUTH_SECRET` >= 32 chars.
4. `npm run seed` for demo data.

## Auth — Edge Runtime Split

- `lib/auth/auth.config.ts` — Pure NextAuth config, no DB. Used by middleware.
- `lib/auth/auth.ts` — Full NextAuth with DB recheck. Used by server components/actions.
- **Never import `auth()` from `auth.ts` in middleware** — Mongoose is Edge-incompatible.
- **Logout (client)**: `signOut({ callbackUrl: "/login" })` from `next-auth/react` in client components. Properly clears cookies + redirects.
- **Logout (server action)**: `logoutAction()` from `lib/actions/auth.actions.ts`. Never call `signOut()` directly from a server action.
- **Client auth**: `signIn` from `next-auth/react` in client components only.

## Middleware (`middleware.ts`)

Edge Runtime via `auth.config.ts`. Public paths: `/`, `/login`, `/register`, `/reset-password`, `/api/auth`, `/api/health`, `/api/register`, `/api/reset-password`. CORS on `/api/*` via `ALLOWED_ORIGINS` env var. HTTPS redirect in production.

## Auth API Route (`app/api/auth/[...nextauth]/route.ts`)

Delegates to `handlers` from `lib/auth/auth.ts`. **Rate limiter** applies to ALL POSTs — must skip for signout:

```typescript
const url = new URL(request.url);
if (url.pathname.endsWith("/signout") || url.searchParams.get("nextauth") === "signout") {
  return handlers.POST(request); // bypass rate limit
}
```

Without this, signout returns 429, session cookie never cleared, user stays logged in.

### Signout Bug — SessionRecheck Infinite Loop (FIXED)

**Symptom:** Clicking "Sign Out" navigates to `/login` briefly, then redirects back to dashboard. Session cookie persists after signout POST returns 200.

**Root cause chain:**

```
SessionRecheck useEffect deps: [session, update, interval]
    ↓
update() calls GET /api/auth/session
    ↓
jwt callback checks: trigger === "update" || (!user && token.id)
                        ↑                        ↑
                   (explicit call)        (matches EVERY session request!)
    ↓
Callback always modifies token (sets isActive), causing JWT re-issuance
    ↓
Set-Cookie header in response → session state changes in SessionProvider
    ↓
session dependency fires effect again → update() → loop (every ~100ms)
```

**Race condition during signout:**

```
T=0:   SessionRecheck sends GET /api/auth/session (with JWT cookie)    ← in-flight
T=100: User clicks Sign Out
T=160: signOut() → POST /api/auth/signout → Set-Cookie clears cookie  ✓
T=200: window.location.href = "/login" queued
T=220: IN-FLIGHT session request returns → Set-Cookie RE-ISSUES JWT   ✗ ← UNDOES SIGNOUT
T=300: Browser navigates to /login with re-set cookie → redirects back to dashboard
```

See logs for evidence: `GET /api/auth/session 200` every 85-130ms (infinite loop), followed by more session calls after `POST /api/auth/signout 200`.

**Three-part fix:**

| File | Change |
|------|--------|
| `components/session-recheck.tsx` | Use `useRef` for `session`/`update`, effect deps only `[interval]` |
| `lib/auth/auth.ts` | Change condition to `trigger === "update"` only — no DB recheck on passive session reads |
| `app/api/auth/[...nextauth]/route.ts` | Signout returns fresh `Response` with clean `Set-Cookie` headers (session, csrf, callback-url). Don't rely on `handlers.POST()` response headers |

**Why the route handler fix matters:** `@auth/core`'s `Auth()` function wraps the signout response via `Response.json({ url }, { headers: response.headers })`. Copying a `Headers` object with multiple `Set-Cookie` entries into a new `Response` can lose headers depending on runtime behavior. Building a fresh response avoids this entirely.


## Role-Based Access

| Role (camelCase) | Route prefixes |
|------|---------------|
| `administrator` | All routes (`/administrator/*` + everything below) |
| `admin` | `/admin/*`, `/sales-dashboard/*`, `/sales-manager/*`, `/accountant/*`, `/finance/*` (blocked from `/administrator`) |
| `salesManager` | `/sales-manager/*`, `/sales-dashboard/*` |
| `salesExecutive` | `/sales-dashboard/*` |
| `accountant` | `/accountant/*`, `/sales-dashboard/*` |
| `finance` | `/finance/*`, `/sales-dashboard/*` |

Role names are camelCase (`salesManager`). Route prefixes are kebab-case (`/sales-manager`).

## Actual Route Paths (not always what sidebar labels suggest)

- Admin sales records: `/admin/sales` (not `/admin/sales-records`)
- Manager approvals: `/sales-manager/pending-approvals` (not `/sales-manager/approvals`)
- Finance payments: `/finance/payments` (not `/finance/payment-history`)
- Administrator sync: `/administrator/sync`, health: `/administrator/health`

## Data Layer

- **Server actions** (`lib/actions/*.ts`): `"use server"`, Zod v4 validation, return `{ success, data?, error? }`. Audit logging via `logAudit()`.
- **API routes** (`app/api/*/route.ts`): Auth via `requireAuth()`, delegate to server actions, errors via `handleError()`.
- **Models** (`lib/models/*.ts`): Soft delete (`deletedAt`). Never `findByIdAndDelete` — use `findByIdAndUpdate(..., { deletedAt: new Date() })`. AuditLog is the exception.
- **Local MongoDB**: No transactions. `approval.actions.ts` and `wallet.actions.ts` auto-fall back to non-transactional ops.

## Approval Workflow

```
Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved
         (Manager)          (Accountant)          (Finance)
```

- **Auto-approve**: ALL products from `autoApprove: true` categories → skips to `Approved` with immediate commission + wallet credit.
- Rejection → `Draft` + `rejectionReason` + `rejectedBy`.
- Resubmit resets ALL workflow fields.
- Commission on **net** (gross - tax - VAT - EO/BP). Tax and VAT both on gross (not sequential).
- Manager approves only their team's records (`managerId` match).

## Code Style

- `@/*` maps to `./*` (no `src/`). Scripts using `tsx` need relative paths instead.
- Prettier: no semis, double quotes, trailing comma es5, printWidth 80, `prettier-plugin-tailwindcss`
- Icons: Lucide React only
- Toasts: sonner via `useNotifications` hook
- Monetary math: always `lib/utils/money.ts` — cents-based integer math, never raw `*` on currency

## Critical Gotchas

1. **No `saleAmount` field** — use `calculateProductTotal(unitPrice, quantity)`, never `p.unitPrice * p.quantity`
2. **`categoryId`** (ObjectId ref), not `category` string
3. **Dual status fields** — `status` (workflow: Draft/Pending_Manager/...) AND `approvalStatus`/`accountantStatus`/`financeStatus` (per-role: Pending/Approved/Rejected). Both must be checked independently.
4. **Draft-only ops** — only `Draft` records can be submitted, edited, or deleted.
5. **Reject stage guards** — manager rejects `Pending_Manager` only, etc.
6. **Eligibility** — 50% threshold. Crossing it triggers re-evaluation of all NOT_ELIGIBLE records in period.
7. **Wallet uses atomic `$inc`** — prevents race conditions.
8. **Tax/VAT rate checks** — use `!== undefined && !== null` because `0` is valid but falsy
9. **Ownership required** — ops check `employeeId`; managers approve only their `managerId` team
10. **ObjectId serialization** — use `lib/utils/serialization.ts` (`serializeId`, `serializeDocument`, `serializeForClient`)
11. **Server action returns** — may return `data`, `{ error }`, or `undefined`. Always optional chaining, `Array.isArray()` before mapping.
12. **Zod v4** (`^4.4.2`) — not v3. Different `.refine()` chaining and error shape.
13. **`lib/utils.ts` ≠ `lib/utils/`** — `lib/utils.ts` is `cn()` (tailwind-merge + clsx). `lib/utils/` has `money.ts`, `password.ts`, `serialization.ts`, `export.ts`, `type-guards.ts`.
14. **Stale `.next/` cache** — if typecheck fails on `.next/dev/types/`, delete `.next/` and rebuild
15. **Middleware is Edge** — only import `auth.config.ts`, never `auth.ts`
16. **`force-dynamic` pages** — `/finance/analytics`, `/sales-dashboard/commissions`, `/admin/wallets` need `export const dynamic = "force-dynamic"` or SSR crashes. Add to new client pages if build fails.
17. **`getCommissions()` return shape** — returns `companyName`, `achievementPercent`, `netAmount`, `grossAmount` alongside commission fields. `app/finance/commissions/` and `app/sales-manager/commissions/` depend on these.
18. **`calculateProductTotal` everywhere** — `app/sales-dashboard/targets/page.tsx` computes totals from `products` array. No `r.totalAmount` exists anywhere. Same pattern for all multi-product aggregation.
19. **Signout must use `signOut()` from `next-auth/react`** — client components call `signOut({ callbackUrl: "/login" })`; never use custom `fetch("/api/auth/signout")` + redirect (race condition, cookies not cleared). Server actions use `logoutAction()` from `lib/actions/auth.actions.ts`.
20. **Rate limiter on `[...nextauth]` blocks signout POSTs** — `app/api/auth/[...nextauth]/route.ts` must skip rate limiting for signout requests (`url.pathname.endsWith("/signout")`), otherwise 429 prevents cookie clearing and user stays logged in.
21. **SessionRecheck: no `session` in useEffect deps** — `components/session-recheck.tsx` uses `useRef` for `session`/`update`, effect depends only on `interval` (constant). Putting `session` in the deps array causes an infinite loop: `update()` → `GET /api/auth/session` → JWT re-issued → session changes → effect re-runs → `update()` again.
22. **jwt callback: only DB recheck on `trigger === "update"`** — `lib/auth/auth.ts` must check only `trigger === "update"`, NOT `(!user && token.id)`. The broader condition matches EVERY `GET /api/auth/session` request (not just explicit `update()` calls), causing JWT re-issuance on every session poll. This was the root cause of the signout race condition (see Signout Bug below).

## Testing

**Vitest** (`npm test`): jsdom, 10s timeout. Coverage via v8.
- Requires local MongoDB running
- `tests/setup.ts` auto-creates commission rules, mocks NextAuth + email
- Server actions (`"use server"`) can't be imported directly — use `tests/helpers/test-actions.ts` or test via API routes
- ObjectIds must be exactly 24 hex chars

**CI**: `.github/workflows/audit.yml` runs typecheck, lint, test, build as parallel jobs on push to master/main.

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` | Sales CRUD, submit, delete, ownership, auto-approve |
| `lib/actions/approval.actions.ts` | Multi-stage approve/reject + auto-approval |
| `lib/actions/wallet.actions.ts` | Atomic credit/debit with session fallback |
| `lib/actions/commission.actions.ts` | Commission calculation, eligibility |
| `lib/actions/notification.actions.ts` | 14 notification types, SSE integration |
| `lib/utils/money.ts` | Cents-based monetary math |
| `lib/utils/serialization.ts` | ObjectId → string helpers |
| `lib/mongodb.ts` | DB singleton, `toObjectId()` |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()` |
| `lib/validations/*.ts` | Zod v4 schemas (14 files) |
| `middleware.ts` | RBAC + CORS (Edge, uses `authConfig`) |
| `lib/api-error.ts` | `ApiError` class + `handleError()` |

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

Additional executives: nasrin, rahim, sabina, mizanur, anika@incentive.io — all `Executive123!`.

## Production

- URL: `https://incentiveio.vercel.app`
- Deploy: `vercel --prod` (project linked via `.vercel/repo.json`)
- Vercel project ID: `prj_GVhPGHTt5LSrEskBMUEgyAqAIeUJ`
- `vercel.json` forces webpack build
- Production MongoDB Atlas uses `retryWrites=true` (unlike local `retryWrites=false`)
