# Bug Tracker

---

## BUG-001: Signout Fails — Session Cookie Survives Signout

**Status:** FIXED  
**Date:** 2026-06-09  
**Severity:** Critical  
**Affected:** All roles

### Symptom

Clicking "Sign Out" navigates to `/login`, briefly shows the login form, then redirects back to the dashboard. Session cookie persists.

### Root Cause

Three interacting bugs form a race condition:

1. **SessionRecheck Infinite Loop** (`components/session-recheck.tsx`) — `useEffect` deps included `session`, causing `update()` → session change → re-run → loop at ~100ms.

2. **Overly Broad jwt Callback** (`lib/auth/auth.ts`) — `trigger === "update" || (!user && token.id)` matched every `GET /api/auth/session`, re-issuing JWT on every poll. Fuel for the loop.

3. **Race During Signout** — In-flight `GET /api/auth/session` responses re-issue JWT cookie after signout clears it, undoing signout silently.

```
T=0:   SessionRecheck sends GET /api/auth/session (in-flight)
T=100: User clicks Sign Out
T=160: POST /api/auth/signout → Set-Cookie clears cookie ✓
T=200: window.location.href = "/login" queued
T=220: In-flight request returns → Set-Cookie RE-ISSUES JWT ✗ ← signout undone
T=300: Browser navigates to /login with re-set cookie
```

### Fix (3 changes)

| File | Change |
|------|--------|
| `components/session-recheck.tsx` | Use `useRef` for session/update, effect deps only `[interval]` |
| `lib/auth/auth.ts` | jwt callback runs DB recheck only on `trigger === "update"` |
| `app/api/auth/[...nextauth]/route.ts` | Signout builds fresh `Response` with clean `Set-Cookie` headers |

---

## BUG-002: Commission Rule Boundary Bug — $0 At Exact Thresholds

**Status:** OPEN  
**Severity:** CRITICAL  
**File:** `lib/actions/approval.actions.ts:974`

### Symptom

Commission calculates as $0 when achievement hits exactly 80%, 100%, or 150%.

### Root Cause

`calculateCommission` queries with `targetPercentageTo: { $gt: achievement }` (strictly greater than). Seed data rules at intervals `[0,80]`, `[81,100]`, `[101,150]`, `[151,999]`. At EXACTLY 80%, 100%, or 150%, no rule matches.

### Fix

Change `$gt` to `$gte` at `lib/actions/approval.actions.ts:974`.

---

## BUG-003: `resetSaleStatuses` — No Auth, Public Server Action

**Status:** OPEN  
**Severity:** CRITICAL  
**File:** `lib/actions/sales.actions.ts:24-41`

### Symptom

Any authenticated user can reset ANY sale record to Draft status, bypassing the entire approval workflow.

### Root Cause

Function has `"use server"` directive but NO session/auth/role check. Public endpoint.

### Fix

Add `const session = await auth()` and check that the caller is admin/administrator or owns the record.

---

## BUG-004: Rate Limiter Ineffective on Vercel (In-Memory)

**Status:** OPEN  
**Severity:** CRITICAL  
**File:** `lib/rate-limit.ts:22-64`

### Symptom

Brute-force protection on login, register, and password-reset endpoints is completely ineffective on Vercel production.

### Root Cause

`RateLimitCache` uses a module-level in-memory `Map`. On Vercel (serverless), each cold start gets a fresh cache. A single user can spread requests across instances to bypass limits entirely.

### Fix

Replace with Redis-based rate limiter (e.g., `@upstash/ratelimit`) or use Vercel Edge Config.

---

## BUG-005: MongoDB Credentials Leaked in Test Logs

**Status:** OPEN  
**Severity:** CRITICAL  
**File:** `tests/setup.ts:67`

### Symptom

`console.log("MongoDB: ${process.env.MONGODB_URI || ...}")` prints full MongoDB URI with credentials.

### Fix

Redact password: `MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')`

---

## BUG-006: CORS Handler Short-Circuits Auth For All API Routes

**Status:** OPEN  
**Severity:** HIGH  
**File:** `middleware.ts:14-29`

### Symptom

For any request path starting with `/api/`, middleware handles CORS and returns `NextResponse.next()` BEFORE reaching auth/role checks (lines 48-132). Zero middleware-level authorization for all API routes.

### Root Cause

The CORS handler at line 14 runs first and returns early at line 29. Auth checks are unreachable for `/api/*` paths.

### Mitigation

Every API route handler implements its own `requireAuth()`/`requireRole()` — but if any new route omits this, it's instantly exposed.

### Fix

Move CORS handling BELOW the public path check, or add auth checks before the early return. At minimum, check `req.auth` before returning `NextResponse.next()` for non-public API routes.

