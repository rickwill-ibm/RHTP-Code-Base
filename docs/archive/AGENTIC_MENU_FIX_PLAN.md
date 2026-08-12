# Agentic Menu Navigation Fix Plan

## Overview
Fix the left-hand menu navigation in the Agentic section to match the behavior of other collapsible sections (like Backup). The menu should remain visible and maintain focus on the active screen item.

## Current Issues
1. **Agentic_Orchestrate-Screens section is not collapsible** - Unlike the Backup section, it's always expanded
2. **No auto-expand logic** - Section doesn't automatically expand when navigating to one of its screens
3. **Menu focus not maintained** - Active item highlighting may not persist properly
4. **Screen name needs update** - "Agentic Super Agent" should be "AGENTIC MARKETPLACE"

## Implementation Plan

### Phase 1: Add Collapsible State Management
**File:** `src/components/AppLayout.tsx`

**Changes:**
1. Add new state variable for Agentic section collapse state:
   ```typescript
   const [agenticCollapsed, setAgenticCollapsed] = useState(true);
   ```

2. Update the existing auto-expand useEffect to include Agentic section:
   ```typescript
   useEffect(() => {
     const normalizedPathname = pathname.endsWith('/') && pathname !== '/'
       ? pathname.slice(0, -1)
       : pathname;
     
     const activeItem = navItems.find(item => {
       const normalizedHref = item.href.endsWith('/') && item.href !== '/'
         ? item.href.slice(0, -1)
         : item.href;
       return normalizedPathname === normalizedHref;
     });
     
     // Auto-expand Backup section
     if (activeItem && activeItem.group === 'Backup' && backupCollapsed) {
       setBackupCollapsed(false);
     }
     
     // Auto-expand Agentic section
     if (activeItem && activeItem.group === 'Agentic_Orchestrate-Screens' && agenticCollapsed) {
       setAgenticCollapsed(false);
     }
   }, [pathname, backupCollapsed, agenticCollapsed]);
   ```

### Phase 2: Update Menu Rendering Logic
**File:** `src/components/AppLayout.tsx`

**Changes:**
1. Update the group rendering section (around line 217) to handle Agentic section like Backup:
   ```typescript
   {!collapsed && (group === 'Backup' || group === 'Agentic_Orchestrate-Screens') ? (
     <button
       onClick={() => group === 'Backup' ? setBackupCollapsed(!backupCollapsed) : setAgenticCollapsed(!agenticCollapsed)}
       className="w-full flex items-center justify-between px-4 mb-1 text-2xs font-semibold text-carbon-gray-50 uppercase tracking-widest hover:text-carbon-gray-30 transition-colors"
     >
       <span>{group === 'Agentic_Orchestrate-Screens' ? 'AGENTIC ORCHESTRATE' : group}</span>
       <Icon name={(group === 'Backup' ? backupCollapsed : agenticCollapsed) ? 'ChevronRightIcon' : 'ChevronDownIcon'} size={14} />
     </button>
   ) : !collapsed ? (
     <p className="px-4 mb-1 text-2xs font-semibold text-carbon-gray-50 uppercase tracking-widest">
       {group === 'Agentic_Orchestrate-Screens' ? 'AGENTIC ORCHESTRATE' : group}
     </p>
   ) : null}
   ```

2. Update the conditional rendering of menu items (around line 230):
   ```typescript
   {((group !== 'Backup' || !backupCollapsed) && (group !== 'Agentic_Orchestrate-Screens' || !agenticCollapsed)) && items.map((item) => {
   ```

### Phase 3: Rename Menu Item
**File:** `src/components/AppLayout.tsx`

**Changes:**
Update line 71 in the navItems array:
```typescript
{ key: 'uhg-super-agent', label: 'AGENTIC MARKETPLACE', icon: 'CpuChipIcon', href: '/uhg-orchestrate/agent-library', group: 'Agentic_Orchestrate-Screens' },
```

### Phase 4: Verify Scroll-Into-View Behavior
**File:** `src/components/AppLayout.tsx`

**Verification:**
- The existing scroll-into-view logic (lines 135-171) should work automatically for the Agentic section
- It finds the active link with class `sidebar-item-active`
- It scrolls the section header into view
- The 200ms delay allows for section expansion before scrolling

**No changes needed** - the existing implementation is group-agnostic and will work for Agentic section once collapsible state is added.

## Testing Checklist

### Menu Behavior Tests
- [ ] Agentic section starts collapsed by default
- [ ] Clicking section header toggles collapse/expand
- [ ] Chevron icon changes direction (right when collapsed, down when expanded)
- [ ] Menu items are hidden when section is collapsed
- [ ] Menu items are visible when section is expanded

### Auto-Expand Tests
- [ ] Navigating to any Agentic screen auto-expands the section
- [ ] Section remains expanded after navigation
- [ ] Other sections (Backup) still work correctly
- [ ] Auto-expand works on page refresh/direct URL access

### Focus & Scroll Tests
- [ ] Active menu item is highlighted with `sidebar-item-active` class
- [ ] Active item scrolls into view on navigation
- [ ] Section header scrolls to top when item is activated
- [ ] Smooth scrolling animation works
- [ ] No unwanted scrolling on initial page load

### Screen Name Test
- [ ] "Agentic Super Agent" is renamed to "AGENTIC MARKETPLACE"
- [ ] Name appears correctly in collapsed and expanded states
- [ ] Name appears correctly in breadcrumbs (if applicable)

## Files to Modify
1. `src/components/AppLayout.tsx` - Main implementation file

## Estimated Impact
- **Low risk** - Following established pattern from Backup section
- **No breaking changes** - Only enhancing existing functionality
- **Backward compatible** - All existing routes and navigation remain unchanged

## Rollback Plan
If issues occur:
1. Revert changes to `AppLayout.tsx`
2. Clear browser cache
3. Restart development server

## Success Criteria
✅ Agentic section behaves identically to Backup section
✅ Menu remains visible and maintains focus on active screen
✅ Auto-expand works when navigating to Agentic screens
✅ "AGENTIC MARKETPLACE" name is displayed correctly
✅ No regression in other menu sections
✅ Smooth user experience with proper scrolling behavior