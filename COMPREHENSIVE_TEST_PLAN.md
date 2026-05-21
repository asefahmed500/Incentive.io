# Comprehensive Test Plan - Incentive.io
## QA Engineer Role - Full Feature Testing

**Act as QA Engineer: Define complete test strategy, test all modules, find bugs, ensure everything works end-to-end.**

---

## Test Strategy Overview

### Scope
- **All 6 User Roles:** salesExecutive, salesManager, accountant, finance, admin, administrator
- **All Dashboard Pages:** 72+ pages across all roles
- **All CRUD Operations:** Sales, Users, Teams, Products, Categories, Wallets, Commissions
- **All Workflows:** Multi-stage approval, auto-approve, notifications
- **All Features:** Search, filter, sort, pagination, real-time updates, email notifications
- **All Integrations:** Database, API, SSE, Email service

### Testing Approach
1. **Local Testing** - Test all features on localhost:3000
2. **Bug Fixing** - Document and fix all bugs found
3. **Production Testing** - Deploy and test on https://incentiveio.vercel.app
4. **Regression Testing** - Verify all fixes work in production
5. **Final Validation** - Complete end-to-end testing

---

## Test Environment Setup

### Prerequisites
```bash
# 1. Ensure MongoDB is running
mongod --dbpath /path/to/data

# 2. Seed database with test data
npm run seed

# 3. Start dev server
npm run dev

# 4. Install agent-browser (already done)
npx skills list | grep agent-browser
```

### Test Accounts
| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Sales Executive | karim@incentive.io | Executive123! | /sales-dashboard |
| Sales Manager | jamal@incentive.io | Manager123! | /sales-manager |
| Accountant | accountant@incentive.io | Accountant123! | /accountant |
| Finance | finance@incentive.io | Finance123! | /finance |
| Admin | admin@incentive.io | Admin123! | /admin |
| Administrator | superadmin@incentive.io | Superadmin123! | /administrator |

---

## Phase 1: Authentication Testing (All 6 Roles)

### Test Cases
```bash
# Test 1.1: Login each role successfully
# Test 1.2: Verify correct role-based redirects
# Test 1.3: Test invalid credentials
# Test 1.4: Test session persistence
# Test 1.5: Test logout functionality
# Test 1.6: Test session expiration
# Test 1.7: Test CSRF protection
# Test 1.8: Test concurrent logins
```

### agent-browser Commands
```bash
# Example: Test admin login
npx agent-browser open http://localhost:3000/login
npx agent-browser type "admin@incentive.io" "#email"
npx agent-browser type "Admin123!" "#password"
npx agent-browser click "button[type='submit']"
npx agent-browser wait 3
npx agent-browser url # Should be /admin
```

### Expected Results
- ✅ All 6 roles can login successfully
- ✅ Correct redirects per role
- ✅ Invalid credentials show error
- ✅ Session persists across page reloads
- ✅ Logout clears session and redirects to home
- ✅ CSRF tokens are validated
- ✅ Cookies have correct security flags

---

## Phase 2: Sales Executive Dashboard Testing (12 Pages)

### Pages to Test
1. `/sales-dashboard` - Main dashboard
2. `/sales-dashboard/add-record` - Add sales record
3. `/sales-dashboard/records` - My records list
4. `/sales-dashboard/targets` - Sales targets
5. `/sales-dashboard/eligibility` - Commission eligibility
6. `/sales-dashboard/commission-rules` - View commission rules
7. `/sales-dashboard/commissions` - My commissions
8. `/sales-dashboard/approved-sales` - Approved sales
9. `/sales-dashboard/wallet` - Wallet balance
10. `/sales-dashboard/profile` - User profile
11. `/sales-dashboard/records/[id]` - Record details
12. `/sales-dashboard/manager-info` - Manager information

### Test Cases

#### 2.1 Main Dashboard (`/sales-dashboard`)
```bash
# Test data loading
npx agent-browser open http://localhost:3000/sales-dashboard
npx agent-browser screenshot tests/sales-exec-dashboard.png

# Verify elements present
- Total sales amount
- Total commission
- Pending sales count
- Approved sales count
- Wallet balance
- Recent sales table
- Charts (Pie, Area, Bar)
- SSE connection indicator (green "Live")
- Notification bell
```

