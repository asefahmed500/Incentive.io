# Sales Executive - Complete TODO & Feature Guide

## Role Overview

- **Hierarchy Level:** 1/5 (Entry level)
- **Dashboard URL:** `/sales-dashboard`
- **Reports To:** Sales Manager
- **Manages:** None

**Purpose:** Front-line sales staff who create sales records and track their own performance.

---

## What This Role Can Do

### ✅ Create/Add
- Sales records (up to 20 products per sale)
- Multi-product sales with individual pricing
- Deal notes and descriptions

### ✅ View/Read
- Own sales records
- Own sales targets and achievement
- Own commissions and payment status
- Own wallet balance and transactions
- Manager contact information
- Performance analytics and charts
- Commission rules and rates

### ✅ Edit/Update
- Own sales records (before manager approval)
- Own profile information

### ❌ Cannot Do
- Approve any sales
- View other users' data
- Modify commission rules
- Process payments
- Access admin features

---

## Features Checklist

### 📝 Sales Records Management

- [ ] **Add Sale**
  - Go to: `/sales-dashboard/add-record`
  - Click: "Add Sale" button
  - Fill: Product details (1-20 products)
  - Fill: Unit price and quantity for each
  - Optional: Enable VAT deduction (percentage)
  - Optional: Enable EO/BP deduction (amount + reason)
  - Upload: Proof of sale files (images/PDF)
  - Click: "Submit Sale"
  - Result: Sale created, status "Manager Review Pending"

- [ ] **View My Sales**
  - Go to: `/sales-dashboard/records`
  - See: All own sales records
  - Filter: By status, category, product, date range
  - Search: By product or company name
  - Export: As Excel or print report
  - Click: Eye icon to view details

- [ ] **View Sale Details**
  - Go to: My Sales page
  - Click: Eye icon on any sale
  - See: Complete sale information
  - See: Approval status and history
  - See: Commission calculation
  - See: Proof of sale files

### 🎯 Target Tracking

- [ ] **View My Targets**
  - Go to: `/sales-dashboard/targets`
  - See: Assigned sales targets
  - See: Current achievement percentage
  - See: Progress bar visualization
  - See: Target period (monthly/quarterly)

### 💰 Commissions

- [ ] **View My Commissions**
  - Go to: `/sales-dashboard/commissions`
  - See: All own commissions
  - See: Commission amount and calculation
  - See: Payment status (Pending/Paid)
  - See: Payment date (if paid)
  - See: Commission age (days since approval)

### 👤 Manager Information

- [ ] **View Manager Info**
  - Go to: `/sales-dashboard/manager-info`
  - See: Assigned manager's name
  - See: Manager's email
  - See: Manager's phone
  - See: Manager's employee ID

### 💳 Wallet

- [ ] **View Wallet Balance**
  - Go to: `/sales-dashboard/wallet`
  - See: Current balance
  - See: Total earned
  - See: Pending commissions
  - See: Transaction history

- [ ] **View Transaction History**
  - Go to: Wallet page
  - See: All transactions (credits/debits)
  - See: Transaction dates
  - See: Transaction amounts
  - See: Linked sales records

### 📊 Analytics

- [ ] **View Performance Charts**
  - Go to: `/sales-dashboard` (main dashboard)
  - See: Sales trend chart
  - See: Commission trend chart
  - See: Category breakdown
  - See: Achievement progress

### 🔔 Notifications

- [ ] **View Notifications**
  - Click: Bell icon (top right)
  - See: All notifications
  - Click: Notification to view details
  - See: Unread count

---

## In The Approval Workflow

### Stage: 1 of 4 (First Stage)

**What You Do:**
- Create sales records with product details
- Add proof of sale documentation
- Enable optional deductions (VAT, EO/BP)
- Submit for manager approval

**Input:**
- Product details (name, category, price, quantity)
- Optional deduction settings
- Proof files

**Output:**
- Sales record with "Pending" status
- Manager notified for review

**Next:**
- Sales Manager reviews and approves/rejects

---

## Data Access