---

## BUG-007: `requireRole()` Never Checks `isActive`

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/auth/role-guard.ts:18-28`

### Symptom

Blocked users can call protected endpoints for up to 60 seconds after being deactivated.

### Root Cause

`requireRole()` (and all wrappers: `requireAdminOrAbove`, `requireManagerOrAbove`, etc.) only check session exists and role matches. Never check `session.user.isActive`. Meanwhile `requireAuth()` DOES check `isActive` at line 12.

This means the three approval endpoints (`/api/approvals/{manager,accountant,finance}`), backup routes, sync routes, and all admin endpoints accept requests from blocked users whose JWT hasn't been revalidated yet.

### Fix

Add `isActive` check to `requireRole()`:
```typescript
const isActive = (session.user as AuthUser).isActive;
if (isActive === false) return { error: "Account deactivated", status: 403 };
```

---

## BUG-008: `notifyAccountantProcessed` Notifies Wrong Recipient

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/actions/notification.actions.ts:331-342`

### Symptom

When an accountant processes a sale, the manager gets a notification, NOT the finance user.

### Root Cause

The function takes `managerId` parameter and creates notification for `userId: parsed.data.managerId`, but the spec says `ACCOUNTANT_PROCESSED` should notify Finance.

### Fix

Change `userId` to finance user IDs and `link` to `/finance/approvals`.

---

## BUG-009: `notifySaleResubmitted` Never Called

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/actions/notification.actions.ts:444`

### Symptom

When a sales executive resubmits a rejected record, it sends a generic "New Sale Pending Approval" notification instead of a "Sale Resubmitted" notification.

### Root Cause

`notifySaleResubmitted` is fully implemented but never imported or called anywhere. `submitSalesRecord` in `sales.actions.ts:515` always calls `notifySaleSubmitted` regardless of whether this is a first submission or resubmission.

### Fix

In `submitSalesRecord`, detect if the record was previously rejected (e.g., check `rejectionReason` field), and call `notifySaleResubmitted` instead.

---

## BUG-010: Audit Log Attributes Rejections To Wrong User

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/actions/approval.actions.ts:199`

### Symptom

When a sale is rejected, the audit trail shows the record's manager (not the actual rejecting user) as having performed the action.

### Root Cause

`userId: record.managerId?.toString()` — uses the record's manager field instead of `session.user.id`.

### Fix

Change to `userId: session.user.id`.

---

## BUG-011: Manager Sees All Pending Approvals (Cross-Team Data Leak)

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/actions/approval.actions.ts:50`

### Symptom

A sales manager sees ALL `Pending_Manager` records from EVERY team in the system.

### Root Cause

`getPendingManagerApprovals` queries `SalesRecord.find({ status: "Pending_Manager" })` with NO `managerId` filter. The `approveSale` action at line 86 does filter by team, so managers can see records they can't act on. Cross-team data leakage + broken UX.

### Fix

Add `managerId: session.user.id` to the query filter.

---

## BUG-012: `requireAccountantOrAbove` Incorrectly Includes Finance

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/auth/role-guard.ts:42-43`

### Symptom

Finance users can access the accountant approval endpoint (`/api/approvals/accountant`), allowing them to process accountant deductions (EO/BP, tax, VAT).

### Root Cause

`requireRole("admin", "administrator", "accountant", "finance")` — finance role was incorrectly included.

### Fix

Remove `"finance"` from the role list: `requireRole("admin", "administrator", "accountant")`.

---

