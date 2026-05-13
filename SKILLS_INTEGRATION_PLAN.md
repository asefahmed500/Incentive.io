# Skills Integration Plan for Incentive.io

## Overview

This document outlines how specialized skills from `C:\Users\asefa\.agents\skills` are integrated into the Incentive.io sales commission management system to ensure production-ready quality.

## Project Context

- **Framework:** Next.js 16.2.6 (App Router) with RSC enabled
- **UI Library:** shadcn/ui (radix-nova style, radix base, lucide icons)
- **Installed Components:** 24 components (alert, avatar, badge, button, card, checkbox, dialog, dropdown-menu, field, input, label, navigation-menu, pagination, progress, select, separator, sheet, sidebar, skeleton, sonner, switch, table, tooltip)
- **Database:** MongoDB with Mongoose 9
- **Auth:** NextAuth v5 with JWT

## Skills Integration Matrix

| Skill | Purpose | Application Areas | Status |
|-------|---------|-------------------|--------|
| **next-best-practices** | Next.js code quality and best practices | File conventions, RSC boundaries, async patterns, error handling | 🟡 In Progress |
| **agent-browser** | Browser automation testing | E2E testing of user workflows, QA, bug hunts | 🔴 Not Started |
| **shadcn** | UI component optimization | Component usage patterns, styling rules, composition | 🟡 In Progress |
| **refero-design** | Research-first design methodology | New UI screens, flow improvements | 🔴 Not Started |
| **openui** | Generative UI framework | Future AI-powered UI features | 🔴 Not Started |

---

## 1. next-best-practices Integration

### Critical Areas to Review

#### File Conventions ✅
- [x] Project structure follows Next.js App Router conventions
- [x] Route segments properly organized (admin/, sales-dashboard/, etc.)
- [x] Middleware properly configured for auth

#### RSC Boundaries 🟡
- [ ] Review all client components for unnecessary `"use client"` directives
- [ ] Ensure server components are default (only add `"use client"` when needed)
- [ ] Check for non-serializable props passed to server components

**Action Required:** Audit client components and remove unnecessary `"use client"` directives

#### Async Patterns ✅
- [x] Using async `params` and `searchParams` properly
- [x] Server actions properly implemented with `"use server"`
- [x] Database connections use proper await patterns

#### Error Handling 🟡
- [x] Error boundaries implemented in dashboards
- [ ] Review all API routes for consistent error handling
- [ ] Ensure proper use of `unstable_rethrow` in catch blocks

**Action Required:** Standardize error handling across all API routes using `getStatusCodeForError()`

#### Data Patterns ✅
- [x] Using `Promise.all` to avoid data waterfalls
- [x] Server actions for data mutations
- [ ] Review for opportunities to use Suspense

**Action Required:** Add Suspense boundaries for better loading states

#### Route Handlers ✅
- [x] All API routes properly implemented
- [x] GET handlers don't conflict with page.tsx
- [x] Proper error responses

#### Image & Font Optimization 🟡
- [ ] Audit all images to use `next/image`
- [ ] Review font optimization with `next/font`

**Action Required:** Replace any `<img>` tags with `next/image`

---

## 2. agent-browser Integration

### Testing Strategy

#### Critical User Flows to Test

1. **Authentication Flow**
   - User registration with password validation
   - Login with all 6 roles
   - Session management and logout
   - Password reset flow

2. **Sales Executive Workflow**
   - Create new sales record
   - Upload product image
   - Submit for approval
   - View commission progress
   - Check eligibility status

3. **Manager Approval Workflow**
   - View pending approvals
   - Approve/reject sales records
   - Add rejection reason
   - View team performance

4. **Accountant Processing Workflow**
   - View pending records
   - Add tax/VAT deductions
   - Calculate net commission
   - Process records to finance

5. **Finance Approval Workflow**
   - View pending payments
   - Final approval
   - Trigger wallet credit
   - View payment history

6. **Admin User Management**
   - Create new users
   - Assign roles and teams
   - Set targets
   - Configure commission rules

### Browser Automation Commands

