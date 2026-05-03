# Sales Manager - Complete TODO & Feature Guide

## Role Overview

- **Hierarchy Level:** 3/5 (Middle management)
- **Dashboard URL:** `/sales-manager`
- **Reports To:** Admin
- **Manages:** Sales Executives (team members)

**Purpose:** Team leaders who approve sales, manage team members, and track team performance.

---

## What This Role Can Do

### ✅ Create/Add
- Own sales records (auto-approved)
- Team members (add/remove)
- Team targets

### ✅ View/Read
- Own sales and commissions
- Team sales records
- Team performance analytics
- Team member targets
- Team commission breakdown
- Own wallet

### ✅ Edit/Update
- Team member information
- Team targets
- Own sales (before approval)

### ✅ Approve/Reject
- Team sales records
- Team member commissions

### ❌ Cannot Do
- Modify commission rules
- Process payments
- Access system settings
- Manage other roles

---

## Features Checklist

### ✅ Pending Approvals

- [ ] **Review Pending Sales**
  - Go to: `/sales-manager/pending-approvals`
  - See: All pending sales from team
  - Click: Eye icon to view details
  - Check: Product information
  - Check: Proof of sale files
  - View: Calculated commission

- [ ] **Approve Sale**
  - Go to: Pending Approvals page
  - Select: Sale to approve
  - Review: All details
  - Click: "Approve" button
  - Confirm: Approval in dialog
  - Result: Commission calculated, accountant notified

- [ ] **Reject Sale**
  - Go to: Pending Approvals page
  - Select: Sale to reject
  - Click: "Reject" button
  - Enter: Rejection reason (required)
  - Click: "Confirm Reject"
  - Result: Executive notified with reason

### 👥 Team Management

- [ ] **View Team Members**
  - Go to: `/sales-manager/team`
  - See: All team members list
  - See: Each member's performance
  - See: Sales totals
  - See: Achievement percentages

- [ ] **Add Team Member**
  - Go to: Team page
  - Click: "Add Member" button
  - Fill: Member details
  - Set: Initial target
  - Click: "Add Member"
  - Result: New team member added

- [ ] **Remove Team Member**
  - Go to: Team page
  - Find: Member to remove
  - Click: "Remove" button
  - Confirm: Removal
  - Result: Member removed from team

### 💰 Commissions

- [ ] **View My Commissions**
  - Go to: `/sales-manager/my-commissions`
  - See: Own commission breakdown
  - See: Monthly totals
  - See: Payment status
  - See: Commission age

- [ ] **Approve Team Commissions**
  - Go to: `/sales-manager/commissions`
  - See: Pending tab
  - Review: Team member commissions
  - Click: "Approve" or "Reject"
  - Add: Notes (optional)
  - Result: Status updated

### 📊 Team Dashboard

- [ ] **View Team Performance**
  - Go to: `/sales-manager/team-dashboard`
  - See: Team size
  - See: Total team sales
  - See: Total team commission
  - See: Average achievement

### 📈 Team Sales

- [ ] **View Team Sales History**
  - Go to: `/sales-manager/team-sales`
  - See: All team sales
  - Filter: By team member
  - Filter: By date range
  - Filter: By status
  - Export: As Excel

### 💳 Wallet

- [ ] **View Own Wallet**
  - Go to: `/sales-manager/wallet`
  - See: Current balance
  - See: Total earned
  - See: Transaction history

### 🔔 Notifications

- [ ] **View Notifications**
  - Click: Bell icon (top right)
  - See: Approval requests
  - See: Commission updates
  - See: System notifications

---

## In The Approval Workflow

### Stage: 2 of 4 (Second Stage)

**What You Do:**
- Review team sales records
- Verify product details and pricing
- Check proof of sale
- Approve or reject sales
- Commission auto-calculated on approval

**Input:**
- Sales record from executive
- Proof of sale files
- Product details

**Output:**
- Approved: Commission calculated, accountant notified
- Rejected: Executive notified with reason

**Next:**
- Accountant reviews and applies deductions

---

## Data Access

### Tables You Can Read

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | Team + Own | All fields (team records) |
| **Wallet** | Own only | All fields (own wallet only) |
| **CommissionCalculation** | Team + Own | All fields |
| **User** | Team + Own | Name, email, role, targets |
| **UserTarget** | Team + Own | All fields |
| **CommissionRule** | All (read-only) | All fields |

### Tables You Can Write

