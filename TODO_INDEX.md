# Role-Based TODO Lists - Master Index

**AlgoIncentive Sales CRM** - Complete Feature and Workflow Documentation

---

## 📚 Complete Documentation Set

This directory contains comprehensive TODO lists and workflow documentation for all 6 user roles in the AlgoIncentive Sales CRM system.

### Quick Access by Role

| Role | TODO File | Dashboard | Level |
|------|-----------|-----------|-------|
| **Sales Executive** | [TODO_SALES_EXECUTIVE.md](TODO_SALES_EXECUTIVE.md) | `/sales-dashboard` | 1/5 |
| **Sales Manager** | [TODO_SALES_MANAGER.md](TODO_SALES_MANAGER.md) | `/sales-manager` | 3/5 |
| **Accountant** | [TODO_ACCOUNTANT.md](TODO_ACCOUNTANT.md) | `/accountant` | 2/5 |
| **Finance** | [TODO_FINANCE.md](TODO_FINANCE.md) | `/finance` | 2.5/5 |
| **Admin** | [TODO_ADMIN.md](TODO_ADMIN.md) | `/admin` | 4/5 |
| **Administrator** | [TODO_ADMINISTRATOR.md](TODO_ADMINISTRATOR.md) | `/administrator` | 5/5 |

---

## 📖 Documentation Files

### Workflow & Data Flow Guides

| File | Purpose | Contents |
|------|---------|----------|
| **[ROLE_BASED_WORKFLOW_GUIDE.md](ROLE_BASED_WORKFLOW_GUIDE.md)** | Master overview | All 6 roles, 4-stage workflow, database relationships |
| **[DATA_FLOW_REFERENCE.md](DATA_FLOW_REFERENCE.md)** | Data flow explanation | How data moves through tables, status transitions |
| **[APPROVAL_WORKFLOW_REFERENCE.md](APPROVAL_WORKFLOW_REFERENCE.md)** | Approval details | Stage-by-stage breakdown, notifications |

### Individual Role TODO Lists

Each TODO file contains:
- ✅ Role overview and permissions
- ✅ Complete features checklist
- ✅ What user can do (create, view, edit, approve)
- ✅ What user cannot do
- ✅ Step-by-step instructions for common tasks
- ✅ Data access (tables they can read/write)
- ✅ Where they fit in the 4-stage workflow

---

## 🔄 Complete 4-Stage Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE APPROVAL WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STAGE 1: SALES EXECUTIVE                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Add sale (1-20 products)                                         │   │
│  │ • Enable deductions (VAT, EO/BP)                                    │   │
│  │ • Upload proof of sale                                              │   │
│  │ • Submit for approval                                               │   │
│  │                                                                     │   │
│  │ Status: "Manager Review Pending"                                  │   │
│  │ Next: Sales Manager                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  STAGE 2: SALES MANAGER                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Review sale and proof                                             │   │
│  │ • Approve or reject                                                │   │
│  │ • Commission auto-calculated                                       │   │
│  │                                                                     │   │
│  │ Status: "Manager Approved"                                        │   │
│  │ Next: Accountant                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  STAGE 3: ACCOUNTANT                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Apply deductions:                                                  │   │
│  │   1. EO/BP (fixed amount)                                         │   │
│  │   2. VAT (percentage)                                              │   │
│  │   3. Tax (percentage)                                              │   │
│  │ • Real-time net sales calculation                                   │   │
│  │ • Approve final commission                                          │   │
│  │                                                                     │   │
│  │ Status: "Eligible for Commission"                                 │   │
│  │ Next: Finance                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↓                                        │
│  STAGE 4: FINANCE                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ • Process payment                                                   │   │
│  │ • Credit executive's wallet                                        │   │
│  │ • Update payment status                                            │   │
│  │                                                                     │   │
│  │ Status: "Commission Paid"                                         │   │
│  │ Workflow: Complete                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Role Permissions Matrix

