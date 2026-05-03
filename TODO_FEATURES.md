# Incentive.io — Role-Based Feature Checklist

## How to Use
For each role, verify every feature works correctly. Mark `[x]` when verified, `[!]` when issues found.

---

## 👤 Admin (`/admin/*`)

### Pages & Features
- [ ] `/admin/dashboard` — Stats: users count, teams count, sales records, commissions
- [ ] `/admin/users` — Create, Edit, Delete, Reset Password, Block/Unblock user
- [ ] `/admin/teams` — Create team, Assign manager, View members
- [ ] `/admin/targets` — Assign targets, Set period/category
- [ ] `/admin/commission-rules` — Create rules, Set achievement ranges, Set rates
- [ ] `/admin/categories` — Create, Edit, Delete categories
- [ ] `/admin/products` — Create, Edit, Delete products, Upload image
- [ ] `/admin/sales` — View all records, Filter by status/date/user
- [ ] `/admin/commissions` — View all commissions, Filter eligibility
- [ ] `/admin/backups` — Create/Restore backups
- [ ] `/admin/settings` — System configuration
- [ ] `/admin/profile` — Update own info, Change password
- [ ] `/admin/analytics` — Analytics charts

### Data Integrity
- [ ] Create user → welcome email sent, notification created
- [ ] Edit user → changes persist
- [ ] Delete user → soft delete works, user removed from lists
- [ ] Reset password → new temp password works, email sent
- [ ] Block/Unblock user → blocked user cannot login

---

## 🔑 Administrator / SuperAdmin (`/administrator/*`)

### Pages & Features
- [ ] `/administrator/dashboard` — Full system overview
- [ ] `/administrator/users` — Manage all users including other admins
- [ ] `/administrator/sync` — Database sync (commissions, targets, teams, wallets, eligibility, all)
- [ ] `/administrator/backups` — Create/Restore backups
- [ ] `/administrator/audit-logs` — View all audit logs
- [ ] `/administrator/health` — System health check
- [ ] `/administrator/settings` — System settings
- [ ] `/administrator/profile` — Update own info, Change password

### SuperAdmin Access
- [ ] Can access ALL role routes (admin, sales-dashboard, sales-manager, accountant, finance)
- [ ] Cannot be blocked by admin
- [ ] Audit logs capture all SuperAdmin actions

---

## 👨‍💼 Sales Executive (`/sales-dashboard/*`)

### Pages & Features
- [ ] `/sales-dashboard/dashboard` — Total records, Pending, Approved amount, Commission
- [ ] `/sales-dashboard/add-record` — Company info, Tax/VAT checkboxes, Multi-products (up to 20), Proof docs
- [ ] `/sales-dashboard/records` — View all records, Edit drafts, Submit for approval, Delete drafts
- [ ] `/sales-dashboard/targets` — View assigned targets, Achievement %
- [ ] `/sales-dashboard/commission-rules` — View commission structure (read-only)
- [ ] `/sales-dashboard/eligibility` — View ELIGIBLE/NOT_ELIGIBLE status
- [ ] `/sales-dashboard/commissions` — View earned commissions
- [ ] `/sales-dashboard/approved-sales` — View finalized records
- [ ] `/sales-dashboard/manager-info` — View assigned manager details
- [ ] `/sales-dashboard/wallet` — View commission wallet
- [ ] `/sales-dashboard/profile` — Update personal info, Change password

### Workflow
- [ ] Add sales record with multiple products → saved as Draft
- [ ] Submit record → status changes to Pending Manager, manager notified
- [ ] Edit draft → changes persist
- [ ] Delete draft → removed
- [ ] Commission calculation updates when achievement changes
- [ ] Eligibility status updates when crossing 50% threshold

---

## 👨‍💼 Sales Manager (`/sales-manager/*`)

### Pages & Features
- [ ] `/sales-manager/dashboard` — Team size, Team sales, Pending, Commission
- [ ] `/sales-manager/add-record` — Create personal sales record
- [ ] `/sales-manager/pending-approvals` — View pending team sales, Approve/Reject
- [ ] `/sales-manager/team-sales` — View all team records, Filter by employee
- [ ] `/sales-manager/team` — View team members, Sales, Achievement
- [ ] `/sales-manager/team-dashboard` — Team performance overview
- [ ] `/sales-manager/team-eligibility` — Team member eligibility status
- [ ] `/sales-manager/team-commissions` — View team member commissions
- [ ] `/sales-manager/targets` — View own targets
- [ ] `/sales-manager/commission-rules` — View commission structure
- [ ] `/sales-manager/my-commissions` — View own commissions
- [ ] `/sales-manager/wallet` — View commission wallet
- [ ] `/sales-manager/profile` — Update profile

