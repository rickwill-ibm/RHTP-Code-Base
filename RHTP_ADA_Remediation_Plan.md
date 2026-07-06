# RHTP — ADA / WCAG 2.1 AA Remediation Plan

**Product:** RHTP (Total Cost of Care Clinical Platform)  
**Standard:** WCAG 2.1 Level AA (IBM Accessibility Requirement)  
**Date:** June 2025  
**Prepared by:** IBM Bob (Automated Codebase Audit — 168 TSX files)  
**Total Gaps Found:** 21 (7 Critical · 5 High · 6 Medium · 3 Low)  
**Estimated Timeline:** 10 weeks · ~105–135 dev hours  

---

## Executive Summary

RHTP has significant ADA compliance gaps that would fail a WCAG 2.1 AA audit. The most severe issues are:

1. **610 interactive div/span elements** with `onClick` but no keyboard support — the app is effectively unusable without a mouse
2. **Zero `aria-live` regions** — screen readers are blind to every dynamic update, workflow change, and status message
3. **294 unlabeled form fields** (152 inputs, 89 selects, 53 textareas) — screen readers cannot identify any field
4. **52 modal dialogs** with no focus-trap, no `role="dialog"`, no `aria-modal` — keyboard users cannot interact with modals
5. **No skip navigation link** — keyboard users must tab through the entire nav menu on every page

IBM requires all software to conform to WCAG 2.1 Level AA (Section 508 equivalent). The Sprint 1 issues are **compliance blockers** and should be treated as such before any external release or IBM accessibility review.

---

## Remediation Roadmap Overview

| Sprint | Focus | Weeks | Est. Hours | Priority |
|--------|-------|-------|------------|----------|
| Sprint 1 | Keyboard access, modals, skip link | 1–3 | 40–50 hrs | CRITICAL |
| Sprint 2 | Form labels, screen reader announcements | 4–6 | 30–40 hrs | HIGH |
| Sprint 3 | Tables, color coding, focus indicators | 7–8 | 20–25 hrs | MEDIUM |
| Sprint 4 | Motion, page titles, audit validation | 9–10 | 15–20 hrs | LOW |
| **Total** | | **10 weeks** | **105–135 hrs** | |

---

## Sprint 1 — Compliance Blockers (Weeks 1–3)
### WCAG Criteria: 2.1.1 Keyboard · 2.1.2 No Keyboard Trap · 2.4.1 Bypass Blocks · 4.1.2 Name/Role/Value

### Task 1.1 — Create PressableDiv and fix 610 non-keyboard-accessible elements
**Severity:** Critical  
**Effort:** High (4–5 days)  
**Files Affected:** 50+ files across the entire application  

**Problem:** 610 `<div>`, `<span>`, `<li>`, `<tr>`, and `<td>` elements use `onClick` but have no `onKeyDown` handler, no `role="button"`, and no `tabIndex`. Keyboard users cannot activate any of these controls.

**Fix:**
1. Create a reusable `<PressableDiv>` component that adds `role="button"`, `tabIndex={0}`, and fires `onClick` when Enter or Space is pressed
2. Replace all interactive divs/spans with `<PressableDiv>` incrementally by page
3. Smoke-test each page after updating

**Acceptance Criteria:**
- All interactive controls reachable via Tab key
- All interactive controls activatable via Enter and Space keys
- No visual regressions

---

### Task 1.2 — Add focus-trap and ARIA roles to all 52 modal dialogs
**Severity:** Critical  
**Effort:** Low (1–2 days)  
**Files Affected:** ContextualActionPanel.tsx, PanelActionBar.tsx, PatientRowActions.tsx, ReferralJourneyTracker.tsx, all journey modals  

**Problem:** All 52 modal instances (ModalShell pattern) have zero `aria-modal`, zero `role="dialog"`, and no focus-trap. When a modal opens, keyboard focus is not moved into it, Tab escapes into background content, and screen readers do not know a dialog is present.

