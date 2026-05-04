# Incentive.io — Agent Guide

Sales Commission Management System — Next.js 16 app router, MongoDB/Mongoose, NextAuth v5, Tailwind CSS 4.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` (turbopack) |
| Build | `npm run build:webpack` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Audit | `npm run audit` (typecheck + lint + test) |

- **Build MUST use `npm run build:webpack`**, not `next build` — Mongoose native bindings fail with Turbopack bundler.
- **No tests are configured** — `npm test` just echoes that fact. CI build step is also `continue-on-error`.

## Setup

1. `cp .env.example .env.local`
2. MongoDB at `mongodb://localhost:27017/incentiveio`
3. `NEXTAUTH_SECRET` must be ≥32 chars (validated by Zod at startup in `lib/env.ts`)
4. `npm run dev` — port falls back to 3003+ if 3000 is busy

## Critical Gotchas

1. **Build** — Must use `npm run build:webpack`, not `next build`. Mongoose native bindings fail with Turbopack.
2. **Model exports** — All models use named exports (`export const User = …`) EXCEPT `CommissionRule` (`export default`). Import it accordingly.
3. **Model pattern** — All models use `mongoose.models.X || mongoose.model<X>(…)` to avoid recompilation in dev. Never `mongoose.model()` without the `||` guard.
4. **Role names** — DB uses camelCase: `salesManager`, `salesExecutive`, `accountant`, `finance`, `admin`, `administrator`. Not snake_case. Not titlecase.
5. **No `saleAmount` field** — Always compute with `products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)`.
6. **Category field** — Schema uses `categoryId` (ObjectId ref), not `category` (string). Zod schema in `sales.actions.ts` also uses `categoryId`.
7. **Dual approval status** — `status` is the workflow stage (`Draft`→`Pending_Manager`→`Pending_Accountant`→`Pending_Finance`→`Approved`). Separate per-role flags: `approvalStatus`/`accountantStatus`/`financeStatus` (`Pending`/`Approved`/`Rejected`).
8. **Only `Draft` can be submitted or deleted** — Server guards enforce this. Don't bypass.
9. **Rejection** → `Draft` with `rejectionReason`. `rejectedBy` accepts `"manager"`, `"accountant"`, or `"finance"`. `rejectedBy` is now stored in the schema.
10. **Wallet auto-credit** — `finalApproveByFinance` auto-credits wallet via atomic `$inc` and calls `checkEligibility`. Don't duplicate.
11. **Accountant guard** — `processByAccountant` requires `approvalStatus === "Approved"`. Finance guard checks `paymentStatus !== "Paid"` using atomic `updateOne`.
12. **Commission recalculated on net sales** — After accountant sets deductions, commission is recalculated on net (not gross). Eligibility also uses net sales.
13. **Eligibility is boolean** — Filter by `isEligible` (boolean from User model), NOT by `status` string. `getCommissions()` returns `isEligible` per record.
14. **Soft delete everywhere** — All models have `deletedAt` + `pre("find")`/`pre("findOne")` hooks. All delete actions use soft delete, never `findByIdAndDelete`.
15. **Middleware redirects on errors** — JWT decode errors redirect to `/login`. No more fallthrough to `NextResponse.next()`.
16. **Session recheck blocks users** — JWT callback re-queries DB on refresh; `session-recheck.tsx` force-logs-out if `isActive === false`.
17. **bcryptjs** — `import bcrypt from "bcryptjs"` (ESM), not `require`.
18. **App name** — "Incentive.io" with the dot.
19. **Notifications** — Polling-based (30s), NOT real-time. Socket.IO is in dependencies but not wired.
20. **Email failures** — All sends wrapped in try/catch; never block workflows. Email URLs use `NEXTAUTH_URL` env var.
21. **Product image** — Schema has `image?: string` field. Upload action supports it.
22. **Zod v4** — Import from `"zod"` as usual but it's v4 API, not v3.
23. **Server actions require auth** — All server actions in `lib/actions/` now check `auth()` and role permissions. Functions return `{ error: "Unauthorized" }` or `{ error: "Forbidden" }` if auth fails.
24. **updateSalesRecord strict schema** — Only allows `companyName`, `companyEmail`, `products`, `taxEnabled`, `vatEnabled`, `date`. Workflow fields cannot be set directly.
25. **rejectSale status guards** — Can only reject records at the correct stage: manager rejects `Pending_Manager`, accountant rejects `Pending_Accountant`, finance rejects `Pending_Finance`.
26. **Resubmit resets all fields** — `submitSalesRecord` resets `accountantStatus`, `financeStatus`, `netSales`, tax/VAT fields, `commission`, `rejectionReason`, `rejectedBy`.
27. **Ownership checks** — Sales records can only be edited/submitted/deleted by their owner (`employeeId`). Managers can only approve records where they are the assigned `managerId`.
28. **changePassword** — Derives `userId` from session, not from client request body.
29. **Notification IDOR** — Notifications are verified against session user ID; admin/administrator can access all.
30. **Wallet atomic updates** — Uses `$inc` instead of read-then-write to prevent race conditions.
31. **Tax/VAT rate of 0** — Always use `!== undefined && !== null` checks, not truthy checks, since `0` is falsy.
32. **Net sales validation** — Accountant processing rejects if net sales < 0.
33. **Eligibility uses cumulative sales** — Per-record achievement is NOT used; cumulative approved sales divided by target.