| Action | Executive | Manager | Accountant | Finance | Admin | Administrator |
|--------|-----------|---------|------------|---------|-------|---------------|
| **Add Sales** | Own | Own (auto-approve) | ❌ | ❌ | ❌ | ❌ |
| **View Sales** | Own | Team | All | All | All | All |
| **Approve Sales** | ❌ | Team | ❌ | ❌ | ❌ | ❌ |
| **Apply Deductions** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Process Payment** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Manage Users** | ❌ | ❌ | ❌ | ❌ | All (except admin) | All |
| **Commission Rules** | View | View | View | View | All | All |
| **Set Targets** | ❌ | Team | ❌ | ❌ | All | All |
| **System Settings** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Database Sync** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Backup/Restore** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 💡 How to Use These TODO Lists

### For New Users
1. Find your role's TODO file
2. Read the "Role Overview" section
3. Review "Features Checklist" for what you can do
4. Follow "Common Tasks" for step-by-step instructions

### For Training
1. Start with [ROLE_BASED_WORKFLOW_GUIDE.md](ROLE_BASED_WORKFLOW_GUIDE.md)
2. Read role-specific TODO file
3. Practice common tasks in test environment
4. Review [APPROVAL_WORKFLOW_REFERENCE.md](APPROVAL_WORKFLOW_REFERENCE.md) for approval stages

### For Troubleshooting
1. Check role-specific TODO file
2. Review "What This Role Can Do" section
3. Check "Troubleshooting" section
4. Verify permissions in matrix above

### For System Understanding
1. Read [ROLE_BASED_WORKFLOW_GUIDE.md](ROLE_BASED_WORKFLOW_GUIDE.md) for complete overview
2. Review [DATA_FLOW_REFERENCE.md](DATA_FLOW_REFERENCE.md) for data flow
3. Check [APPROVAL_WORKFLOW_REFERENCE.md](APPROVAL_WORKFLOW_REFERENCE.md) for approval details
4. Reference role TODO files for specific tasks

---

## 🔑 Key Concepts

### Commission Fields Explained

| Field | Set By | Purpose |
|-------|--------|---------|
| `calculatedCommission` | Manager (auto) | System-calculated amount (audit) |
| `finalCommission` | Accountant | Gross commission after deductions |
| `commission` | Accountant | Net payout (final - tax) |

### Status Fields

| Field | Set By | Values |
|-------|--------|--------|
| `approvalStatus` | Manager | Pending → Approved/Rejected |
| `accountantStatus` | Accountant | Pending → Approved/Rejected |
| `paymentStatus` | Finance | Pending → Paid |

### Deduction Order

```
Total Sales
    ↓
- EO/BP (Fixed amount)
    ↓
- VAT (Percentage)
    ↓
- Tax (Percentage)
    ↓
= Net Sales (used for commission)
```

---

## 📱 Dashboard URLs

| Role | Dashboard URL |
|------|---------------|
| Sales Executive | `/sales-dashboard` |
| Sales Manager | `/sales-manager` |
| Accountant | `/accountant` |
| Finance | `/finance` |
| Admin | `/admin` |
| Administrator | `/administrator` |

---

## 🎯 Quick Task Finder

### I want to...

**Add a sale:**
- Sales Executive: See [TODO_SALES_EXECUTIVE.md](TODO_SALES_EXECUTIVE.md) - Task 1

**Approve a sale:**
- Sales Manager: See [TODO_SALES_MANAGER.md](TODO_SALES_MANAGER.md) - Task 1

**Apply deductions:**
- Accountant: See [TODO_ACCOUNTANT.md](TODO_ACCOUNTANT.md) - Task 1

**Process payment:**
- Finance: See [TODO_FINANCE.md](TODO_FINANCE.md) - Task 1

**Create user:**
- Admin: See [TODO_ADMIN.md](TODO_ADMIN.md) - Task 1
- Administrator: See [TODO_ADMINISTRATOR.md](TODO_ADMINISTRATOR.md) - Task 1

**Set commission rule:**
- Admin: See [TODO_ADMIN.md](TODO_ADMIN.md) - Task 2

**Run database sync:**
- Administrator: See [TODO_ADMINISTRATOR.md](TODO_ADMINISTRATOR.md) - Task 2

**Create backup:**
- Administrator: See [TODO_ADMINISTRATOR.md](TODO_ADMINISTRATOR.md) - Task 3