**Fix:**
1. Install `focus-trap-react` (MIT license — verify with IBM OSS process)
2. Update `ModalShell` component to add `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the modal title `id`
3. Wrap modal content in `<FocusTrap>`
4. On modal open: move focus to first focusable element inside modal
5. On modal close: return focus to the element that triggered the modal

**Acceptance Criteria:**
- Opening a modal moves keyboard focus inside it
- Tab key cannot escape an open modal into background content
- Screen reader announces modal title when dialog opens
- Closing modal returns focus to the trigger element

---

### Task 1.3 — Add "Skip to main content" link
**Severity:** Critical  
**Effort:** Very Low (2–3 hours)  
**Files Affected:** src/components/AppLayout.tsx  

**Problem:** There is no skip navigation link. Keyboard users must Tab through the entire left navigation menu on every single page before reaching the main content area. WCAG 2.4.1 explicitly requires this.

**Fix:**
1. Add a visually hidden `<a href="#main-content">Skip to main content</a>` as the very first element in `AppLayout.tsx`
2. Style it to appear visible on `:focus` (position absolute, top/left 0, z-index 9999)
3. Add `id="main-content"` to the main content wrapper element

**Acceptance Criteria:**
- First Tab press on any page shows the skip link
- Activating the skip link moves focus past the navigation to the main content
- Skip link is visually hidden when not focused

---

### Task 1.4 — Fix AppLogo keyboard access and alt text
**Severity:** High  
**Effort:** Very Low (1–2 hours)  
**Files Affected:** src/components/ui/AppLogo.tsx, src/uhg/components/ui/AppLogo.tsx  

**Problem:** Both AppLogo instances wrap a clickable logo in a plain `<div onClick>` with no `role`, no `tabIndex`, and no keyboard handler. Also uses non-descriptive `alt="Logo"`.

**Fix:**
1. Replace `<div onClick>` with `<button>` or `<a href="/">`
2. Update `alt="Logo"` to `alt="RHTP — Return to home"`

**Acceptance Criteria:**
- Logo is reachable and activatable via keyboard
- Screen reader announces "RHTP — Return to home" when logo is focused

---

## Sprint 2 — Form Labels & Screen Reader Support (Weeks 4–6)
### WCAG Criteria: 1.3.1 Info & Relationships · 4.1.2 Name/Role/Value · 4.1.3 Status Messages

### Task 2.1 — Label all 294 unlabeled form controls
**Severity:** Critical  
**Effort:** Medium (3–4 days)  
**Files Affected:** WholePersonSummary.tsx (13 inputs), AttributionDisputeJourney.tsx (8 inputs), HCCConfirmationJourney.tsx (7 inputs), ContextualActionPanel.tsx + all form pages  

**Problem:** 152 `<input>`, 89 `<select>`, and 53 `<textarea>` elements have no programmatic label association. Labels are visually present but not linked. Screen readers cannot identify any field.

**Fix:** For each unlabeled control, either:
- Add matching `id` to the input and `htmlFor` to the label, OR
- Add `aria-label="Field name"` directly on the control

Prioritize clinical data entry fields first (WholePersonSummary, AttributionDisputeJourney, HCCConfirmationJourney).

**Acceptance Criteria:**
- Screen reader announces field name when any input, select, or textarea receives focus
- Clicking a label focuses its associated input

---

### Task 2.2 — Add aria-live regions for dynamic content
**Severity:** Critical  
**Effort:** Medium (2–3 days)  
**Files Affected:** AppLayout.tsx + all workflow pages  

**Problem:** Zero `aria-live` announcements across all 168 files. Every dynamic update — workflow step changes, save confirmations, error messages, loading states, alert acknowledgements — is completely silent to screen reader users.

**Fix:**
1. Add a global `<div aria-live="polite" aria-atomic="true" className="sr-only">` announcement region in `AppLayout.tsx`
2. Create a lightweight `useAnnounce()` hook
3. Call the hook on: workflow step advances, form saves, validation errors, loading completions, alert acknowledgements

**Acceptance Criteria:**
- Screen reader announces outcome after saving, submitting, or advancing any workflow step
- Validation errors are announced immediately when they occur
- Loading state changes are announced

---

### Task 2.3 — Fix care-team-inbox accordion
**Severity:** Medium  
**Effort:** Very Low (1–2 hours)  
**Files Affected:** src/app/care-team-inbox/page.tsx  

**Problem:** Accordion expand control uses `<div onClick>` with no `role`, no `aria-expanded`, and no keyboard support.

**Fix:**
1. Replace `<div onClick>` with `<button>`
2. Add `aria-expanded={expanded}`
3. Add `aria-controls` pointing to the collapsible panel `id`

---

### Task 2.4 — Add aria-label to all icon-only buttons
**Severity:** High  
**Effort:** Medium (2 days)  
**Files Affected:** All pages with close, expand, collapse, sort, and action menu icon buttons  

**Problem:** Only 3 `aria-label` attributes exist across 168 files. Hundreds of icon-only buttons have no accessible name.

**Fix:** Add descriptive `aria-label` to every icon-only button. Examples:
- `aria-label="Close HCC review dialog"`
- `aria-label="Sort by patient name"`
- `aria-label="Open patient actions menu"`

---

## Sprint 3 — Tables, Color & Focus Indicators (Weeks 7–8)
### WCAG Criteria: 1.3.1 · 1.4.1 · 1.4.13 · 2.4.7 · 2.4.11

### Task 3.1 — Add scope="col" to all 186 table headers
**Severity:** High  
**Effort:** Very Low (2–3 hours)  
**Files Affected:** PatientPanelTable.tsx, ActiveReferralsTable.tsx, ProviderDirectoryTable.tsx, HighCostPatientTable.tsx, CaseloadDashboard.tsx + all data tables  

**Fix:** Add `scope="col"` to every `<th>` in column-header position. This is largely a find-and-replace operation.

**Acceptance Criteria:**
- Screen reader reads column header names when navigating table cells

---

### Task 3.2 — Replace focus:outline-none with Carbon focus ring
**Severity:** High  
**Effort:** Low (1 day)  
**Files Affected:** 221 occurrences across all form files  

**Problem:** Every form input in the app uses `focus:outline-none`. Keyboard users cannot reliably see where focus is.

**Fix:** Replace `focus:outline-none` with IBM Carbon-compliant focus indicator:
```
focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f62fe]
```
Add this as a global Tailwind utility class to avoid 221 individual changes.

**Acceptance Criteria:**
- Keyboard focus is clearly visible on every interactive element (2px blue ring)

---

### Task 3.3 — Add text/icon supplements to all color-coded status indicators
**Severity:** High  
**Effort:** Medium (3 days)  
**Files Affected:** PatientPanelTable.tsx, ReferralTracking, CareManager, FinancialDashboard  

**Problem:** Risk scores, HCC status, care gap status, referral state, and alert severity are conveyed through color alone. ~8% of males cannot distinguish red/green.

**Fix:** Add visible text label or icon with `aria-label` alongside every color indicator.  
Example: "High Risk" text next to a red badge, not just the red color.

**Note:** Requires design input on text labels — schedule design review at Sprint 3 kickoff.

**Acceptance Criteria:**
- All status indicators readable without color (verified with grayscale filter)

---

### Task 3.4 — Make tooltips keyboard and touch accessible
**Severity:** High  
**Effort:** Low (1 day)  
**Files Affected:** journey-aware-context/page.tsx, episodic-management-analytics/page.tsx, social-needs-dashboard/page.tsx  

**Problem:** 10 tooltip implementations use only `onMouseEnter`/`onMouseLeave` — keyboard and touch users never see tooltip content.

**Fix:**
1. Add `onFocus`/`onBlur` to show/hide alongside mouse events
2. Add `aria-describedby` linking the trigger to the tooltip container `id`

**Acceptance Criteria:**
- Tooltip content accessible via Tab key focus

---

## Sprint 4 — Polish, Motion & Audit Validation (Weeks 9–10)
### WCAG Criteria: 2.3.3 · 2.4.2 · 3.1.1 · IBM Accessibility Standard

### Task 4.1 — Add prefers-reduced-motion support
**Severity:** Medium  
**Effort:** Very Low (1 hour)  
**Files Affected:** src/styles/tailwind.css or globals.css  

**Problem:** 945 animations/transitions with zero reduced-motion support. IBM Design Standards require this.

**Fix:** Add to global stylesheet:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Task 4.2 — Add unique page titles to all 40+ route pages
**Severity:** Medium  
**Effort:** Low (half day)  
**Files Affected:** All route page.tsx files  

**Fix:** Export a `metadata` object with a descriptive `title` from each route page:
```tsx
export const metadata = { title: "Patient Panel — RHTP" }
```

---

### Task 4.3 — Fix demo-deck lang attribute
**Severity:** Medium  
**Effort:** Very Low (15 minutes)  
**Files Affected:** src/app/demo-deck/page.tsx  

**Fix:** Add `lang="en"` to the raw `<html>` tag, or remove the raw tag and let the root layout handle it.

---

### Task 4.4 — Run automated + manual audit validation
**Severity:** Required for compliance sign-off  
**Effort:** Medium (3–4 days)  

**Steps:**
1. Run IBM Equal Access Checker or axe DevTools against all key flows
2. Fix any remaining automated violations
3. Conduct manual keyboard-only walkthrough of all core workflows:
   - Patient Panel → Patient Detail
   - HCC Review workflow
   - Care Plan creation/editing
   - Referral creation and tracking
   - Care gap closure
4. Draft IBM Accessibility Conformance Report (ACR / VPAT)
5. Submit ACR to IBM accessibility review team

**Note:** Identify the correct IBM accessibility stakeholder early — the ACR may need to be filed through an internal IBM system.

---

### Task 4.5 — Move planning docs to /docs folder
**Severity:** Low (Housekeeping)  
**Effort:** Very Low  

Move all `.md` planning files from repo root to a `/docs` directory.

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Task 1.1 (610 interactive divs) has regression risk | Apply PressableDiv incrementally by page; smoke-test after each batch |
| Task 1.2 requires `focus-trap-react` install | Verify MIT license is IBM OSS-approved before install |
| Task 2.2 — Sonner (already in use) may handle aria-live natively | Check Sonner's screen reader support before building custom hook |
| Task 3.3 requires design input on status label text | Schedule design review at Sprint 3 kickoff |
| Task 4.4 ACR/VPAT must go through IBM internal system | Identify correct IBM accessibility stakeholder in Sprint 1 |

---

## Tools Recommended

| Tool | Purpose |
|------|---------|
| IBM Equal Access Checker (browser extension) | Automated WCAG audit — IBM's preferred tool |
| axe DevTools | Secondary automated audit |
| NVDA (Windows) or VoiceOver (Mac) | Manual screen reader testing |
| focus-trap-react | Modal focus management |
| Chrome DevTools — Accessibility panel | Inspect ARIA tree during development |

---

*Document prepared by IBM Bob automated codebase audit — June 2025*  
*Based on static analysis of 168 TSX source files in the RHTP codebase*  
*This plan should be reviewed with an IBM Accessibility SME before filing an official ACR/VPAT*
