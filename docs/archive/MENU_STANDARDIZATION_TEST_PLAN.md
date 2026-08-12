# RHTP Menu Standardization - Test Plan

## Test Execution Date: [To be filled]
## Tester: [To be filled]

## Overview
This document provides a comprehensive test plan to verify that all menu standardization changes have been implemented correctly and that the menu behaves consistently across all sections of the RHTP application.

## Changes Implemented

### 1. Agentic Orchestrate Section - Initial State
**File Modified:** `src/components/AppLayout.tsx` (line 110)
**Change:** `agenticCollapsed` initial state changed from `true` to `false`
**Expected Result:** Agentic Orchestrate section starts expanded

### 2. UHG Orchestrate Layout Wrapper
**File Created:** `src/app/uhg-orchestrate/layout.tsx`
**Change:** Added AppLayout wrapper for all UHG Orchestrate routes
**Expected Result:** Sidebar menu visible on all UHG Orchestrate screens

### 3. ScreenLayout Height Adjustment
**File Modified:** `src/uhg/components/shared/ScreenLayout.tsx` (line 28)
**Change:** Changed `minHeight: '100vh'` to `height: '100%'`
**Expected Result:** ScreenLayout works properly within AppLayout container

## Test Cases

### Test Suite 1: Initial Menu State
**Objective:** Verify correct initial state of all menu sections

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS1-01 | Load application home page | All non-collapsible sections visible | [ ] Pass [ ] Fail | |
| TS1-02 | Check Agentic Orchestrate section | Section is EXPANDED (open) on load | [ ] Pass [ ] Fail | |
| TS1-03 | Check Backup section | Section is COLLAPSED (closed) on load | [ ] Pass [ ] Fail | |
| TS1-04 | Check RHTP Program section | Section is visible (not collapsible) | [ ] Pass [ ] Fail | |
| TS1-05 | Check Care Team Workflows section | Section is visible (not collapsible) | [ ] Pass [ ] Fail | |
| TS1-06 | Check Whole Person Care section | Section is visible (not collapsible) | [ ] Pass [ ] Fail | |
| TS1-07 | Check System section | Section is visible (not collapsible) | [ ] Pass [ ] Fail | |

### Test Suite 2: Agentic Orchestrate Section Behavior
**Objective:** Verify Agentic Orchestrate section works correctly

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS2-01 | Click Agentic section header | Section collapses | [ ] Pass [ ] Fail | |
| TS2-02 | Click Agentic section header again | Section expands | [ ] Pass [ ] Fail | |
| TS2-03 | Collapse section, navigate to Agentic route | Section auto-expands | [ ] Pass [ ] Fail | |
| TS2-04 | Navigate to "One Enterprise · Five Entities" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-05 | Navigate to "CDP Assembly" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-06 | Navigate to "Journey-Aware Context" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-07 | Navigate to "Whole Person Care Intelligence" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-08 | Navigate to "Signal Disposition Engine" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-09 | Navigate to "Agentic Super Orchestration" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-10 | Navigate to "Agentic Super Agent" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-11 | Navigate to "Family Thread — Dependents" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-12 | Navigate to "Caregiver Intelligence — Elena" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-13 | Navigate to "Agent Impact Dashboard" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-14 | Navigate to "Agent Impact — Reporting" | Sidebar remains visible | [ ] Pass [ ] Fail | |
| TS2-15 | Navigate to "Live Population Filter" | Sidebar remains visible | [ ] Pass [ ] Fail | |

### Test Suite 3: Backup Section Behavior
**Objective:** Verify Backup section works correctly

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS3-01 | Click Backup section header | Section expands | [ ] Pass [ ] Fail | |
| TS3-02 | Click Backup section header again | Section collapses | [ ] Pass [ ] Fail | |
| TS3-03 | Collapse section, navigate to Backup route | Section auto-expands | [ ] Pass [ ] Fail | |
| TS3-04 | Navigate away from Backup route | Section remains in current state | [ ] Pass [ ] Fail | |

### Test Suite 4: Menu Navigation & Scroll Behavior
**Objective:** Verify menu navigation and scroll-into-view functionality

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS4-01 | Navigate to route in collapsed Agentic section | Section expands and scrolls into view | [ ] Pass [ ] Fail | |
| TS4-02 | Navigate to route in collapsed Backup section | Section expands and scrolls into view | [ ] Pass [ ] Fail | |
| TS4-03 | Navigate between routes in same section | Active item scrolls into view | [ ] Pass [ ] Fail | |
| TS4-04 | Navigate to route at bottom of menu | Menu scrolls to show active item | [ ] Pass [ ] Fail | |
| TS4-05 | Active menu item highlighting | Correct item highlighted with blue background | [ ] Pass [ ] Fail | |

### Test Suite 5: UHG Orchestrate Screen Layout
**Objective:** Verify UHG Orchestrate screens render correctly with sidebar

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS5-01 | Navigate to any UHG Orchestrate screen | Sidebar visible on left | [ ] Pass [ ] Fail | |
| TS5-02 | Check ScreenLayout dark theme | Background is #161616 (dark gray) | [ ] Pass [ ] Fail | |
| TS5-03 | Check Phase Arc display | Phase Arc displays correctly in header | [ ] Pass [ ] Fail | |
| TS5-04 | Check Presenter Controls | Presenter controls functional | [ ] Pass [ ] Fail | |
| TS5-05 | Check Maria Status Strip | Status strip displays correctly | [ ] Pass [ ] Fail | |
| TS5-06 | Check content scrolling | Content scrolls properly within layout | [ ] Pass [ ] Fail | |
| TS5-07 | Check for layout overflow | No horizontal scroll or overflow issues | [ ] Pass [ ] Fail | |
| TS5-08 | Check sidebar collapse/expand | Sidebar collapse works on UHG screens | [ ] Pass [ ] Fail | |

