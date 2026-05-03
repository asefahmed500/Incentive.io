# Module-by-Module Implementation Checklist  
## AlgoIncentive Sales Commission Management System  

Use this checklist to guide development. Each module lists sub-features with **role indicators**:  
- **Exe** = Sales Executive  
- **Mgr** = Sales Manager  
- **Acc** = Accountant  
- **Fin** = Finance  
- **Admin** = Admin  
- **Super** = Administrator (SuperAdmin)  

Check items off as completed. Dependencies are noted at the start of each module.

---

## Module 1: Authentication & Authorization  
**Dependencies:** None – base infrastructure.

### Sub‑features
- [ ] 1.1 Login with email/password (JWT) – all roles  
- [ ] 1.2 Session re‑check every 60 seconds (DB sync) – all roles  
- [ ] 1.3 Logout + token invalidation – all roles  
- [ ] 1.4 Role‑based route guards (middleware) – all roles  
- [ ] 1.5 Password change from own profile – Exe, Mgr, Acc, Fin, Admin, Super  
- [ ] 1.6 Password reset by admin (force reset) – Admin, Super  
- [ ] 1.7 Block / unblock user – Admin, Super  

---

## Module 2: User Management  
**Dependencies:** Module 1 (auth).  

- [ ] 2.1 View list of all users (filter by role, status, search) – Admin, Super  
- [ ] 2.2 Create new user (all roles except SuperAdmin creation limited to Super) – Admin, Super  
- [ ] 2.3 Edit user details (name, email, phone, role, manager assignment) – Admin, Super  
- [ ] 2.4 Delete user (with confirmation, prevent last SuperAdmin deletion) – Admin, Super  
- [ ] 2.5 Assign manager to executive – Admin, Super  
- [ ] 2.6 Reset user password – Admin, Super  
- [ ] 2.7 Export user list to Excel – Admin, Super  

---

## Module 3: Team Management  
**Dependencies:** Module 2 (users exist).  

- [ ] 3.1 Create team – Admin, Super  
- [ ] 3.2 Assign manager to team – Admin, Super  
- [ ] 3.3 View team members – Manager, Admin, Super  
- [ ] 3.4 Add member to team – Manager (own team), Admin, Super  
- [ ] 3.5 Remove member from team – Manager (own team), Admin, Super  
- [ ] 3.6 View team sales & performance dashboard – Manager  

---

## Module 4: Product Categories  
**Dependencies:** None needed before creating products.  

- [ ] 4.1 View all categories – Exe, Mgr, Acc, Fin, Admin, Super  
- [ ] 4.2 Create category – Admin, Super  
- [ ] 4.3 Edit category (name, description, aliases) – Admin, Super  
- [ ] 4.4 Delete category (if no products linked) – Admin, Super  

---

## Module 5: Product Management  
**Dependencies:** Module 4 (categories).  

- [ ] 5.1 View all products (filter by category, search) – Exe, Mgr, Acc, Fin, Admin, Super  
- [ ] 5.2 Add product (name, SKU, category, price, unit, stock) – Admin, Super  
- [ ] 5.3 Edit product details – Admin, Super  
- [ ] 5.4 Delete product – Admin, Super  
- [ ] 5.5 Upload product image – Admin, Super  

---

## Module 6: Sales Record – Create & Submit  
**Dependencies:** Module 5 (products), Module 2 (users).  

- [ ] 6.1 Add sales record form (executive / manager) – Exe, Mgr  
- [ ] 6.2 Multi‑product support (up to 20 lines) – Exe, Mgr  
- [ ] 6.3 Fields: company name, email, product name, category, unit price, original price, quantity, deal notes – Exe, Mgr  
- [ ] 6.4 Checkbox for “Include Tax” (executive indicates if tax is included) – Exe, Mgr  
- [ ] 6.5 Checkbox for “Include VAT” – Exe, Mgr  
- [ ] 6.6 Upload proof of sale (JPG, PNG, PDF, max 10MB each) – Exe, Mgr  
- [ ] 6.7 Save as draft – Exe, Mgr  
- [ ] 6.8 Submit for manager approval (status → Pending_Manager) – Exe, Mgr  
- [ ] 6.9 Auto‑assign manager based on executive’s managerId – system  

---

## Module 7: Sales Record – View & Edit (Own)  
**Dependencies:** Module 6.  

