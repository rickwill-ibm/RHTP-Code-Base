# RHTP Admin Console — Detailed Implementation Plan

**Author:** Richard Hennessy / Rick Williams — IBM RHTP Team  
**Spec source:** `RHTP_Admin_Console_Plan.docx` (July 13, 2026)  
**Status:** PLAN — Awaiting approval before coding begins  
**Target app:** `RHTP_Code_Base` (Next.js 15 App Router, port 4029)

---

## 1. Overview

The Admin Console is a dedicated operational interface for **technical operators** (Platform Admin, Data/Integration Engineer, Security & Compliance Officer, Support Analyst, Auditor). It is distinct from the Director Command Center (P7 — executive product). All 8 sections live under a new top-level route `/admin-console` with sub-routes per section.

---

## 2. Route Structure

```
/admin-console                        → Home Dashboard (redirect target)
/admin-console/home                   → AC-1: Home Dashboard
/admin-console/data-connections       → AC-2: Data Connections
/admin-console/consent-governance     → AC-3: Consent & Governance
/admin-console/system-health          → AC-4: System Health
/admin-console/agent-oversight        → AC-5: Agent Oversight
/admin-console/identity-access        → AC-6: Identity & Access
/admin-console/data-quality           → AC-7: Data Quality
/admin-console/audit-compliance       → AC-8: Audit & Compliance
```

Each sub-route is a Next.js `page.tsx` wrapped in `AppLayout`. The root `/admin-console` redirects to `/admin-console/home`.

---

## 3. Nav Integration — `AppLayout.tsx`

### 3.1 New nav items (insert before `System` group)

```ts
// Admin Console
{ key: 'nav-ac-home',        label: 'Admin Console',        icon: 'ServerStackIcon',          href: '/admin-console/home',               group: 'Admin Console' },
{ key: 'nav-ac-data',        label: 'Data Connections',      icon: 'ArrowsRightLeftIcon',      href: '/admin-console/data-connections',    group: 'Admin Console' },
{ key: 'nav-ac-consent',     label: 'Consent & Governance',  icon: 'ShieldCheckIcon',          href: '/admin-console/consent-governance',  group: 'Admin Console' },
{ key: 'nav-ac-health',      label: 'System Health',         icon: 'HeartIcon',                href: '/admin-console/system-health',       group: 'Admin Console' },
{ key: 'nav-ac-agents',      label: 'Agent Oversight',       icon: 'CpuChipIcon',              href: '/admin-console/agent-oversight',     group: 'Admin Console' },
{ key: 'nav-ac-iam',         label: 'Identity & Access',     icon: 'UserCircleIcon',           href: '/admin-console/identity-access',     group: 'Admin Console' },
{ key: 'nav-ac-quality',     label: 'Data Quality',          icon: 'MagnifyingGlassIcon',      href: '/admin-console/data-quality',        group: 'Admin Console' },
{ key: 'nav-ac-audit',       label: 'Audit & Compliance',    icon: 'DocumentMagnifyingGlassIcon', href: '/admin-console/audit-compliance', group: 'Admin Console' },
```

### 3.2 `groupOrder` change

Add `'Admin Console'` between `'Agentic_Orchestrate-Screens'` and `'System'`:
```ts
const groupOrder = ['RHTP Program', 'Care Team Workflows', 'Whole Person Care', 'Agentic_Orchestrate-Screens', 'Admin Console', 'System', 'Backup'];
```

### 3.3 Collapse behaviour

`Admin Console` group renders always-expanded (same pattern as `RHTP Program` / `Care Team Workflows`). No collapse toggle needed.

---

## 4. Shared Infrastructure Files (new)

### `src/lib/adminConsoleRoles.ts`
Role definitions and permission matrix for the Admin Console's 5 roles × 8 sections.