## Approval Workflow

```
Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved
          (Manager)          (Accountant)          (Finance)
```
- Rejection at any stage → `Draft` with `rejectionReason`.
- Manager approval calculates commission on gross; accountant processing recalculates on net.

## Auth & RBAC

- NextAuth v5 JWT strategy, 24h maxAge
- `export const { handlers, auth } = NextAuth(config)` in `lib/auth/auth.ts`
- Route handler: `app/api/auth/[...nextauth]/route.ts` re-exports `handlers.GET/POST`
- All layouts call `signOut({ callbackUrl: "/login" })`

| Path | Role |
|------|------|
| `/admin/*` | admin |
| `/administrator/*` | administrator (super admin — also accesses `/admin`, `/sales-*`, `/accountant`, `/finance`) |
| `/sales-dashboard/*` | salesExecutive |
| `/sales-manager/*` | salesManager (also accesses `/sales-dashboard`) |
| `/accountant/*` | accountant (also accesses `/sales-dashboard`) |
| `/finance/*` | finance (also accesses `/sales-dashboard`) |

## Data Layer

- **Server actions** in `lib/actions/` — `"use server"` at top, Zod validation, returns `{ success, data?, error? }`
- **Mongoose models** in `lib/models/` — `deletedAt` hooks auto-filter deleted records
- **DB singleton** in `lib/mongodb.ts` — caches on `global.mongoose`

## Code Style

- Prettier: no semicolons, double quotes, trailing comma es5, printWidth 80, tabWidth 2
- Tailwind plugin sorts classes (`prettier-plugin-tailwindcss`)
- Server actions: `"use server"` at top, Zod validation, returns `{ success, data?, error? }`
- Currency: `amount?.toLocaleString() ?? "0"`
- Icons: Lucide React only
- `@/*` maps to `./*` via tsconfig (no `src/` dir)

## ESLint

- `no-explicit-any`: warn (not error) — ~350 warnings exist and are acceptable
- `set-state-in-effect`: off — intentional pattern with `useTransition`
- Unused args prefixed with `_` are allowed

## next.config.mjs

Mongoose is `commonjs` external for server build; client has `fs`, `net`, `tls` etc. fallbacks set to `false`.

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| jamal@incentive.io | Jamal123! | salesExecutive |
| superadmin@incentive.io | Superadmin123! | administrator |
| manager@incentive.io | Manager123! | salesManager |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |