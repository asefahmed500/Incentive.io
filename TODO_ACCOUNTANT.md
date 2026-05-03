# Accountant - Complete TODO & Feature Guide

## Role Overview

- **Hierarchy Level:** 2/5 (Financial management)
- **Dashboard URL:** `/accountant`
- **Reports To:** Admin
- **Manages:** Commissions and deductions

**Purpose:** Financial approvers who finalize commissions, apply deductions, and prepare payments.

---

## What This Role Can Do

### ✅ Create/Add
- N/A (Review role only)

### ✅ View/Read
- All sales records (all users)
- All commissions (all users)
- All wallets (all users)
- Commission rules
- Financial reports

### ✅ Edit/Update
- Commission amounts (final override)
- Deduction amounts (EO/BP, VAT, Tax)
- Commission approval status

### ✅ Approve/Reject
- Manager-approved sales
- Commission calculations
- Final payout amounts

### ❌ Cannot Do
- Process payments (finance only)
- Modify commission rules
- Manage users
- Access system settings

---

## Features Checklist

### ✅ Approvals

- [ ] **View Pending Approvals**
  - Go to: `/accountant/approvals`
  - See: All manager-approved sales
  - Review: Sale details
  - Review: Calculated commission
  - Check: Deduction history

- [ ] **Approve with Deductions**
  - Go to: Approvals page
  - Click: "Approve" on a sale
  - Apply: EO/BP deduction (amount + reason)
  - Apply: VAT deduction (percentage)
  - Apply: Tax deduction (percentage)
  - See: Real-time net sales calculation
  - Override: Final commission (optional)
  - Add: Notes (optional)
  - Click: "Approve"
  - Result: Commission finalized, finance notified

- [ ] **Reject Commission**
  - Go to: Approvals page
  - Click: "Reject" on a sale
  - Enter: Rejection reason (required)
  - Click: "Confirm Reject"
  - Result: Executive and manager notified

### 💰 Commissions

- [ ] **View All Commissions**
  - Go to: `/accountant/commissions`
  - See: All commissions in system
  - Filter: By status
  - Filter: By employee
  - Filter: By date range
  - Export: As Excel

- [ ] **View Commission Details**
  - Click: On any commission
  - See: Original sales amount
  - See: All deductions applied
  - See: Final commission amount
  - See: Payment status

### 💳 Payments

- [ ] **View Payment Queue**
  - Go to: `/accountant/payments`
  - See: Approved commissions awaiting finance
  - See: Total pending amount
  - See: Payment status tracking

- [ ] **View Payment History**
  - Go to: Payments page
  - See: All processed payments
  - Filter: By date range
  - Filter: By employee
  - Export: Payment report

### 📊 Records

- [ ] **View All Sales Records**
  - Go to: `/accountant/records`
  - See: All sales in system
  - Filter: By status
  - Filter: By employee
  - Filter: By category
  - Export: As Excel

### 📈 Analytics

- [ ] **View Financial Analytics**
  - Go to: `/accountant/analytics`
  - See: Commission trends
  - See: Payment statistics
  - See: Deduction breakdown
  - See: Employee totals

### 🔔 Notifications

- [ ] **View Notifications**
  - Click: Bell icon (top right)
  - See: New approval requests
  - See: Payment updates
  - See: System alerts

---

## In The Approval Workflow

### Stage: 3 of 4 (Third Stage)

**What You Do:**
- Review manager-approved sales
- Apply deductions (EO/BP, VAT, Tax)
- Calculate net sales amount
- Set final commission
- Approve for payment

**Input:**
- Manager-approved sales record
- Calculated commission (from manager stage)
- Deduction parameters

**Output:**
- Approved: Final commission set, finance notified
- Rejected: Executive and manager notified

**Next:**
- Finance processes payment and credits wallet

---

## Deduction Workflow

### Complete Deduction Calculation