## BUG-013: Managers Can Edit/Delete Any Employee's Records

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/actions/sales.actions.ts:467,554,592`

### Symptom

Sales managers can submit, delete, or edit records from ANY employee, not just their team.

### Root Cause

Ownership checks use: `record.employeeId.toString() !== userId && !["admin", "administrator", "salesManager"].includes(userRole)`. Any sales manager bypasses the `employeeId` check. Compare with `approveSale` which correctly checks `record.managerId?.toString() !== session.user.id` for managers.

### Fix

For managers, verify `record.managerId === session.user.id` (i.e., the employee belongs to their team) instead of letting all managers through.

---

## BUG-014: No ErrorBoundary on 10+ Critical Sub-Pages

**Status:** OPEN  
**Severity:** HIGH  
**Affected:** `finance/commissions`, `finance/wallets`, `finance/analytics`, `finance/approvals`, `sales-dashboard/commissions`, `sales-dashboard/records`, `sales-manager/commissions`, `admin/commissions`, `accountant/commissions`, `sales-dashboard/add-record`

### Symptom

Server component errors on these pages crash to a raw error page with no user-friendly fallback.

### Fix

Wrap page contents in `<ErrorBoundary fallback={<ErrorMessage />}>`.

---

## BUG-015: Icon-Only Buttons Missing `aria-label`

**Status:** OPEN  
**Severity:** HIGH  
**Files:** `app/sales-dashboard/records/page.tsx:216-231`, `app/finance/approvals/page.tsx`, `app/finance/payment-queue/page.tsx`

### Symptom

Eye, Pencil, Send, Trash, and X buttons have only SVG icons with no text. Screen readers have no way to describe the action.

### Fix

Add `aria-label` to each icon-only button (e.g., `aria-label="View record"`, `aria-label="Delete"`).

---

## BUG-016: Form Errors Use `alert()` Instead of Toast

**Status:** OPEN  
**Severity:** HIGH  
**Files:** `app/sales-dashboard/add-record/page.tsx:224,238,246`, `app/sales-manager/add-record/page.tsx`, `app/finance/payment-queue/page.tsx:62,72,108`

### Symptom

Form submission errors show a browser `alert()` dialog instead of the project's `sonner` toast system.

### Fix

Replace `alert()` calls with `toast.error()` from `useNotifications` hook.

---

## BUG-017: Finance/Sales-Manager Dashboards Have No Empty State

**Status:** OPEN  
**Severity:** HIGH  
**Files:** `app/finance/page.tsx:92-263`, `app/sales-manager/page.tsx:124-298`

### Symptom

When a finance user or sales manager has zero records, the dashboard renders all zero-value cards and empty charts with no user guidance.

### Fix

Add `EmptyState` component with guidance text (e.g., "No sales records yet" / "No team members assigned").

---

## BUG-018: Rate Limit Header Contradicts Actual Limit

**Status:** OPEN  
**Severity:** HIGH  
**File:** `app/api/auth/[...nextauth]/route.ts:55,69`

### Symptom

Rate limit check allows 20 requests (`check(20, ip)`), but the response header reports `"X-RateLimit-Limit": "10"`. Clients reading the header get wrong information.

### Fix

Change header value from `"10"` to `"20"` to match the actual check.

---

## BUG-019: String Errors Passed to `handleError()` Return 500 Instead of Correct Status

**Status:** OPEN  
**Severity:** HIGH  
**Files:** `app/api/reset-password/request/route.ts:47`, `app/api/reset-password/confirm/route.ts:53`

### Symptom

Benign errors like "User not found" or "Invalid token" return HTTP 500 instead of 400/404.

### Root Cause

`handleError()` receives a plain string and falls through to the `Error` path (status 500). It doesn't handle strings.

### Fix

Add string handling to `handleError()` in `lib/api-error.ts`: return appropriate HTTP status for known error message patterns.

---

## BUG-020: Path Traversal in Uploaded Filenames

**Status:** OPEN  
**Severity:** HIGH  
**File:** `app/api/upload/route.ts:46`

### Symptom

Uploaded filenames like `../../etc/critical` are accepted and stored in MongoDB as-is. Used in Content-Disposition headers and API responses.

### Fix

Strip path components: `file.name.replace(/^.*[\\/]/, '')`.

---

## BUG-021: Unsanitized Filename in Content-Disposition Header

**Status:** OPEN  
**Severity:** HIGH  
**File:** `app/api/files/[id]/route.ts:33`

### Symptom

`Content-Disposition: inline; filename="${attachment.filename}"` uses original filename without sanitization. Malicious names like `malware.exe"` can manipulate the header.

### Fix

Sanitize filenames: `attachment.filename.replace(/[^a-zA-Z0-9._-]/g, '_')`.

---

## BUG-022: SMTP Error Details Returned to Caller

**Status:** OPEN  
**Severity:** HIGH  
**File:** `lib/email.ts:50-53`

### Symptom

`sendEmail()` returns raw SMTP transport errors to callers. These may contain server hostnames, ports, and connection details.

### Fix

Return sanitized error: `{ success: false, error: "Failed to send email" }`, log full error separately.

---

## BUG-023: SSE Keepalive Interval Leaked On Stream Cancel

**Status:** OPEN  
**Severity:** MEDIUM  
**File:** `app/api/events/route.ts:50-66`

### Symptom

When the ReadableStream's `cancel()` fires (client navigates away), the `keepaliveInterval` timer is NOT cleared. Timer runs indefinitely in the server process.

### Fix

Store interval ID in a closure-accessible variable and clear it in both the `abort` handler and `cancel()` callback.

---

## BUG-024: SSE Map Modified During `forEach` Iteration

**Status:** OPEN  
**Severity:** MEDIUM  
**File:** `lib/sse.ts:51-78`

### Symptom

`sendToRole()` and `broadcast()` call `this.clients.forEach()` while `removeClient()` (called from catch blocks) can `this.clients.delete(userId)`. Modifying a Map during forEach is undefined behavior.

