# Admin - Complete TODO & Feature Guide

## Role Overview

- **Hierarchy Level:** 4/5 (System management)
- **Dashboard URL:** `/admin`
- **Reports To:** Administrator
- **Manages:** All users below admin level

**Purpose:** System managers who configure business rules, manage users, products, and commission policies.

---

## What This Role Can Do

### ✅ Create/Add
- User accounts (all roles except administrator)
- Products
- Product categories
- Commission rules
- User targets

### ✅ View/Read
- All sales records
- All commissions
- All wallets
- All users
- All system data
- Analytics and reports

### ✅ Edit/Update
- User accounts
- Product information
- Commission rules (anytime)
- User targets
- System settings

### ✅ Delete/Remove
- User accounts
- Products
- Commission rules
- Targets

### ❌ Cannot Do
- Manage administrator accounts
- Access system settings
- Perform database sync
- Manage backups

---

## Features Checklist

### 👥 User Management

- [ ] **View All Users**
  - Go to: `/admin/users`
  - See: All user accounts
  - Filter: By role
  - Filter: By status
  - Search: By name or email
  - Export: User list

- [ ] **Add New User**
  - Go to: Users page
  - Click: "Add User" button
  - Fill: User details
  - Select: Role (Executive, Manager, Accountant, Finance, Admin)
  - Set: Password or auto-generate
  - Click: "Add User"
  - Result: User created, can log in

- [ ] **Edit User**
  - Go to: Users page
  - Click: "Edit" on user
  - Update: User information
  - Change: Role (if needed)
  - Reset: Password
  - Click: "Save Changes"
  - Result: User updated

- [ ] **Delete User**
  - Go to: Users page
  - Click: "Delete" on user
  - Confirm: Deletion
  - Result: User removed

- [ ] **Assign Manager**
  - Go to: Users page
  - Edit: Sales Executive
  - Set: Manager assignment
  - Click: "Save"
  - Result: Executive assigned to manager

### 📦 Products

- [ ] **View All Products**
  - Go to: `/admin/products`
  - See: Product catalog
  - Filter: By category
  - Filter: By status (active/inactive)
  - Search: By name

- [ ] **Add Product**
  - Go to: Products page
  - Click: "Add Product" button
  - Fill: Product details
    - Name, SKU, Category
    - Price, Unit
    - Stock quantity
    - Image (optional)
  - Set: Base rates (optional)
  - Click: "Add Product"
  - Result: Product added to catalog

- [ ] **Edit Product**
  - Go to: Products page
  - Click: "Edit" on product
  - Update: Product information
  - Change: Price, stock, category
  - Upload: New image
  - Click: "Save Changes"
  - Result: Product updated

- [ ] **Delete Product**
  - Go to: Products page
  - Click: "Delete" on product
  - Confirm: Deletion
  - Result: Product removed

### 🏷️ Product Categories

- [ ] **View Categories**
  - Go to: `/admin/product-categories`
  - See: All categories
  - See: Category descriptions
  - See: Product counts per category

- [ ] **Add Category**
  - Go to: Categories page
  - Click: "Add Category" button
  - Fill: Category name
  - Add: Description (optional)
  - Add: Aliases (optional)
  - Click: "Add Category"
  - Result: Category created

- [ ] **Edit Category**
  - Go to: Categories page
  - Click: "Edit" on category
  - Update: Name, description
  - Add: Remove aliases
  - Click: "Save Changes"
  - Result: Category updated

### 💰 Commission Rules

- [ ] **View Commission Rules**
  - Go to: `/admin/commission-rules`
  - See: All commission rules
  - See: Rule tiers and rates
  - See: Category-specific rules
  - See: Validity periods

- [ ] **Add Commission Rule**
  - Go to: Commission Rules page
  - Click: "Add Rule" button
  - Fill: Rule details
    - Target percentage range (from/to)
    - Commission rate (percentage)
    - Product categories (optional)
    - Validity period (optional)
    - Priority (if multiple rules match)
  - Click: "Add Rule"
  - Result: Rule created
  - Note: Takes effect immediately for new calculations

- [ ] **Edit Commission Rule**
  - Go to: Commission Rules page
  - Click: "Edit" on rule
  - Update: Rate, ranges, categories
  - Click: "Save Changes"
  - Result: Rule updated
  - Note: Affects future calculations only

- [ ] **Delete Commission Rule**
  - Go to: Commission Rules page
  - Click: "Delete" on rule
  - Confirm: Deletion
  - Result: Rule removed
  - Warning: Affects commission calculations

### 🎯 Targets