```bash
# Install agent-browser (if not already installed)
npm i -g agent-browser && agent-browser install

# Load core workflows
agent-browser skills get core --full

# Load specialized skills for testing
agent-browser skills get dogfood           # Exploratory testing / QA
agent-browser skills get electron          # If testing desktop apps

# Example: Test login flow
agent-browser goto http://localhost:3000/login
agent-browser fill '#email' 'admin@incentive.io'
agent-browser fill '#password' 'Admin123!'
agent-browser click 'button[type="submit"]'
agent-browser screenshot login-success.png
```

### Test Scenarios

| Scenario | Steps | Expected Outcome |
|----------|-------|------------------|
| Registration | Navigate to register, fill form with valid data, submit | Account created, redirected to login |
| Invalid Login | Attempt login with wrong password | Error message shown |
| Sales Record Creation | Add product, fill details, submit | Record saved as Draft |
| Manager Approval | View pending, approve record | Status changes to Pending_Accountant |
| Commission Calculation | Process accountant deductions, approve | Net commission calculated correctly |
| Wallet Credit | Finance approves record | Wallet balance increases |

---

## 3. shadcn Integration

### Current Component Usage Audit

#### Properly Used Patterns ✅
- Button variants (default, outline, ghost, destructive)
- Card composition (CardHeader, CardTitle, CardContent)
- Form validation with Field component
- Loading states with Skeleton
- Toast notifications with sonner
- Dialogs with proper Title/Description

#### Areas for Improvement 🟡

**Critical Rule Violations Found:**

1. **Spacing:** Some instances of `space-y-*` instead of `gap-*`
   - Location: `app/accountant/page.tsx`, `app/finance/page.tsx`
   - Fix: Replace with `flex flex-col gap-*`

2. **Icon Sizing:** Icons with manual sizing classes
   - Location: Multiple dashboard pages
   - Fix: Remove `size-4` or `w-4 h-4` classes from icons inside components

3. **Form Layout:** Some forms using raw `div` instead of `FieldGroup`
   - Location: `app/register/register-form.tsx`
   - Fix: Restructure to use `FieldGroup` + `Field` pattern

**Action Required:**
1. Audit all components for shadcn rule violations
2. Replace `space-y-*` with `gap-*` patterns
3. Remove icon sizing classes inside components
4. Use `FieldGroup` for all form layouts

### Component Additions Needed

Based on the project needs, consider adding:
- ` resizable` - For resizable panels in dashboards
- `scroll-area` - For better scrolling in tables/lists
- `tabs` - For tabbed interfaces (already using custom implementation)

---

## 4. refero-design Integration

### Research-First Approach for New Features

When creating new UI screens or flows:

1. **Discovery Phase**
   - Define WHAT we're building (screen type, platform, scope)
   - Identify WHO it's for (audience, technical level)
   - Determine the primary action and success metric
   - Establish the desired tone and feeling

2. **Research Phase**
   - Use Refero MCP to search for similar screens/flows
   - Analyze top 5-10 examples in detail
   - Extract specific tactics (not generic patterns)
   - Document findings with exact details

3. **Analysis Phase**
   - Create pattern comparison table
   - Build "steal list" with specific adaptations
   - Make intentional design decisions

4. **Design Phase**
   - Apply professional craft (typography, color, spacing)
   - Add unique "soul" elements (20% unique, 80% proven)
   - Avoid AI slop (no indigo/violet defaults, no blob backgrounds)

5. **Implementation Phase**
   - Build with semantic HTML
   - Ensure responsive design
   - Add proper hover/focus states
   - Validate against quality gates

### Example: Improving the Registration Form

**Discovery:**
- WHAT: User registration form
- WHO: New users across all 6 roles
- GOAL: Get users to create strong passwords and complete registration
- TONE: Professional, secure, helpful
- OBJECTION: "Password requirements are too complex"

**Research Queries:**
- "registration form"
- "signup with password requirements"
- "enterprise saas registration"
- "password strength indicator"

**Expected Findings:**
- Progressive password strength indicators
- Real-time validation feedback
- Clear password requirements display
- Minimal form fields to reduce friction

**Implementation:**
- Already improved with real-time password requirements display
- Next: Add progressive strength indicator

---

## 5. openui Integration (Future)

### Potential Use Cases

