# AlgoIncentive — Complete System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Role-Based Features](#role-based-features)
3. [UI/UX Specifications](#uiux-specifications)
4. [Form Fields Reference](#form-fields-reference)
5. [Approval Workflow](#approval-workflow)
6. [Notifications](#notifications)
7. [Calculations](#calculations)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)

---

## 1. System Overview

**Application:** Sales Commission Management System  
**Stack:** Next.js 16, MongoDB, NextAuth v5, RTK Query, Socket.IO, Tailwind CSS 4  
**Auth:** JWT tokens with DB re-check every 60s  
**File Storage:** Local filesystem (`public/uploads/`)

### Test Accounts (6 Roles)

| Email | Password | Role |
|-------|----------|------|
| iomadmin@iomltd.com | IOMadmin123! | admin |
| jamal.hassan@iomltd.com | Jamal123! | sales executive |
| iomadministrator@iomltd.com | IOMadministratort123! | administrator |
| iommanager@iomltd.com | iom123@!A | sales manager |
| iomaccountant@iomltd.com | IOMaccount123! | accountant |
| iomfinance@iomltd.com | IOMfinance123! | finance |

---

## 2. Role-Based Features

### 👤 Admin
**Base Route:** `/admin`

| Page | Features |
|------|----------|
| Dashboard | Users count, Teams count, Sales records, Commissions |
| Users | Create, Edit, Delete, Reset Password, Block/Unblock |
| Teams | Create team, Assign manager, View members |
| Targets | Assign targets, Set period/category |
| Commission Rules | Create rules, Set achievement ranges (0-80%, 81-100%, 101-150%), Set rates |
| Product Categories | Create, Edit, Delete categories |
| Sales Records | View all records, Filter by status/date/user |
| Commissions | View all commissions, Filter eligibility |
| Backups | Create/Restore backups |
| Settings | System configuration |

---

### 👨‍💼 Sales Executive
**Base Route:** `/sales-dashboard`

| Page | Features |
|------|----------|
| Dashboard | Total records, Pending, Approved amount, Commission |
| Add Record | Company info, Tax/VAT checkboxes, Products, Proof docs |
| Records | View all records, Edit drafts, Submit for approval |
| Targets | View assigned targets, Achievement % |
| Commission Rules | View commission structure (read-only) |
| Eligibility | View ELIGIBLE/NOT_ELIGIBLE status |
| Commissions | View earned commissions |
| Approved Sales | View finalized records |
| Manager Info | View assigned manager details |
| Wallet | View commission wallet |
| Profile | Update personal info, Change password |

---

### 👨‍💼 Sales Manager
**Base Route:** `/sales-manager`

| Page | Features |
|------|----------|
| Dashboard | Team size, Team sales, Pending, Commission |
| Add Record | Create personal sales record |
| Sales History | View team records, Filter by employee |
| Approvals | Approve/Reject team sales |
| Team | View team members, Sales, Achievement |
| Targets | View own targets |
| Commission Rules | View commission structure |
| Team Eligibility | Team member eligibility |
| Team Commissions | Team member commissions |
| Wallet | View commission wallet |
| Profile | Update profile |

---

### 💼 Accountant
**Base Route:** `/accountant`

| Page | Features |
|------|----------|
| Dashboard | Pending, Processed today, Deductions |
| Approvals | Add Tax%, VAT%, EO/BP, Calculate Net |
| Processed | View processed history |
| Analytics | Analytics charts |
| Wallets | View wallets |
| Profile | Update profile |

---

### 🏦 Finance
**Base Route:** `/finance`

| Page | Features |
|------|----------|
| Dashboard | Pending, Approved today, Total commissions |
| Approvals | Final approve, Trigger commission |
| Sales Records | View all records |
| Commissions | View all, Filter eligibility |
| Approved | View ELIGIBLE commissions |
| Payment Queue | Process payments |
| Wallets | View all wallets |
| Analytics | Analytics charts |
| Profile | Update profile |

---

## 3. UI/UX Specifications

### Color Scheme
- **Primary:** Sky Blue (#0EA5E9)
- **Success:** Green (#22C55E)
- **Warning:** Amber (#F59E0B)
- **Danger:** Red (#EF4444)
- **Background:** White / Gray-50
- **Text:** Gray-900 (primary), Gray-600 (secondary)

### Status Badges

| Status | Badge |
|--------|-------|
| Draft | `bg-gray-100 text-gray-800` |
| Pending Manager | `bg-yellow-100 text-yellow-800` |
| Pending Accountant | `bg-orange-100 text-orange-800` |
| Pending Finance | `bg-blue-100 text-blue-800` |
| Approved | `bg-green-100 text-green-800` |
| Rejected | `bg-red-100 text-red-800` |

### Tax/VAT Badges

| Value | Badge |
|-------|-------|
| Yes (Included) | `bg-green-100 text-green-800` |
| — (Not Included) | `text-gray-400` |

### Form Layouts
- **Single column:** 1fr
- **Two columns:** `grid grid-cols-1 sm:grid-cols-2 gap-4`
- **Three columns:** `grid grid-cols-1 md:grid-cols-3 gap-4`

### Tables
- Sticky header
- Alternating row colors (white/gray-50)
- Hover state: `hover:bg-gray-50`
- Pagination: 20 per page

### Responsive Breakpoints
- **Mobile:** < 640px
- **Tablet:** 640px - 1024px
- **Desktop:** > 1024px

---

## 4. Form Fields Reference

### Add Sales Record Form
**File:** `src/components/sales-dashboard/add-record-form.tsx`

**Multi-Product Support:** Up to 20 products per sales record

| Field | Type | Required | Description |
|-------|------|----------|----------|
| Company Name | text | ✓ | Company where products sold |
| Company Email | email | ✓ | Contact email |
| Include Tax | checkbox | No | Tax will be deducted |
| Include VAT | checkbox | No | VAT will be deducted |

**Product Lines (repeatable, max 20):**

| Field | Type | Required | Description |
|-------|------|----------|----------|
| Product Name | text | ✓ | Product name |
| Category | select | ✓ | Product category |
| Unit Price | number | ✓ | Price per unit |
| Original Price | number | No | Original/list price |
| Quantity | number | ✓ | Number sold (default: 1) |
| Deal Notes | textarea | No | Discount notes |

| Additional | file | No | JPG, PNG, PDF (max 10MB each) |

### Accountant Approval Form
**File:** `src/components/accountant/accountant-approval-queue.tsx`

| Step | Field | Type | Description |
|------|-------|------|----------|
| 1 | Original Sales | display | Auto (from record) |
| 2 | EO/BP Amount | number | Fixed deduction |
| 2 | EO/BP Reason | text | Reason for deduction |
| 3 | Tax Rate | number (%) | If NOT included by Executive |
| 4 | VAT Rate | number (%) | If NOT included by Executive |
| 5 | Net Sales | display | Calculated |
| 6 | Commission | display | System calculated |

### Manager Approval Form
**File:** `src/components/sales-manager/approval-queue.tsx`

| Field | Type | Description |
|-------|------|----------|
| Employee | display | Record creator |
| Product | display | Product info |
| Original Price | display | List price |
| Negotiated Price | display | Final price |
| Delta | display | Discount % |
| Commission | display | Calculated |
| Status | badge | Sold/Not Sold |
| Actions | buttons | Approve/Reject |

---

## 5. Approval Workflow

### Flow Diagram
```
Executive → Submit (Draft → Pending_Manager)
    ↓
Manager → Approve (Pending_Manager → Pending_Accountant)
    ↓ (OR Reject → Draft)
Accountant → Process (Pending_Accountant → Pending_Finance)
    ↓ (OR Reject → Draft)
Finance → Approve (Pending_Finance → APPROVED + Commission)
    ↓ (OR Reject → Draft)
```

### Status Progression
| Stage | Status Value |
|-------|-----------|
| Created | `Draft` |
| Submitted | `Pending_Manager` |
| Manager Approved | `Pending_Accountant` |
| Accountant Processed | `Pending_Finance` |
| Final Approved | `Approved` |
| Rejected | `Draft` (with reason) |

### Roles at Each Stage
| Stage | Role Required |
|-------|-----------|
| Create | Executive, Manager |
| Approve | Manager |
| Process | Accountant |
| Final Approve | Finance |

---

## 6. Notifications

### Notification Events
**File:** `src/services/notification-unified.service.ts`

| Event | Trigger | Recipients |
|-------|---------|-----------|
| SALE_SUBMITTED | Executive submits | Manager |
| MANAGER_APPROVED | Manager approves | Executive |
| MANAGER_REJECTED | Manager rejects | Executive |
| ACCOUNTANT_PROCESSED | Accountant processes | Finance |
| ACCOUNTANT_REJECTED | Accountant rejects | Executive |
| FINANCE_APPROVED | Finance approves | Executive, Manager |
| FINANCE_REJECTED | Finance rejects | Executive |
| COMMISSION_ELIGIBLE | Crosses 50% threshold | Executive |
| NEW_TARGET | Admin assigns target | Executive, Manager |

### Real-Time Delivery
- Socket.IO for instant delivery
- Bell icon in header shows unread count
- Click notification to navigate to relevant page

---

## 7. Calculations

### Net Sales Calculation
**Formula:** `Net = Gross Sales - Tax - VAT - EO/BP`

```
Example:
Gross Sales: ৳100,000
Tax (5%):   -৳5,000
VAT (10%):  -৳10,000
EO/BP:      -৳2,000
-----------------
Net Sales:    ৳83,000
```

**Note:** Tax and VAT are both calculated on Gross Sales (not sequential)

### Commission Calculation
**Formula:** `Commission = Net Sales × Commission Rate`

- Commission Rate determined by achievement %
- **Achievement %** = (Total Approved Sales / Target) × 100

### Commission Rules (Admin)
| Achievement Range | Commission Rate |
|---------------|-------------|
| 0-80% | 2.0% |
| 81-100% | 3.0% |
| 101-150% | 4.5% |
| 151%+ | 5.0% |

### Eligibility
- **ELIGIBLE:** Achievement ≥ 50%
- **NOT_ELIGIBLE:** Achievement < 50%

### Re-evaluation
When achievement crosses 50%, ALL previous NOT_ELIGIBLE records in that period are re-evaluated automatically.

---

## 8. Database Schema

### SalesRecord Model
**File:** `src/models/SalesRecord.ts`

```typescript
interface SalesRecord {
  // Identifiers
  _id: ObjectId
  employeeId: string
  employeeName: string

  // Company
  companyName: string
  companyEmail: string

  // Products
  products: ProductLine[]
  
  // Dates
  date: Date
  createdAt: Date
  updatedAt: Date

  // Workflow Status
  status: "Sold" | "Not Sold"
  approvalStatus: "Pending" | "Approved" | "Rejected"
  accountantStatus: "Pending" | "Approved" | "Rejected"
  financeStatus: "Pending" | "Approved" | "Rejected"
  
  // Tax/VAT (Executive checkboxes)
  taxEnabled: boolean
  vatEnabled: boolean
  
  // Tax/VAT (Accountant inputs)
  taxRate: number
  taxAmount: number
  vatRate: number
  vatAmount: number
  
  // Deductions
  eoBpAmount: number
  eoBpReason: string
  
  // Financial
  commission: number
  calculatedCommission: number
  
  // Rejection
  rejectionReason: string
  
  // Proof
  proofOfSale: string[]
}
```

### ProductLine Interface
```typescript
interface ProductLine {
  productName: string
  category: string
  unitPrice: number
  quantity: number
  originalPrice: number
  dealNotes: string
}
```

**Multi-Product Handling:**
- `getSaleAmount(record)` calculates sum of all `(unitPrice × quantity)`
- Single product: `saleAmount` field used directly
- Multiple products: `products[]` array with line totals
- Always use helper function, NOT `record.saleAmount` directly

### User Model
**File:** `src/models/User.ts`

```typescript
interface User {
  _id: ObjectId
  name: string
  email: string
  password: string
  role: "admin" | "administrator" | "salesManager" | "salesExecutive" | "accountant" | "finance"
  employeeId: string
  phone: string
  isActive: boolean
  
  // Team
  teamId: ObjectId
  managerId: ObjectId
  
  // Target
  targetAmount: number
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}
```

---

## 9. API Endpoints

### Sales Records
| Method | Endpoint | Description |
|--------|---------|-----------|
| GET | `/api/sales-records` | List all records |
| POST | `/api/sales-records` | Create record |
| GET | `/api/sales-records/[id]` | Get single record |
| PUT | `/api/sales-records/[id]` | Update record |
| DELETE | `/api/sales-records/[id]` | Delete record |

### Approvals
| Method | Endpoint | Role | Description |
|--------|--------|------|-----------|
| POST | `/api/sales-manager/approve-sale` | Manager | Approve sale |
| POST | `/api/sales-manager/reject-sale` | Manager | Reject sale |
| POST | `/api/accountant/approvals` | Accountant | Process with deductions |
| POST | `/api/finance/approvals` | Finance | Final approve |

### Commissions
| Method | Endpoint | Description |
|--------|---------|-----------|
| GET | `/api/commission-calculations` | List commissions |
| GET | `/api/commission-eligibility` | Check eligibility |

### Users & Auth
| Method | Endpoint | Description |
|--------|---------|-----------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/session` | Get session |
| POST | `/api/admin/users` | Create user |

### Notifications
| Method | Endpoint | Description |
|--------|---------|-----------|
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/[id]/read` | Mark as read |

---

## Key File References

| Purpose | File |
|---------|------|
| Add Record Form | `src/components/sales-dashboard/add-record-form.tsx` |
| Executive Table | `src/components/sales-dashboard/sales-records-table.tsx` |
| Manager Approvals | `src/components/sales-manager/approval-queue.tsx` |
| Manager Team Table | `src/components/sales-manager/team-sales-table.tsx` |
| Accountant Form | `src/components/accountant/accountant-approval-queue.tsx` |
| Commission Engine | `src/services/commission-calculation.service.ts` |
| Notifications | `src/services/notification-unified.service.ts` |
| Auth Config | `src/lib/auth/auth.ts` |
| Middleware | `src/middleware.ts` |
| MongoDB | `src/lib/mongodb.ts` |

---

## Critical Gotchas

1. **REJECTION HANDLING**: Filter to `approvalStatus: 'Approved'` AND `accountantStatus: 'Approved'`
2. **MULTI-PRODUCT**: Use `getSaleAmount(record)` NOT `record.saleAmount`
3. **FORMATTING**: Use `safeCurrencyFormat(amount)` instead of `toLocaleString()`
4. **IMPORT PREFIX**: Use `@/` for all imports from `src/`
5. **FORM INPUTS**: Must have BOTH `value` AND `onChange` props
6. **ROLE NAMES**: DB uses underscores (`sales_manager`), path uses camelCase (`salesmanager`)

---

**End of Documentation**