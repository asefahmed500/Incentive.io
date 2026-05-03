# incentiveio

Sales Commission Management System — Next.js 16 app router, MongoDB/Mongoose, NextAuth v5.

## Commands

| Task | Command |
|------|---------|
| Dev | `npm run dev` |
| Build | `npm run build:webpack` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` |

**CRITICAL:** Use `npm run build:webpack` — Mongoose is a native Node module and fails with Turbopack.

## Setup

1. Copy `.env.example` → `.env.local`
2. MongoDB must be running locally on `mongodb://localhost:27017/incentiveio`
3. `npm run dev` — falls back to port 3003+ if 3000 is busy

## Architecture

### Role-based route structure
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
Rejection at any stage returns to `Draft` with a reason.

## Critical Gotchas

1. **Build command** — `npm run build:webpack` (NOT `next build`). Webpack is required for Mongoose native bindings.
2. **Model exports** — All models use named exports (`export const User = ...`) EXCEPT `CommissionRule` which uses `export default`. Import accordingly.
3. **Never use default imports on models** — `import { User }` not `import User from`.
4. **Auth pattern** — `export const { handlers, auth } = NextAuth(config)` in `lib/auth/auth.ts`; route handler uses `export const GET = handlers.GET; export const POST = handlers.POST;`.
5. **Role names** — DB uses camelCase: `salesManager`, `salesExecutive` (NOT underscores).
6. **Middleware allows through on DB failure** — `checkDatabaseConnection` errors are caught and logged; requests proceed even if DB is down.
7. **Notifications use polling** — 30-second polling via `notification-bell.tsx`. Socket.IO packages are installed but not used.
8. **File uploads** — max 10MB, JPG/PNG/PDF only, stored at `public/uploads/sales-records/`.
9. **Email failures never block** — all `sendEmail` calls are wrapped in try/catch with console.error only.
10. **Commission calculation** — Uses cumulative approved sales per employee, not just the current sale amount.
11. **Wallet credits on finance approval** — `finalApproveByFinance` auto-credits the employee's wallet and calls `checkEligibility`.
12. **Approval actions have guards** — `processByAccountant` checks `approvalStatus === "Approved"`; `finalApproveByFinance` checks `paymentStatus !== "Paid"` before processing.

## Setup

1. Copy `.env.example` → `.env.local`
2. MongoDB must be running locally on `mongodb://localhost:27017/incentiveio`
3. `npm run dev`

## Key Directories

```
app/api/              # Route handlers
app/{role}/           # Role-specific dashboards and pages
lib/actions/          # Server actions (data layer)
lib/models/           # 8 Mongoose models
lib/auth/auth.ts      # NextAuth v5 config
lib/email.ts          # Nodemailer (ESM)
lib/mongodb.ts       # Mongoose connection
lib/utils/export.ts  # CSV export utility
stores/auth.store.ts  # Zustand client-side auth mirror
```

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| iomadmin@iomltd.com | IOMadmin123! | admin |
| jamal.hassan@iomltd.com | Jamal123! | salesExecutive |
| iomadministrator@iomltd.com | IOMadministratort123! | administrator |
| iommanager@iomltd.com | iom123@!A | salesManager |
| iomaccountant@iomltd.com | IOMaccount123! | accountant |
| iomfinance@iomltd.com | IOMfinance123! | finance |

## Server Actions (data layer)

| File | Key functions |
|------|--------------|
| `lib/actions/user.actions.ts` | createUser, getUsers, updateUser, deleteUser, resetPassword, toggleUserStatus |
| `lib/actions/sales.actions.ts` | createSalesRecord, submitSalesRecord, getSalesRecords, getSalesRecord, getSalesStats |
| `lib/actions/approval.actions.ts` | approveSale, rejectSale, processByAccountant, finalApproveByFinance |
| `lib/actions/commission.actions.ts` | getCommissions, getCommissionsByEmployee, checkEligibility, create/update/deleteCommissionRule |
| `lib/actions/notification.actions.ts` | createNotification, getNotifications, notifySaleSubmitted, notifyManagerApproved, notifyFinanceApproved, notifyCommissionEligible |
| `lib/actions/wallet.actions.ts` | getWallet, getOrCreateWallet, creditWallet, markCommissionPaid, getAllWallets, getWalletTransactions |
| `lib/actions/category.actions.ts` | getCategories, createCategory, updateCategory, deleteCategory |
| `lib/actions/product.actions.ts` | getProducts, createProduct, updateProduct, deleteProduct |
| `lib/actions/team.actions.ts` | getTeams, createTeam, updateTeam, deleteTeam |
| `lib/actions/target.actions.ts` | getTargets, assignTarget, removeTarget |

## Models (8 total)

`User`, `SalesRecord`, `Team`, `Category`, `Product`, `CommissionRule`, `Wallet`, `AuditLog` — all in `lib/models/`.

CommissionRule and AuditLog use `export default`; all others use named exports.

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/health` | GET | DB health check |
| `/api/upload` | POST, DELETE | File upload/delete |
| `/api/users` | GET, POST | User management |
| `/api/categories` | GET, POST | Product categories |
| `/api/products` | GET, POST | Products |
| `/api/teams` | GET, POST | Teams |
| `/api/commission-rules` | GET, POST | Commission rules |
| `/api/sales-records` | GET, POST, PATCH | Sales records |
| `/api/sales-records/[id]` | GET, PUT, DELETE | Individual record |
| `/api/approvals/manager` | POST | Manager approve/reject |
| `/api/approvals/accountant` | POST | Accountant process |
| `/api/approvals/finance` | POST | Finance final approve |
| `/api/commissions` | GET | Commissions |
| `/api/notifications` | GET, PATCH | Notifications |
| `/api/backups` | GET, POST, DELETE | Backup list/create/delete |
| `/api/backups/restore` | GET, POST | Backup restore |
| `/api/sync` | GET, POST | Database sync (commissions/targets/teams/wallets/eligibility/all) |
| `/api/settings` | GET, PUT, POST | System settings |
| `/api/audit-logs` | GET, POST | Audit logs |

## Email Notifications

All sent via `lib/email.ts` (ESM, nodemailer). Failures are caught and logged, never block workflows.

| Event | Trigger | Recipient |
|-------|---------|-----------|
| SALE_SUBMITTED | Executive submits | Manager |
| MANAGER_APPROVED | Manager approves | Executive |
| MANAGER_REJECTED | Manager rejects | Executive |
| ACCOUNTANT_PROCESSED | Accountant processes | Finance team |
| FINANCE_APPROVED | Finance approves | Executive + Manager |
| COMMISSION_ELIGIBLE | Achievement crosses 50% | Executive |
| USER_CREATED | Admin creates user | New user |
| PASSWORD_RESET | Admin resets password | User |

## Config

- TypeScript: strict mode, `moduleResolution: "bundler"`, `@/*` path alias
- Tailwind CSS 4 with `@tailwindcss/postcss`
- Prettier with `prettier-plugin-tailwindcss`
- ESLint via `eslint-config-next`