---

## 📋 Document Contents Summary

### ROLE_BASED_WORKFLOW_GUIDE.md
- All 6 roles overview
- Role hierarchy levels
- 4-stage workflow diagram
- Database relationships
- Commission calculation formula
- Wallet system
- Notification flow

### DATA_FLOW_REFERENCE.md
- Stage-by-stage data changes
- Status field transitions
- When calculations happen
- Field-by-field reference
- Table relationships
- Data access by role

### APPROVAL_WORKFLOW_REFERENCE.md
- Stage-by-stage approval breakdown
- Who can approve what
- Required fields at each stage
- Notifications at each stage
- Error handling
- Rejection paths

### TODO_SALES_EXECUTIVE.md
- Add sales (up to 20 products)
- View own sales, targets, commissions
- View wallet balance
- Manager information
- Step-by-step tasks

### TODO_SALES_MANAGER.md
- Approve/reject team sales
- View team performance
- Manage team members
- Set team targets
- Add own sales (auto-approved)
- Step-by-step tasks

### TODO_ACCOUNTANT.md
- Approve commissions with deductions
- Apply EO/BP, VAT, Tax deductions
- Real-time net sales calculation
- View all commissions
- Payment queue management
- Step-by-step tasks

### TODO_FINANCE.md
- Process payments
- Credit wallets
- Batch payment processing
- View payment history
- Wallet management
- Step-by-step tasks

### TODO_ADMIN.md
- Manage all users (except administrators)
- Manage products and categories
- Create/edit commission rules
- Assign targets
- View analytics
- Step-by-step tasks

### TODO_ADMINISTRATOR.md
- All admin features PLUS:
- Manage other administrators
- System settings configuration
- Database synchronization
- Backup and restore operations
- System monitoring
- Step-by-step tasks

---

## ✅ What's Included

Each TODO file provides:
- ✅ Role overview and level
- ✅ Dashboard URL
- ✅ Complete permissions list
- ✅ Features checklist with instructions
- ✅ Approval workflow participation
- ✅ Data access (read/write permissions)
- ✅ Common tasks with step-by-step guides
- ✅ Troubleshooting section
- ✅ Best practices
- ✅ Related documentation links

---

## 🚀 Getting Started

1. **Identify your role** from the matrix above
2. **Open your TODO file** for detailed instructions
3. **Read the workflow guides** to understand the complete system
4. **Follow common tasks** for step-by-step guidance
5. **Reference this index** to find related information

---

## 📞 Support

For questions about:
- **Your role features**: Check your TODO file
- **Workflow process**: Check Approval Workflow Reference
- **Data flow**: Check Data Flow Reference
- **System overview**: Check Role-Based Workflow Guide

---

**Documentation Version:** 1.0
**Last Updated:** April 19, 2026
**Total Files:** 10 documents (3 guides + 6 role TODOs + 1 index)

---

## 📖 Recommended Reading Order

### For New Users
1. Start here: This index file
2. Your role's TODO file
3. Approval Workflow Reference (if you approve anything)

### For Managers/Admins
1. Role-Based Workflow Guide (complete overview)
2. Data Flow Reference (system understanding)
3. All relevant role TODO files

### For Developers
1. Data Flow Reference (data structures)
2. Approval Workflow Reference (workflow logic)
3. Role-Based Workflow Guide (system overview)

### For System Administrators
1. Administrator TODO file
2. Role-Based Workflow Guide
3. Database Sync operations in Administrator TODO

---

**Quick Links:**
- [Sales Executive TODO](TODO_SALES_EXECUTIVE.md)
- [Sales Manager TODO](TODO_SALES_MANAGER.md)
- [Accountant TODO](TODO_ACCOUNTANT.md)
- [Finance TODO](TODO_FINANCE.md)
- [Admin TODO](TODO_ADMIN.md)
- [Administrator TODO](TODO_ADMINISTRATOR.md)
- [Workflow Guide](ROLE_BASED_WORKFLOW_GUIDE.md)
- [Data Flow Reference](DATA_FLOW_REFERENCE.md)
- [Approval Reference](APPROVAL_WORKFLOW_REFERENCE.md)