### Test Suite 6: Sidebar Collapse/Expand
**Objective:** Verify sidebar collapse functionality works consistently

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS6-01 | Click collapse button | Sidebar collapses to icon-only view | [ ] Pass [ ] Fail | |
| TS6-02 | Click expand button | Sidebar expands to full view | [ ] Pass [ ] Fail | |
| TS6-03 | Collapse sidebar on RHTP screen | Works correctly | [ ] Pass [ ] Fail | |
| TS6-04 | Collapse sidebar on UHG Orchestrate screen | Works correctly | [ ] Pass [ ] Fail | |
| TS6-05 | Collapsed state persists | State maintained when navigating | [ ] Pass [ ] Fail | |

### Test Suite 7: Mobile Responsiveness
**Objective:** Verify menu works on mobile/tablet viewports

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS7-01 | Open mobile menu (hamburger icon) | Menu slides in from left | [ ] Pass [ ] Fail | |
| TS7-02 | Click outside mobile menu | Menu closes | [ ] Pass [ ] Fail | |
| TS7-03 | Navigate from mobile menu | Menu closes after navigation | [ ] Pass [ ] Fail | |
| TS7-04 | Mobile menu on UHG Orchestrate screens | Works correctly | [ ] Pass [ ] Fail | |
| TS7-05 | Tablet viewport (768px-1024px) | Sidebar visible, responsive | [ ] Pass [ ] Fail | |

### Test Suite 8: Cross-Section Navigation
**Objective:** Verify navigation between different menu sections

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS8-01 | Navigate from RHTP to Agentic section | Smooth transition, correct highlighting | [ ] Pass [ ] Fail | |
| TS8-02 | Navigate from Agentic to Backup section | Smooth transition, correct highlighting | [ ] Pass [ ] Fail | |
| TS8-03 | Navigate from Backup to Care Team section | Smooth transition, correct highlighting | [ ] Pass [ ] Fail | |
| TS8-04 | Navigate from UHG screen to RHTP screen | Sidebar remains visible, correct highlighting | [ ] Pass [ ] Fail | |

### Test Suite 9: Demo Navigator Integration
**Objective:** Verify Demo Navigator works with menu changes

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS9-01 | Open Demo Navigator | Floating navigator appears | [ ] Pass [ ] Fail | |
| TS9-02 | Navigate using Demo Navigator | Menu updates correctly | [ ] Pass [ ] Fail | |
| TS9-03 | Demo Navigator on UHG screens | Works correctly with sidebar visible | [ ] Pass [ ] Fail | |

### Test Suite 10: Regression Testing
**Objective:** Verify no existing functionality was broken

| Test ID | Test Case | Expected Result | Status | Notes |
|---------|-----------|-----------------|--------|-------|
| TS10-01 | User role switcher (CM/MD) | Works correctly | [ ] Pass [ ] Fail | |
| TS10-02 | Entry context switcher (Browse/Cerner) | Works correctly | [ ] Pass [ ] Fail | |
| TS10-03 | Badge counts on menu items | Display correctly | [ ] Pass [ ] Fail | |
| TS10-04 | Menu item icons | Display correctly | [ ] Pass [ ] Fail | |
| TS10-05 | Breadcrumbs in top bar | Display correctly | [ ] Pass [ ] Fail | |
| TS10-06 | Page titles | Display correctly | [ ] Pass [ ] Fail | |
| TS10-07 | User profile in sidebar | Displays correctly | [ ] Pass [ ] Fail | |
| TS10-08 | Notifications icon | Works correctly | [ ] Pass [ ] Fail | |

## Browser Testing Matrix

Test all critical paths in the following browsers:

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | [ ] Pass [ ] Fail | |
| Firefox | Latest | [ ] Pass [ ] Fail | |
| Safari | Latest | [ ] Pass [ ] Fail | |
| Edge | Latest | [ ] Pass [ ] Fail | |

## Performance Testing

| Test | Expected Result | Status | Notes |
|------|-----------------|--------|-------|
| Menu expand/collapse animation | Smooth, no lag | [ ] Pass [ ] Fail | |
| Navigation between routes | Fast, no delay | [ ] Pass [ ] Fail | |
| Scroll-into-view behavior | Smooth scrolling | [ ] Pass [ ] Fail | |
| UHG screen load time | No noticeable delay | [ ] Pass [ ] Fail | |

## Known Issues / Limitations

Document any issues discovered during testing:

1. [Issue description]
   - Severity: [Low/Medium/High/Critical]
   - Workaround: [If available]
   - Status: [Open/In Progress/Resolved]

## Test Summary

**Total Test Cases:** 80+
**Passed:** ___
**Failed:** ___
**Blocked:** ___
**Not Tested:** ___

**Pass Rate:** ___%

## Sign-off

**Tested By:** ___________________
**Date:** ___________________
**Approved By:** ___________________
**Date:** ___________________

## Notes

Additional observations or comments:

---

## Quick Smoke Test Checklist

For rapid verification, complete this minimal checklist:

- [ ] Agentic section starts OPEN
- [ ] Backup section starts CLOSED
- [ ] Navigate to "One Enterprise · Five Entities" - sidebar visible
- [ ] Navigate to "Agentic Super Agent" - sidebar visible
- [ ] Collapse Agentic section, navigate to Agentic route - auto-expands
- [ ] Sidebar collapse/expand works on UHG screens
- [ ] No console errors
- [ ] No layout breaking or overflow issues