| Table | Access | Fields |
|-------|--------|--------|
| **SalesRecord** | Own only | Can create own (auto-approved) |
| **SalesRecord** | Team | approvalStatus, approvedBy, approvedAt |
| **User** | Team | Can add/remove team members |
| **UserTarget** | Team | Can set team targets |
| **Wallet** | Own only | Cannot modify (read-only) |

### Fields You Can Modify

**Team Sales Records:**
- `approvalStatus` (Pending → Approved/Rejected)
- `approvedBy` (your ID)
- `approvedAt` (timestamp)

**Team Members:**
- Manager assignment
- Target amounts

**Own Sales Records:**
- All fields (before approval)

### Fields You Cannot Touch

**Protected Fields (system-controlled):**
- `accountantStatus` (accountant only)
- `finalCommission` (accountant only)
- `taxAmount` (accountant only)
- `paymentStatus` (finance only)
- `paidAt`, `paidBy` (finance only)

**Other Data:**
- Other managers' teams
- Admin-level configuration
- Commission rules

---

## Common Tasks

### Task 1: Approve a Sale

```
1. Go to: /sales-manager/pending-approvals

2. Find Sale:
   - Look through pending sales list
   - Check executive name
   - Check sale amount
   - Check date

3. Review Details:
   Click "View" icon
   - Review product information
   - Check quantities and prices
   - View proof of sale files
   - Read executive notes

4. Check Commission:
   - See calculated commission amount
   - Verify commission rate
   - Check achievement percentage

5. Make Decision:

   To Approve:
   - Click "Approve" button
   - Click "Confirm" in dialog
   - Result: Commission calculated, accountant notified

   To Reject:
   - Click "Reject" button
   - Enter reason (required)
   - Click "Confirm Reject"
   - Result: Executive notified
```

### Task 2: Add Team Member

```
1. Go to: /sales-manager/team

2. Click "Add Member" button

3. Fill Member Details:
   - Name: [Full name]
   - Email: [Email address]
   - Employee ID: [5-digit ID]
   - Role: Sales Executive (automatic)
   - Initial Target: [Amount]

4. Assign to Team:
   - Member automatically assigned to you

5. Click "Add Member"

6. Result:
   - New team member created
   - Target assigned
   - Member can now log in
```

### Task 3: Set Team Target

```
1. Go to: /sales-manager/team

2. Find Team Member:
   - Scroll through list
   - Find member to update

3. Click "Set Target" button

4. Fill Target Details:
   - Target Amount: [e.g., 100000]
   - Period: [e.g., 2026-04]
   - Start Date: [Period start]
   - End Date: [Period end]

5. Click "Save Target"

6. Result:
   - Target assigned to member
   - Member can view in their dashboard
   - Commission calculation uses target
```

### Task 4: View Team Performance

```
1. Go to: /sales-manager/team-dashboard

2. View Stats Cards:
   - Team Size: Number of members
   - Total Team Sales: Combined sales
   - Total Commission: Combined earnings
   - Average Achievement: Team average

3. View Top Performers:
   - See top 5 team members
   - Compare sales totals
   - Compare achievements

4. View Team Members Table:
   - See all members
   - See individual sales
   - See achievement percentages
   - See commission amounts
```

### Task 5: Add Own Sale (Auto-Approved)

```
1. Go to: /sales-manager/add-record

2. Add Products:
   - Add product details
   - Set quantities and prices
   - Add multiple products if needed

3. Enable Deductions (optional):
   - VAT percentage
   - EO/BP amount + reason

4. Upload Proof:
   - Add proof files

5. Click "Submit Sale"

6. Result:
   - Sale created
   - approvalStatus: "Approved" (auto)
   - Commission calculated immediately
   - Accountant notified directly
```

---

## Understanding Your Data

### How Your Approvals Flow