```ts
export type AdminRole = 'platform_admin' | 'data_engineer' | 'security_compliance' | 'support_analyst' | 'auditor';
export type AdminSection = 'home' | 'data-connections' | 'consent-governance' | 'system-health' | 'agent-oversight' | 'identity-access' | 'data-quality' | 'audit-compliance';
export type Permission = 'none' | 'view' | 'edit' | 'full';

export const ROLE_PERMISSIONS: Record<AdminRole, Record<AdminSection, Permission>> = {
  platform_admin:       { home: 'full', 'data-connections': 'full', 'consent-governance': 'full', 'system-health': 'full', 'agent-oversight': 'full', 'identity-access': 'full', 'data-quality': 'full', 'audit-compliance': 'full' },
  data_engineer:        { home: 'view', 'data-connections': 'full', 'consent-governance': 'view', 'system-health': 'view', 'agent-oversight': 'view', 'identity-access': 'none', 'data-quality': 'full', 'audit-compliance': 'view' },
  security_compliance:  { home: 'view', 'data-connections': 'view', 'consent-governance': 'full', 'system-health': 'view', 'agent-oversight': 'full', 'identity-access': 'full', 'data-quality': 'view', 'audit-compliance': 'full' },
  support_analyst:      { home: 'view', 'data-connections': 'edit', 'consent-governance': 'none', 'system-health': 'view', 'agent-oversight': 'none', 'identity-access': 'none', 'data-quality': 'none', 'audit-compliance': 'none' },
  auditor:              { home: 'none', 'data-connections': 'none', 'consent-governance': 'view', 'system-health': 'none', 'agent-oversight': 'view', 'identity-access': 'view', 'data-quality': 'none', 'audit-compliance': 'full' },
};

export function getPermission(role: AdminRole, section: AdminSection): Permission { ... }
export function canView(role: AdminRole, section: AdminSection): boolean { ... }
export function canEdit(role: AdminRole, section: AdminSection): boolean { ... }
```

### `src/components/admin/AdminLayout.tsx`
Thin wrapper that adds the sub-nav "breadcrumb strip" common to all Admin Console sections. Renders the section title, FHIR R4 badge (where live data is shown), and the `AdminRoleBanner` showing the active admin role.

### `src/components/admin/AdminRoleBanner.tsx`
Pill showing active admin role (hardcoded to `platform_admin` in Phase 1 for demo; wired to `useAppContext()` role in Phase 2). Shown at top of every Admin Console page.

### `src/components/admin/AccessDenied.tsx`
Standard "Access Denied" card rendered when `canView(role, section) === false`.

---

## 5. Section-by-Section Implementation

---

### AC-1 — Home Dashboard
**Route:** `/admin-console/home/page.tsx`  
**Phase:** 1 MVP  
**FHIR resources:** `MeasureReport` (KPIs), `AuditEvent` (recent activity count), `Consent` (active count)

#### Layout
- 4-column KPI strip (Carbon pattern matching `executive-outcomes-dashboard`)
- 3-column section cards grid (one card per section AC-2 → AC-8) with status indicator and quick-action link
- Alert feed (last 5 system alerts — static mock in Phase 1)
- Recent activity log (last 10 AuditEvent resources from FHIR, or mock)

#### KPI cards (live FHIR in Live mode)
| Card | Source |
|---|---|
| Active Connectors | static mock (6/8) — Phase 1 |
| Consent Records Active | `GET /Consent?status=active&_summary=count` |
| System Uptime | static (99.94%) — Phase 1 |
| Open Alerts | static mock (3) — Phase 1 |

#### Section status cards
Each of the 8 sections gets a card showing: icon, name, status dot (green/amber/red — static), short description, "Open →" link. Renders regardless of role (role gates the linked page).

#### Files
```
src/app/admin-console/home/page.tsx          ← main page
```

---

### AC-2 — Data Connections
**Route:** `/admin-console/data-connections/page.tsx`  
**Phase:** 1 MVP  
**FHIR resources:** `Organization` (connector partners), static mock connector status

#### Layout
- Tab strip: `Connectors | Sync Log | Data Volume`
- **Connectors tab:** Table of 8 connectors (EHR, Claims, SDOH, CBO, Lab, Pharmacy, HIE, State Registry). Columns: Name, Type, Status (LIVE/DEGRADED/DOWN), Last Sync, Records/Day, Actions (Retry / Pause — edit+ only)
- **Sync Log tab:** Scrollable log entries with timestamp, connector, records processed, status — static mock data
- **Data Volume tab:** Simple bar chart (pure CSS/SVG, no external charting lib) showing daily record volume by connector — static mock

#### FHIR wiring (Live mode)
- `GET /Organization?type=partner` → populate connector org names/IDs
- Connector status rows are mock in Phase 1 (no real connector health API yet)

#### Role gates
- Retry/Pause action buttons: hidden for `view` permission, shown for `edit`/`full`

#### Files
```
src/app/admin-console/data-connections/page.tsx
```

---

### AC-3 — Consent & Governance
**Route:** `/admin-console/consent-governance/page.tsx`  
**Phase:** 1 MVP  
**FHIR resources:** `Consent` (all 4 seeded records + live create/update)