### Tables You Can Read

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | Own only | All fields (own records only) |
| **Wallet** | Own only | All fields (own wallet only) |
| **CommissionCalculation** | Own only | All fields (own calculations only) |
| **UserTarget** | Own only | All fields (own targets only) |
| **CommissionRule** | All (read-only) | All fields |
| **Product** | All (read-only) | All fields |

### Tables You Can Write

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | Create only | Can create new records |
| **User** | Own profile | Can update own profile only |

### Fields You Can Modify

**Own Sales Record (before approval):**
- Product details
- Quantities
- Prices
- Deduction settings
- Proof files

**Own Profile:**
- Name
- Email (with verification)
- Phone
- Profile picture

### Fields You Cannot Touch

**Protected Fields (auto-set by system):**
- `approvalStatus`
- `approvedBy`, `approvedAt`
- `accountantStatus`
- `finalCommission`, `taxAmount`
- `commission`, `calculatedCommission`
- `paymentStatus`, `paidAt`, `paidBy`

**Other Users' Data:**
- Other users' sales records
- Other users' wallet balances
- Other users' commissions

---

## Common Tasks

### Task 1: Add a New Sale

```
1. Go to: /sales-dashboard/add-record
   OR
   Click "Add Sale" from sidebar

2. Add First Product:
   - Product Name: "Laptop XYZ"
   - Category: Select from dropdown
   - Unit Price: 50000
   - Quantity: 2
   - Deal Notes: "Corporate client" (optional)

3. Add More Products (up to 20):
   Click "Add Product" and repeat step 2

4. Enable Deductions (optional):
   ☐ Enable VAT
     Rate: 10%

   ☐ Enable EO/BP
     Amount: 5000
     Reason: "Bulk purchase"

5. Upload Proof of Sale:
   Click "Choose Files"
   Select files (JPG, PNG, PDF)
   Max 10 files, 10MB each

6. Review:
   - Check all product details
   - Verify total amount
   - Check deduction settings

7. Submit:
   Click "Submit Sale"

8. Result:
   - Sale created
   - Status: "Manager Review Pending"
   - Manager notified
```

### Task 2: Check My Commission Status

```
1. Go to: /sales-dashboard/commissions

2. View Commissions List:
   - See all commissions
   - Check payment status column
   - "⏳ Pending" = Awaiting finance payment
   - "✓ Paid" = Payment processed

3. Click on any commission:
   - View detailed breakdown
   - See sale amount
   - See deduction details
   - See final commission amount

4. Check Wallet:
   - Go to: /sales-dashboard/wallet
   - See current balance
   - See pending commissions
   - See transaction history
```

### Task 3: View My Target Progress

```
1. Go to: /sales-dashboard/targets

2. View Target Details:
   - Target amount: ৳100,000
   - Current sales: ৳50,000
   - Achievement: 50%
   - Progress bar: Half filled

3. View Commission Tier:
   - Current tier: Bronze (0-100%)
   - Commission rate: 3%
   - Next tier: Silver (100-150%)
```

### Task 4: Contact My Manager

```
1. Go to: /sales-dashboard/manager-info

2. View Manager Details:
   - Name: [Manager's name]
   - Email: [Manager's email]
   - Phone: [Manager's phone]
   - Employee ID: [Manager's ID]

3. Contact Options:
   - Click email to send email
   - Copy phone number to call
```

---

## Understanding Your Data

### How Your Sales Flow Through Tables