### Approval Workflow
- [ ] Approve sale → status changes to Pending Accountant, executive notified
- [ ] Reject sale → status returns to Draft with reason, executive notified
- [ ] Commission auto-calculated on approval
- [ ] Email + in-app notification sent on approve/reject

---

## 💼 Accountant (`/accountant/*`)

### Pages & Features
- [ ] `/accountant/dashboard` — Pending, Processed today, Deductions
- [ ] `/accountant/approvals` — Add Tax%, VAT%, EO/BP, Calculate Net, Approve/Reject
- [ ] `/accountant/processed` — View processed history
- [ ] `/accountant/analytics` — Analytics charts
- [ ] `/accountant/wallets` — View all wallets
- [ ] `/accountant/records` — View all records
- [ ] `/accountant/commissions` — View commissions
- [ ] `/accountant/payments` — Payment queue
- [ ] `/accountant/profile` — Update profile

### Processing Workflow
- [ ] View pending accountant records → only Pending_Accountant status
- [ ] Apply EO/BP deduction → amount + reason saved
- [ ] Apply Tax rate → calculated correctly (on gross sales)
- [ ] Apply VAT rate → calculated correctly (on gross sales)
- [ ] Net Sales calculation → gross - tax - vat - eo/bp
- [ ] Approve → status changes to Pending Finance, finance notified
- [ ] Reject → status returns to Draft with reason

---

## 🏦 Finance (`/finance/*`)

### Pages & Features
- [ ] `/finance/dashboard` — Pending, Approved today, Total commissions
- [ ] `/finance/approvals` — Final approve, Trigger commission
- [ ] `/finance/sales-records` — View all records
- [ ] `/finance/commissions` — View all commissions, Filter eligibility
- [ ] `/finance/approved` — View ELIGIBLE commissions, Payment status
- [ ] `/finance/payment-queue` — Process payments
- [ ] `/finance/payments` — Payment history
- [ ] `/finance/wallets` — View all wallets
- [ ] `/finance/analytics` — Analytics charts
- [ ] `/finance/profile` — Update profile

### Final Approval Workflow
- [ ] View pending finance records → only Pending_Finance status
- [ ] Final Approve → status changes to Approved, commission triggered
- [ ] Wallet auto-credit on approval
- [ ] Eligibility re-check triggered
- [ ] Email sent to executive + manager
- [ ] Reject → status returns to Draft with reason

---

## 🔐 Authentication & Authorization

### Tests
- [ ] Login with correct credentials → redirected to role dashboard
- [ ] Login with wrong password → error shown
- [ ] Blocked user cannot login
- [ ] Unauthenticated access → redirected to login
- [ ] Access wrong role route → redirected appropriately
- [ ] Session expires after 60s → revalidation works
- [ ] Password change → works, old password verified
- [ ] Admin reset password → new password works

---

## 📬 Notifications

### Email + In-App Tests
- [ ] Sale submitted → manager receives email + notification
- [ ] Manager approves → executive receives email + notification
- [ ] Manager rejects → executive receives email + notification + reason
- [ ] Accountant processes → finance receives email + notification
- [ ] Finance approves → executive + manager receive email + notification
- [ ] Commission eligible → executive receives email + notification
- [ ] Target assigned → user receives email + notification
- [ ] User created → welcome email sent

---

## 💰 Commission & Wallet

### Tests
- [ ] Commission calculated correctly per achievement tier
- [ ] 0-80% achievement → 2.0% commission rate
- [ ] 81-100% achievement → 3.0% commission rate
- [ ] 101-150% achievement → 4.5% commission rate
- [ ] 151%+ achievement → 5.0% commission rate
- [ ] Wallet balance updates on commission credit
- [ ] Transaction history records all credits/debits
- [ ] Payment marks record as Paid

---

## 🗄️ Database Integrity

### Tests
- [ ] Soft delete → deleted records hidden from queries
- [ ] Indexes exist → queries performant on large datasets
- [ ] Audit logs capture all state changes
- [ ] Email failures don't block workflows

---

## 📱 UI/UX Checklist

### Responsive
- [ ] Mobile (320px) → no clipped elements, scrollable
- [ ] Tablet (768px) → proper layout adaptation
- [ ] Desktop (1920px) → full layout, no overflow

### States
- [ ] Loading skeletons → shown while data fetching
- [ ] Empty states → shown when no data
- [ ] Error toasts → shown on failures
- [ ] Success toasts → shown on success
- [ ] Form validation → inline errors
- [ ] Disabled buttons → while submitting

---

## 🚀 CI/CD

### GitHub Actions
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` has 0 errors
- [ ] `npm run build:webpack` succeeds
- [ ] Test accounts work after fresh database

---

**Last Updated:** 2026-05-03
**Commit:** `2838eb3`
