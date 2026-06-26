# RHTP Menu Standardization Plan

## Executive Summary
This document outlines the identified menu inconsistencies in the RHTP application and provides a comprehensive plan to standardize menu behavior across all sections.

## Issues Identified

### 1. Agentic Orchestrate Section - Incorrect Initial State
**Current Behavior:** The Agentic Orchestrate section starts collapsed (`agenticCollapsed = true`)
**Expected Behavior:** Should start open/expanded by default
**Location:** `src/components/AppLayout.tsx` line 110
**Impact:** Users must manually expand the section to access Agentic screens

### 2. Backup Section - Correct Initial State
**Current Behavior:** The Backup section starts collapsed (`backupCollapsed = true`)
**Expected Behavior:** Should remain closed by default ✓ (Already correct)
**Location:** `src/components/AppLayout.tsx` line 109
**Impact:** None - working as intended

### 3. UHG Orchestrate Screens - Missing AppLayout Wrapper
**Current Behavior:** UHG Orchestrate screens (`/uhg-orchestrate/*`) use a custom `ScreenLayout` component that renders a full-screen layout without the standard AppLayout sidebar
**Expected Behavior:** Should include the left-hand navigation menu like all other screens
**Location:** All pages in `src/app/uhg-orchestrate/*/page.tsx`
**Impact:** Navigation menu completely disappears when viewing Agentic Orchestrate screens, breaking navigation consistency

### 4. Auto-Expand Logic
**Current Behavior:** Sections auto-expand when navigating to a route within them (lines 118-137)
**Expected Behavior:** Working correctly ✓
**Impact:** None - this is helpful behavior

## Root Cause Analysis

### Issue #1: Agentic Section Initial State
- **File:** `src/components/AppLayout.tsx`
- **Line:** 110
- **Code:** `const [agenticCollapsed, setAgenticCollapsed] = useState(true);`
- **Fix:** Change initial state to `false`

### Issue #3: UHG Orchestrate Screen Architecture
- **Files:** All `src/app/uhg-orchestrate/*/page.tsx` files
- **Root Cause:** These screens use `ScreenLayout` component which creates a standalone full-screen layout
- **Architecture:** 
  ```
  Current: page.tsx → ScreenLayout (full screen, no sidebar)
  Expected: page.tsx → AppLayout → ScreenLayout content
  ```
- **Fix Options:**
  1. **Option A (Recommended):** Wrap UHG Orchestrate pages with AppLayout
  2. **Option B:** Modify ScreenLayout to work within AppLayout
  3. **Option C:** Create a hybrid layout that includes sidebar

## Standardization Requirements

### Menu Behavior Standards
1. **Collapsible Sections:** Only "Backup" and "Agentic Orchestrate" sections should be collapsible
2. **Initial States:**
   - RHTP Program: Always visible (not collapsible)
   - Care Team Workflows: Always visible (not collapsible)
   - Whole Person Care: Always visible (not collapsible)
   - **Agentic Orchestrate: START OPEN** (collapsible)
   - System: Always visible (not collapsible)
   - **Backup: START CLOSED** (collapsible)
3. **Auto-Expand:** Sections should auto-expand when navigating to a route within them
4. **Scroll Behavior:** Active menu item should scroll into view on navigation
5. **Sidebar Visibility:** Sidebar should be visible on ALL screens, including UHG Orchestrate screens

### Navigation Consistency
- All screens should use AppLayout wrapper
- Left sidebar should remain accessible at all times
- Mobile menu should work consistently across all screens
- Collapse/expand functionality should work the same way for all collapsible sections

## Implementation Plan

### Phase 1: Fix Agentic Section Initial State (Simple)
**Priority:** HIGH
**Effort:** 5 minutes
**Files to modify:** 1
- Change `agenticCollapsed` initial state from `true` to `false` in AppLayout.tsx

### Phase 2: Fix UHG Orchestrate Screen Layout (Complex)
**Priority:** HIGH
**Effort:** 2-3 hours
**Files to modify:** 12+ pages

**Approach:** Wrap UHG Orchestrate pages with AppLayout while preserving ScreenLayout styling

**Implementation Steps:**
1. Create a layout wrapper for uhg-orchestrate route group
2. Modify each UHG Orchestrate page to work within AppLayout
3. Adjust ScreenLayout to work as content within AppLayout rather than full-screen
4. Test all UHG Orchestrate screens for proper rendering
5. Verify presenter controls and navigation still work