```
YOU CREATE SALE
    ↓
┌─────────────────────────────────────┐
│ SalesRecord Collection               │
│ ──────────────────────────────────  │
│ employeeId: "00005" (you)            │
│ managerId: "00003" (your manager)    │
│                                     │
│ products[]:                          │
│   - Product A, ৳50,000               │
│   - Product B, ৳30,000               │
│ totalSaleAmount: ৳80,000             │
│                                     │
│ approvalStatus: "Pending"           │
│ accountantStatus: "Pending"         │
│ paymentStatus: "Pending"            │
│                                     │
│ commission: null (not calculated)   │
└─────────────────────────────────────┘
    ↓
MANAGER APPROVES
    ↓
┌─────────────────────────────────────┐
│ SalesRecord Updated                 │
│ ──────────────────────────────────  │
│ approvalStatus: "Approved"          │
│ approvedBy: "00003"                 │
│ approvedAt: [Date]                  │
│                                     │
│ calculatedCommission: ৳2,400        │
│ commission: ৳2,400                  │
└─────────────────────────────────────┘
    ↓
ACCOUNTANT APPROVES (with deductions)
    ↓
┌─────────────────────────────────────┐
│ SalesRecord Updated                 │
│ ──────────────────────────────────  │
│ accountantStatus: "Approved"        │
│                                     │
│ eoBpAmount: ৳5,000                  │
│ vatAmount: ৳3,750                   │
│ taxAmount: ৳1,425                   │
│                                     │
│ finalCommission: ৳2,100             │
│ commission: ৳2,100 (net payout)      │
│ paymentStatus: "Pending"            │
└─────────────────────────────────────┘
    ↓
FINANCE PROCESSES PAYMENT
    ↓
┌─────────────────────────────────────┐
│ SalesRecord Updated                 │
│ ──────────────────────────────────  │
│ paymentStatus: "Paid"               │
│ paidAt: [Date]                      │
│ paidBy: "00006"                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Wallet Updated                      │
│ ──────────────────────────────────  │
│ employeeId: "00005" (you)            │
│ balance: ৳[previous] + ৳2,100        │
│ totalEarned: ৳[previous] + ৳2,100    │
│                                     │
│ transactions[]:                      │
│   {                                  │
│     type: "credit",                  │
│     amount: ৳2,100,                  │
│     salesRecordId: "...",            │
│     date: [Date],                    │
│     description: "Commission..."     │
│   }                                  │
└─────────────────────────────────────┘
```

### Status Labels You'll See

| Label | Color | Meaning | Next Step |
|-------|-------|---------|-----------|
| Manager Review Pending | Yellow | Awaiting manager | Manager will review |
| Manager Approved | Blue | Manager approved | Accountant will review |
| Eligible for Commission | Purple | Ready for payment | Finance will pay |
| Commission Paid | Green | Payment complete | In your wallet |
| Rejected | Red | Sale rejected | Contact manager |

---

## Dashboard Pages Overview

### Main Dashboard (`/sales-dashboard`)
- **Shows:** Performance overview, stats cards, recent activity
- **Refresh:** Auto-refreshes every 30 seconds
- **Manual Refresh:** Click "Refresh" button

### Sales Records (`/sales-dashboard/records`)
- **Shows:** All your sales records
- **Filters:** Status, category, product, date range, amount
- **Actions:** View details, export

### Add Sale (`/sales-dashboard/add-record`)
- **Purpose:** Create new sales record
- **Products:** Up to 20 products per sale
- **Proof:** Upload files for verification

### My Targets (`/sales-dashboard/targets`)
- **Shows:** Your assigned targets
- **Progress:** Visual progress bar
- **Achievement:** Percentage calculation

### My Commissions (`/sales-dashboard/commissions`)
- **Shows:** All your commissions
- **Status:** Payment tracking
- **Details:** Commission breakdown

### Manager Info (`/sales-dashboard/manager-info`)
- **Shows:** Your manager's contact details
- **Purpose:** Quick access to manager

### Wallet (`/sales-dashboard/wallet`)
- **Shows:** Balance, transactions
- **History:** All financial movements

---

## Tips for Sales Executives

1. **Always add proof of sale** - Increases approval chances
2. **Fill accurate product details** - Helps manager verify
3. **Check deduction settings** - Affects final commission
4. **Monitor your targets** - Know your achievement tier
5. **Track commission status** - Know when to expect payment
6. **Keep manager informed** - Contact for any issues

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Sale not appearing | Check status (may be rejected) |
| Commission wrong | Contact accountant |
| Wallet not updated | Payment may be pending |
| Cannot edit sale | May already be approved |
| Manager not responding | Check manager info for contact |

---

**Related Documentation:**
- `ROLE_BASED_WORKFLOW_GUIDE.md` - Complete system overview
- `DATA_FLOW_REFERENCE.md` - How data flows
- `APPROVAL_WORKFLOW_REFERENCE.md` - Approval stages

**Last Updated:** April 19, 2026
**Version:** 1.0