### Fix

Snap the client list before iterating: `Array.from(this.clients.entries())`.

---

## BUG-025: No In-App Notification To Finance When Accountant Processes

**Status:** OPEN  
**Severity:** MEDIUM  
**File:** `lib/actions/approval.actions.ts:388-391`

### Symptom

When accountant processes a sale, finance users get email and an SSE `DASHBOARD_REFRESH` event, but NO bell notification appears in the finance user's dropdown.

### Fix

Call `notifyAccountantProcessed` with finance user IDs instead of manager ID (see BUG-008).

---

## BUG-026: No Atomicity on `approveSale` and `processByAccountant`

**Status:** OPEN  
**Severity:** MEDIUM  
**Files:** `lib/actions/approval.actions.ts:79-100,319-359`

### Symptom

Both use `findById` → modify → `record.save()` with no locking. Concurrent requests both pass status check, both save, second silently overwrites first.

### Fix

Use `findOneAndUpdate` with the status as an additional filter condition for atomicity:
```typescript
await SalesRecord.findOneAndUpdate(
  { _id: record._id, status: "Pending_Manager" },
  { $set: { status: "Pending_Accountant", ... } }
);
```

---

## BUG-027: `rejectSale` Doesn't Validate `rejectedBy` Matches Caller

**Status:** OPEN  
**Severity:** MEDIUM  
**File:** `lib/actions/approval.actions.ts:150-174`

### Symptom

Any role can call `rejectSale` with any `rejectedBy` value. A manager could pass `rejectedBy: "finance"`.

### Fix

Validate that `session.user.role` matches the `rejectedBy` parameter or derive it server-side.

---

## BUG-028: Manager's Own Sales Records May Be Invisible

**Status:** OPEN  
**Severity:** MEDIUM  
**File:** `lib/actions/sales.actions.ts:139-150`

### Symptom

The `roleFilter` for `salesManager` builds an `$or` of team `employeeIds` and `managerId` match. A manager creating their own record won't be in their own team's `employeeIds`, and `managerId` on the record would be their *own* manager, not their user ID.

### Fix

Add the manager's own `employeeId` to the filter: `$or: [...teamIds, { managerId: userId }, { employeeId: userId }]`.

---

## BUG-029: No `error.tsx` or `not-found.tsx` At Root

**Status:** OPEN  
**Severity:** MEDIUM  
**File:** `app/` (missing)

### Symptom

Server component errors and 404s show default Next.js error/not-found pages with no branding or navigation.

### Fix

Create `app/error.tsx` and `app/not-found.tsx` with branded UI.

---

## BUG-030: Double `auth()` Call Per Notification

**Status:** OPEN  
**Severity:** LOW  
**File:** `lib/actions/notification.actions.ts:102,290`

### Symptom

Every notification: `notifyManagerApproved()` calls `auth()` at line 303, then `createNotification()` calls `auth()` again at line 102. Two DB hits per notification.

### Fix

Pass the session object down to `createNotification` instead of re-calling `auth()`.

---

## BUG-031: `formatCurrency` Never Used – 174+ `toLocaleString` Calls

**Status:** OPEN  
**Severity:** LOW  
**File:** `lib/utils/money.ts:74-79`

### Symptom

All currency displays use raw `.toLocaleString()` with varying decimal precision instead of the project's `formatCurrency()` helper that ensures consistent 2-decimal display.

### Fix

Replace `.toLocaleString()` calls with `formatCurrency()` throughout the codebase.

---

## BUG-032: `logoutAction` Dead Code

**Status:** OPEN  
**Severity:** LOW  
**File:** `lib/actions/auth.actions.ts:5-7`

### Symptom

`logoutAction` is defined but never imported or used. All 6 layouts use `signOut({ callbackUrl: "/login" })` directly. If called, it does a GET (not POST) to signout, which wouldn't properly clear cookies.

### Fix

Remove `logoutAction` or fix it to use POST to signout.

---

## BUG-033: Raw `price * qty` Instead of `calculateProductTotal`

**Status:** OPEN  
**Severity:** LOW  
**Files:** `app/sales-dashboard/add-record/page.tsx:252-256`, `app/sales-manager/add-record/page.tsx`

### Symptom

Client-side total calculation uses direct float multiplication instead of the project's cents-based `calculateProductTotal()` from `lib/utils/money.ts`. Can produce floating-point artifacts.

### Fix

Import and use `calculateProductTotal(price, qty)`.

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| CRITICAL | 5 | 1 (BUG-001) |
| HIGH | 17 | 1 (BUG-001) |
| MEDIUM | 7 | 0 |
| LOW | 5 | 0 |
| **Total** | **33** | **1** |