```
┌─────────────────────────────────────────────────────────────┐
│              DEDUCTION CALCULATION STEP BY STEP             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  STEP 1: Original Sales Amount                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Total Sale:          ৳100,000                         │  │
│  │ Products:           10 items                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                     │
│  STEP 2: Less EO/BP (End Owner/Bulk Purchase)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ EO/BP Amount:        ৳5,000                          │  │
│  │ Reason:              "Bulk purchase discount"          │  │
│  │ Remaining:           ৳95,000                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                     │
│  STEP 3: Less VAT (Value Added Tax)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ VAT Rate:           10%                              │  │
│  │ VAT Amount:         ৳9,500                          │  │
│  │ Remaining:           ৳85,500                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                     │
│  STEP 4: Less Tax (Income Tax)                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Tax Rate:           5%                               │  │
│  │ Tax Amount:         ৳4,275                          │  │
│  │ Remaining:           ৳81,225                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                     │
│  STEP 5: Net Sales for Commission                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Net Sales:           ৳81,225                          │  │
│  │ Commission Base:     ৳81,225                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                     │
│  STEP 6: Final Commission (Payout)                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Commission Rate:    5% (Silver tier)                  │  │
│  │ Final Commission:   ৳4,061                           │  │
│  │                                                             │
│  │ NOTE: This is the NET PAYOUT after all deductions      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  FINAL RESULT: ৳4,061 credited to executive's wallet      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Deduction Fields

| Deduction | Type | Range | Purpose |
|-----------|------|-------|---------|
| **EO/BP** | Fixed amount | ≥ 0 | End-owner commission or bulk purchase discount |
| **VAT** | Percentage | 0-100% | Value Added Tax on sale |
| **Tax** | Percentage | 0-100% | Income tax on commission |

### Calculation Code

```javascript
function calculateCommissionWithDeductions(record, deductions) {
  // Start with total sales
  let netSales = record.totalSaleAmount;

  // Step 1: Subtract EO/BP
  netSales = netSales - deductions.eoBpAmount;

  // Step 2: Subtract VAT
  const vatAmount = (netSales * deductions.vatRate) / 100;
  netSales = netSales - vatAmount;

  // Step 3: Subtract Tax
  const taxAmount = (netSales * deductions.taxRate) / 100;
  netSales = netSales - taxAmount;

  // Step 4: Calculate commission on net sales
  const finalCommission = (netSales * deductions.commissionRate) / 100;

  // Net payout
  const netPayout = finalCommission;  // Already after tax

  return {
    netSales,
    vatAmount,
    taxAmount,
    finalCommission,
    netPayout
  };
}
```

---

## Data Access

### Tables You Can Read

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | All | All fields |
| **Wallet** | All | All fields |
| **CommissionCalculation** | All | All fields |
| **User** | All (read-only) | Name, email, role |
| **UserTarget** | All | All fields |
| **CommissionRule** | All (read-only) | All fields |

### Tables You Can Write

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | Approved sales | accountantStatus, deductions, finalCommission, commission |
| **Wallet** | Read only | Cannot modify (finance only) |

### Fields You Can Modify

**SalesRecord (Accountant Fields):**
- `accountantStatus` → "Approved" or "Rejected"
- `eoBpAmount` → EO/BP deduction amount
- `eoBpReason` → EO/BP reason
- `vatRate` → VAT percentage
- `vatAmount` → Calculated VAT amount
- `taxRate` → Tax percentage
- `taxAmount` → Calculated tax amount
- `finalCommission` → Gross commission
- `commission` → Net payout (final - tax)
- `paymentStatus` → "Pending" (ready for finance)
- `statusHistory` → Add accountant entry

### Fields You Cannot Touch

**Protected Fields (other roles):**
- `approvalStatus` (manager only)
- `approvedBy`, `approvedAt` (manager only)
- `paymentStatus` → "Paid" (finance only)
- `paidAt`, `paidBy` (finance only)

**System Fields:**
- `employeeId` (cannot change)
- `managerId` (cannot change)
- `products[]` (cannot modify)

---

## Common Tasks

### Task 1: Approve Commission with Deductions

```
1. Go to: /accountant/approvals

2. Find Sale:
   - Look through approved sales list
   - Check executive name
   - Check sale amount
   - Check manager's commission calculation

3. Click "Approve" Button:
   - Opens deduction form

4. Apply Deductions:

   Step 1 - EO/BP:
   - Amount: 5000
   - Reason: "Bulk purchase discount"
   - See: Remaining amount update

   Step 2 - VAT:
   - Rate: 10
   - See: VAT amount calculated
   - See: Remaining amount update

   Step 3 - Tax:
   - Rate: 5
   - See: Tax amount calculated
   - See: Net sales amount

   Step 4 - Commission:
   - See: Final commission calculated
   - Can override: Enter manual amount if needed

5. Add Notes (optional):
   - Enter any additional notes
   - Example: "Verified with client"

6. Click "Approve"

7. Result:
   - Commission finalized
   - Executive notified
   - Finance notified
   - Ready for payment
```

### Task 2: Reject Commission

```
1. Go to: /accountant/approvals

2. Find Sale:
   - Locate sale to reject

3. Click "Reject" Button

4. Enter Reason (required):
   - Example: "Incorrect product category"
   - Example: "Price verification needed"
   - Example: "Missing documentation"

5. Click "Confirm Reject"

6. Result:
   - Executive notified with reason
   - Manager notified
   - Status returns to pending
```

### Task 3: View All Commissions

```
1. Go to: /accountant/commissions

2. View List:
   - See all commissions
   - Check status column
   - Check amounts

3. Filter:
   - By Status: Pending, Approved, Paid, Rejected
   - By Employee: Select from dropdown
   - By Date: Set date range