- [ ] 7.1 View own sales records list with filters (status, date, product) – Exe, Mgr (own sales)  
- [ ] 7.2 View detailed sale (products, proofs, status history) – Exe, Mgr (own)  
- [ ] 7.3 Edit draft sales (before submission) – Exe, Mgr  
- [ ] 7.4 Delete draft sales – Exe, Mgr  
- [ ] 7.5 Export own sales to Excel – Exe, Mgr  

---

## Module 8: Manager Approval Workflow  
**Dependencies:** Module 6 (submitted records).  

- [ ] 8.1 View pending approvals (team sales with status Pending_Manager) – Mgr  
- [ ] 8.2 Review sale details & proof documents – Mgr  
- [ ] 8.3 Approve sale → status changes to Pending_Accountant – Mgr  
- [ ] 8.4 Reject sale → status back to Draft, require rejection reason – Mgr  
- [ ] 8.5 Auto‑calculate commission on approval (based on achievement % & rules) – system  
- [ ] 8.6 Notify executive of approval/rejection – system  
- [ ] 8.7 Notify accountant when status becomes Pending_Accountant – system  

---

## Module 9: Accountant Deduction & Approval  
**Dependencies:** Module 8 (manager‑approved records).  

- [ ] 9.1 View account‑pending records (status Pending_Accountant) – Acc  
- [ ] 9.2 Apply EO/BP deduction (fixed amount + reason) – Acc  
- [ ] 9.3 Apply VAT rate (%) if not already included by executive – Acc  
- [ ] 9.4 Apply Tax rate (%) if not already included – Acc  
- [ ] 9.5 Real‑time net sales calculation preview – Acc  
- [ ] 9.6 Override final commission (optional) – Acc  
- [ ] 9.7 Approve → status Pending_Finance, commission finalised – Acc  
- [ ] 9.8 Reject → status Draft with reason – Acc  
- [ ] 9.9 Notify finance of pending approval – system  
- [ ] 9.10 Notify executive of rejection – system  

---

## Module 10: Finance Final Approval & Commission Trigger  
**Dependencies:** Module 9 (accountant‑approved records).  

- [ ] 10.1 View finance‑pending records (status Pending_Finance) – Fin  
- [ ] 10.2 Review final commission and deductions – Fin  
- [ ] 10.3 Final approve → status changes to Approved – Fin  
- [ ] 10.4 Reject → status Draft with reason – Fin  
- [ ] 10.5 Trigger commission eligibility check (achievement ≥ 50%) – system  
- [ ] 10.6 Automatically re‑evaluate previous NOT_ELIGIBLE records when threshold crossed – system  
- [ ] 10.7 Notify executive & manager of final approval – system  
- [ ] 10.8 Mark sale as ready for payment (paymentStatus = Pending) – system  

---

## Module 11: Commission Rules & Targets  
**Dependencies:** Module 2 (users), Module 4 (categories optional).  

- [ ] 11.1 View commission rules (read‑only) – Exe, Mgr, Acc, Fin  
- [ ] 11.2 Create commission rule (achievement range %, rate %, category optional, priority) – Admin, Super  
- [ ] 11.3 Edit commission rule – Admin, Super  
- [ ] 11.4 Delete commission rule – Admin, Super  
- [ ] 11.5 View all targets – Admin, Super  
- [ ] 11.6 Assign target to user (amount, period, dates) – Admin, Super, Manager (for own team)  
- [ ] 11.7 Edit target – Admin, Super, Manager (team only)  
- [ ] 11.8 Delete target – Admin, Super  

---

## Module 12: Commission & Eligibility Tracking  
**Dependencies:** Module 10 (approved sales), Module 11 (rules & targets).  

- [ ] 12.1 View own commissions list – Exe, Mgr  
- [ ] 12.2 View team commissions – Mgr  
- [ ] 12.3 View all commissions (admin/super/finance/accountant) – Acc, Fin, Admin, Super  
- [ ] 12.4 Filter commissions by eligibility (ELIGIBLE / NOT_ELIGIBLE) – Exe, Mgr, Acc, Fin, Admin, Super  
- [ ] 12.5 View achievement percentage against target – Exe, Mgr  
- [ ] 12.6 View team eligibility summary – Mgr  
- [ ] 12.7 Commission breakdown per sale (deductions, net, rate) – Exe, Mgr, Acc, Fin, Admin, Super  