- [ ] **View All Targets**
  - Go to: `/admin/targets`
  - See: All assigned targets
  - Filter: By employee
  - Filter: By period
  - Filter: By status

- [ ] **Assign Target**
  - Go to: Targets page
  - Click: "Assign Target" button
  - Select: Employee
  - Set: Target amount
  - Set: Period (month/year)
  - Set: Start/end dates
  - Click: "Assign"
  - Result: Target assigned to employee

- [ ] **Edit Target**
  - Go to: Targets page
  - Click: "Edit" on target
  - Update: Target amount
  - Update: Period
  - Update: Dates
  - Click: "Save Changes"
  - Result: Target updated

- [ ] **Delete Target**
  - Go to: Targets page
  - Click: "Delete" on target
  - Confirm: Deletion
  - Result: Target removed

### 📊 Analytics

- [ ] **View Dashboard Analytics**
  - Go to: `/admin/analytics`
  - See: User statistics
  - See: Sales trends
  - See: Commission statistics
  - See: Performance metrics
  - Export: Reports

### 💼 Sales Management

- [ ] **View All Sales**
  - Go to: `/admin/sales`
  - See: All sales records
  - Filter: By multiple criteria
  - Search: By product or company
  - Export: As Excel

### 🔔 Notifications

- [ ] **View Notifications**
  - Click: Bell icon (top right)
  - See: System notifications
  - See: User activities
  - See: Alerts

---

## In The Approval Workflow

### Stage: Configuration (Not in approval chain)

**What You Do:**
- Configure commission rules
- Set user targets
- Manage product catalog
- Assign managers to executives

**Input:**
- Business requirements
- Commission policies
- Sales targets

**Output:**
- Configured system
- Ready approval workflow

**Impact:**
- Commission calculations use your rules
- Achievement based on your targets

---

## Data Access

### Tables You Can Read

| Table | Access | Fields |
|-------|--------|--------|
| **All Tables** | Full access | All fields |

### Tables You Can Write

| Table | Access | Fields |
|-------|--------|--------|
| **User** | All (except admin) | All fields |
| **Product** | All | All fields |
| **ProductCategory** | All | All fields |
| **CommissionRule** | All | All fields |
| **UserTarget** | All | All fields |
| **SalesRecord** | Read-only | Cannot modify (approval workflow) |

### Fields You Can Modify

**User:**
- All fields except administrator role

**CommissionRule:**
- All fields (can change anytime)
- Changes affect future calculations only

**Product:**
- All fields

### Fields You Cannot Touch

**Protected Fields:**
- Administrator accounts (only Administrator can manage)
- SalesRecord approval fields (workflow only)
- Wallet balances (finance only)

---

## Common Tasks

### Task 1: Create New Sales Executive

```
1. Go to: /admin/users

2. Click "Add User" button

3. Fill User Details:
   - Name: [Full name]
   - Email: [Email address]
   - Employee ID: [5-digit ID]
   - Password: [Secure password]
   - Role: Sales Executive (select)
   - Phone: [Phone number]
   - Address: [Optional]

4. Assign Manager:
   - Select: Manager from dropdown
   - Or: Leave unassigned

5. Click "Add User"

6. Result:
   - User account created
   - Can log in immediately
   - Redirected to sales dashboard
```

### Task 2: Create Commission Rule

```
1. Go to: /admin/commission-rules

2. Click "Add Rule" button

3. Fill Rule Details:
   - Target From: [e.g., 100]
   - Target To: [e.g., 150]
   - Commission Rate: [e.g., 5]
   - Product Categories: [Optional - select specific categories]
   - Valid From: [Optional - start date]
   - Valid To: [Optional - end date]
   - Priority: [e.g., 1]
   - Active: [Checked]

4. Click "Add Rule"

5. Result:
   - Rule created
   - Takes effect immediately
   - Used in all future commission calculations
```

### Task 3: Assign Sales Target

```
1. Go to: /admin/targets

2. Click "Assign Target" button

3. Fill Target Details:
   - Employee: [Select from dropdown]
   - Target Amount: [e.g., 100000]
   - Period: [e.g., 2026-04]
   - Start Date: [e.g., 2026-04-01]
   - End Date: [e.g., 2026-04-30]

4. Click "Assign"

5. Result:
   - Target assigned to employee
   - Visible in employee dashboard
   - Used for commission calculation
```

### Task 4: Add Product

