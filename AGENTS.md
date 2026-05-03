# Incentive.io — Agent Guide

Sales Commission Management System — Next.js 16 app router, MongoDB/Mongoose, NextAuth v5, Tailwind CSS 4.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` |
| Build (required) | `npm run build:webpack` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Audit | `npm run audit` (typecheck + lint + test) |
| Format | `npm run format` |

**CRITICAL:** Always use `npm run build:webpack` — Mongoose native bindings fail with Turbopack.

## Setup

1. `cp .env.example .env.local`
2. MongoDB must run at `mongodb://localhost:27017/incentiveio`
3. `npm run dev` — falls back to port 3003+ if 3000 is busy

## Critical Gotchas

1. **Build** — `npm run build:webpack` NOT `next build`
2. **Model exports** — All models use named exports (`export const User = ...`) EXCEPT `CommissionRule` (`export default`)
3. **Auth pattern** — `export const { handlers, auth } = NextAuth(config)` in `lib/auth/auth.ts`; route handler: `export const GET = handlers.GET; export const POST = handlers.POST;`
4. **Role names** — DB uses camelCase: `salesManager`, `salesExecutive` (NOT underscores/snake_case)
5. **Notifications** — 30s polling via `notification-bell.tsx`; Socket.IO packages installed but NOT used
6. **Email failures** — wrapped in try/catch, never block workflows
7. **Commission calculation** — cumulative approved sales per employee (not just current sale)
8. **Wallet auto-credit** — `finalApproveByFinance` auto-credits wallet + calls `checkEligibility`
9. **Approval guards** — `processByAccountant` checks `approvalStatus === "Approved"`; `finalApproveByFinance` checks `paymentStatus !== "Paid"`
10. **Middleware allows through on DB failure** — caught and logged, requests proceed
11. **App name** — Always "Incentive.io" (not "incentiveio" or "IncentiveIO")

## Architecture

### Role-based routes
| Path | Role |
|------|------|
| `/admin/*` | admin |
| `/administrator/*` | administrator (super admin) |
| `/sales-dashboard/*` | salesExecutive |
| `/sales-manager/*` | salesManager |
| `/accountant/*` | accountant |
| `/finance/*` | finance |

### Approval workflow
```
Draft → Pending_Manager → Pending_Accountant → Pending_Finance → Approved
         (Manager)          (Accountant)          (Finance)
```
Rejection → `Draft` with `rejectionReason`.

## Data Layer (server actions)

All in `lib/actions/` — every action has Zod validation via `parsed.error.issues[0].message`.

| File | Key functions |
|------|--------------|
| `user.actions.ts` | createUser, getUsers, updateUser, deleteUser, resetPassword, toggleUserStatus, getManagerForUser |
| `sales.actions.ts` | createSalesRecord, submitSalesRecord, getSalesRecords, getSalesRecord, getSalesStats |
| `approval.actions.ts` | approveSale, rejectSale, processByAccountant, finalApproveByFinance, getPending* |
| `commission.actions.ts` | getCommissions, getCommissionsByEmployee, checkEligibility, create/update/deleteCommissionRule |
| `notification.actions.ts` | createNotification, notifySaleSubmitted, notifyManagerApproved, notifyFinanceApproved, notifyCommissionEligible, notifyUserCreated |
| `wallet.actions.ts` | getWallet, getOrCreateWallet, creditWallet, markCommissionPaid, getAllWallets, getWalletTransactions |
| `audit.actions.ts` | logAudit, getAuditLogs |
| `target.actions.ts` | getTargets, assignTarget, removeTarget |

## Models (9 total)

All in `lib/models/`. `User`, `SalesRecord`, `Team`, `Category`, `Product`, `Wallet`, `AuditLog` use named exports; `CommissionRule` uses `export default`.

All models have:
- `deletedAt` soft delete field + pre-find hooks (auto-filters deleted records)
- Database indexes on frequently queried fields

## Env Validation

`lib/env.ts` — Zod v4 schema validates all env vars on startup. Copy `.env.example` exactly; NEXTAUTH_SECRET must be ≥32 chars.

## Auth & RBAC

- NextAuth v5 JWT strategy, 60s session recheck via `session-recheck.tsx`
- Middleware in `middleware.ts` validates role from JWT payload cookie
- SuperAdmin (administrator) can access all role routes

## Audit Logging

`logAudit()` in `lib/actions/audit.actions.ts` records all state changes. Audit log entries include: userId, userEmail, userRole, action, entity, entityId, details, ipAddress, userAgent, createdAt.

## Key Files

- `middleware.ts` — route guards for all 6 roles
- `lib/mongodb.ts` — connection singleton with cache
- `lib/email.ts` — nodemailer (ESM), all failures caught
- `lib/env.ts` — env validation with Zod
- `.github/workflows/audit.yml` — CI (typecheck + lint + test + build on every push)
- `stores/auth.store.ts` — Zustand client-side auth mirror
- `TODO_FEATURES.md` — step-by-step feature verification checklist

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| jamal@incentive.io | Jamal123! | salesExecutive |
| superadmin@incentive.io | Superadmin123! | administrator |
| manager@incentive.io | Manager123! | salesManager |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |

## Tech Stack

- Next.js 16 (App Router), TypeScript 5.9 strict
- MongoDB/Mongoose 9, NextAuth v5 beta
- Tailwind CSS 4, shadcn/ui, Radix UI, Lucide icons
- Zustand (client auth), Sonner (toasts), Zod v4 (validation)
- bcryptjs, nodemailer, Socket.IO (installed but unused)

## File Upload

- Max 10MB per file, JPG/PNG/PDF only
- Stored at `public/uploads/sales-records/`