#### 2.2 Add Sales Record (`/sales-dashboard/add-record`)
```bash
npx agent-browser open http://localhost:3000/sales-dashboard/add-record

# Test form fields
- Company name field
- Company email field
- Product selection (multi-select)
- Date picker
- Submit button
- Cancel button

# Test validation
- Submit empty form → should show errors
- Invalid email → should show error
- No products selected → should show error

# Test successful submission
npx agent-browser type "Test Company" "#companyName"
npx agent-browser type "test@company.com" "#companyEmail"
npx agent-browser select "Product 1" ".product-select"
npx agent-browser click "button[type='submit']"
npx agent-browser wait 3
npx agent-browser url # Should be /sales-dashboard/records
```

#### 2.3 Records List (`/sales-dashboard/records`)
```bash
npx agent-browser open http://localhost:3000/sales-dashboard/records

# Test features
- Records table displays
- Status badges (Draft, Pending, Approved, Rejected)
- View details button
- Search functionality
- Filter by status
- Sort by date/amount
- Pagination

# Test actions
- Click view details → navigate to record detail page
- Search for company name → filter results
- Filter by status → show only filtered records
```

#### 2.4 Wallet (`/sales-dashboard/wallet`)
```bash
npx agent-browser open http://localhost:3000/sales-dashboard/wallet

# Verify data
- Current balance
- Transaction history table
- Transaction types (Credit, Debit)
- Transaction dates
- Reference numbers
- Running balance

# Test features
- Filter transactions
- Sort by date
- Pagination
```

---

## Phase 3: Sales Manager Dashboard Testing (14 Pages)

### Pages to Test
1. `/sales-manager` - Team dashboard
2. `/sales-manager/pending-approvals` - Approval queue
3. `/sales-manager/team` - Team members
4. `/sales-manager/team-sales` - Team sales
5. `/sales-manager/team-dashboard` - Team analytics
6. `/sales-manager/team-eligibility` - Team eligibility
7. `/sales-manager/add-record` - Add team sales
8. `/sales-manager/records` - All records
9. `/sales-manager/my-commissions` - Manager commissions
10. `/sales-manager/commissions` - Team commissions
11. `/sales-manager/commission-rules` - View rules
12. `/sales-manager/targets` - Sales targets
13. `/sales-manager/wallet` - Manager wallet
14. `/sales-manager/profile` - Manager profile

### Critical Test: Approval Workflow
```bash
# Test 3.1: Manager Approval
npx agent-browser open http://localhost:3000/sales-manager/pending-approvals

# Verify pending records display
- Sales executive name
- Company name
- Sale amount
- Products
- Date
- Approve button
- Reject button

# Test approval
npx agent-browser click "button[data-action='approve']"
npx agent-browser wait 2

# Verify status changed to "Pending_Accountant"
# Verify notification sent to accountant
# Verify email sent to accountant
```

---

## Phase 4: Accountant Dashboard Testing (9 Pages)

### Pages to Test
1. `/accountant` - Main dashboard
2. `/accountant/approvals` - Processing queue
3. `/accountant/analytics` - Financial analytics
4. `/accountant/commissions` - Commission tracking
5. `/accountant/commission-rules` - View rules
6. `/accountant/payments` - Payment tracking
7. `/accountant/records` - All records
8. `/accountant/wallets` - User wallets
9. `/accountant/profile` - Profile

### Critical Test: Tax/VAT Processing
```bash
# Test 4.1: Accountant Processing
npx agent-browser open http://localhost:3000/accountant/approvals

# Verify pending records display
- All sales details
- Tax/VAT input fields
- EO/BP input field
- Net sales calculation
- Process button

# Test processing with tax
npx agent-browser type "5" "#taxRate"
npx agent-browser type "10" "#vatRate"
npx agent-browser type "500" "#eoBP"
npx agent-browser click "button[data-action='process']"
npx agent-browser wait 2

# Verify net sales calculated correctly
# Verify status changed to "Pending_Finance"
# Verify commission calculated on net sales
```

---

## Phase 5: Finance Dashboard Testing (11 Pages)

### Pages to Test
1. `/finance` - Main dashboard
2. `/finance/approvals` - Final approval queue
3. `/finance/approved` - Approved sales
4. `/finance/analytics` - Financial analytics
5. `/finance/commission-rules` - View rules
6. `/finance/commissions` - Commission tracking
7. `/finance/payment-queue` - Payment queue
8. `/finance/payments` - Payment history
9. `/finance/sales-records` - All records
10. `/finance/wallets` - User wallets
11. `/finance/profile` - Profile