1. **AI-Powered Dashboard Configuration**
   - Allow users to describe desired dashboard layout
   - Generate UI components dynamically
   - Stream dashboard updates in real-time

2. **Dynamic Report Generation**
   - Users describe report requirements in natural language
   - OpenUI Lang generates report layout
   - Renderer displays structured report

3. **Custom Form Builder**
   - Admin describes form requirements
   - AI generates form with appropriate fields
   - Real-time preview and adjustment

### Integration Steps

1. Install OpenUI SDK:
```bash
npm install @openuidev/react-lang @openuidev/react-headless
```

2. Define component library with Zod schemas
3. Create library prompt from components
4. Integrate with LLM for streaming generation
5. Use Renderer component for live UI

---

## Implementation Priority

### Phase 1: Code Quality (Week 1)
1. Complete next-best-practices review
2. Fix shadcn rule violations
3. Standardize error handling
4. Optimize client components

### Phase 2: Testing (Week 2)
1. Set up agent-browser
2. Create test scenarios for all user flows
3. Execute automated tests
4. Document and fix bugs

### Phase 3: Design Improvements (Week 3)
1. Use refero-design for new UI improvements
2. Implement progressive password strength indicator
3. Add better loading states
4. Improve empty states

### Phase 4: Advanced Features (Week 4)
1. Evaluate openui integration
2. Implement AI-powered features if valuable
3. Final testing and validation

---

## Success Metrics

### Code Quality
- [ ] Zero unnecessary `"use client"` directives
- [ ] All components follow shadcn rules
- [ ] Consistent error handling across all routes
- [ ] Proper use of Next.js best practices

### Testing Coverage
- [ ] All 6 user workflows tested end-to-end
- [ ] Critical paths automated with agent-browser
- [ ] Edge cases identified and fixed
- [ ] Performance benchmarks established

### Design Quality
- [ ] All new screens follow research-first approach
- [ ] Consistent visual language
- [ ] Accessible contrast ratios
- [ ] Responsive design verified

---

## Skills Command Reference

### next-best-practices
```bash
# View specific best practices
cat C:/Users/asefa/.agents/skills/next-best-practices/[topic].md

# Topics: file-conventions, rsc-boundaries, async-patterns,
# runtime-selection, directives, functions, error-handling,
# data-patterns, route-handlers, metadata, image, font,
# bundling, scripts, hydration-error, suspense-boundaries,
# parallel-routes, self-hosting, debug-tricks
```

### agent-browser
```bash
# Get core workflows
agent-browser skills get core --full

# Get specialized skills
agent-browser skills get dogfood
agent-browser skills get electron

# Common commands
agent-browser goto <url>
agent-browser fill <selector> <value>
agent-browser click <selector>
agent-browser screenshot <path>
agent-browser pdf <path>
```

### shadcn
```bash
# Get project context
npx shadcn@latest info --json

# Search components
npx shadcn@latest search <query>

# Get component docs
npx shadcn@latest docs <component>

# Add components
npx shadcn@latest add <component>

# Preview changes
npx shadcn@latest add <component> --dry-run
npx shadcn@latest add <component> --diff <file>
```

### refero-design
```bash
# Access via Refero MCP server
# Requires: https://api.refero.design/v1/mcp with Bearer token

# Research workflow
search_screens("<query>", limit=25)
get_screen("<screen_id>", include_similar=true)
search_flows("<query>", limit=25)
get_flow("<flow_id>")
get_design_guidance("<screen_type>")
```

### openui
```bash
# Scaffold new app
npx @openuidev/cli@latest create --name my-app

# Full documentation
curl https://www.openui.com/llms-full.txt

# Topic index
curl https://www.openui.com/llms.txt
```

---

## Next Steps

1. **Immediate (Today)**
   - Complete next-best-practices review
   - Fix shadcn rule violations
   - Set up agent-browser for testing

2. **Short-term (This Week)**
   - Execute agent-browser test scenarios
   - Fix any bugs found
   - Implement design improvements using refero-design

3. **Long-term (Next Week)**
   - Evaluate openui integration
   - Implement AI-powered features
   - Final validation and deployment

---

*This plan ensures systematic integration of specialized skills to achieve production-ready quality for the Incentive.io sales commission management system.*