4. Export:
   - Click "Export" button
   - Select "Export as Excel"
   - File downloads

5. View Details:
   - Click on any commission
   - See full breakdown
```

### Task 4: Check Payment Queue

```
1. Go to: /accountant/payments

2. View Pending:
   - See all approved commissions
   - Total pending amount shown
   - Ready for finance processing

3. Filter:
   - By Employee
   - By Date Range
   - By Amount Range

4. Track Status:
   - "Pending" = Awaiting finance
   - "Paid" = Payment processed
```

---

## Understanding Your Data

### How Your Approval Updates Tables

```
YOU APPROVE WITH DEDUCTIONS
    ↓
┌─────────────────────────────────────┐
│ SalesRecord Updated                 │
│ ──────────────────────────────────  │
│ approvalStatus: "Approved"          │ (from manager)
│ accountantStatus: "Approved"        │ ← YOU SET THIS
│                                     │
│ eoBpAmount: ৳5,000                  │ ← YOU SET THIS
│ eoBpReason: "Bulk purchase"          │ ← YOU SET THIS
│ vatRate: 10                         │ ← YOU SET THIS
│ vatAmount: ৳9,500                   │ ← CALCULATED
│ taxRate: 5                          │ ← YOU SET THIS
│ taxAmount: ৳4,275                   │ ← CALCULATED
│                                     │
│ finalCommission: ৳4,061             │ ← CALCULATED
│ commission: ৳4,061                  │ ← NET PAYOUT
│                                     │
│ paymentStatus: "Pending"            │ ← YOU SET THIS
│                                     │
│ statusHistory[]:                    │
│   {                                 │
│     status: "Accountant Approved",  │
│     changedBy: "00004",             │
│     changedAt: [Timestamp],         │
│     notes: "Approved with EO/BP"    │
│   }                                 │
└─────────────────────────────────────┘
    ↓
FINANCE NOTIFIED
    ↓
┌─────────────────────────────────────┐
│ Finance Processes Payment            │
│ ──────────────────────────────────  │
│ - Updates paymentStatus to "Paid"    │
│ - Credits executive's wallet         │
│ - Records paidAt timestamp           │
│ - Notifies executive                 │
└─────────────────────────────────────┘
```

### Commission Fields Explained

| Field | Set By | Purpose |
|-------|--------|---------|
| `calculatedCommission` | Manager (auto) | System-calculated amount (audit) |
| `finalCommission` | Accountant | Gross commission after deductions |
| `commission` | Accountant | Net payout (final - tax) |

**Important:** The `commission` field is what gets credited to the wallet.

---

## Dashboard Pages Overview

### Main Dashboard (`/accountant`)
- **Shows:** Financial overview
- **Stats:** Pending commissions, approved this month, payments pending
- **Auto-refresh:** Every 30 seconds

### Approvals (`/accountant/approvals`)
- **Shows:** Manager-approved sales
- **Actions:** Approve with deductions, reject
- **Real-time:** Deduction calculations

### Commissions (`/accountant/commissions`)
- **Shows:** All commissions
- **Filters:** Status, employee, date
- **Export:** Excel available

### Payments (`/accountant/payments`)
- **Shows:** Payment queue and history
- **Tracking:** Payment status
- **Details:** Commission breakdown

### Records (`/accountant/records`)
- **Shows:** All sales records
- **Filters:** Multiple options
- **Export:** Full data export

### Analytics (`/accountant/analytics`)
- **Shows:** Financial trends
- **Charts:** Commission trends, payment stats
- **Reports:** Deduction breakdown

---

## Tips for Accountants

1. **Verify calculations** - Double-check all math
2. **Document deductions** - Always provide reasons
3. **Review thoroughly** - Check manager's work
4. **Communicate clearly** - Use rejection reasons
5. **Process promptly** - Don't delay payments
6. **Stay consistent** - Apply rules fairly

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot approve sale | Check if already accountant-approved |
| Calculation seems wrong | Verify deduction amounts |
| Cannot find sale | Check if manager-approved |
| Override not working | Check commission amount field |
| Status not updating | Refresh page, check connection |

---

## Approval Best Practices

### DO ✅
- Apply deductions consistently
- Provide clear reasons
- Verify calculations
- Review thoroughly
- Process promptly

### DON'T ❌
- Skip deduction review
- Leave reasons blank
- Override without cause
- Delay approvals
- Make arbitrary changes

---

**Related Documentation:**
- `ROLE_BASED_WORKFLOW_GUIDE.md` - Complete system overview
- `DATA_FLOW_REFERENCE.md` - How data flows
- `APPROVAL_WORKFLOW_REFERENCE.md` - Approval stages

**Last Updated:** April 19, 2026
**Version:** 1.0