### Critical Test: Final Approval & Payment
```bash
# Test 5.1: Finance Approval with Wallet Credit
npx agent-browser open http://localhost:3000/finance/approvals

# Verify pending records display
- All details visible
- Net sales amount
- Commission amount
- Approve & Pay button
- Reject button

# Test approval
npx agent-browser click "button[data-action='approve']"
npx agent-browser wait 3

# CRITICAL: Verify atomic transaction
- Status changed to "Approved"
- Wallet credited (atomic operation)
- Commission calculated correctly
- Notification sent to employee
- Email sent to employee
- Payment marked as complete
```

---

## Phase 6: Admin Dashboard Testing (15 Pages)

### Pages to Test
1. `/admin` - Main dashboard
2. `/admin/users` - User management
3. `/admin/teams` - Team management
4. `/admin/products` - Product management
5. `/admin/categories` - Category management
6. `/admin/commission-rules` - Commission rules
7. `/admin/sales` - All sales records
8. `/admin/commissions` - All commissions
9. `/admin/wallets` - All wallets
10. `/admin/targets` - Target management
11. `/admin/settings` - System settings
12. `/admin/backups` - Database backups
13. `/admin/analytics` - System analytics
14. `/admin/dashboard` - Admin analytics
15. `/admin/profile` - Admin profile

### Critical Tests: CRUD Operations

#### 6.1 User Management
```bash
# Test 6.1.1: Create User
npx agent-browser open http://localhost:3000/admin/users
npx agent-browser click "button[data-action='add-user']"
npx agent-browser type "Test User" "#name"
npx agent-browser type "test@example.com" "#email"
npx agent-browser type "TestPass123!" "#password"
npx agent-browser select "salesExecutive" "#role"
npx agent-browser click "button[type='submit']"

# Verify user created
- User appears in table
- Welcome email sent
- Employee ID generated
- User can login

# Test 6.1.2: Edit User
npx agent-browser click "button[data-action='edit'][data-id='...']"
npx agent-browser type "Updated Name" "#name"
npx agent-browser click "button[type='submit']"

# Verify user updated
- Name changed in table
- Changes reflected in database

# Test 6.1.3: Delete User (Soft Delete)
npx agent-browser click "button[data-action='delete'][data-id='...']"
npx agent-browser click "button[data-action='confirm']"

# Verify soft delete
- User removed from table
- User still in database with deletedAt timestamp
- User cannot login
```

#### 6.2 Category Management with Auto-Approve
```bash
# Test 6.2.1: Create Auto-Approve Category
npx agent-browser open http://localhost:3000/admin/categories
npx agent-browser click "button[data-action='add-category']"
npx agent-browser type "Auto-Approve Products" "#name"
npx agent-browser check "#autoApprove"
npx agent-browser click "button[type='submit']"

# Verify auto-approve category created
- Category appears in table
- Auto-approve badge shown
- Products in this category auto-approve

# Test 6.2.2: Auto-Approve Sales Flow
# Create sale with all products from auto-approve category
# Verify sale skips manager approval
# Verify sale goes directly to accountant
# Verify notifications sent correctly
```

---

## Phase 7: Administrator Dashboard Testing (8 Pages)

### Pages to Test
1. `/administrator` - Main dashboard
2. `/administrator/users` - User management
3. `/administrator/audit-logs` - Audit logs
4. `/administrator/settings` - System settings
5. `/administrator/backups` - Database backups
6. `/administrator/sync` - Data synchronization
7. `/administrator/health` - System health
8. `/administrator/profile` - Profile

### Critical Test: Audit Logs
```bash
# Test 7.1: Audit Log Verification
npx agent-browser open http://localhost:3000/administrator/audit-logs

# Verify audit logs display
- User creation logs
- User update logs
- Sales creation logs
- Approval workflow logs
- Password reset logs
- System change logs

# Test filtering
- Filter by action type
- Filter by user
- Filter by date range
- Search functionality
```

---

## Phase 8: Notification System Testing

