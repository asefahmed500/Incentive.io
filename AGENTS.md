# Incentive.io — Agent Guide

Next.js 16 app router, MongoDB/Mongoose, NextAuth v5, Tailwind CSS 4.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` |
| Build | `npm run build:webpack` |
| Typecheck | `npm run typecheck` |
| Seed | `npm run seed` |

**Must use `npm run build:webpack`** — Mongoose native bindings fail with Turbopack.

## Setup

1. `cp .env.example .env.local`
2. MongoDB at `mongodb://localhost:27017/incentiveio`
3. `NEXTAUTH_SECRET` ≥32 chars
4. Run `npm run seed` for demo data (13 users, teams, products, sales records)

## Critical Gotchas

| # | Gotcha | Why it matters |
|---|-------|---------------|
| 1 | Use `products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0)` | No `saleAmount` field exists |
| 2 | Schema uses `categoryId`, not `category` | ObjectId ref to Category |
| 3 | `status` = workflow stage; `approvalStatus`/`accountantStatus`/`financeStatus` = per-role flags | Both exist in schema |
| 4 | Only `Draft` records can be submitted/deleted | Server guards enforce this |
| 5 | `rejectedBy` field = `"manager"` \| `"accountant"` \| `"finance"` | Stored in schema since 2025 |
| 6 | Commission recalculated on **net** (not gross) after accountant processing | Net = gross - tax - VAT - EO/BP |
| 7 | Eligibility is **boolean** on User model (`isEligible`), not string status | `getCommissions()` returns `isEligible` |
| 8 | All deletes use soft delete (`deletedAt` + hooks) | Never use `findByIdAndDelete` |
| 9 | Server actions return `{ error: "Unauthorized" }` on auth failure | All actions check `auth()` now |
| 10 | `updateSalesRecord` allows ONLY: `companyName`, `companyEmail`, `products`, `taxEnabled`, `vatEnabled`, `date` | Strict schema |
| 11 | rejectSale has stage guards: manager→`Pending_Manager` only, accountant→`Pending_Accountant` only | Can't reject wrong stage |
| 12 | Resubmit resets ALL workflow fields | accountantStatus, financeStatus, netSales, tax, commission, rejectionReason, rejectedBy |
| 13 | Ownership required for sales record operations | Must own `employeeId`; managers can only approve their `managerId` |
| 14 | `changePassword` derives userId from session | Never trust client input for userId |
| 15 | Wallet uses atomic `$inc` | Prevents race conditions from read-then-write |
| 16 | Tax/VAT rate checks use `!== undefined && !== null` | `0` is falsy, breaks truthy checks |
| 17 | Net sales < 0 rejected | Accountant processing validates this |
| 18 | Eligibility uses **cumulative** sales, not per-record | 50% threshold = (totalApproved / target) × 100 |
| 19 | Role names: `salesManager`, `salesExecutive`, `accountant`, `finance`, `admin`, `administrator` | camelCase, not snake_case |

## Approval Workflow

```
Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved
   (Manager)       (Accountant)        (Finance)
```

Rejection → `Draft` + `rejectionReason` + `rejectedBy`

## Auth & RBAC

- NextAuth v5 JWT, 24h maxAge
- `export const { handlers, auth } = NextAuth(config)` in `lib/auth/auth.ts`

| Path | Role |
|------|------|
| `/admin/*` | admin |
| `/administrator/*` | administrator (super — accesses all) |
| `/sales-dashboard/*` | salesExecutive |
| `/sales-manager/*` | salesManager (+ sales-dashboard) |
| `/accountant/*` | accountant (+ sales-dashboard) |
| `/finance/*` | finance (+ sales-dashboard) |

## Data Layer

- **Server actions**: `lib/actions/*.ts` — `"use server"`, Zod validation, returns `{ success, data?, error? }`
- **Models**: `lib/models/*.ts` — soft delete hooks auto-filter `deletedAt: null`
- **DB singleton**: `lib/mongodb.ts`

## Key Files

| File | Purpose |
|------|---------|
| `lib/actions/sales.actions.ts` |CRUD, submit, delete with ownership checks |
| `lib/actions/approval.actions.ts` | Approve/reject/process by role with status guards |
| `lib/actions/wallet.actions.ts` | Atomic `$inc` credit/debit operations |
| `scripts/seed.ts` | Demo data: users, teams, products, sales, commission rules |
| `middleware.ts` | Role-based route protection |
| `lib/auth/role-guard.ts` | `requireAuth()`, `requireRole()` helpers |

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| superadmin@incentive.io | Superadmin123! | administrator |
| jamal@incentive.io | Jamal123! | salesExecutive |
| manager@incentive.io | Manager123! | salesManager |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |

## Code Style

- Prettier: no semicolons, double quotes, trailing comma es5
- `@/*` maps to `./*` (no `src/` prefix needed)
- Icon components: Lucide React only
- Currency: `(amount || 0).toLocaleString()`