# Finance - Complete TODO & Feature Guide

## Role Overview

- **Hierarchy Level:** 2.5/5 (Financial processing)
- **Dashboard URL:** `/finance`
- **Reports To:** Admin
- **Manages:** Payment processing and wallets

**Purpose:** Payment processors who payout approved commissions and manage wallet transactions.

---

## What This Role Can Do

### ✅ Create/Add
- N/A (Processing role only)

### ✅ View/Read
- All sales records (read-only)
- All commissions (read-only)
- All wallets (read-only)
- Payment history
- Financial reports

### ✅ Edit/Update
- Payment status (set to "Paid")
- Wallet balances (credit/debit)
- Transaction records

### ✅ Process
- Commission payments
- Batch payments
- Wallet credits

### ❌ Cannot Do
- Approve commissions (accountant only)
- Modify commission amounts
- Reject commissions
- Manage users
- Modify commission rules

---

## Features Checklist

### 💳 Payments

- [ ] **View Payment Queue**
  - Go to: `/finance/payments`
  - See: All approved commissions awaiting payment
  - See: Executive name and amount
  - See: Commission breakdown
  - See: Deductions applied
  - Check: Wallet information

- [ ] **Process Single Payment**
  - Go to: Payments page
  - Click: "Process Payment" on a commission
  - Review: Payment details in dialog
  - Confirm: Payment amount and wallet
  - Click: "Confirm Payment"
  - Result: Wallet credited, status updated, executive notified

- [ ] **Process Batch Payments**
  - Go to: Payments page
  - Select: Multiple commissions (checkboxes)
  - Click: "Batch Process" button
  - Review: Total amount and commission count
  - Confirm: Batch payment
  - Result: All wallets credited, all statuses updated

### 📄 Sales Records

- [ ] **View All Sales Records**
  - Go to: `/finance/sales-records`
  - See: All sales in system (read-only)
  - Filter: By status, employee, date
  - Search: By product or company
  - Export: As Excel
  - View: Detailed breakdown

### 💰 Commissions

- [ ] **View All Commissions**
  - Go to: `/finance/commissions`
  - See: All commissions
  - Filter: By status (Pending/Paid)
  - Filter: By employee
  - Filter: By date range
  - See: Eligibility status
  - See: Payment status

- [ ] **View Approved Commissions**
  - Go to: `/finance/approved`
  - See: Only accountant-approved commissions
  - See: Ready for payment
  - Filter: By various criteria
  - Export: Payment report

### 📊 Analytics

- [ ] **View Financial Analytics**
  - Go to: `/finance/analytics`
  - See: Payment trends
  - See: Total payouts
  - See: Monthly statistics
  - See: Commission breakdown

### 💳 Wallets

- [ ] **View Wallet Balances**
  - Go to: `/finance/wallets`
  - See: All user wallets
  - See: Current balances
  - See: Pending balances
  - See: Total earned
  - See: Transaction counts

- [ ] **View Wallet Transactions**
  - Go to: Wallets page
  - Click: On any wallet
  - See: Transaction history
  - See: Credit/debit entries
  - See: Transaction dates
  - See: Linked sales records

### 🔔 Notifications

- [ ] **View Notifications**
  - Click: Bell icon (top right)
  - See: New payment requests
  - See: Payment confirmations
  - See: System alerts

---

## In The Approval Workflow

### Stage: 4 of 4 (Final Stage)

**What You Do:**
- Review approved commissions
- Process payments
- Credit user wallets
- Record payment details

**Input:**
- Accountant-approved commission
- Final commission amount
- Executive's wallet

**Output:**
- Payment status set to "Paid"
- Wallet balance increased
- Transaction recorded
- Executive notified

**Workflow:** Complete (no further stages)

---

## Payment Processing Workflow

### Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  PAYMENT PROCESSING WORKFLOW                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  YOU CLICK "PROCESS PAYMENT"                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. Find approved commission                            │  │
│  │ 2. Click "Process Payment"                             │  │
│  │ 3. Review payment details                              │  │
│  │ 4. Confirm payment                                     │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                     │
│  SYSTEM PROCESSES PAYMENT                                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Step 1: Update SalesRecord                            │  │
│  │   paymentStatus: "Paid"                               │  │
│  │   paidAt: [Current timestamp]                         │  │
│  │   paidBy: [Your user ID]                              │  │
│  │                                                        │  │
│  │ Step 2: Find or Create Wallet                         │  │
│  │   employeeId: [Executive's ID]                        │  │
│  │   balance: [Current + commission]                     │  │
│  │   totalEarned: [Current + commission]                 │  │
│  │                                                        │  │
│  │ Step 3: Add Transaction                               │  │
│  │   type: "credit"                                      │  │
│  │   amount: [Commission amount]                         │  │
│  │   salesRecordId: [Sale ID]                            │  │
│  │   date: [Current timestamp]                            │  │
│  │   description: "Commission from sale"                  │  │
│  │   balance: [New balance]                               │  │
│  │                                                        │  │
│  │ Step 4: Notify Executive                              │  │
│  │   In-app: "Commission Paid!"                          │  │
│  │   Email: Payment confirmation                         │  │
│  │   Socket.IO: commission:paid                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  RESULT: Wallet credited, executive notified              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Wallet Credit Code

```javascript
async function processPayment(salesRecord) {
  // 1. Find or create wallet
  let wallet = await Wallet.findOne({
    employeeId: salesRecord.employeeId
  });

  if (!wallet) {
    wallet = await Wallet.create({
      employeeId: salesRecord.employeeId,
      balance: 0,
      pendingBalance: 0,
      totalEarned: 0,
      transactions: []
    });
  }

  // 2. Get commission amount
  const commission = salesRecord.commission;

  // 3. Credit the wallet
  wallet.balance += commission;
  wallet.totalEarned += commission;
  wallet.pendingBalance -= commission;

  // 4. Add transaction record
  wallet.transactions.push({
    type: "credit",
    amount: commission,
    salesRecordId: salesRecord._id,
    date: new Date(),
    description: `Commission from sale`,
    balance: wallet.balance
  });

  // 5. Save wallet
  await wallet.save();

  // 6. Update sales record
  salesRecord.paymentStatus = "Paid";
  salesRecord.paidAt = new Date();
  salesRecord.paidBy = currentUser.id;
  await salesRecord.save();

  return wallet;
}
```

---

## Data Access

### Tables You Can Read

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | All (read-only) | All fields |
| **Wallet** | All | All fields |
| **CommissionCalculation** | All (read-only) | All fields |
| **User** | All (read-only) | Name, email, role |
| **CommissionRule** | All (read-only) | All fields |

### Tables You Can Write

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | Approved only | paymentStatus, paidAt, paidBy |
| **Wallet** | All | balance, totalEarned, transactions[] |

### Fields You Can Modify

**SalesRecord (Payment Fields):**
- `paymentStatus` → "Paid" (only if "Pending")
- `paidAt` → Current timestamp
- `paidBy` → Your user ID

**Wallet (Payment Processing):**
- `balance` → Add commission amount
- `totalEarned` → Add commission amount
- `pendingBalance` → Subtract commission amount
- `transactions[]` → Push new credit entry

### Fields You Cannot Touch

**Protected Fields (other roles):**
- `approvalStatus` (manager only)
- `accountantStatus` (accountant only)
- `commission`, `finalCommission` (accountant only)
- `calculatedCommission` (system only)
- Deduction fields (accountant only)

---

## Common Tasks

### Task 1: Process a Single Payment

```
1. Go to: /finance/payments

2. Find Commission:
   - Look through payment queue
   - Check executive name
   - Check commission amount
   - Verify accountant approval

3. Click "Process Payment":
   - Opens confirmation dialog

4. Review Details:
   ┌─────────────────────────────────────┐
   │  Process Payment Confirmation       │
   ├─────────────────────────────────────┤
   │  Executive: Jamal Hassan             │
   │  Employee ID: 00005                 │
   │                                     │
   │  Commission: ৳4,061                │
   │  Sale Amount: ৳81,225 (net)        │
   │                                     │
   │  Wallet Update:                     │
   │  Before: ৳13,000                    │
   │  After:  ৳17,061                    │
   │                                     │
   │  [Cancel]  [Confirm Payment]       │
   └─────────────────────────────────────┘

5. Click "Confirm Payment"

6. Result:
   - SalesRecord.paymentStatus = "Paid"
   - Wallet.balance increased by ৳4,061
   - Transaction added to wallet
   - Executive notified
   - Payment marked as complete
```

### Task 2: Process Batch Payments

```
1. Go to: /finance/payments

2. Select Commissions:
   - Check boxes for multiple commissions
   - Or click "Select All"

3. Review Selection:
   - See: Number of selected payments
   - See: Total amount to be paid
   - See: List of executives

4. Click "Batch Process"

5. Confirm Batch:
   ┌─────────────────────────────────────┐
   │  Batch Payment Confirmation        │
   ├─────────────────────────────────────┤
   │  Payments: 5 commissions           │
   │  Total Amount: ৳25,000             │
   │                                     │
   │  Executives:                        │
   │  • Jamal Hassan: ৳4,061            │
   │  • Karim Rahman: ৳5,200            │
   │  • Rahim Ali: ৳6,100               │
   │  • ...                              │
   │                                     │
   │  [Cancel]  [Confirm All]           │
   └─────────────────────────────────────┘

6. Click "Confirm All"

7. Result:
   - All 5 payments processed
   - All 5 wallets credited
   - All 5 executives notified
   - Payment history updated
```

### Task 3: View Payment History

```
1. Go to: /finance/payments

2. Switch to "History" tab:
   - See all processed payments
   - Sort by date (newest first)
   - See payment status: "✓ Paid"

3. Filter History:
   - By Date Range: Set start/end dates
   - By Executive: Select from dropdown
   - By Amount: Set min/max range

4. Export History:
   - Click "Export" button
   - Select "Export as Excel"
   - File downloads with all data
```

### Task 4: Check Wallet Details

```
1. Go to: /finance/wallets

2. Find Wallet:
   - Search by executive name
   - Or filter by balance range

3. Click on Wallet:
   - See: Current balance
   - See: Total earned
   - See: Transaction count

4. View Transactions:
   - See: All credit/debit entries
   - Sort by date
   - Filter: By type, by date range
   - See: Linked sales record IDs

5. Export Transactions:
   - Click "Export" on wallet
   - Download transaction history
```

---

## Understanding Your Data

### How Payment Processing Updates Tables

```
YOU PROCESS PAYMENT
    ↓
┌─────────────────────────────────────┐
│ SalesRecord Updated                 │
│ ──────────────────────────────────  │
│ paymentStatus: "Paid"               │ ← YOU SET THIS
│ paidAt: 2026-04-19T11:00:00Z       │ ← SET BY SYSTEM
│ paidBy: "00006"                     │ ← YOUR ID
│                                     │
│ (Other fields unchanged)             │
│ - approvalStatus: "Approved"        │
│ - accountantStatus: "Approved"      │
│ - commission: 4,061                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Wallet Updated                      │
│ ──────────────────────────────────  │
│ employeeId: "00005"                 │
│ balance: 17,061                     │ ← WAS 13,000, +4,061
│ pendingBalance: 0                   │ ← WAS 4,061, -4,061
│ totalEarned: 28,154                 │ ← WAS 24,093, +4,061
│                                     │
│ transactions[]:                     │
│   {                                 │
│     type: "credit",                 │
│     amount: 4,061,                  │
│     salesRecordId: "...",           │
│     date: 2026-04-19T11:00:00Z,     │
│     description: "Commission...",   │
│     balance: 17,061                 │
│   }                                 │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Notifications Sent                  │
│ ──────────────────────────────────  │
│ Executive (In-app):                 │
│   "Commission Paid! ৳4,061          │
│    credited to your wallet"         │
│                                     │
│ Executive (Email):                  │
│   Subject: "Payment Confirmation"    │
│   Body: Commission details           │
│                                     │
│ Socket.IO:                          │
│   commission:paid                   │
│   wallet:credited                   │
└─────────────────────────────────────┘
```

### Payment Status Flow

| Status | Set By | When | Meaning |
|--------|--------|------|---------|
| "Pending" | Accountant | After approval | Ready for payment |
| "Paid" | Finance | After processing | Payment complete |

**Note:** Finance can only change status from "Pending" to "Paid"

---

## Dashboard Pages Overview

### Main Dashboard (`/finance`)
- **Shows:** Financial overview
- **Stats:** Pending payments, processed this month, total processed
- **Auto-refresh:** Every 30 seconds

### Payments (`/finance/payments`)
- **Shows:** Payment queue and history
- **Tabs:** Pending / History
- **Actions:** Process single/batch

### Sales Records (`/finance/sales-records`)
- **Shows:** All sales (read-only)
- **Purpose:** Reference and verification
- **Filters:** Multiple options

### Commissions (`/finance/commissions`)
- **Shows:** All commissions
- **Purpose:** Verification before payment
- **Filters:** Status, employee, date

### Approved (`/finance/approved`)
- **Shows:** Ready-to-pay commissions
- **Purpose:** Payment queue only
- **Actions:** Process payments

### Analytics (`/finance/analytics`)
- **Shows:** Financial trends
- **Charts:** Payment statistics
- **Reports:** Monthly breakdowns

### Wallets (`/finance/wallets`)
- **Shows:** All user wallets
- **Details:** Balances, transactions
- **Actions:** View transaction history

---

## Tips for Finance

1. **Verify before paying** - Check commission details
2. **Process in batches** - More efficient
3. **Keep records** - Export payment history
4. **Double-check amounts** - Verify calculations
5. **Communicate issues** - Report problems promptly
6. **Monitor wallets** - Ensure correct credits

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot process payment | Check if already paid |
| Wallet not found | System auto-creates |
| Wrong amount credited | Check commission field |
| Executive not notified | Check notification system |
| Duplicate payment | Check paymentStatus first |

---

## Payment Best Practices

### DO ✅
- Verify commission amount
- Check wallet exists
- Process in batches when possible
- Keep payment records
- Notify on issues
- Double-check details

### DON'T ❌
- Pay without verifying
- Skip confirmation
- Ignore warnings
- Pay rejected commissions
- Process duplicate payments
- Forget to record details

---

**Related Documentation:**
- `ROLE_BASED_WORKFLOW_GUIDE.md` - Complete system overview
- `DATA_FLOW_REFERENCE.md` - How data flows
- `APPROVAL_WORKFLOW_REFERENCE.md` - Approval stages

**Last Updated:** April 19, 2026
**Version:** 1.0