### In-App Notifications
```bash
# Test 8.1: Notification Bell
npx agent-browser open http://localhost:3000/sales-dashboard

# Verify notification bell
- Bell icon in header
- Unread count badge
- Click to open notifications panel
- Notifications list displays
- Mark as read functionality
- Mark all as read functionality

# Test 8.2: Notification Types
- Sale submitted notification (manager receives)
- Manager approved notification (accountant receives)
- Accountant processed notification (finance receives)
- Finance approved notification (employee receives)
- Commission credited notification (employee receives)
- Wallet updated notification (employee receives)
```

### Email Notifications
```bash
# Test 8.3: Email Delivery
# Check email service for:
- Welcome emails (user registration)
- Password reset emails
- Sale submitted emails (manager)
- Approval notifications (next stage)
- Rejection notifications (employee)
- Commission credited emails (employee)
- Payment confirmation emails

# Verify email content
- Correct recipient
- Correct subject
- Correct body content
- Working links
- Proper formatting
```

---

## Phase 9: Real-Time Updates Testing (SSE)

### Test 9.1: SSE Connection
```bash
# Verify SSE connection indicator
- Green dot with "Live" when connected
- Red dot with "Reconnecting..." when disconnected
- Auto-reconnection after disconnect

# Test real-time updates
1. Open dashboard in two browser windows
2. Create sale in window 1
3. Verify window 2 updates automatically
4. No manual refresh required
```

### Test 9.2: SSE Events
```bash
# Test SSE event types
- SALE_CREATED: New sale notification
- SALE_APPROVED: Approval notification
- SALE_REJECTED: Rejection notification
- WALLET_UPDATED: Wallet credit notification
- DASHBOARD_REFRESH: Dashboard data refresh
- NOTIFICATION_NEW: New in-app notification
```

---

## Phase 10: Search & Filter Testing

### Test 10.1: Search Functionality
```bash
# Test search in records pages
npx agent-browser open http://localhost:3000/sales-dashboard/records

# Test search by company name
npx agent-browser type "Test Company" "#search"
# Verify results filtered

# Test search by email
npx agent-browser type "test@example.com" "#search"
# Verify results filtered

# Test empty search
npx agent-browser clear "#search"
# Verify all records shown
```

### Test 10.2: Filter Functionality
```bash
# Test status filters
npx agent-browser select "Pending" "#statusFilter"
# Verify only pending records shown

# Test date range filter
npx agent-browser type "2026-01-01" "#startDate"
npx agent-browser type "2026-01-31" "#endDate"
# Verify records in date range shown

# Test amount range filter
npx agent-browser type "1000" "#minAmount"
npx agent-browser type "5000" "#maxAmount"
# Verify records in amount range shown
```

### Test 10.3: Sort Functionality
```bash
# Test sorting
npx agent-browser click "button[data-sort='date']"
# Verify sorted by date

npx agent-browser click "button[data-sort='amount']"
# Verify sorted by amount

# Test ascending/descending
npx agent-browser click "button[data-sort='amount']"
npx agent-browser click "button[data-sort='amount']"
# Verify toggle between asc/desc
```

---

## Phase 11: Data Integrity Testing

### Test 11.1: Database Operations
```bash
# Verify data persistence
1. Create sale record
2. Check MongoDB - record exists
3. Update sale record
4. Check MongoDB - changes reflected
5. Delete sale record (soft delete)
6. Check MongoDB - deletedAt set

# Verify atomic transactions
1. Approve sale (finance)
2. Check sales record - status = "Approved"
3. Check wallet - balance increased
4. Check transactions - new transaction added
5. All updates must be atomic (all or nothing)
```

### Test 11.2: Calculations
```bash
# Test commission calculation
- Gross sale amount: 10,000
- Tax: 5% (500)
- VAT: 10% (1,000)
- EO/BP: 500
- Net sales: 10,000 - 500 - 1,000 - 500 = 8,000
- Commission rate: 10%
- Commission amount: 8,000 * 10% = 800

# Verify exact calculations
# Test edge cases (zero amounts, negative amounts)
# Test percentage calculations
# Test currency formatting
```

---

## Phase 12: Security Testing

### Test 12.1: Authorization
```bash
# Test role-based access control
# Login as sales executive
npx agent-browser open http://localhost:3000/admin/users
# Verify redirect back to /sales-dashboard

# Login as accountant
npx agent-browser open http://localhost:3000/finance/approvals
# Verify redirect back to /accountant

# Test API access control
curl -X GET http://localhost:3000/api/users
# Verify 401 Unauthorized (without session)
```