#### Layout
- Search bar (filter by patient name, partner org, status)
- Status filter pills: ALL | ACTIVE | REVOKED | EXPIRED | PENDING
- Consent records table: Patient, MRN, Type, Scope, Granted To, Status, Granted Date, Expires, Method, FHIR Ref
- Row expand: shows full provision details, purpose-of-use codes, data-use agreement status
- Data Sovereignty Rules panel (collapsible): 6 rules from `DATA_SOVEREIGNTY_RULES` (reuse pattern from `consent-sovereignty-panel/page.tsx`)
- Partner DUA Status table: partner org, agreement type, signed date, expiry — static mock

#### FHIR wiring (Live mode)
- `GET /Consent` → load all consent records → `mapFhirConsent()` (reuse mapper from `consent-sovereignty-panel`)
- Mock fallback: same 7 mock records as current `consent-sovereignty-panel`
- Phase 2: PUT/POST for consent edit/creation

#### Role gates
- Edit/Create/Revoke actions: `full` only (`platform_admin`, `security_compliance`)
- Row expand with full provision detail: `view`+

#### Files
```
src/app/admin-console/consent-governance/page.tsx
```

---

### AC-4 — System Health
**Route:** `/admin-console/system-health/page.tsx`  
**Phase:** 1 MVP  
**FHIR resources:** `MeasureReport` (uptime/performance KPIs), FHIR server ping

#### Layout
- KPI strip: API Uptime, Avg Latency, Error Rate, Active Sessions — static mock + FHIR ping
- Tab strip: `Services | Deployment Log | Incidents`
- **Services tab:** Table of platform services (FHIR Server, Auth Service, SDOH API, Claims Adapter, Notification Service, AI Orchestrator). Columns: Service, Version, Status, Uptime %, Last Deploy, Health Check. FHIR Server row pings `GET /metadata` live.
- **Deployment Log tab:** Static mock release log (version, date, deployed by, change summary, status: SUCCESS/ROLLBACK)
- **Incidents tab:** Static mock incident list (ID, severity, title, opened, resolved, RCA link)

#### FHIR wiring (Live mode)
- Ping `GET /fhir/metadata` for FHIR server status row
- `GET /MeasureReport?_count=1&_sort=-date` → surface latest measure date as "Last data refresh" KPI

#### Files
```
src/app/admin-console/system-health/page.tsx
```

---

### AC-5 — Agent Oversight
**Route:** `/admin-console/agent-oversight/page.tsx`  
**Phase:** 2  
**FHIR resources:** `AuditEvent` (agent action log), `Task` (pending high-risk actions)

#### Layout
- Alert banner if pending high-risk actions > 0
- Tab strip: `Pending Approval | Guardrails | Activity Log`
- **Pending Approval tab:** Queue of high-risk agent actions awaiting human sign-off. Columns: Agent, Action Type, Patient (masked), Risk Score, Requested, Approve / Deny buttons (`full`/`edit` only)
- **Guardrails tab:** Configurable thresholds table (action type, current threshold, min/max, last changed by). Edit mode for `full` permission.
- **Activity Log tab:** `AuditEvent` records filtered by `agent` entity type. Table: timestamp, agent ID, action, patient (masked), outcome.

#### FHIR wiring (Live mode)
- `GET /AuditEvent?entity-type=agent&_count=50&_sort=-date` → activity log
- `GET /Task?status=requested&code=high-risk-action` → pending approvals queue
- Phase 2: POST `AuditEvent` on Approve/Deny

#### Files
```
src/app/admin-console/agent-oversight/page.tsx
```

---

### AC-6 — Identity & Access
**Route:** `/admin-console/identity-access/page.tsx`  
**Phase:** 2  
**FHIR resources:** `Practitioner` (users), `AuditEvent` (security log)

#### Layout
- Tab strip: `Users & Roles | Access Reviews | Security Log`
- **Users & Roles tab:** Table of platform users. Columns: Name, NPI/ID, Role, Status, Last Login, MFA, Actions (Edit/Deactivate — `full` only). Create User button (`full` only).
- **Access Reviews tab:** Periodic access review records — who reviewed, date, outcome, next review due. Static mock.
- **Security Log tab:** `AuditEvent` records with `type=security`. Table: timestamp, user, event type, IP, outcome. Export CSV button (`full`/`security_compliance`).

#### FHIR wiring (Live mode)
- `GET /Practitioner` → populate Users & Roles table rows
- `GET /AuditEvent?type=security&_count=50&_sort=-date` → security log
- Phase 2: PUT Practitioner for role edits

