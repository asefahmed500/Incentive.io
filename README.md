# Incentive.io — Sales Commission Management System

A production-ready multi-role sales commission management platform with full approval workflows, real-time notifications, commission tracking, and wallet management.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Server Actions
- **Database:** MongoDB with Mongoose 9
- **Auth:** NextAuth v5 (JWT strategy)
- **Validation:** Zod v4 (all server actions)
- **Notifications:** Email (nodemailer) + in-app polling

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

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| iomadmin@iomltd.com | IOMadmin123! | admin |
| jamal.hassan@iomltd.com | Jamal123! | sales executive |
| iomadministrator@iomltd.com | IOMadministratort123! | administrator (super admin) |
| iommanager@iomltd.com | iom123@!A | sales manager |
| iomaccountant@iomltd.com | IOMaccount123! | accountant |
| iomfinance@iomltd.com | IOMfinance123! | finance |

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

## Documentation

See [AGENTS.md](./AGENTS.md) for developer-specific guidance.