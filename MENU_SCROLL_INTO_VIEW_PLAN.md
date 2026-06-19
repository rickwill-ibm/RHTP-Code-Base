# Menu Scroll-Into-View Fix Plan

## Problem Statement

**Current Behavior:**
- User clicks "Care Team Inbox" → Menu highlights correctly ✅ → Item stays visible ✅
- User clicks "Whole Person Care View" → Menu highlights correctly ✅ → **Menu scrolls and highlighted item disappears from view** ❌

**Root Cause:**
The sidebar has `overflow-y-auto` which allows scrolling, but when a user clicks a menu item (especially one lower in the list), the browser's default link behavior or the menu's scroll position causes the highlighted item to scroll out of view.

## Expected Behavior

When a user clicks any menu item:
1. ✅ Menu item should highlight immediately
2. ✅ Page content should load in the right panel
3. ✅ **The highlighted menu item should remain visible in the sidebar** (scroll into view if needed)
4. ✅ The highlight should persist even after navigation

## Technical Analysis

### Current Sidebar Structure (AppLayout.tsx):
```typescript
<nav className="flex-1 min-h-0 overflow-y-auto py-4 scrollbar-thin">
  {/* Menu items render here */}
</nav>
```

### Issue:
- The `<nav>` element is scrollable
- When clicking items, there's no logic to ensure the active item stays in view
- The sidebar may scroll to show other items, hiding the active one

## Solution: Auto-Scroll Active Item Into View

### Implementation Strategy:

Add a `useEffect` that:
1. Detects when the pathname changes (user navigates)
2. Finds the active menu item in the DOM
3. Scrolls that item into view smoothly
4. Ensures the item is centered or at least fully visible

### Code Implementation:

```typescript
// Add useRef for the nav container
const navRef = useRef<HTMLElement>(null);

// Add useEffect to scroll active item into view
useEffect(() => {
  if (!navRef.current) return;
  
  // Small delay to ensure DOM is updated
  const timer = setTimeout(() => {
    const activeLink = navRef.current?.querySelector('.sidebar-item-active');
    if (activeLink) {
      activeLink.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // Scroll only if needed
        inline: 'nearest'
      });
    }
  }, 100);
  
  return () => clearTimeout(timer);
}, [pathname]);
```

### Alternative Approach (More Robust):

Use a ref callback on each Link element to track the active one:

```typescript
const activeItemRef = useRef<HTMLAnchorElement>(null);

// In the Link component:
<Link
  ref={isActive ? activeItemRef : null}
  // ... other props
>

// In useEffect:
useEffect(() => {
  if (activeItemRef.current) {
    activeItemRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }
}, [pathname]);
```

## Detailed Implementation Plan

### Step 1: Add Ref to Nav Container
```typescript
const navRef = useRef<HTMLElement>(null);

// In JSX:
<nav ref={navRef} className="flex-1 min-h-0 overflow-y-auto py-4 scrollbar-thin">
```

### Step 2: Add Scroll-Into-View Effect
```typescript
useEffect(() => {
  if (!navRef.current) return;
  
  // Wait for DOM to update after navigation
  const timer = setTimeout(() => {
    const activeLink = navRef.current?.querySelector('.sidebar-item-active');
    if (activeLink) {
      // Scroll the active item into view
      activeLink.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest', // Only scroll if item is not visible
        inline: 'nearest'
      });
    }
  }, 150); // Small delay to ensure rendering is complete
  
  return () => clearTimeout(timer);
}, [pathname]); // Run whenever pathname changes
```

### Step 3: Optional Enhancement - Prevent Initial Scroll
```typescript
const [isInitialMount, setIsInitialMount] = useState(true);

useEffect(() => {
  if (isInitialMount) {
    setIsInitialMount(false);
    return;
  }
  
  // Scroll logic here...
}, [pathname]);
```

## scrollIntoView Options Explained

```typescript
scrollIntoView({
  behavior: 'smooth',  // Smooth animation vs 'auto' (instant)
  block: 'nearest',    // Options: 'start', 'center', 'end', 'nearest'
                       // 'nearest' = only scroll if not visible
  inline: 'nearest'    // Horizontal scroll behavior
})
```

**Recommended:** `block: 'nearest'` - Only scrolls if the item is not fully visible, preventing unnecessary scrolling.

**Alternative:** `block: 'center'` - Always centers the active item, but may cause excessive scrolling.

## Edge Cases to Handle

### 1. Collapsed Sidebar
When sidebar is collapsed, scrolling is less critical but should still work.

### 2. Mobile View
On mobile, the sidebar is a drawer that opens/closes. Ensure scroll-into-view works when drawer opens.

### 3. Backup Section
When Backup section expands (auto-expand feature), ensure the active item scrolls into view.

### 4. Initial Page Load
On first load, don't scroll - let the menu stay at the top. Only scroll on subsequent navigation.

## Complete Implementation

```typescript
export default function AppLayout({ children, pageTitle, breadcrumbs, contextBanner }: AppLayoutProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backupCollapsed, setBackupCollapsed] = useState(true);
  const { user, setUser, entryContext, setEntryContext } = useAppContext();
  
  // Add ref for nav container
  const navRef = useRef<HTMLElement>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Auto-expand Backup section if active item is inside
  useEffect(() => {
    // ... existing code ...
  }, [pathname, backupCollapsed]);

  // Scroll active item into view on navigation
  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount) {
      setIsInitialMount(false);
      return;
    }
    
    if (!navRef.current) return;
    
    // Small delay to ensure DOM updates and Backup section expands if needed
    const timer = setTimeout(() => {
      const activeLink = navRef.current?.querySelector('.sidebar-item-active');
      if (activeLink) {
        activeLink.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }
    }, 200); // Slightly longer delay to account for Backup expansion
    
    return () => clearTimeout(timer);
  }, [pathname, isInitialMount]);

  // ... rest of component
}
```

## Testing Checklist

After implementation, test:
- [ ] Click "Care Team Inbox" → Should highlight and stay visible
- [ ] Click "Whole Person Care View" → Should highlight and stay visible (scroll if needed)
- [ ] Click items at top of menu → Should not scroll unnecessarily
- [ ] Click items at bottom of menu → Should scroll to show them
- [ ] Click Backup items → Should expand Backup AND scroll item into view
- [ ] Navigate using browser back/forward → Active item should scroll into view
- [ ] Refresh page → Should not auto-scroll on initial load
- [ ] Test with collapsed sidebar → Should still work
- [ ] Test on mobile → Should work when drawer opens

## Expected Outcome

✅ **Always visible:** The active/highlighted menu item will always be visible in the sidebar
✅ **Smooth scrolling:** Transitions are smooth and not jarring
✅ **Smart scrolling:** Only scrolls when necessary (item not visible)
✅ **Persistent highlight:** Active state remains visible throughout navigation
✅ **Works everywhere:** Functions correctly in all viewport sizes and states

---

**Status:** Ready for implementation
**Estimated Time:** 10 minutes
**Risk Level:** Very Low (non-breaking enhancement)
**Dependencies:** Requires existing auto-expand Backup fix