#### Role gates
- Entire section: `none` for `data_engineer` → renders `<AccessDenied />`
- `auditor` gets view of security log only (tab 3), tabs 1 and 2 hidden

#### Files
```
src/app/admin-console/identity-access/page.tsx
```

---

### AC-7 — Data Quality
**Route:** `/admin-console/data-quality/page.tsx`  
**Phase:** 3  
**FHIR resources:** `Patient` (duplicate detection), `Observation` (quality flags)

#### Layout
- KPI strip: Match Queue, Auto-resolved Today, Manual Review Needed, Quality Score
- Tab strip: `Match Queue | Resolved | Metrics`
- **Match Queue tab:** Ambiguous entity match pairs. Each row: Patient A / Patient B (masked name + DOB + MRN), Match Score, Recommended Action (Merge/Split/Ignore), Review buttons (`full`/`data_engineer`).
- **Resolved tab:** History of resolved matches. Columns: Date, Operator, Action Taken, Patient IDs, Notes.
- **Metrics tab:** Data quality metrics table by connector — completeness %, duplicate rate, error rate. Static mock in Phase 3.

#### FHIR wiring (Live mode)
- `GET /Patient?_count=20` → surface patients for potential duplicate detection heuristic
- Match scores are computed client-side from DOB/name similarity — no separate API needed

#### Files
```
src/app/admin-console/data-quality/page.tsx
```

---

### AC-8 — Audit & Compliance
**Route:** `/admin-console/audit-compliance/page.tsx`  
**Phase:** 3  
**FHIR resources:** `AuditEvent` (all records)

#### Layout
- Date-range picker (last 7d / 30d / 90d / custom)
- Module filter (All | Data Connections | Consent | Agent | Identity | System)
- Audit trail table: Timestamp, Module, Actor (user ID), Action, Resource, Outcome. Sortable. Paginated (25/page).
- Export button (CSV of filtered results — `full` + `auditor` only)
- Compliance Reports panel: buttons to generate HIPAA Summary, 42 CFR Part 2 Report, CMS Attestation — static mock PDFs in Phase 3

#### FHIR wiring (Live mode)
- `GET /AuditEvent?_count=100&_sort=-date` + client-side filter by date range & module
- Each row maps `AuditEvent.agent[0].who`, `AuditEvent.action`, `AuditEvent.entity[0].what`, `AuditEvent.outcome`

#### Files
```
src/app/admin-console/audit-compliance/page.tsx
```

---

## 6. Redirect File

```
src/app/admin-console/page.tsx   → redirect to /admin-console/home
```

Contents:
```ts
import { redirect } from 'next/navigation';
export default function AdminConsoleRoot() { redirect('/admin-console/home'); }
```

---

## 7. File-by-File Task List

### Phase 1 MVP (implement first)

| # | File | Description |
|---|---|---|
| P1-1 | `src/lib/adminConsoleRoles.ts` | Role/permission matrix, helper functions |
| P1-2 | `src/components/admin/AdminRoleBanner.tsx` | Role pill shown on every AC page |
| P1-3 | `src/components/admin/AccessDenied.tsx` | Standard access-denied card |
| P1-4 | `src/components/AppLayout.tsx` | Add 8 nav items + `Admin Console` group + `groupOrder` update |
| P1-5 | `src/app/admin-console/page.tsx` | Root redirect → `/admin-console/home` |
| P1-6 | `src/app/admin-console/home/page.tsx` | AC-1 Home Dashboard |
| P1-7 | `src/app/admin-console/data-connections/page.tsx` | AC-2 Data Connections |
| P1-8 | `src/app/admin-console/consent-governance/page.tsx` | AC-3 Consent & Governance |
| P1-9 | `src/app/admin-console/system-health/page.tsx` | AC-4 System Health |

### Phase 2

| # | File | Description |
|---|---|---|
| P2-1 | `src/app/admin-console/agent-oversight/page.tsx` | AC-5 Agent Oversight |
| P2-2 | `src/app/admin-console/identity-access/page.tsx` | AC-6 Identity & Access |

### Phase 3

| # | File | Description |
|---|---|---|
| P3-1 | `src/app/admin-console/data-quality/page.tsx` | AC-7 Data Quality |
| P3-2 | `src/app/admin-console/audit-compliance/page.tsx` | AC-8 Audit & Compliance |

---

## 8. FHIR Resource Mapping Summary

