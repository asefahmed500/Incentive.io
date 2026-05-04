# Role‑Based Feature Checklist with Role Dependencies

This document organizes all features by **user role** and shows **dependencies** – what other roles or system modules must be completed before a feature can function. Use this to plan development order or to guide an AI implementation.

---

## 1. Sales Executive (Exe)

**Dependencies for the entire role:**  
- Module 1 (Authentication)  
- Module 2 (User account exists, assigned to a manager)  
- Module 4 (Product categories)  
- Module 5 (Products)  

### Sub‑features

**1.1 Add Sales Record**  
- [ ] Multi‑product form (up to 20 lines)  
- [ ] Company name & email fields  
- [ ] Checkboxes: “Include Tax”, “Include VAT”  
- [ ] Upload proof of sale (images, PDF)  
- [ ] Save as draft  
- **Dependencies:** Products (Module 5), Categories (Module 4), Manager assignment (Module 3/2)

**1.2 Submit for Approval**  
- [ ] Change status from Draft → Pending_Manager  
- [ ] Notify manager (requires Module 14 – Notifications)  
- **Dependencies:** Module 14 (notifications)

**1.3 View Own Sales Records**  
- [ ] Filter by status, date, product  
- [ ] View details (products, deductions, approval history)  
- [ ] Edit draft records  
- **Dependencies:** Sales record creation (1.1)

**1.4 View Own Targets**  
- [ ] Display target amount, period  
- [ ] Show achievement % (based on approved sales)  
- **Dependencies:** Module 11 (targets assigned by Admin/Manager)

**1.5 View Commission Rules**  
- [ ] Read‑only list of commission tiers and rates  
- **Dependencies:** Module 11 (rules created by Admin)

**1.6 View Eligibility Status**  
- [ ] Show ELIGIBLE / NOT_ELIGIBLE based on achievement ≥ 50%  
- **Dependencies:** Module 12 (eligibility calculation)

**1.7 View Own Commissions**  
- [ ] List of commissions from approved sales  
- [ ] Show payment status (Pending / Paid)  
- **Dependencies:** Module 12 (commission tracking), Module 10 (finance final approval)

**1.8 View Wallet**  
- [ ] Current balance  
- [ ] Transaction history (credits from paid commissions)  
- **Dependencies:** Module 13 (wallet & payment processing)

**1.9 View Manager Info**  
- [ ] Name, email, phone of assigned manager  
- **Dependencies:** Module 3 (team assignment)

**1.10 Profile Management**  
- [ ] Update name, phone, password  
- **Dependencies:** Module 2 (user update endpoint)

---

## 2. Sales Manager (Mgr)

**Dependencies for the entire role:**  
- All Executive features (manager can also act as executive)  
- Module 3 (Team management)  
- Module 8 (Approval workflow)  

### Sub‑features

**2.1 Team Dashboard**  
- [ ] View team size, total team sales, team commission  
- [ ] Average achievement % of team  
- **Dependencies:** Module 3 (team members assigned), Module 7 (sales records of team)

**2.2 Pending Approvals (Manager Approval Queue)**  
- [ ] List team sales with status Pending_Manager  
- [ ] Review sale details, proof documents  
- [ ] Approve → status becomes Pending_Accountant, commission auto‑calculated  
- [ ] Reject → status Draft with required reason  
- **Dependencies:** Module 6 (executive submissions), Module 11 (commission rules for calculation)

**2.3 Team Sales History**  
- [ ] View all team sales, filter by employee  
- [ ] Export to Excel  
- **Dependencies:** Module 7 (sales records exist)

**2.4 Team Management**  
- [ ] View team members list  
- [ ] Add / remove team members (requires Admin/Super permissions – usually delegated)  
- **Dependencies:** Module 2 (user management), Module 3

**2.5 Assign Team Targets**  
- [ ] Set or edit target amount for any team member  
- **Dependencies:** Module 11 (target CRUD)

**2.6 Team Eligibility & Commissions**  
- [ ] View eligibility status of each team member  
- [ ] View team member commissions  
- **Dependencies:** Module 12

**2.7 Own Sales (Manager as Executive)**  
- [ ] Add own sales – auto‑approved (skip manager approval)  
- **Dependencies:** Same as Executive features (1.1 – 1.3)

