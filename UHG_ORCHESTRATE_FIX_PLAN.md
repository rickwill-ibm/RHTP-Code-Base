# UHG-ORCHESTRATE Data Inconsistency Fix Plan

## Overview
This plan addresses all 11 data inconsistencies found in the UHG-ORCHESTRATE screens for Maria Redhawk.

**Source Document:** `UHG_ORCHESTRATE_Maria_Redhawk_Data_Inconsistencies.docx`

---

## Verified Facts (Source of Truth)
- **Maria Redhawk:** 34 years old, MRN: MARIA_SD_001
- **Elena Redhawk:** 66 years old - Maria's MOTHER on Medicare
- **Elena's Residence:** Lives alone, 15 miles from Maria
- **Sophia Redhawk:** 24 months old - Maria's daughter
- **Care Gaps:** 9 total (3 Clinical, 2 Behavioral Health, 4 Social)
- **HbA1c Gap:** Open 38 days
- **Edinburgh PND:** Open 427 days (CRITICAL)
- **RAF Score:** 2.18
- **Medications:** Metformin + Lisinopril (Maria's medications, NOT duplicates)
- **Caregiver Burden:** Zarit 48 - Maria cares for elderly mother Elena (15 miles away) + toddler Sophia

---

## Fix Plan by Screen

### Screen 1: Consumer-360 (`src/app/uhg-orchestrate/consumer-360/page.tsx`)

**File:** `RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2/src/app/uhg-orchestrate/consumer-360/page.tsx`

#### Critical Fixes (4):

**Fix 1: Maria's Age (Line 73)**
- **Current:** `{ id: 'pa-age', label: 'Age', value: '58', color: '#c6c6c6' }`
- **Change to:** `{ id: 'pa-age', label: 'Age', value: '34', color: '#c6c6c6' }`
- **Priority:** CRITICAL

**Fix 2: HbA1c Gap Days (Line 456)**
- **Current:** `careGapStatus="HbA1c Gap 45d"`
- **Change to:** `careGapStatus="HbA1c Gap 38d"`
- **Priority:** CRITICAL

**Fix 3: Duplicate Therapy Warning (Line 82)**
- **Current:** `{ id: 'pa-dup', label: '⚠ Dup Therapy', value: 'Lisinopril + Metformin', color: '#fa4d56' }`
- **Change to:** `{ id: 'pa-meds', label: 'Medications', value: 'Lisinopril + Metformin', color: '#42be65' }`
- **Note:** Remove duplicate therapy implication - these are Maria's prescribed medications
- **Priority:** CRITICAL

**Fix 4: Medication Duplicate Alert (Lines 520-550)**
- **Current:** Shows medications as duplicate therapy with warning
- **Action:** Remove duplicate therapy warning section or clarify these are Maria's prescribed medications
- **Priority:** CRITICAL

#### Moderate Fixes (3):

**Fix 5: Risk Score Display (Line 74)**
- **Current:** `{ id: 'pa-risk', label: 'Risk Score', value: '7.8 / 10', color: '#fa4d56' }`
- **Change to:** `{ id: 'pa-risk', label: 'RAF Score', value: '2.18', color: '#fa4d56' }`
- **Note:** Or add clarification that 7.8/10 is a different scoring system
- **Priority:** MODERATE

**Fix 6: Caregiver Status (Line 701)**
- **Current:** `{ label: 'Caregiver status', value: 'Registered Nov 2024 (Elena)', color: '#c084fc' }`
- **Change to:** `{ label: 'Caregiver status', value: 'Caregiver for mother Elena (66y, 15mi away)', color: '#c084fc' }`
- **Priority:** MODERATE

**Fix 7: Household Members (Lines 906-910)**
- **Current:** Shows Elena as household member
- **Change:** Update Elena's entry to clarify she lives separately:
  ```typescript
  { id: 'ELENA_SD_003', name: 'Elena Redhawk', role: 'Mother (lives 15mi away)', risk: 'Medicare', riskColor: '#78a9ff', initials: 'ER', note: 'Maria is caregiver · Separate residence' }
  ```
- **Priority:** MODERATE

---

### Screen 2: Fragmentation Split System View (`src/app/uhg-orchestrate/fragmentation-split-system-view/page.tsx`)

**File:** `RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2/src/app/uhg-orchestrate/fragmentation-split-system-view/page.tsx`

#### Critical Fixes (1):

**Fix 8: Elena's Age (Line 114)**
- **Current:** `{ id: 'caregiver', label: 'CAREGIVER', subtitle: 'Elena Redhawk, 71', ... }`
- **Change to:** `{ id: 'caregiver', label: 'CAREGIVER', subtitle: 'Elena Redhawk, 66', ... }`
- **Priority:** CRITICAL

#### Moderate Fixes (2):

**Fix 9: Elena's Health Data (Line 118)**
- **Current:** `items: ['Heart + Diabetes (A1C 8.1%)', 'Metformin + Lisinopril', 'Proxy consent PENDING']`
- **Action:** Verify if this is Elena's data or Maria's data. If Maria's, update accordingly.
- **Priority:** MODERATE

**Fix 10: Elena's Living Situation (Line 119)**
- **Current:** `livesIn: 'Nowhere — no system aware'`
- **Change to:** `livesIn: 'Medicare · Separate residence (15mi from Maria)'`
- **Priority:** MODERATE

---

### Screen 3: Agent Library (`src/app/uhg-orchestrate/agent-library/page.tsx`)

**File:** `RHTP_V2.0_FINAL_BACKUP_061726_MariaRedhawk 2/src/app/uhg-orchestrate/agent-library/page.tsx`

**Status:** ✅ NO FIXES NEEDED
- This screen displays agent capabilities only, no Maria-specific data

---

## Execution Steps

### Phase 1: Consumer-360 Screen (7 fixes)
1. Read current file
2. Apply all 7 fixes using `apply_diff`
3. Verify changes
4. Test screen at http://localhost:4029/uhg-orchestrate/consumer-360

### Phase 2: Fragmentation Screen (3 fixes)
1. Read current file
2. Apply all 3 fixes using `apply_diff`
3. Verify changes
4. Test screen at http://localhost:4029/uhg-orchestrate/fragmentation-split-system-view

### Phase 3: Verification
1. Review all screens visually
2. Confirm all data matches verified facts
3. Document any remaining issues

### Phase 4: Backup & Commit
1. Backup changes to GitHub using auto_backup_to_github.sh
2. Create commit message: "Fixed UHG-ORCHESTRATE data inconsistencies for Maria Redhawk"

---

## Testing Checklist

After fixes are applied, verify:

- [ ] Maria's age shows as 34 (not 58)
- [ ] Elena's age shows as 66 (not 71)
- [ ] HbA1c gap shows as 38 days (not 45 days)
- [ ] Medications show as Maria's prescribed meds (not duplicate therapy)
- [ ] Risk score clarified (RAF 2.18 or explained)
- [ ] Caregiver relationship clarified (Maria cares FOR Elena)
- [ ] Elena's living situation clarified (15 miles away, separate residence)
- [ ] Household display updated (Elena not shown as household member or clarified)

---

## Risk Assessment

**Low Risk Changes:**
- Age updates (simple value changes)
- Gap days update (simple value change)
- Text clarifications

**Medium Risk Changes:**
- Medication duplicate therapy removal (affects alert logic)
- Household member display (may affect other components)

**Mitigation:**
- Test each screen after changes
- Keep backup of original files
- Use git for version control

---

## Estimated Time
- Phase 1 (Consumer-360): 15-20 minutes
- Phase 2 (Fragmentation): 10 minutes
- Phase 3 (Verification): 10 minutes
- Phase 4 (Backup): 5 minutes
- **Total:** ~40-45 minutes

---

## Success Criteria
✅ All 11 inconsistencies resolved
✅ All screens display correct data matching verified facts
✅ No new errors introduced
✅ Changes committed to GitHub
✅ Application runs without errors on port 4029

---

**Ready to Execute:** Yes
**Approval Required:** User confirmation to proceed