| Section | Resource | Endpoint | Live / Mock |
|---|---|---|---|
| AC-1 Home | Consent | `GET /Consent?status=active&_summary=count` | Live |
| AC-1 Home | AuditEvent | `GET /AuditEvent?_count=5&_sort=-date` | Live |
| AC-1 Home | MeasureReport | `GET /MeasureReport?_count=1&_sort=-date` | Live |
| AC-2 Data Connections | Organization | `GET /Organization?type=partner` | Live |
| AC-3 Consent | Consent | `GET /Consent` | Live |
| AC-4 System Health | metadata | `GET /metadata` (ping) | Live |
| AC-4 System Health | MeasureReport | `GET /MeasureReport?_count=1&_sort=-date` | Live |
| AC-5 Agent Oversight | AuditEvent | `GET /AuditEvent?entity-type=agent&_count=50` | Live |
| AC-5 Agent Oversight | Task | `GET /Task?status=requested` | Live |
| AC-6 Identity & Access | Practitioner | `GET /Practitioner` | Live |
| AC-6 Identity & Access | AuditEvent | `GET /AuditEvent?type=security&_count=50` | Live |
| AC-7 Data Quality | Patient | `GET /Patient?_count=20` | Live |
| AC-8 Audit & Compliance | AuditEvent | `GET /AuditEvent?_count=100&_sort=-date` | Live |

---

## 9. UI Conventions (consistent with existing codebase)

- **Wrapper:** `<AppLayout pageTitle="..." breadcrumbs={[...]}>` — same as every other screen
- **FHIR R4 badge:** `<span className="text-xs font-semibold px-1.5 py-0.5 bg-[#defbe6] text-[#0e6027] border border-[#a7f0ba]">FHIR R4</span>` — shown in page header when live data present
- **KPI strip:** `grid grid-cols-2 md:grid-cols-4 gap-4` of `bg-white border border-carbon-gray-20 p-4` cards
- **Tables:** `w-full text-sm`, `thead` with `bg-carbon-gray-10 text-carbon-gray-70 text-xs uppercase`, `tbody` with `divide-y divide-carbon-gray-20 hover:bg-carbon-gray-10`
- **Tab strip:** Pill-style tabs, `bg-carbon-gray-10` inactive, `bg-carbon-blue text-white` active
- **Status badges:** `ACTIVE` → green `#defbe6/#0e6027`, `DEGRADED`/`REVOKED` → amber `#fff1e0/#8a3800`, `DOWN`/`EXPIRED` → red `#fff1f1/#a2191f`
- **No external charting libraries** — SVG-only bar charts (matches existing screens)
- **No PHI** — patient names masked to initials + last 4 MRN in non-clinical sections
- **Mock fallback** — every `useEffect` FHIR fetch wraps in try/catch and falls back to static mock array

---

## 10. Non-Functional Requirements (in-scope for implementation)

| Requirement | Implementation approach |
|---|---|
| Immutable audit logging | Every admin action (retry, approve, edit) posts a `AuditEvent` to FHIR in Live mode |
| Least-privilege RBAC | All action buttons conditioned on `canEdit()` / `canView()` from `adminConsoleRoles.ts` |
| No raw PHI | Patient names masked in all non-clinical admin sections |
| WCAG 2.1 AA | Semantic HTML, `aria-label` on icon buttons, keyboard-navigable tabs |
| Mobile-responsive | AC-1, AC-4, AC-5 use responsive grid; sidebar collapses same as rest of app |
| Step-up MFA | Placeholder modal for high-risk actions (guardrail edit, consent revoke) — Phase 2 |

---

## 11. Build Order & Commit Strategy

Each phase produces one git commit:

| Commit | Files | Message |
|---|---|---|
| `feat: AC Phase 1 — Admin Console nav + Home Dashboard + Data Connections + Consent & Governance + System Health` | P1-1 → P1-9 | Phase 1 MVP |
| `feat: AC Phase 2 — Agent Oversight + Identity & Access` | P2-1 → P2-2 | Phase 2 |
| `feat: AC Phase 3 — Data Quality + Audit & Compliance` | P3-1 → P3-2 | Phase 3 |

---

## 12. Out of Scope (this plan)

- Director Command Center (P7) — separate product, separate plan
- Real connector health APIs (connector status is mock in all phases)
- Step-up MFA implementation (placeholder modal only in Phase 2)
- PDF report generation (compliance reports are mock buttons in Phase 3)
- Backend API routes for admin actions (all writes go directly to FHIR R4 via `getFhirClient()`)