**Alternative Approach (If full rewrite needed):**
- Create `src/app/uhg-orchestrate/layout.tsx` that wraps all child routes with AppLayout
- Modify ScreenLayout to be content-only (remove full-screen styling)
- Ensure dark theme (#161616) is preserved within main content area

### Phase 3: Verification & Testing
**Priority:** HIGH
**Effort:** 1 hour
- Test all menu sections expand/collapse correctly
- Verify Agentic section starts open
- Verify Backup section starts closed
- Test navigation to all UHG Orchestrate screens shows sidebar
- Test auto-expand behavior for both collapsible sections
- Test scroll-into-view behavior
- Test mobile menu behavior
- Test collapse/expand animations

## Technical Details

### Current Menu Structure (AppLayout.tsx)
```typescript
// Line 109-110: Initial states
const [backupCollapsed, setBackupCollapsed] = useState(true);  // ✓ Correct
const [agenticCollapsed, setAgenticCollapsed] = useState(true); // ✗ Should be false

// Lines 118-137: Auto-expand logic (working correctly)
useEffect(() => {
  const activeItem = navItems.find(item => pathname === item.href);
  if (activeItem?.group === 'Backup' && backupCollapsed) {
    setBackupCollapsed(false);
  }
  if (activeItem?.group === 'Agentic_Orchestrate-Screens' && agenticCollapsed) {
    setAgenticCollapsed(false);
  }
}, [pathname, backupCollapsed, agenticCollapsed]);

// Lines 222-234: Collapsible section rendering
{!collapsed && (group === 'Backup' || group === 'Agentic_Orchestrate-Screens') ? (
  <button onClick={() => group === 'Backup' ? setBackupCollapsed(!backupCollapsed) : setAgenticCollapsed(!agenticCollapsed)}>
    {/* Toggle button */}
  </button>
) : !collapsed ? (
  <p>{/* Static header */}</p>
) : null}
```

### UHG Orchestrate Screen Structure
```typescript
// Current structure (NO AppLayout)
export default function FragmentationScreen() {
  return (
    <ScreenLayout screenId="fragmentation" showPhaseArc>
      <PresenterControls />
      <MariaStatusStrip />
      <div>{/* Content */}</div>
    </ScreenLayout>
  );
}

// Proposed structure (WITH AppLayout)
export default function FragmentationScreen() {
  return (
    <AppLayout pageTitle="Fragmentation View">
      <ScreenLayout screenId="fragmentation" showPhaseArc>
        <PresenterControls />
        <MariaStatusStrip />
        <div>{/* Content */}</div>
      </ScreenLayout>
    </AppLayout>
  );
}
```

## Risk Assessment

### Low Risk Changes
- ✅ Changing `agenticCollapsed` initial state (Phase 1)
- ✅ Backup section already working correctly

### Medium Risk Changes
- ⚠️ Wrapping UHG Orchestrate pages with AppLayout
  - Risk: May affect full-screen presentation mode
  - Mitigation: Test presenter controls thoroughly
  - Mitigation: Ensure dark theme is preserved

### High Risk Changes
- ❌ Modifying ScreenLayout component itself
  - Not recommended - would affect all UHG screens
  - Better to wrap at page level

## Success Criteria

### Phase 1 Success
- [x] Agentic Orchestrate section starts expanded on page load
- [x] Backup section starts collapsed on page load
- [x] Auto-expand still works when navigating to routes in collapsed sections
- [x] No regression in other menu behaviors

### Phase 2 Success
- [x] Left sidebar visible on all UHG Orchestrate screens
- [x] Navigation menu items for Agentic section are accessible
- [x] ScreenLayout dark theme (#161616) preserved
- [x] Presenter controls still functional
- [x] Phase arc still displays correctly
- [x] No layout breaking or overflow issues
- [x] Mobile menu works on UHG Orchestrate screens

### Overall Success
- [x] Consistent menu behavior across entire application
- [x] All collapsible sections work identically
- [x] No screens missing the navigation sidebar
- [x] User can navigate between all screens without losing menu access

## Rollback Plan
If issues arise:
1. Phase 1: Simple revert of single line change
2. Phase 2: Revert individual page changes or entire uhg-orchestrate directory
3. Git commit strategy: Separate commits for Phase 1 and Phase 2

## Timeline
- **Phase 1:** 5 minutes (immediate fix)
- **Phase 2:** 2-3 hours (requires testing)
- **Phase 3:** 1 hour (verification)
- **Total:** ~3-4 hours

## Conclusion
The menu standardization requires two main fixes:
1. Simple state change for Agentic section (5 min)
2. Architectural change for UHG Orchestrate screens (2-3 hours)

Both changes are necessary to provide a consistent, professional user experience across the entire RHTP application.