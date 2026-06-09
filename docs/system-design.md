# Incentive.io — System Design Document

Sales Commission Management System  
**Stack:** Next.js 16 (App Router), MongoDB/Mongoose 9, NextAuth v5, Tailwind CSS 4, shadcn/ui, Zod v4, Socket.IO

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Database Schema](#3-database-schema)
4. [API Layer](#4-api-layer)
5. [Approval Workflow](#5-approval-workflow)
6. [Commission & Eligibility](#6-commission--eligibility)
7. [Wallet & Payments](#7-wallet--payments)
8. [Notifications & Real-Time Events](#8-notifications--real-time-events)
9. [UI Architecture](#9-ui-architecture)
10. [Role-Based Access Control](#10-role-based-access-control)
11. [Calculations & Formulas](#11-calculations--formulas)
12. [Error Handling](#12-error-handling)
13. [Security](#13-security)
14. [Deployment](#14-deployment)

---

## 1. Architecture Overview

### Directory Structure

```
incentiveio/
├── app/                      # Next.js 16 App Router
│   ├── api/                  # 32 REST API endpoints
│   │   ├── auth/[...nextauth]/  # NextAuth v5 handler
│   │   ├── approvals/        # Manager, Accountant, Finance approval
│   │   ├── events/           # SSE real-time stream
│   │   ├── upload/           # File upload (proof of sale)
│   │   └── files/[id]/       # File serving
│   ├── (auth)/               # login, register, reset-password
│   ├── admin/                # Admin dashboard (14 pages)
│   ├── sales-dashboard/      # Executive portal (10 pages)
│   ├── sales-manager/        # Manager portal (9 pages)
│   ├── accountant/           # Accountant portal (8 pages)
│   ├── finance/              # Finance portal (10 pages)
│   ├── administrator/        # SuperAdmin portal (8 pages)
│   ├── layout.tsx            # Root layout (providers)
│   └── page.tsx              # Landing page
├── lib/
│   ├── actions/              # 13 server action files
│   ├── auth/                 # NextAuth config (split Edge/Server)
│   ├── models/               # 12 Mongoose models
│   ├── validations/          # 14 Zod v4 schemas
│   └── utils/                # money, serialization, password, export
├── components/
│   ├── ui/                   # 24 shadcn/ui primitives
│   └── *.tsx                 # Shared components (notification, SSE, theme)
├── hooks/                    # useSSE, useNotifications, useMobile
├── stores/                   # Jotai auth atom
├── types/                    # TypeScript type definitions
├── tests/                    # Unit, integration, E2E, security tests
├── scripts/                  # 45 E2E/seed/debug scripts
├── docs/                     # bugs.md, system-design.md
├── middleware.ts             # Edge Runtime RBAC + CORS
├── .env.example              # Environment template
└── package.json              # Dependencies (961 packages)
```

### Data Flow

```
Browser → Next.js Middleware (Edge, RBAC)
    ↓
Page/Component → fetch() or server action
    ↓
API Route → requireAuth() / requireRole()
    ↓
Server Action → Zod Validation → Mongoose → MongoDB
    ↓              ↓                  ↓
    SSE ←──── Notification/Audit    AuditLog
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Auth split into Edge + Server configs | Mongoose is Edge-incompatible; middleware needs pure config |
| Server actions for business logic | Type-safe, colocated with models, audit logging built-in |
| SSE over WebSocket | Simpler serverless-compatible real-time, no Socket.IO dependency needed |
| Cents-based monetary math | Avoids JS floating-point errors (`0.1 + 0.2 !== 0.3`) |
| Soft delete pattern | All models except AuditLog use `deletedAt` timestamp |
| Zod v4 validation | Runtime type safety for all API inputs |
| Transaction fallback | Local MongoDB has no transactions — code auto-falls back to sequential ops |

---

## 2. Authentication & Authorization

### Edge Runtime Split

```
┌─────────────────────────────────────┐
│ lib/auth/auth.config.ts             │ ← EDGE-COMPATIBLE
│ - CredentialsProvider stub          │
│ - JWT strategy config               │
│ - Cookie settings                   │
│ - jwt↔session callback mapping      │
│ Used by: middleware.ts              │
├─────────────────────────────────────┤
│ lib/auth/auth.ts                    │ ← SERVER-ONLY
│ - Full credentials provider (bcrypt)│
│ - DB recheck on trigger="update"    │
│ - Exports: handlers, auth, signOut  │
│ Used by: server components, actions │
└─────────────────────────────────────┘
```

### JWT Strategy

| Setting | Value |
|---------|-------|
| Strategy | JWT |
| Max Age | 24 hours |
| Update Age | 60 seconds (DB recheck via SessionRecheck) |
| Cookie Name (dev) | `next-auth.session-token` |
| Cookie Name (prod) | `__Secure-next-auth.session-token` |
| Cookie Options | `httpOnly`, `sameSite: lax`, `path: /`, `secure` (prod only) |

### jwt Callback Flow

```
request → jwt callback → (user present?) → set token.id, role, employeeId, isActive
                                     → (trigger === "update"?) → DB recheck isActive
                                                              → return token
```

**Critical:** Only DB recheck on `trigger === "update"` — NOT on every passive session read. This prevents infinite JWT re-issuance loops.

### Session Callback

```
token → session callback → session.user.id, role, employeeId, isActive
```

### Auth Guards (`lib/auth/role-guard.ts`)

| Guard | Allowed Roles | Checks |
|-------|--------------|--------|
| `requireAuth()` | Any authenticated | session exists + `isActive !== false` |
| `requireRole(...roles)` | Specified roles | session exists + role match |
| `requireAdminOrAbove()` | admin, administrator | |
| `requireManagerOrAbove()` | admin, administrator, salesManager | |
| `requireFinanceOrAbove()` | admin, administrator, finance | |
| `requireAccountantOrAbove()` | admin, administrator, accountant, finance | |

### Signout Flow

```
Client: signOut({ callbackUrl: "/login" }) → fetch("POST /api/auth/signout")
    ↓
Route: POST → bypass rate limit → handlers.POST (process signout)
    → build fresh Response with Set-Cookie headers (clear session, csrf, callbackUrl)
    → return { url: "/login" }
    ↓
Browser: processes Set-Cookie → window.location.href = "/login"
```

### Session Polling (SessionRecheck)

- Component: `components/session-recheck.tsx`
- Uses `useRef` for session/update to prevent infinite re-render loops
- Calls `update()` every 60 seconds via `setInterval`
- If `isActive === false`, forces `signOut({ callbackUrl: "/login" })`

---

## 3. Database Schema

### Entity Relationship Diagram

```
User ────→ Team (teamId)
  │───────→ User (managerId, self-ref)
  │───────→ Wallet (employeeId)
  │───────→ SalesRecord (employeeId, managerId, approvedBy, paidBy)
  │───────→ AuditLog (userId)

Team ────→ User (managerId)
       ──→ User[] (members)

Category ─→ Product (categoryId)
        ──→ SalesRecord.products.categoryId
        ──→ CommissionRule.categoryId

SalesRecord ─→ User (employeeId, managerId)
            ─→ Category (products.categoryId, autoApprovedCategories)
            ─→ Wallet (via transactions.salesRecordId)

Wallet ──→ User (employeeId)
       ──→ SalesRecord (transactions.salesRecordId)

CommissionRule ─→ Category (categoryId)

Notification ─→ User (userId as string)

AuditLog ──→ User (userId)

FileAttachment ─→ User (uploadedBy)

Backup, SystemSettings: No relationships
```

### Model Details

#### User

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `name` | String | ✓ | | |
| `email` | String | ✓ | unique, lowercase | |
| `password` | String | ✓ | | bcrypt hashed |
| `role` | String | | "salesExecutive" | Enum: admin, administrator, salesManager, salesExecutive, accountant, finance |
| `employeeId` | String | | | unique sparse |
| `phone` | String | | "" | |
| `isActive` | Boolean | | true | |
| `isEligible` | Boolean | | false | ≥50% achievement |
| `teamId` | ObjectId | | | ref: Team |
| `managerId` | ObjectId | | | ref: User |
| `targetAmount` | Number | | 0 | |
| `targetPeriod` | String | | | |
| `previousTargetAmount` | Number | | | For change detection |
| `resetPasswordToken` | String | | | 1hr expiry |
| `emailVerified` | Boolean | | false | |

**Indexes:** `role`, `managerId`, `teamId`, `isActive`, `isEligible`, compound: `isEligible+targetAmount`, `role+isActive`, `managerId+isActive`

#### SalesRecord

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `employeeId` | String | ✓ | | |
| `employeeName` | String | ✓ | | |
| `companyName` | String | ✓ | | |
| `companyEmail` | String | ✓ | | lowercase |
| `products[]` | Array\<SubDoc\> | ✓ | | Up to 20 |
| `products[].productName` | String | ✓ | | |
| `products[].categoryId` | ObjectId | ✓ | | ref: Category |
| `products[].unitPrice` | Number | ✓ | | |
| `products[].quantity` | Number | | 1 | |
| `products[].originalPrice` | Number | | | |
| `products[].dealNotes` | String | | | |
| `taxEnabled` | Boolean | | false | Executive checkbox |
| `vatEnabled` | Boolean | | false | Executive checkbox |
| `taxRate` | Number | | 0 | Accountant input |
| `taxAmount` | Number | | 0 | |
| `vatRate` | Number | | 0 | |
| `vatAmount` | Number | | 0 | |
| `eoBpAmount` | Number | | 0 | Accountant deduction |
| `eoBpReason` | String | | | |
| `netSales` | Number | | 0 | Gross - Tax - VAT - EO/BP |
| `status` | String | | "Draft" | Draft→Pending_Manager→Pending_Accountant→Pending_Finance→Approved |
| `approvalStatus` | String | | "Pending" | Per-role: Pending/Approved/Rejected |
| `accountantStatus` | String | | "Pending" | |
| `financeStatus` | String | | "Pending" | |
| `commission` | Number | | 0 | |
| `calculatedCommission` | Number | | 0 | |
| `eligibilityStatus` | String | | "Pending" | Eligible/Not_Eligible |
| `autoApproved` | Boolean | | false | All products from auto-approve categories |
| `paidBy` | ObjectId | | | ref: User |
| `isPaid` | Boolean | | false | |
| `paymentStatus` | String | | "Pending" | |

**Indexes:** `employeeId`, `status`, `managerId`, compound: `employeeId+createdAt`, `financeStatus+employeeId`, `approvalStatus+accountantStatus+financeStatus`

#### Wallet

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `employeeId` | ObjectId | ✓ | unique | ref: User |
| `balance` | Number | | 0 | min: 0 |
| `pendingBalance` | Number | | 0 | min: 0 |
| `totalEarned` | Number | | 0 | |
| `totalPaid` | Number | | 0 | |
| `transactions[]` | Array\<SubDoc\> | | [] | |
| `transactions[].type` | String | ✓ | | "credit" / "debit" |
| `transactions[].amount` | Number | ✓ | | |
| `transactions[].salesRecordId` | ObjectId | | | ref: SalesRecord |
| `transactions[].description` | String | ✓ | | |
| `transactions[].balanceAfter` | Number | ✓ | | |

**Operations:** Atomic `$inc` for race-condition-safe balance updates. 5-retry exponential backoff fallback for local MongoDB (no transactions).

#### CommissionRule

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `targetPercentageFrom` | Number | ✓ | Lower bound |
| `targetPercentageTo` | Number | ✓ | Upper bound |
| `commissionRate` | Number | ✓ | 0-100% |
| `categoryId` | ObjectId | | Optional per-category |
| `priority` | Number | 0 | Higher = checked first |
| `isActive` | Boolean | true | |

**Seed data:**
| Range | Rate |
|-------|------|
| 0-80% | 2.0% |
| 81-100% | 3.0% |
| 101-150% | 4.5% |
| 151%+ | 5.0% |

#### Remaining Models

| Model | Key Fields | Special Behavior |
|-------|-----------|------------------|
| **Team** | name (unique), managerId, members[] | Cascade cleanup on delete |
| **Product** | name, sku (unique), categoryId, price, stock | min: 0 price |
| **Category** | name (unique), description, autoApprove | autoApprove: true → bypasses approval |
| **Notification** | userId, recipientRole, type (14 enum), title, message, isRead | |
| **AuditLog** | userId, userEmail, userRole, action, entity, entityId, details | No soft delete (exception) |
| **Backup** | filename, data (Mixed), size | Snapshot of all collections |
| **SystemSettings** | key (unique), value (Mixed), category | Enum: commission/user/system/notification |
| **FileAttachment** | filename, mimeType, size, data (Buffer) | Binary file storage in MongoDB |

### Soft Delete Pattern

All models except AuditLog implement:
```typescript
schema.pre("find", function() { this.where({ deletedAt: null }); });
schema.pre("findOne", function() { this.where({ deletedAt: null }); });
schema.pre("countDocuments", function() { this.where({ deletedAt: null }); });
```

---

## 4. API Layer

### Middleware Flow

```
Request → CORS for /api/* → HTTPS redirect (prod) → Public path? → let through
                                                      ↓ No
                                         req.auth valid? → No → redirect /login
                                                      ↓ Yes
                                         Role-based path check → allowed? → proceed
                                                              ↓ No
                                              redirect to role home
```

**Matcher:** `/((?!api/auth|_next/static|_next/image|favicon.ico).*)`  
**Public paths:** `/`, `/login`, `/register`, `/reset-password`, `/api/auth`, `/api/health`, `/api/register`, `/api/reset-password`

### API Endpoints (32 total)

| Endpoint | Methods | Auth | Purpose |
|----------|---------|------|---------|
| `/api/auth/[...nextauth]` | GET, POST | Public | NextAuth login/logout/session |
| `/api/health` | GET | Public | DB health check |
| `/api/register` | POST | Public | Registration |
| `/api/reset-password/request` | POST | Public | Request reset |
| `/api/reset-password/confirm` | POST | Public | Confirm reset |
| `/api/events` | GET | Auth (inline) | SSE stream |
| `/api/users` | GET, POST | Auth / Admin+ | User CRUD |
| `/api/users/[id]` | GET, PATCH, DELETE | Auth / Admin+ | Single user |
| `/api/sales-records` | GET, POST, PATCH, DELETE | Auth | Sales CRUD |
| `/api/sales-records/[id]` | GET, PUT, DELETE | Auth | Single record |
| `/api/approvals/manager` | POST | Manager+ | Manager approve/reject |
| `/api/approvals/accountant` | POST | Accountant+ | Accountant process |
| `/api/approvals/finance` | POST | Finance+ | Finance final approve |
| `/api/products` | GET, POST | Auth / Admin+ | Product CRUD |
| `/api/products/[id]` | GET, PATCH, DELETE | Auth / Admin+ | Single product |
| `/api/categories` | GET, POST | Auth / Admin+ | Category CRUD |
| `/api/categories/[id]` | GET, PATCH, DELETE | Auth / Admin+ | Single category |
| `/api/teams` | GET, POST | Auth / Admin+ | Team CRUD |
| `/api/teams/[id]` | GET, PATCH, DELETE | Auth / Admin+ | Single team |
| `/api/targets` | GET, POST, DELETE | Auth / Admin+ | Target assignment |
| `/api/commission-rules` | GET, POST | Auth / Admin+ | Rule CRUD |
| `/api/commission-rules/[id]` | GET, PUT, DELETE | Admin+ | Single rule |
| `/api/commissions` | GET | Auth | Commission/eligibility |
| `/api/notifications` | GET, PATCH | Auth | Notifications CRUD |
| `/api/wallets` | GET, POST | Auth / Finance+ | Wallet CRUD |
| `/api/wallets/[id]` | GET, PUT | Auth / Finance+ | Single wallet |
| `/api/settings` | GET, PUT, POST | Admin+ | System settings |
| `/api/audit-logs` | GET, POST | Admin+ | Audit log |
| `/api/backups` | GET, POST, DELETE | Admin+ | Database backups |
| `/api/backups/restore` | GET, POST | Admin+ | Restore backup |
| `/api/sync` | GET, POST | Admin+ | DB sync operations |
| `/api/upload` | POST, DELETE | Auth | File upload |
| `/api/files/[id]` | GET | Auth | Serve uploaded files |

### Route Handler Pattern

All API routes follow this structure:
```typescript
export async function METHOD(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ("error" in authResult) return errorResponse(...);

    const body = await request.json();
    const parsed = schema.parse(body);        // Zod v4 validation
    const result = await serverAction(parsed);  // Delegate to action
    if (!result.success) return errorResponse(...);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);  // Unified error handler
  }
}
```

### Server Actions Pattern

```typescript
"use server"

export async function myAction(params: Params): Promise<ActionResult> {
  try {
    const session = await auth();             // Auth check
    if (!session?.user?.id) return { error: "Unauthorized" };

    const parsed = schema.parse(params);      // Validate

    await connectToDatabase();
    const result = await Model.create(parsed);

    await logAudit({ ... });                  // Audit trail

    return { success: true, data: serializeDocument(result) };
  } catch (error) {
    return handleActionError(error);
  }
}
```

### Validation Layer

14 Zod v4 schemas covering:
- **Common:** ObjectId, pagination, search, money, percentage rates, email
- **Sales:** products (1-20), create/submit/delete/query
- **Approval:** manager action, accountant process (EO/BP+Tax+VAT), finance approve
- **Commission:** rules (ranges, rates), query params
- **User:** CRUD, password policy, bulk actions
- **Team:** create/update with member management
- **Product/Category:** CRUD with SKU uniqueness
- **Wallet:** credit/debit with amounts
- **Target:** assignment with period
- **Audit:** log creation with query filters
- **Settings:** key-value with known key validation
- **Notification:** create/query/mark-read

Password policy: ≥12 chars, uppercase, lowercase, digit, special character.

---

## 5. Approval Workflow

### State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                        FULL APPROVAL FLOW                    │
│                                                              │
│  Submit → Pending_Manager [Manager Appr] → Pending_Accountant│
│            ↑                    ↓                            │
│            │           [Manager Reject → Draft]              │
│                                                              │
│  Pending_Accountant [Accountant: EO/BP+Tax+VAT → Net]       │
│       → Pending_Finance                                      │
│           ↓                                                  │
│  [Accountant Reject → Draft]                                 │
│                                                              │
│  Pending_Finance [Finance Final → Approved + Commission]     │
│            ↓                                                 │
│  [Finance Reject → Draft]                                    │
│                                                              │
│  APPROVED → Wallet Credit → Commission → Eligibility Check   │
└──────────────────────────────────────────────────────────────┘

                    AUTO-APPROVAL SHORTCUT
                    (all products from autoApprove: true categories)

  Submit → SKIP ALL STAGES → Approved + Commission + Wallet Credit
```

### Status Fields

Records have dual status tracking:

| Field | Purpose | Values |
|-------|---------|--------|
| `status` | Overall workflow position | Draft, Pending_Manager, Pending_Accountant, Pending_Finance, Approved |
| `approvalStatus` | Manager's action | Pending, Approved, Rejected |
| `accountantStatus` | Accountant's action | Pending, Approved, Rejected |
| `financeStatus` | Finance's action | Pending, Approved, Rejected |

**Both must be checked independently.** For accountant queue: `status === "Pending_Accountant"` AND `approvalStatus === "Approved"`.

### Stage Details

#### Manager Approval

- **Queue query:** `status: "Pending_Manager"`, filtered by `managerId` in action
- **Action:** Approve → calculate commission → move to `Pending_Accountant`
- **Rejection:** → `Draft` with `rejectionReason`, required to provide reason
- **Notifications:** Employee gets in-app + SSE on both approve/reject
- **Only sees own team:** `record.managerId === session.user.id`

#### Accountant Processing

- **Queue query:** `status: "Pending_Accountant"` AND `approvalStatus: "Approved"`
- **Deductions applied:**
  - EO/BP (fixed amount + reason required if amount > 0)
  - Tax% (only if executive did NOT include tax via checkbox)
  - VAT% (only if executive did NOT include VAT via checkbox)
- **Formula:** `Net = Gross − Tax − VAT − EO/BP`
- **Commission recalculated** based on net sales
- **Action:** Approve → `Pending_Finance`
- **Notifications:** Finance users get email + SSE `DASHBOARD_REFRESH`; manager gets in-app notification (BUG-008: should notify finance, not manager)

#### Finance Final Approval

- **Queue query:** `status: "Pending_Finance"` AND `accountantStatus: "Approved"`
- **Action:** Final approve → `Approved` + `isPaid: true` + wallet credit
- **Transaction-safe:** Uses `findOneAndUpdate` + `$inc` for atomic wallet credit
- **Eligibility trigger:** Calls `checkEligibility()` → re-evaluates all NOT_ELIGIBLE records if crossed 50% threshold
- **Notifications:** Employee + Manager get in-app + email + SSE

#### Auto-Approval

- **Trigger:** All product categories have `autoApprove: true`
- **Check:** `checkAutoApproveEligibility(products)` called during submit
- **Action:** Immediately sets `status: "Approved"`, credits wallet, marks `autoApproved: true`
- **Notifications:** Employee + Manager + all Finance users

### Database Operations

```typescript
// Manager Approve
const record = await SalesRecord.findById(id);
record.status = "Pending_Accountant";
record.approvalStatus = "Approved";
record.approvedBy = session.user.id;
record.approvedAt = new Date();
record.calculatedCommission = await calculateCommission(record);
await record.save();

// Finance Final Approve (transaction-safe)
await SalesRecord.findOneAndUpdate(
  { _id: id, status: "Pending_Finance", accountantStatus: "Approved" },
  { $set: { status: "Approved", financeStatus: "Approved", ... } }
);
await Wallet.findOneAndUpdate(
  { employeeId: record.employeeId },
  { $inc: { balance: commission, totalEarned: commission } }
);
```

---

## 6. Commission & Eligibility

### Commission Calculation

```
step 1: Gross Sales = Σ(product.unitPrice × product.quantity)
step 2: Net Sales    = Gross − Tax − VAT − EO/BP
                        (Tax and VAT both calculated on Gross, not sequential)
step 3: Achievement% = (Σ Approved Net Sales / Target Amount) × 100
step 4: Commission   = Net Sales × Rate

Rate = lookup from CommissionRule table where:
  achievement% >= targetPercentageFrom AND achievement% <= targetPercentageTo
  ordered by priority DESC, most specific first
```

### Commission Rules (Admin Configurable)

| Achievement Range | Commission Rate |
|-------------------|-----------------|
| 0% — 80% | 2.0% |
| 81% — 100% | 3.0% |
| 101% — 150% | 4.5% |
| 151% — 999% | 5.0% |

Rules are matched by `targetPercentageTo: { $gt: achievement }` sorted by priority.

### Eligibility

- **Threshold:** ≥50% achievement
- **Status:** `User.isEligible` boolean + `SalesRecord.eligibilityStatus`
- **Trigger:** Re-evaluated on every finance approval or auto-approval
- **Re-evaluation:** When crossing 50%, ALL previously NOT_ELIGIBLE records are re-evaluated
- **Notification:** `COMMISSION_ELIGIBLE` sent on crossing threshold

```typescript
async function checkEligibility(employeeId: string) {
  const user = await User.findById(employeeId);
  const approvedRecords = await SalesRecord.find({
    employeeId, financeStatus: "Approved"
  });
  const totalNet = approvedRecords.reduce((sum, r) => sum + r.netSales, 0);
  const achievement = user.targetAmount > 0 ? (totalNet / user.targetAmount) * 100 : 0;
  const wasEligible = user.isEligible;
  const isEligible = achievement >= 50;

  if (isEligible !== wasEligible) {
    await User.findByIdAndUpdate(employeeId, { isEligible });
    if (isEligible) {
      await notifyCommissionEligible(employeeId, achievement);
      await reevaluateIneligibleRecords(employeeId);
    }
  }
  return { eligible: isEligible, achievement, totalSales: totalNet, targetAmount: user.targetAmount };
}
```

### Monetary Math

Uses `lib/utils/money.ts` — cents-based integer math throughout:

```typescript
// Convert dollars to cents (integer)
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

// Convert cents to dollars
export function fromCents(cents: number): number {
  return cents / 100;
}

// Calculate product total (NEVER raw float multiplication)
export function calculateProductTotal(unitPrice: number, quantity: number): number {
  return fromCents(toCents(unitPrice) * quantity);
}
```

**Never use:** `p.unitPrice * p.quantity` — always use `calculateProductTotal(unitPrice, quantity)`.

---

## 7. Wallet & Payments

### Wallet Operations

```
Wallet.employeeId → unique, 1:1 with User
Wallet.balance    → current available balance (atomic $inc)
Wallet.totalEarned → lifetime commissions earned
Wallet.totalPaid  → total paid out
Wallet.transactions[] → audit trail of all credits/debits
```

### Credit Flow (Finance approves sale)

```typescript
// Transaction-safe (MongoDB Atlas) or fallback (local MongoDB)
async function creditWallet(employeeId, amount, salesRecordId) {
  // Retry up to 5 times with exponential backoff
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Check for duplicate credit (idempotency)
      const wallet = await Wallet.findOne({ employeeId });
      const exists = wallet.transactions.some(t =>
        t.salesRecordId?.equals(salesRecordId) && t.type === "credit"
      );
      if (exists) return { success: true, newBalance: wallet.balance };

      // Atomic increment
      const updated = await Wallet.findOneAndUpdate(
        { employeeId },
        {
          $inc: { balance: amount, totalEarned: amount },
          $push: { transactions: { type: "credit", amount, salesRecordId, balanceAfter: wallet.balance + amount } }
        },
        { new: true }
      );
      return { success: true, newBalance: updated.balance };
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await delay(2 ** attempt * 100);
    }
  }
}
```

### Payment Processing (Finance)

```
Finance Payment Queue:
  1. View ELIGIBLE commissions
  2. Select records to pay
  3. Confirm payment → debit wallet
  4. Mark commission as paid
```

---

## 8. Notifications & Real-Time Events

### Notification Types (14 events)

| Type | Trigger | Recipient |
|------|---------|-----------|
| `SALE_SUBMITTED` | Executive submits | Manager |
| `SALE_RESUBMITTED` | Executive resubmits rejected | Manager |
| `MANAGER_APPROVED` | Manager approves | Executive |
| `MANAGER_REJECTED` | Manager rejects | Executive |
| `ACCOUNTANT_PROCESSED` | Accountant processes | Finance (BUG-008: currently manager) |
| `ACCOUNTANT_REJECTED` | Accountant rejects | Executive |
| `FINANCE_APPROVED` | Finance approves | Executive + Manager |
| `FINANCE_REJECTED` | Finance rejects | Executive |
| `NEW_TARGET` | Admin assigns target | Executive/Manager |
| `COMMISSION_ELIGIBLE` | Crosses 50% threshold | Executive |
| `USER_CREATED` | New user account | New user |
| `AUTO_APPROVED` | Sale auto-approved | Executive |
| `TEAM_SALE_AUTO_APPROVED` | Team sale auto-approved | Manager |
| `SALE_AUTO_APPROVED` | Sale auto-approved | Finance |

### SSE (Server-Sent Events)

**Server:** `lib/sse.ts` — Singleton `SSEManager`

```typescript
class SSEManager {
  private clients: Map<string, Set<SSEClient>>;

  sendToUser(userId, data)    // SSE to specific user
  sendToRole(role, data)      // SSE to all users with role
  broadcast(data)             // SSE to all connected
}
```

**Endpoint:** `GET /api/events`
- Returns `text/event-stream` with 30s keepalive
- Auth via inline `auth()` + DB isActive check
- Auto-cleanup on connection close

**Client Hook:** `hooks/use-sse.ts`

```typescript
function useSSE({ onNotification, onSaleUpdate, onDashboardRefresh, ... }) {
  // Creates EventSource("/api/events")
  // Auto-retry with exponential backoff (3s × 2^(n-1), max 5 retries)
  return { isConnected, clientId };
}
```

### Notification Bell (`components/notification-bell.tsx`)

```typescript
// Displays unread count badge via SSE + polling fallback
// Fetches notifications on click
// Links navigate user to relevant page based on notification type
```

### Email Notifications

**SMTP:** Nodemailer with configurable host/port/auth  
**Templates:** `sendNotificationEmail()`, `sendWelcomeEmail()`, `sendPasswordResetEmail()`

---

## 9. UI Architecture

### Layout System

```
Root Layout (app/layout.tsx)
├── SessionProvider (next-auth/react)
│   ├── ThemeProvider
│   │   ├── SessionRecheck (60s interval)
│   │   └── {children}
│   └── Toaster (sonner)
```

### Role Layouts (Shell Pattern)

Every role has an identical sidebar shell:

```
SidebarProvider
├── Sidebar
│   ├── SidebarHeader (logo + role name)
│   ├── SidebarContent (menu items via SidebarMenu)
│   └── SidebarFooter (sign out button)
└── SidebarInset
    ├── Header (SidebarTrigger + Separator + NotificationBell + ThemeToggle)
    └── Content ({children})
```

### Sidebar Items Per Role

| Admin (14) | Sales Executive (10) | Sales Manager (9) | Accountant (8) | Finance (10) | Administrator (8) |
|------------|---------------------|--------------------|----------------|--------------|-------------------|
| Dashboard | Dashboard | Dashboard | Dashboard | Dashboard | Dashboard |
| Users | Add Record | Team | Approvals | Approval Queue | Users |
| Teams | My Records | Approvals | Commissions | Payment Queue | Database Sync |
| Categories | Targets | Team Sales | Payments | Payment History | Backups |
| Products | Eligibility | Commission Rules | Records | Commissions | Audit Logs |
| Commission Rules | Commission Rules | Team Eligibility | Analytics | Sales Records | System Health |
| Targets | Commissions | Commissions | Commission Rules | Wallets | Settings |
| Sales | Approved Sales | Wallet | Profile | Analytics | Profile |
| Commissions | Wallet | Profile | | Commission Rules | |
| Wallets | Profile | | | Profile | |
| Analytics | | | | | |
| Backups | | | | | |
| Settings | | | | | |
| Profile | | | | | |

### Page Data Pattern

Every page follows the same fetch pattern:

```typescript
"use client"

export default function Page() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [records, notifications] = await Promise.all([
        getRecords(),
        getNotifications()
      ]);
      setData({ records, notifications });
      setLoading(false);
    }
    fetchData();
    const timer = setInterval(fetchData, 30000); // polling fallback
    return () => clearInterval(timer);
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <EmptyState />;

  return (
    <ErrorBoundary>
      {/* render data */}
    </ErrorBoundary>
  );
}
```

### UI Components

#### shadcn/ui Primitives (24)
`Alert`, `Avatar`, `Badge`, `Button`, `Card`, `Checkbox`, `Dialog`, `DropdownMenu`, `EmptyState`, `Field`, `Input`, `Label`, `NavigationMenu`, `Pagination`, `Progress`, `Select`, `Separator`, `Sheet`, `Sidebar`, `Skeleton`, `Sonner`, `Switch`, `Table`, `Tooltip`

#### Shared Components

| Component | Purpose |
|-----------|---------|
| `session-recheck.tsx` | 60s DB re-check of isActive |
| `notification-bell.tsx` | Unread count + dropdown list |
| `sse-connection-indicator.tsx` | SSE connection status |
| `theme-provider.tsx` | Dark/light mode |
| `error-boundary.tsx` | React error boundary |
| `empty-state.tsx` | Empty data display |
| `file-preview.tsx` | Uploaded file preview |
| `dashboard-skeleton.tsx` | Loading placeholder |

---

## 10. Role-Based Access Control

### Role Definitions

| Role (camelCase) | Base Route | Modules Accessible |
|------------------|-----------|-------------------|
| `administrator` | `/administrator` | All (full system control) |
| `admin` | `/admin` | Admin + all below (blocked from /administrator) |
| `salesManager` | `/sales-manager` | Manager + Executive features |
| `salesExecutive` | `/sales-dashboard` | Executive features only |
| `accountant` | `/accountant` | Accountant + Executive features |
| `finance` | `/finance` | Finance + Executive features |

### Path-Based Access (Middleware)

```typescript
// Role to allowed path prefixes mapping
const ACCESS_MAP = {
  administrator: ["/admin", "/administrator", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"],
  admin:         ["/admin", "/sales-dashboard", "/sales-manager", "/accountant", "/finance"],
  salesManager:  ["/sales-manager", "/sales-dashboard"],
  salesExecutive:["/sales-dashboard"],
  accountant:    ["/accountant", "/sales-dashboard"],
  finance:       ["/finance", "/sales-dashboard"],
};
```

Non-matching paths redirect to the user's home dashboard. Invalid role → redirect to `/login`.

### Tenant Isolation

- **Executives:** See only their own records (`employeeId` match)
- **Managers:** See team records (`managerId` match or team member `employeeId`)
- **Accountants/Finance:** See all records (system-wide view)
- **Approval actions:** Verifies stage ownership (manager = team only)

### Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@incentive.io | Admin123! | admin |
| superadmin@incentive.io | Superadmin123! | administrator |
| jamal@incentive.io | Manager123! | salesManager |
| fatima@incentive.io | Manager123! | salesManager |
| karim@incentive.io | Executive123! | salesExecutive |
| accountant@incentive.io | Accountant123! | accountant |
| finance@incentive.io | Finance123! | finance |

---

## 11. Calculations & Formulas

### Sales Amount

```
Gross Sales = Σ(product.unitPrice × product.quantity) for all products
```
Always use `calculateProductTotal(unitPrice, quantity)` from `lib/utils/money.ts`.

### Net Sales

```
Net Sales = Gross Sales − Tax − VAT − EO/BP

Where:
  Tax = Gross × taxRate% (applied if tax not included by executive)
  VAT = Gross × vatRate% (applied if VAT not included by executive)
  EO/BP = fixed deduction amount

Note: Tax and VAT are BOTH calculated on Gross Sales (not sequential)
```

### Commission

```
Commission = Net Sales × Commission Rate

Commission Rate = lookup from CommissionRule where:
  Achievement% >= targetPercentageFrom AND Achievement% <= targetPercentageTo
  (ordered by priority DESC, isActive: true)
```

### Achievement Percentage

```
Achievement% = (Σ Approved Net Sales / Target Amount) × 100
```

### Eligibility Threshold

```
ELIGIBLE if Achievement% ≥ 50%
NOT_ELIGIBLE if Achievement% < 50%
```

### Example Calculation

```
Gross Sales:    ৳100,000
Tax (5%):       ৳ −5,000
VAT (10%):      ৳−10,000
EO/BP:          ৳ −2,000
────────────────────────
Net Sales:      ৳ 83,000

Target:         ৳500,000
Achievement%:   (83,000/500,000) × 100 = 16.6%
Rate:           2.0% (0−80% range)
Commission:     ৳83,000 × 2.0% = ৳1,660
Eligibility:    NOT_ELIGIBLE (16.6% < 50%)
```

### Money Utilities (`lib/utils/money.ts`)

```typescript
toCents(amount)               // $1.99 → 199
fromCents(cents)              // 199 → 1.99
calculateProductTotal(p, q)   // $1.99 × 3 → 5.97 (cents-safe)
formatCurrency(amount)        // 1000 → "৳1,000.00"
addAmounts(a, b)              // cents-safe addition
subtractAmounts(a, b)         // cents-safe subtraction
multiplyAmount(a, b)          // cents-safe multiplication
calculatePercentage(a, pct)   // 1000 × 5% → 50
roundMoney(amount)            // round to 2 decimal places
```

---

## 12. Error Handling

### Unified Error Flow

```
throw new ApiError(400, "Invalid input", "VALIDATION_ERROR")
    ↓
handleError(error) in lib/api-error.ts
    ↓
Priority chain:
  1. ApiError        → status + message + code from constructor
  2. ZodError        → 400 with field-level details
  3. Duplicate key    → 409, ALREADY_EXISTS
  4. Mongoose Valid.  → 400, VALIDATION_ERROR
  5. Generic Error    → 500, INTERNAL_ERROR (message hidden in prod)
  6. Unknown          → 500, INTERNAL_ERROR
    ↓
NextResponse.json({ error, code, requestId }, { status })
```

### Error Codes (16 predefined)

```typescript
UNAUTHORIZED, FORBIDDEN, INVALID_CREDENTIALS, SESSION_EXPIRED,
VALIDATION_ERROR, INVALID_INPUT, MISSING_REQUIRED_FIELD, INVALID_FORMAT,
NOT_FOUND, ALREADY_EXISTS, CONFLICT,
OPERATION_NOT_ALLOWED, INSUFFICIENT_PERMISSIONS, INVALID_STATE,
RATE_LIMIT_EXCEEDED,
INTERNAL_ERROR, DATABASE_ERROR, TRANSACTION_FAILED
```

### Helper Functions

```typescript
errorResponses.unauthorized()     // throw helpers
errorResponses.forbidden()
errorResponses.notFound()
errorResponses.badRequest()
errorResponses.conflict()
getStatusCodeForError(str)        // Maps error string to HTTP status
```

---

## 13. Security

### Authentication
- JWT tokens with 24h expiry
- Session revalidated against DB every 60s (explicit `update()` only)
- Blocked users lose access within 60s max
- Rate-limited login (20/15min), register (20/15min), password reset (10-15/15min)
- Password policy: ≥12 chars, uppercase, lowercase, digit, special

### Authorization
- Edge middleware RBAC for page routes
- Server-side `requireAuth()` / `requireRole()` on all API routes
- Ownership checks on all CRUD operations (`employeeId`, `managerId`)
- Stage-based approval guards (can only approve records in correct status)

### Data Protection
- Soft delete on all models (except AuditLog)
- Audit logging on all CRUD + approval operations
- Email enumeration prevention (ambiguous reset responses)
- HTML escaping on email templates
- Proof of sale: JPG/PNG/PDF only, 10MB max
- MongoDB query injection prevention (no `$` prefix in user input)

### Rate Limiting
- In-memory (module-level Map)
- **Known limitation:** Not shared across Vercel serverless instances → requires Redis-based solution for production

---

## 14. Deployment

### Production

| Config | Value |
|--------|-------|
| URL | `https://incentiveio.vercel.app` |
| Platform | Vercel |
| Project ID | `prj_GVhPGHTt5LSrEskBMUEgyAqAIeUJ` |
| Build | `vercel --prod` |
| Build command | `npm run build:webpack` |
| MongoDB | Atlas (retryWrites=true) |

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection (Atlas in prod, localhost in dev) |
| `NEXTAUTH_SECRET` | JWT signing key (≥32 chars) |
| `NEXTAUTH_URL` | Base URL for auth callbacks |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) |
| `EMAIL_HOST` | SMTP server |
| `EMAIL_PORT` | SMTP port (587) |
| `EMAIL_SECURE` | Use TLS |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password |
| `EMAIL_FROM` | Sender email |

### Build Notes

- **Mongoose + Turbopack = crash.** Must use `--webpack` flag.
- `vercel.json` enforces `NEXT_PRIVATE_BUILD_WORKER=webpack`.
- Local MongoDB: `retryWrites=false` (no transactions on standalone).
- Production MongoDB Atlas: `retryWrites=true`.
- `force-dynamic` required on pages using real-time data (`/finance/analytics`, `/sales-dashboard/commissions`, `/admin/wallets`).

---

## Appendix: Module Dependencies

```
Module 1:  Auth + User Base   → All modules
Module 2:  Team Management    → Depends on Users
Module 3:  Categories         → Standalone
Module 4:  Products           → Depends on Categories
Module 5:  Sales Records      → Depends on Users, Products, Categories
Module 6:  Manager Approval   → Depends on Sales Records, Teams
Module 7:  Accountant Process → Depends on Manager Approval
Module 8:  Finance Final      → Depends on Accountant Process
Module 9:  Commission Rules   → Standalone (admin config)
Module 10: Commission Calc    → Depends on Sales Records, Rules, Targets
Module 11: Eligibility        → Depends on Commission Calc
Module 12: Wallet             → Depends on Commission, Eligibility
Module 13: Notifications      → Cross-cuts all modules
Module 14: SSE                → Depends on Notifications
Module 15: Dashboards         → Aggregates all above
Module 16: Admin Tools        → Backups, Settings, Sync
```

### Recommended Implementation Order

1. Auth + User base (Modules 1)
2. Categories + Products (3, 4)
3. Teams (2)
4. Sales Record CRUD (5)
5. Manager Approval (6)
6. Commission Rules (9)
7. Accountant Processing (7)
8. Finance Approval + Wallet (8, 12)
9. Commission Calc + Eligibility (10, 11)
10. Notifications + SSE (13, 14)
11. Dashboards (15)
12. Admin Tools (16)