### Test 12.2: Input Validation
```bash
# Test SQL injection prevention
npx agent-browser type "'; DROP TABLE users; --" "#search"
# Verify no SQL error

# Test XSS prevention
npx agent-browser type "<script>alert('XSS')</script>" "#companyName"
# Verify script not executed

# Test NoSQL injection prevention
npx agent-browser type "{$ne: null}" "#search"
# Verify query rejected
```

---

## Phase 13: Performance Testing

### Test 13.1: Page Load Times
```bash
# Measure dashboard load time
# Target: < 3 seconds for initial load
# Target: < 1 second for subsequent loads

# Measure API response times
# Target: < 500ms for API calls
# Target: < 200ms for database queries
```

### Test 13.2: Concurrent Users
```bash
# Test multiple simultaneous users
# Create 10 concurrent sales
# Verify all records created
# Verify no race conditions
# Verify wallet updates are atomic
```

---

## Phase 14: Mobile Responsiveness Testing

### Test 14.1: Mobile Viewport (375px)
```bash
# Test mobile layout
- Sidebar collapsed by default
- Hamburger menu to toggle sidebar
- Tables scrollable horizontally
- Charts responsive
- Forms usable on mobile
```

### Test 14.2: Tablet Viewport (768px)
```bash
# Test tablet layout
- Sidebar visible
- 2-column layout where applicable
- Touch targets adequate size
```

---

## Bug Tracking Template

### Bug Report Format
```markdown
## Bug #[ID]: [Title]

**Severity:** Critical / High / Medium / Low
**Status:** Open / In Progress / Fixed / Verified
**Module:** [Page/Feature]
**Role:** [Which role discovered it]

### Steps to Reproduce
1. Navigate to [page]
2. Click [element]
3. Enter [input]
4. Submit form

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Screenshots
[Attach screenshot]

### Environment
- URL: [localhost or production]
- Browser: [Chrome/Firefox/Safari]
- Viewport: [Desktop/Tablet/Mobile]

### Fix Applied
[Describe the fix]
```

---

## Test Execution Schedule

### Week 1: Local Testing
- Day 1-2: Authentication & Authorization (Phases 1-2)
- Day 3-4: Workflow Testing (Phases 3-5)
- Day 5: Admin Functions (Phases 6-7)

### Week 2: Feature Testing
- Day 1: Notifications & Real-time (Phases 8-9)
- Day 2: Search, Filter, Sort (Phase 10)
- Day 3: Data Integrity & Security (Phases 11-12)
- Day 4: Performance & Mobile (Phases 13-14)
- Day 5: Bug Fixes & Regression Testing

### Week 3: Production Testing
- Day 1: Deploy to production
- Day 2-3: Complete production testing
- Day 4: Fix production bugs
- Day 5: Final validation & documentation

---

## Success Criteria

✅ **All Test Cases Pass**
- Zero critical bugs
- Zero high-severity bugs
- Maximum 5 medium-severity bugs
- Maximum 10 low-severity bugs

✅ **All Features Functional**
- All 6 roles can login and work
- All 72+ pages load correctly
- All CRUD operations work
- All workflows complete successfully
- All notifications sent (in-app + email)
- Real-time updates work
- Search, filter, sort work
- Mobile responsive

✅ **Data Integrity**
- All calculations correct
- Atomic transactions work
- No data loss
- Soft delete implemented
- Audit logs complete

✅ **Security**
- Authorization enforced
- Input validation works
- No SQL/NoSQL injection
- CSRF protection works
- XSS prevention works
- Rate limiting works

---

## Next Steps

1. **Start Local Testing** - Execute all test cases on localhost
2. **Document Bugs** - Track all bugs found with screenshots
3. **Fix Bugs** - Prioritize and fix all bugs
4. **Deploy to Production** - Push code and deploy
5. **Production Testing** - Execute all tests on production URL
6. **Fix Production Bugs** - Address any production issues
7. **Final Validation** - Complete end-to-end testing
8. **Generate Report** - Document all findings and fixes

**Status:** Ready to begin testing
**agent-browser:** Installed and ready
**Test Plan:** Comprehensive and detailed
**Next Action:** Begin Phase 1 - Authentication Testing
