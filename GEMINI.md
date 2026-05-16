# GEMINI.md — Project Instructions for Incentive.io

## Project Overview
**Incentive.io** is a production-ready sales commission management system built with the Next.js App Router. It features a multi-stage approval workflow, real-time notifications via SSE, and role-based dashboards.

### Core Tech Stack
- **Framework:** Next.js 16.2.6 (App Router), React 19
- **Database:** MongoDB with Mongoose 9 (Soft deletes, compound indexes)
- **Authentication:** NextAuth v5 (JWT with jose verification, 24h maxAge)
- **Styling:** Tailwind CSS 4, shadcn/ui, Lucide React icons
- **State/Data:** Server Actions (Zod validated), React Hook Form, Zustand (auth)
- **Real-time:** Server-Sent Events (SSE) via `/api/events`
- **Testing:** Jest (Integration/Unit), Playwright (E2E)

---

## Building, Running, and Testing

| Task | Command |
|------|---------|
| **Development** | `npm run dev` |
| **Build (Prod)** | `npm run build:webpack` (Mandatory: Webpack is required for Mongoose bindings) |
| **Linting** | `npm run lint` |
| **Type Checking** | `npm run typecheck` |
| **Format** | `npm run format` |
| **Test (Jest)** | `npm test` |
| **Test (E2E)** | `npm run test:e2e` |
| **Seed Data** | `npm run seed` |

---

## Development Conventions & Mandates

### 1. Data Layer & Security
- **Server Actions:** All actions must be in `lib/actions/`, use `"use server"`, and return `{ success: boolean; data?: T; error?: string }`.
- **Role-Based Access Control (RBAC):** 
    - Enforced in `middleware.ts` (route-level) and within server actions (data-level).
    - Use `requireAuth()`, `requireRole()`, etc., from `lib/auth/role-guard.ts`.
- **Soft Deletes:** Never use `findByIdAndDelete`. All models use a `deletedAt` field. Queries are auto-filtered via Mongoose hooks.
- **Monetary Precision:** Always use `lib/utils/money.ts` (e.g., `calculateProductTotal`, `roundMoney`) to avoid floating-point errors.
- **Validation:** Use Zod schemas in `lib/validations/` for both API routes and server actions.

### 2. Database Patterns
- **Transactions:** Use MongoDB sessions for atomic updates (e.g., approving a sale + crediting a wallet). 
- **Local Fallback:** Code in `lib/actions/` handles local MongoDB environments (which lack replica sets) by falling back to non-transactional operations if a transaction fails.
- **Serialization:** Convert MongoDB `ObjectId` to string using `.toString()` before returning data from Server Actions to Client Components.
- **Helper:** Use `toObjectId()` from `lib/mongodb.ts` for consistent ID casting.

### 3. UI & Real-time
- **Real-time Updates:** Use the `useSSE` hook in dashboards for instant updates on sales, approvals, and wallet changes.
- **Notifications:** Use `hooks/useNotifications.ts` for unified toast notifications (Sonner).
- **Layouts:** Dashboards use `SidebarProvider` + `SidebarInset`. The `NotificationBell` belongs in the header.
- **Charts:** Use Recharts 3.8+ with 30-second polling as a fallback for SSE. Tooltip formatters must handle null values.

### 4. Code Style
- **Import Alias:** Use `@/*` for the root directory.
- **Prettier:** No semicolons, double quotes, trailing comma ES5.
- **Naming:** Role names are camelCase (`salesManager`, `salesExecutive`).

---

## Project Structure Highlights
- `app/`: Dashboards segregated by role (`admin`, `sales-dashboard`, `accountant`, etc.).
- `lib/actions/`: Encapsulated business logic.
- `lib/models/`: Mongoose schemas and hooks.
- `lib/validations/`: Centralized Zod schemas.
- `types/`: Comprehensive TypeScript interfaces (`index.ts`) and custom errors (`errors.ts`).

---

## Critical Workflow
**Approval Flow:** `Draft` → `Pending_Manager` → `Pending_Accountant` → `Pending_Finance` → `Approved`.
- **Rejection:** Returns the record to `Draft` status with `rejectionReason` and `rejectedBy`.
- **Commission:** Recalculated on **net sales** (Gross - Tax - VAT - deductions) only after the Accountant stage.
- **Eligibility:** 50% target achievement threshold triggers `isEligible: true`.
