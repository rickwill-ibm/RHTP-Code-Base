# Menu Reorganization Plan: Move CDP & Agentic Orchestration to Backup Section

## Overview
Move all CDP & Agentic Orchestration screens from the main demo flow to the Appendix/Backup section, making them accessible via the "A" key but not part of the primary navigation flow.

---

## Current Menu Structure

### **Main Demo Flow (SCREEN_ORDER)** - 14 screens:
1. knowledge-graph
2. **fragmentation** ← CDP & Agentic Orchestration
3. **cdp-assembly** ← CDP & Agentic Orchestration
4. **maria-subgraph** ← CDP & Agentic Orchestration
5. **consumer-360** ← CDP & Agentic Orchestration (UHG-ORCHESTRATE)
6. **whole-person-care** ← CDP & Agentic Orchestration (UHG-ORCHESTRATE)
7. signal-disposition-engine
8. controller
9. family-sofia
10. caregiver-elena
11. agent-impact
12. portfolio-scale
13. strategic-roadmap
14. leave-behind

### **Appendix/Backup Section (APPENDIX_ORDER)** - 8 screens:
- agent-marketplace-query
- agent-library
- reporting-dashboard
- burning-platform
- opening
- maria-counterfactual
- signal-classification-beat
- financial-intelligence

---

## Screens to Move

### **CDP & Agentic Orchestration Screens (5 screens):**

1. **fragmentation** (`/fragmentation-split-system-view`)
   - Label: "Fragmentation"
   - Description: "System fragmentation view showing split care delivery"

2. **cdp-assembly** (`/cdp-assembly-split`)
   - Label: "CDP Assembly"
   - Description: "Customer Data Platform identity resolution and assembly"

3. **maria-subgraph** (`/maria-subgraph-context`)
   - Label: "Maria Subgraph"
   - Description: "Maria's knowledge graph subgraph context"

4. **consumer-360** (`/consumer-360`)
   - Label: "Consumer 360"
   - Description: "UHG-ORCHESTRATE Consumer 360 view"
   - **Note:** Recently fixed for data inconsistencies

5. **whole-person-care** (`/whole-person-care`)
   - Label: "Whole Person Care"
   - Description: "UHG-ORCHESTRATE Whole Person Care orchestration"

---

## Proposed New Menu Structure

### **New Main Demo Flow (SCREEN_ORDER)** - 9 screens:
1. knowledge-graph
2. signal-disposition-engine
3. controller
4. family-sofia
5. caregiver-elena
6. agent-impact
7. portfolio-scale
8. strategic-roadmap
9. leave-behind

### **New Appendix/Backup Section (APPENDIX_ORDER)** - 13 screens:
**CDP & Agentic Orchestration Section:**
- fragmentation
- cdp-assembly
- maria-subgraph
- consumer-360
- whole-person-care

**Existing Appendix Screens:**
- agent-marketplace-query
- agent-library
- reporting-dashboard
- burning-platform
- opening
- maria-counterfactual
- signal-classification-beat
- financial-intelligence

---

## Implementation Steps

### **Step 1: Update demoStore.ts**
**File:** `src/uhg/store/demoStore.ts`

**Changes:**
1. Remove 5 screens from `SCREEN_ORDER` array (lines 10-25)
2. Add 5 screens to `APPENDIX_ORDER` array (lines 28-37)
3. Keep `SCREEN_ROUTES` unchanged (lines 39-62)
4. Keep `SCREEN_LABELS` unchanged (lines 64-87)

**Before:**
```typescript
export const SCREEN_ORDER: ScreenId[] = [
  'knowledge-graph',
  'fragmentation',        // REMOVE
  'cdp-assembly',         // REMOVE
  'maria-subgraph',       // REMOVE
  'consumer-360',         // REMOVE
  'whole-person-care',    // REMOVE
  'signal-disposition-engine',
  'controller',
  'family-sofia',
  'caregiver-elena',
  'agent-impact',
  'portfolio-scale',
  'strategic-roadmap',
  'leave-behind',
];

export const APPENDIX_ORDER: ScreenId[] = [
  'agent-marketplace-query',
  'agent-library',
  'reporting-dashboard',
  'burning-platform',
  'opening',
  'maria-counterfactual',
  'signal-classification-beat',
  'financial-intelligence',
];
```

**After:**
```typescript
export const SCREEN_ORDER: ScreenId[] = [
  'knowledge-graph',
  'signal-disposition-engine',
  'controller',
  'family-sofia',
  'caregiver-elena',
  'agent-impact',
  'portfolio-scale',
  'strategic-roadmap',
  'leave-behind',
];

export const APPENDIX_ORDER: ScreenId[] = [
  // CDP & Agentic Orchestration Section
  'fragmentation',
  'cdp-assembly',
  'maria-subgraph',
  'consumer-360',
  'whole-person-care',
  // Existing Appendix Screens
  'agent-marketplace-query',
  'agent-library',
  'reporting-dashboard',
  'burning-platform',
  'opening',
  'maria-counterfactual',
  'signal-classification-beat',
  'financial-intelligence',
];
```