```
YOU APPROVE SALE
    ↓
┌─────────────────────────────────────┐
│ SalesRecord Updated                 │
│ ──────────────────────────────────  │
│ employeeId: "00005" (executive)      │
│ managerId: "00003" (you)             │
│                                     │
│ approvalStatus: "Approved"          │ ← YOU SET THIS
│ approvedBy: "00003"                 │ ← YOUR ID
│ approvedAt: [Timestamp]             │ ← YOUR ACTION
│                                     │
│ calculatedCommission: ৳2,400        │ ← AUTO-CALCULATED
│ commission: ৳2,400                  │ ← INITIALLY SET
└─────────────────────────────────────┘
    ↓
ACCOUNTANT NOTIFIED
    ↓
┌─────────────────────────────────────┐
│ Accountant Reviews                  │
│ ──────────────────────────────────  │
│ - Applies deductions                │
│ - Sets finalCommission             │
│ - Sets accountantStatus             │
│ - Notifies finance                   │
└─────────────────────────────────────┘
    ↓
FINANCE PROCESSES PAYMENT
    ↓
┌─────────────────────────────────────┐
│ Executive's Wallet Updated          │
│ ──────────────────────────────────  │
│ balance: +৳2,400 (minus deductions)  │
│ transactions[]: New credit entry     │
└─────────────────────────────────────┘
```

### Commission Calculation You Trigger

When you approve a sale, the system automatically calculates commission:

```javascript
// 1. Get total sales from record
const totalSales = record.totalSaleAmount;

// 2. Get executive's target
const target = await UserTarget.findOne({
  userId: record.employeeId
});
const targetAmount = target.targetAmount;

// 3. Calculate achievement
const achievement = (totalSales / targetAmount) * 100;

// 4. Get commission rule
const rule = await CommissionRule.findOne({
  targetPercentageFrom: { $lte: achievement },
  targetPercentageTo: { $gte: achievement }
});

// 5. Calculate commission
const commission = (totalSales * rule.commissionRate) / 100;

// Example:
// totalSales = ৳80,000
// targetAmount = ৳100,000
// achievement = 80%
// rule.commissionRate = 3% (Bronze tier)
// commission = (80,000 × 3) / 100 = ৳2,400
```

### Commission Tiers

| Achievement | Rate | Tier |
|-------------|------|------|
| 0-100% | 3% | Bronze |
| 100-150% | 5% | Silver |
| 150-200% | 7% | Gold |
| 200%+ | 10% | Platinum |

**Note:** Executive's achievement determines tier, not yours.

---

## Dashboard Pages Overview

### Main Dashboard (`/sales-manager`)
- **Shows:** Team performance overview
- **Stats:** Team size, sales, commission, achievement
- **Auto-refresh:** Every 30 seconds

### Pending Approvals (`/sales-manager/pending-approvals`)
- **Shows:** Sales awaiting your approval
- **Actions:** Approve/Reject with reason
- **Details:** Product info, proof, commission

### My Commissions (`/sales-manager/my-commissions`)
- **Shows:** Your own commissions
- **Breakdown:** Monthly totals
- **Status:** Payment tracking

### Commission Approvals (`/sales-manager/commissions`)
- **Shows:** Team commission approvals
- **Tabs:** Pending/Approved
- **Actions:** Approve/Reject team commissions

### Team (`/sales-manager/team`)
- **Shows:** All team members
- **Actions:** Add/Remove members
- **Details:** Performance per member

### Team Dashboard (`/sales-manager/team-dashboard`)
- **Shows:** Team analytics
- **Stats:** Combined team metrics
- **Top Performers:** Leaderboard

### Team Sales (`/sales-manager/team-sales`)
- **Shows:** All team sales records
- **Filters:** By member, date, status
- **Export:** Excel available

---

## Tips for Sales Managers

1. **Review promptly** - Keep approval queue short
2. **Check proof carefully** - Verify sale authenticity
3. **Provide feedback** - Help executives improve
4. **Monitor team performance** - Identify top performers
5. **Set realistic targets** - Based on past performance
6. **Communicate regularly** - Keep team informed

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot approve sale | May be already approved/rejected |
| Commission seems wrong | Check achievement percentage |
| Team member not showing | Check if removed from team |
| Cannot find sale | Check filters and date range |
| Auto-approval not working | Check if you're logged in as manager |

---

## Approval Best Practices

### DO ✅
- Review all product details
- Verify proof of sale
- Check calculation accuracy
- Provide clear rejection reasons
- Approve promptly

### DON'T ❌
- Approve without reviewing
- Reject without explanation
- Ignore pending approvals
- Skip proof verification
- Approve suspicious sales

---

**Related Documentation:**
- `ROLE_BASED_WORKFLOW_GUIDE.md` - Complete system overview
- `DATA_FLOW_REFERENCE.md` - How data flows
- `APPROVAL_WORKFLOW_REFERENCE.md` - Approval stages

**Last Updated:** April 19, 2026
**Version:** 1.0