```
1. Go to: /admin/products

2. Click "Add Product" button

3. Fill Product Details:
   - Name: [Product name]
   - SKU: [Unique identifier]
   - Category: [Select or create new]
   - Price: [Unit price]
   - Unit: [e.g., pcs, kg, liters]
   - Stock: [Quantity in stock]
   - Description: [Optional]

4. Set Base Rates (Optional):
   - Executive Base Rate: [e.g., 3%]
   - Manager Base Rate: [e.g., 5%]

5. Upload Image (Optional):
   - Select: Product image file
   - Upload: Image

6. Click "Add Product"

7. Result:
   - Product added to catalog
   - Available for selection in sales forms
```

---

## Understanding Your Data

### How Commission Rules Work

```
YOU CREATE COMMISSION RULE
    ↓
┌─────────────────────────────────────┐
│ CommissionRule Created               │
│ ──────────────────────────────────  │
│ targetPercentageFrom: 100            │
│ targetPercentageTo: 150              │
│ commissionRate: 5                    │
│ productCategories: ["Electronics"]   │
│ priority: 1                          │
│ isActive: true                       │
└─────────────────────────────────────┘
    ↓
SYSTEM USES RULE FOR CALCULATION
    ↓
┌─────────────────────────────────────┐
│ Commission Calculation               │
│ ──────────────────────────────────  │
│ 1. Get executive's sales total       │
│ 2. Get executive's target amount     │
│ 3. Calculate achievement %            │
│ 4. Find matching commission rule     │
│ 5. Apply commission rate             │
│                                     │
│ Example:                            │
│ totalSales = ৳120,000               │
│ targetAmount = ৳100,000              │
│ achievement = 120%                   │
│ matchingRule: 100-150% range         │
│ commissionRate = 5%                  │
│ commission = (120,000 × 5) / 100      │
│            = ৳6,000                   │
└─────────────────────────────────────┘
```

### Rule Matching Logic

```javascript
function findCommissionRule(achievement, category) {
  // 1. Find category-specific rules first
  let rule = await CommissionRule.findOne({
    productCategories: category,
    targetPercentageFrom: { $lte: achievement },
    targetPercentageTo: { $gte: achievement },
    isActive: true
  }).sort({ priority: -1 });  // Highest priority first

  // 2. If no category-specific rule, find global rule
  if (!rule) {
    rule = await CommissionRule.findOne({
      targetPercentageFrom: { $lte: achievement },
      targetPercentageTo: { $gte: achievement },
      isActive: true
    }).sort({ priority: -1 });
  }

  return rule;
}
```

---

## Dashboard Pages Overview

### Main Dashboard (`/admin`)
- **Shows:** System overview
- **Stats:** Users, sales, commissions
- **Quick Actions:** Add user, create rule
- **Auto-refresh:** Every 30 seconds

### Users (`/admin/users`)
- **Shows:** All user accounts
- **Actions:** Create, edit, delete, assign manager

### Products (`/admin/products`)
- **Shows:** Product catalog
- **Actions:** Create, edit, delete products

### Commission Rules (`/admin/commission-rules`)
- **Shows:** All commission rules
- **Actions:** Create, edit, delete rules
- **Note:** Changes take effect immediately

### Targets (`/admin/targets`)
- **Shows:** All assigned targets
- **Actions:** Assign, edit, delete targets

### Analytics (`/admin/analytics`)
- **Shows:** System-wide analytics
- **Reports:** User stats, sales trends, commission data

### Sales (`/admin/sales`)
- **Shows:** All sales records
- **Purpose:** Reference and oversight
- **Filters:** Multiple options

---

## Tips for Admins

1. **Set realistic targets** - Based on past performance
2. **Create clear rules** - Document commission policies
3. **Assign managers properly** - Each executive needs a manager
4. **Monitor analytics** - Track system performance
5. **Keep catalog updated** - Maintain product list
6. **Review rules regularly** - Update as business changes

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| User cannot log in | Check role assignment |
| Commission wrong | Verify rule settings |
| Target not working | Check date ranges |
| Product not showing | Verify category |
| Rule not applying | Check priority and dates |

---

## Admin Best Practices

### DO ✅
- Set clear commission rules
- Document rule changes
- Assign managers properly
- Monitor system performance
- Keep data consistent
- Test rule changes

### DON'T ❌
- Create conflicting rules
- Skip manager assignment
- Set unrealistic targets
- Delete active rules
- Ignore analytics
- Make untested changes

---

**Related Documentation:**
- `ROLE_BASED_WORKFLOW_GUIDE.md` - Complete system overview
- `DATA_FLOW_REFERENCE.md` - How data flows
- `TODO_ADMINISTRATOR.md` - Higher-level admin features

**Last Updated:** April 19, 2026
**Version:** 1.0