---

### **Step 2: Update PresenterControls.tsx**
**File:** `src/uhg/components/shared/PresenterControls.tsx`

**Changes:**
Add the 5 CDP & Agentic Orchestration screens to the `APPENDIX_SCREENS` array in the `AppendixOverlay` component (lines 24-67).

**Add after line 66:**
```typescript
{
  id: 'fragmentation' as const,
  label: 'CDP1 — Fragmentation Split System View',
  desc: 'System fragmentation view showing split care delivery across multiple systems and providers.',
  color: '#06b6d4',
  route: '/fragmentation-split-system-view',
},
{
  id: 'cdp-assembly' as const,
  label: 'CDP2 — CDP Assembly',
  desc: 'Customer Data Platform identity resolution and data assembly process.',
  color: '#8b5cf6',
  route: '/cdp-assembly-split',
},
{
  id: 'maria-subgraph' as const,
  label: 'CDP3 — Maria Subgraph Context',
  desc: 'Maria\'s knowledge graph subgraph showing relationships, care gaps, and context.',
  color: '#42be65',
  route: '/maria-subgraph-context',
},
{
  id: 'consumer-360' as const,
  label: 'UHG1 — Consumer 360',
  desc: 'UHG-ORCHESTRATE Consumer 360 view with identity, care gaps, and household context.',
  color: '#78a9ff',
  route: '/consumer-360',
},
{
  id: 'whole-person-care' as const,
  label: 'UHG2 — Whole Person Care',
  desc: 'UHG-ORCHESTRATE Whole Person Care orchestration and intervention planning.',
  color: '#f1c21b',
  route: '/whole-person-care',
},
```

---

### **Step 3: Update Phase Arc Logic (if needed)**
**File:** `src/uhg/store/demoStore.ts` (lines 137-148)

The phase arc activation logic may need adjustment since screen indices will change:

**Current logic:**
```typescript
phaseArcActive: {
  foundation: screenIndex >= 0,
  orchestration: screenIndex >= 6,
  autonomous: screenIndex >= 7,
},
```

**New logic (adjust indices):**
```typescript
phaseArcActive: {
  foundation: screenIndex >= 0,
  orchestration: screenIndex >= 1,  // Adjusted from 6
  autonomous: screenIndex >= 2,     // Adjusted from 7
},
```

---

## Testing Checklist

After implementation, verify:

- [ ] Main demo flow has 9 screens (down from 14)
- [ ] Arrow keys navigate through 9 screens only
- [ ] "A" key opens Appendix overlay
- [ ] Appendix shows 13 screens (up from 8)
- [ ] CDP & Agentic Orchestration screens grouped together in Appendix
- [ ] All 5 moved screens accessible via Appendix
- [ ] Routes still work correctly
- [ ] Screen labels display correctly
- [ ] Phase arc activates at correct points
- [ ] No broken navigation or missing screens
- [ ] Application compiles without errors

---

## Impact Assessment

### **Benefits:**
✅ Streamlined main demo flow (9 screens vs 14)
✅ Faster navigation through primary content
✅ CDP & Agentic Orchestration screens preserved and accessible
✅ Better organization of reference material
✅ Recently fixed data inconsistencies preserved

### **Risks:**
⚠️ Users may not discover CDP screens in Appendix
⚠️ Phase arc timing may need adjustment
⚠️ Screen index references may break if hardcoded elsewhere

### **Mitigation:**
- Clear labeling in Appendix ("CDP1", "CDP2", "UHG1", "UHG2")
- Test all navigation paths
- Update any hardcoded screen indices
- Document the change for presenters

---

## Files to Modify

1. **src/uhg/store/demoStore.ts** (Primary changes)
   - Update `SCREEN_ORDER` array
   - Update `APPENDIX_ORDER` array
   - Adjust phase arc logic

2. **src/uhg/components/shared/PresenterControls.tsx** (Secondary changes)
   - Add 5 screens to `APPENDIX_SCREENS` array

---

## Rollback Plan

If issues arise:
1. Revert `demoStore.ts` to previous `SCREEN_ORDER` and `APPENDIX_ORDER`
2. Revert `PresenterControls.tsx` to previous `APPENDIX_SCREENS`
3. Use git to restore: `git checkout HEAD -- src/uhg/store/demoStore.ts src/uhg/components/shared/PresenterControls.tsx`

---

## Estimated Time
- Implementation: 15-20 minutes
- Testing: 15-20 minutes
- **Total: 30-40 minutes**

---

**Ready to Execute:** Awaiting user approval to proceed with implementation.