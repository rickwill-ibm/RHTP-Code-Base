# Menu Focus Retention Fix Plan

## Problem Analysis

### Current Issue:
When clicking on a menu item, it highlights momentarily but doesn't retain focus/active state when navigating to the page. The menu doesn't show which screen the user is currently on.

### Root Cause:
The menu uses Next.js `usePathname()` hook to determine active state by comparing `pathname === item.href`. However, there may be issues with:
1. **Path matching logic** - Exact match may not work for all routes
2. **CSS class application** - The active/inactive classes are defined but may not be visually distinct enough
3. **Collapsible Backup section** - When a Backup item is active, the section may be collapsed, hiding the active indicator

## Current Implementation

### Active State Detection (AppLayout.tsx, line 170):
```typescript
const isActive = pathname === item.href;
```

### CSS Classes Applied (AppLayout.tsx, line 179):
```typescript
${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}
```

### CSS Definitions (tailwind.css, lines 137-143):
```css
.sidebar-item-active {
  @apply bg-[#0f62fe] text-white;
}

.sidebar-item-inactive {
  @apply text-[#c6c6c6] hover:bg-[#393939] hover:text-white;
}
```

## Issues Identified

### 1. **Backup Section Collapsibility Issue**
- Backup section defaults to collapsed (`backupCollapsed = true`)
- If user navigates to a Backup item, the section remains collapsed
- Active item is hidden, so user can't see which page they're on

### 2. **Path Matching May Fail**
- Some routes might have trailing slashes or query parameters
- Exact match (`pathname === item.href`) might not catch all cases

### 3. **Visual Distinction**
- Active state: Blue background (#0f62fe) with white text ✅ Good
- Inactive state: Gray text (#c6c6c6) ✅ Good
- But need to ensure contrast is sufficient

## Proposed Solutions

### Solution 1: Auto-Expand Backup Section When Active Item Inside
**Priority: HIGH**

When a menu item in the Backup section is active, automatically expand the Backup section to show the active item.

**Implementation:**
```typescript
// In AppLayout component, add useEffect to auto-expand Backup if active item is inside
useEffect(() => {
  const activeItem = navItems.find(item => pathname === item.href);
  if (activeItem && activeItem.group === 'Backup' && backupCollapsed) {
    setBackupCollapsed(false);
  }
}, [pathname, backupCollapsed]);
```

### Solution 2: Improve Path Matching Logic
**Priority: MEDIUM**

Handle edge cases like trailing slashes and ensure robust matching.

**Implementation:**
```typescript
// Normalize paths for comparison
const normalizedPathname = pathname.endsWith('/') && pathname !== '/' 
  ? pathname.slice(0, -1) 
  : pathname;
const normalizedHref = item.href.endsWith('/') && item.href !== '/' 
  ? item.href.slice(0, -1) 
  : item.href;
const isActive = normalizedPathname === normalizedHref;
```

### Solution 3: Add Visual Indicator for Active Section
**Priority: LOW**

Add a left border or icon to the active menu group header to show which section contains the active page.

**Implementation:**
```typescript
// Check if any item in the group is active
const hasActiveItem = items.some(item => pathname === item.href);

// Apply visual indicator to group header
<p className={`px-4 mb-1 text-2xs font-semibold uppercase tracking-widest ${
  hasActiveItem ? 'text-[#0f62fe] border-l-2 border-[#0f62fe] pl-3' : 'text-carbon-gray-50'
}`}>
```

### Solution 4: Add Active State Persistence
**Priority: LOW**

Store the last active menu item in localStorage to maintain state across page refreshes.

**Implementation:**
```typescript
// Save active item to localStorage
useEffect(() => {
  const activeItem = navItems.find(item => pathname === item.href);
  if (activeItem) {
    localStorage.setItem('lastActiveMenuItem', activeItem.key);
  }
}, [pathname]);
```

## Recommended Implementation Order

### Phase 1: Critical Fixes (Immediate)
1. ✅ **Auto-expand Backup section** when active item is inside
2. ✅ **Improve path matching** to handle edge cases

### Phase 2: Enhancements (Optional)
3. ⭐ **Visual indicator** for active section header
4. ⭐ **Persistence** via localStorage

## Testing Checklist

After implementation, test:
- [ ] Click on any menu item - should highlight immediately
- [ ] Navigate to page - menu item should remain highlighted
- [ ] Click on Backup item - Backup section should expand and show active item
- [ ] Refresh page - active item should still be highlighted
- [ ] Navigate between different sections - active state should update correctly
- [ ] Test with collapsed sidebar - active state should still be visible
- [ ] Test on mobile - active state should work in mobile menu

## Expected Outcome

After fixes:
1. ✅ Menu always shows which page user is on
2. ✅ Backup section auto-expands when needed
3. ✅ Active state persists across navigation
4. ✅ Visual feedback is clear and immediate
5. ✅ Works in all viewport sizes

## Files to Modify

1. **src/components/AppLayout.tsx**
   - Add useEffect for auto-expanding Backup
   - Improve path matching logic
   - Optional: Add section header indicators

2. **src/styles/tailwind.css** (if needed)
   - Optional: Enhance active state styles
   - Optional: Add section header active styles

---

**Status:** Ready for implementation
**Estimated Time:** 15-20 minutes
**Risk Level:** Low (non-breaking changes)