---

## Module 13: Wallet & Payment Processing  
**Dependencies:** Module 10 (approved sales).  

- [ ] 13.1 View own wallet balance & transaction history – Exe, Mgr  
- [ ] 13.2 View all wallets (finance, admin, super) – Fin, Admin, Super  
- [ ] 13.3 View payment queue (approved commissions, paymentStatus = Pending) – Fin  
- [ ] 13.4 Process single payment → updates wallet balance, adds transaction, sets paymentStatus = Paid – Fin  
- [ ] 13.5 Process batch payments (select multiple) – Fin  
- [ ] 13.6 View payment history with filters – Fin, Admin, Super  
- [ ] 13.7 Export payment report – Fin, Admin, Super  

---

## Module 14: Notifications & Real‑time Updates  
**Dependencies:** Module 1 (auth), Socket.IO setup.  

- [ ] 14.1 Real‑time notifications for sale submitted → manager – system  
- [ ] 14.2 Manager approved / rejected → executive – system  
- [ ] 14.3 Accountant processed / rejected → executive & finance – system  
- [ ] 14.4 Finance final approved / rejected → executive & manager – system  
- [ ] 14.5 Commission eligibility crossed 50% → executive – system  
- [ ] 14.6 New target assigned → executive / manager – system  
- [ ] 14.7 Bell icon with unread count – all roles  
- [ ] 14.8 Click notification to navigate to relevant page – all roles  
- [ ] 14.9 Mark notification as read – all roles  

---

## Module 15: Admin & SuperAdmin System Operations  
**Dependencies:** All previous modules.  

- [ ] 15.1 System dashboard with users count, teams, sales, commissions – Admin, Super  
- [ ] 15.2 View all sales records (read‑only for admin / super) – Admin, Super  
- [ ] 15.3 Backups – create, download, restore, delete – Super only  
- [ ] 15.4 System settings (commission defaults, company info, currency, date format) – Super only  
- [ ] 15.5 Database sync operations (recalculate commissions, fix statuses, reconcile wallets) – Super only  
- [ ] 15.6 Audit logs view (user actions) – Super only  
- [ ] 15.7 Analytics (user stats, sales trends, commission distribution) – Admin, Super  

---

## Module 16: Dashboard & Reporting  
**Dependencies:** All modules.  

- [ ] 16.1 Executive dashboard: total records, pending, approved amount, commission, targets chart – Exe  
- [ ] 16.2 Manager dashboard: team size, team sales, pending approvals, team commission – Mgr  
- [ ] 16.3 Accountant dashboard: pending approvals count, processed today, total deductions – Acc  
- [ ] 16.4 Finance dashboard: pending payments, approved today, total commissions – Fin  
- [ ] 16.5 Role‑specific analytics pages (charts, filters, export) – each role as per TODO  
- [ ] 16.6 Responsive design (mobile/tablet/desktop) – all roles  

---

## Cross‑Cutting Dependencies Summary

| Module | Depends on |
|--------|-------------|
| 1 | None |
| 2 | 1 |
| 3 | 2 |
| 4 | None |
| 5 | 4 |
| 6 | 5, 2 |
| 7 | 6 |
| 8 | 6 |
| 9 | 8 |
| 10 | 9 |
| 11 | 2, 4 |
| 12 | 10, 11 |
| 13 | 10 |
| 14 | 1 |
| 15 | 2,3,4,5,6,7,8,9,10,11,12,13 |
| 16 | All |

---

## How to Use This Checklist

1. **Start with Module 1** – authentication is the foundation.  
2. Move to Module 2 (users) and Module 4 (categories) – they can be parallel.  
3. Then Modules 5 (products) and 3 (teams) – needed for sales records.  
4. Implement Module 6 & 7 (create/view sales).  
5. Then approval chain Modules 8 → 9 → 10.  
6. Add commission rules (11) and tracking (12) – can be built before or after approvals.  
7. Implement wallet & payments (13) after Module 10.  
8. Add notifications (14) – can be integrated incrementally.  
9. Finally, admin/super tools (15) and dashboards (16).  

For each sub‑feature, tick the box when the feature is **implemented, tested, and deployed** for the indicated roles.  

---

**End of Checklist** – use this to guide your AI or track your own progress.