**2.8 Wallet (own)**  
- [ ] Same as Executive wallet (1.8)  
- **Dependencies:** Module 13


---

## 3. Accountant (Acc)

**Dependencies for the entire role:**  
- Module 9 (Deduction & approval logic)  
- Manager approvals must be complete (status Pending_Accountant)  

### Sub‑features

**3.1 Accountant Approval Queue**  
- [ ] View sales with status Pending_Accountant  
- [ ] Display original sales amount, manager’s calculated commission  
- **Dependencies:** Module 8 (manager approvals completed)

**3.2 Apply Deductions**  
- [ ] EO/BP field (fixed amount + reason)  
- [ ] VAT rate (%) – only if executive did NOT include VAT  
- [ ] Tax rate (%) – only if executive did NOT include Tax  
- [ ] Real‑time net sales calculation  
- **Dependencies:** Sales record must have taxEnabled/vatEnabled flags from executive

**3.3 Set Final Commission**  
- [ ] System calculates commission on net sales (using manager’s rule)  
- [ ] Option to manually override final commission  
- **Dependencies:** Module 11 (commission rules)

**3.4 Approve / Reject**  
- [ ] Approve → status becomes Pending_Finance, paymentStatus = Pending  
- [ ] Reject → status Draft, notify executive & manager  
- **Dependencies:** Module 14 (notifications)

**3.5 View All Commissions & Wallets**  
- [ ] List commissions filtered by eligibility, employee, date  
- [ ] View all wallets (read‑only)  
- **Dependencies:** Module 12, Module 13

**3.6 Analytics**  
- [ ] Charts: commission trends, deduction breakdown  
- **Dependencies:** Module 16

---

## 4. Finance (Fin)

**Dependencies for the entire role:**  
- Module 10 (Finance approval and commission trigger)  
- Accountant approvals complete (status Pending_Finance)  
ro
### Sub‑features

**4.1 Finance Approval Queue**  
- [ ] View sales with status Pending_Finance  
- [ ] Review final commission, deductions applied by accountant  
- **Dependencies:** Module 9 (accountant processed)

**4.2 Final Approve**  
- [ ] Approve → status becomes Approved  
- [ ] Trigger eligibility re‑evaluation for the period  
- [ ] Automatically re‑calculate previous NOT_ELIGIBLE records if threshold crossed  
- [ ] Reject → status Draft with reason  
- **Dependencies:** Module 12 (eligibility engine), Module 14 (notifications)

**4.3 Payment Queue**  
- [ ] View approved commissions with paymentStatus = Pending  
- [ ] Process single payment  
- [ ] Process batch payments (multiple selections)  
- **Dependencies:** Module 13 (wallet credit logic)

**4.4 Payment History**  
- [ ] View all paid commissions, filter by employee, date  
- [ ] Export payment report  
- **Dependencies:** Module 13

**4.5 View All Wallets**  
- [ ] List all user wallets, balances, transactions  
- **Dependencies:** Module 13

**4.6 Analytics**  
- [ ] Payment trends, total payouts by period  
- **Dependencies:** Module 16

---

## 5. Admin

**Dependencies for the entire role:**  
- All Executive, Manager, Accountant, Finance modules (admin oversees everything)  
- Module 2 (full user management), Module 11 (rules & targets), Module 15 (system ops)  

### Sub‑features

**5.1 User Management**  
- [ ] View all users (all roles except SuperAdmin – limited)  
- [ ] Create user (any role except SuperAdmin)  
- [ ] Edit user (role, manager assignment, status)  
- [ ] Delete user  
- [ ] Reset password  
- [ ] Block / unblock user  
- **Dependencies:** Module 2, Module 3 (for manager assignments)

**5.2 Team Management**  
- [ ] Create team  
- [ ] Assign manager to team  
- [ ] View team members and performance  
- **Dependencies:** Module 3

**5.3 Product Categories**  
- [ ] CRUD categories  
- **Dependencies:** Module 4

**5.4 Product Management**  
- [ ] CRUD products (name, SKU, category, price, stock)  
- [ ] Upload product images  
- **Dependencies:** Module 5, Module 4

