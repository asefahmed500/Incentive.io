# Incentive.io — Sales Commission Management System

A production-ready multi-role sales commission management platform with full approval workflows, real-time notifications, commission tracking, and wallet management.

## Tech Stack

- **Frontend:** Next.js 16.2.6 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions with MongoDB transactions
- **Database:** MongoDB with Mongoose 9, compound indexes for performance
- **Auth:** NextAuth v5 (JWT with jose verification), 24h maxAge
- **Validation:** Zod v4 (all server actions)
- **Notifications:** Sonner toast + in-app polling
- **Monitoring:** Custom metric logging with AuditLog trail

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB running at `mongodb://localhost:27017/incentiveio`

### Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it falls back to port 3003+ if 3000 is busy.

### Production Build

```bash
npm run build:webpack
```

**Important:** Always use `npm run build:webpack` — Mongoose native bindings fail with Turbopack.

## App Name

The application is named **Incentive.io** (not "incentiveio" or "IncentiveIO").

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| jamal@incentive.io | Jamal123! | sales executive |
| superadmin@incentive.io | Superadmin123! | administrator (super admin) |
| manager@incentive.io | Manager123! | sales manager |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |

## Role-Based Access

| Route | Role |
|------|------|
| `/admin/*` | Admin |
| `/administrator/*` | Super Admin (full access) |
| `/sales-dashboard/*` | Sales Executive |
| `/sales-manager/*` | Sales Manager |
| `/accountant/*` | Accountant |
| `/finance/*` | Finance |

## Approval Workflow

```
Draft → Pending Manager → Pending Accountant → Pending Finance → Approved
```

Each stage is handled by a specific role. Rejection returns the record to `Draft` with a reason.

## Commands

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Production build | `npm run build:webpack` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Audit | `npm run audit` |
| Format | `npm run format` |

## Project Structure

```
app/
  admin/             # Admin dashboard pages
  administrator/     # Super admin pages
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
  notification-bell  # Notification polling
  session-recheck    # 60s session revalidation
```

## Key Features

- **Multi-role dashboards** with role-specific views and permissions
- **Sales record management** with multi-product support (up to 20 products)
- **Commission calculation** based on cumulative approved sales vs. targets
- **Wallet system** with transaction history
- **Audit logging** on all state changes
- **Email notifications** for all workflow events
- **Database backups** with restore capability

## Testing

| Test Suite | Location | Purpose |
|------------|----------|---------|
| Integration | `tests/integration/workflow.test.ts` | Complete approval workflow, wallet atomicity, role-based access |
| E2E | `tests/e2e/role-workflows.spec.ts` | End-to-end workflows for all 6 roles |
| Performance | `tests/performance/load-test.ts` | Wallet concurrency, dashboard load times, database indexes |
| Security | `tests/security/auth-security.test.ts` | JWT tampering, role escalation, injection prevention |

Run tests with `npm test`.

## Documentation

See [AGENTS.md](./AGENTS.md) for developer-specific guidance.
## Recent Improvements

### Security (Phase 1 - Complete)
- JWT token verification with jose library - prevents token tampering attacks
- Atomic wallet transactions with MongoDB sessions - prevents race conditions
- Proper status field synchronization - fixes rejection/resubmission workflow
- Updated Next.js to 16.2.6 - fixes DoS vulnerability

### Performance (Phase 4 - Complete)
- MongoDB aggregation pipeline for commission calculations - fixes N+1 queries
- Compound database indexes on SalesRecord, Wallet, User models
- Target change detection with automatic eligibility recalculation

### Type Safety (Phase 2 - Complete)
- Comprehensive TypeScript definitions in `types/index.ts`
- Custom error classes in `types/errors.ts`
- Replaced all `as any` usages with proper types

### Developer Experience (Phase 3 - Complete)
- Unified notification hook using sonner toast
- Loading skeleton components
- Error boundary components
- Pre-deployment GitHub Actions workflow
- Monitoring and metrics logging system

### Monitoring & Deployment (Phase 6 - Complete)
- Pre-deployment checks with GitHub Actions
- Metric logging for key operations
- Audit trail for all state changes