**5.5 Commission Rules**  
- [ ] Create, edit, delete rules (achievement ranges, rates, category‑specific, priority)  
- **Dependencies:** Module 11

**5.6 Targets**  
- [ ] Assign, edit, delete targets for any user  
- **Dependencies:** Module 11

**5.7 Sales Records (View‑only)**  
- [ ] View all sales records, filter by status/date/user  
- [ ] Cannot modify approval fields  
- **Dependencies:** Module 6,7,8,9,10

**5.8 Commissions (View‑only)**  
- [ ] View all commissions, filter eligibility  
- **Dependencies:** Module 12

**5.9 Analytics Dashboard**  
- [ ] Users count, teams, sales, commissions charts  
- **Dependencies:** Module 16

**5.10 Backups (limited)**  
- [ ] View backups (creation only if permitted – usually Super only)  
- **Dependencies:** Module 15

**5.11 Settings (limited)**  
- [ ] System settings – only Super has write; Admin may have read  
- **Dependencies:** Module 15

---

## 6. Administrator (SuperAdmin)

**Dependencies for the entire role:**  
- All modules (full system)  
- Admin features plus additional system‑level operations  

### Sub‑features

**6.1 Full User Management**  
- [ ] Manage even other SuperAdmin accounts (except delete last one)  
- [ ] Create, edit, delete users of any role including SuperAdmin  
- **Dependencies:** Module 2 (extended permissions)

**6.2 System Settings**  
- [ ] Configure commission settings (default rate, minimum threshold)  
- [ ] Set company name, currency symbol, date format, timezone  
- [ ] Configure notification settings (email, SMS, in‑app)  
- **Dependencies:** Module 15

**6.3 Database Sync Operations**  
- [ ] Sync sales records: recalculate commissions, fix missing calculated commissions  
- [ ] Sync user data: update targets, team relationships, validate IDs  
- [ ] Sync commissions: re‑evaluate all commissions based on current rules  
- [ ] Sync wallets: reconcile balances, validate transactions  
- **Dependencies:** All data modules (6–13)

**6.4 Backup & Restore**  
- [ ] Create manual backup (full database export as JSON)  
- [ ] Download backup  
- [ ] Delete backup  
- [ ] Restore from backup (with warning and confirmation)  
- **Dependencies:** Module 15 (file system, database dump)

**6.5 Audit Logs**  
- [ ] View user actions, login attempts, setting changes  
- **Dependencies:** Module 15 (logging service)

**6.6 System Health Monitoring**  
- [ ] API response times, error rates, active sessions  
- **Dependencies:** Module 16 (enhanced analytics)

**6.7 All Admin Features**  
- [ ] Admin can do everything; SuperAdmin inherits all Admin features  
- **Dependencies:** Admin module (5)

---

## Cross‑Role Dependency Map (Simplified)

| Feature Area | Requires from other roles |
|--------------|---------------------------|
| Executive submits sale | Manager exists, Products exist |
| Manager approves | Executive submitted, Commission rules exist |
| Accountant deducts | Manager approved, Tax/VAT flags from executive |
| Finance pays | Accountant approved, Wallet module ready |
| Admin sets rules | No dependency – can be done anytime |
| SuperAdmin syncs | All data modules complete |

---

## Recommended Implementation Order (by Dependencies)

1. **Auth + User + Team base** (Modules 1, 2, 3) – allow login and role assignment.  
2. **Categories + Products** (Modules 4, 5) – so executives have products to sell.  
3. **Sales create + view** (Modules 6, 7) – executives can enter records.  
4. **Manager approval** (Module 8) – complete the first approval stage.  
5. **Commission rules + targets** (Module 11) – needed for calculations.  
6. **Accountant approval** (Module 9) – second stage.  
7. **Finance approval & eligibility** (Module 10, 12) – final stage and commission tracking.  
8. **Wallet & payments** (Module 13) – payout.  
9. **Notifications** (Module 14) – can be added incrementally, but useful from step 4.  
10. **Admin & SuperAdmin tools** (Module 15) – after core flow works.  
11. **Dashboards & analytics** (Module 16) – last, as they rely on aggregated data.

---

Use this checklist to track each sub‑feature. Mark `[x]` when implemented, tested, and integrated with its dependencies. This will ensure a role‑based, dependency‑aware build.