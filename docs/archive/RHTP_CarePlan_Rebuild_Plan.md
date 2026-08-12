# RHTP Care Plan Rebuild Plan

## Problem Statement
The care plan displayed in the MD SMART app is not updating after code fixes. The generated care plan still shows hallucinations (fake provider names, incorrect goals, etc.) even though the underlying code has been corrected.

## Root Cause Analysis

### 1. **Cached Generated Plan**
The care plan was generated BEFORE the fixes were applied. The UI is displaying the old cached `generatedPlan` object that was created with the hallucinated data.

### 2. **Multiple Generation Functions**
There are TWO care plan generation functions being used:
- `generateComprehensiveCarePlan()` - Used in CarePlanPanel.tsx
- `generateHolisticCarePlan()` - Used in MdSmartSummaryScreen.tsx

Both need to be verified for hallucinations.

### 3. **Data Flow Issue**
```
Patient Data → carePlanGenerator.ts → GeneratedCarePlan → CarePlanForm → UI Display
```
The fixes were applied to carePlanGenerator.ts, but the UI is still showing the OLD GeneratedCarePlan object.

## Solution Plan

### Phase 1: Verify All Generation Functions (IMMEDIATE)
**Goal:** Ensure both generation functions are hallucination-free

#### Step 1.1: Review generateComprehensiveCarePlan()
- ✅ Already fixed in previous work
- Verify no hardcoded names remain
- Verify uses patient.primaryCareProvider
- Verify uses patient.careManager

#### Step 1.2: Review generateHolisticCarePlan()
- ✅ Already fixed buildCareTeamFromHolisticPlan()
- Verify no other hallucination sources
- Verify uses actual patient data

#### Step 1.3: Check for Hidden Hallucinations
Search for any remaining:
- Hardcoded provider names (Dr. Whitfield, Dr. Chen, Angela Torres, Maria Garcia)
- Math.random() calls
- Fake organization names (TCOC)
- Inappropriate goals (eye exams for pre-diabetic patients)

### Phase 2: Force Cache Clear & Regeneration (IMMEDIATE)
**Goal:** Get fresh care plan with corrected data

#### Step 2.1: Clear Browser State
User needs to:
1. Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Clear localStorage if needed
3. Close and reopen the Care Plan tab

#### Step 2.2: Regenerate Care Plan
User needs to:
1. Navigate to Care Plan tab
2. Click "Generate AI Care Plan" button
3. Wait for new generation to complete
4. Verify the new plan shows correct data

### Phase 3: Validation Checklist (IMMEDIATE)
**Goal:** Verify no hallucinations in the new care plan

#### What to Check in the Generated Plan:

##### ✅ Care Team Members
- [ ] Primary Care Provider = "Bennett County Health (CAH)" or patient.primaryCareProvider
- [ ] Care Manager = "Sarah Johnson" or patient.careManager
- [ ] NO "Dr. James Whitfield"
- [ ] NO "Dr. Emily Chen"
- [ ] NO "Angela Torres, NP"
- [ ] NO "Maria Garcia, LCSW"
- [ ] Specialists marked as "(referral pending)" if not assigned

##### ✅ Clinical Goals
- [ ] NO eye exam goal (Maria is pre-diabetic, not diabetic)
- [ ] Goals match actual care gaps (HbA1c, Edinburgh PND, Well-Child)
- [ ] Goals are appropriate for Maria's conditions
- [ ] Goal count matches actual needs (should be ~5-6, not 8)

##### ✅ SDoH Needs
- [ ] Transportation barriers mentioned (47 miles to Winner Regional)
- [ ] Childcare needs mentioned ($487/mo)
- [ ] WIC enrollment mentioned ($320/mo)
- [ ] LIHEAP mentioned
- [ ] NO random/fake SDoH needs

##### ✅ Organization References
- [ ] Shows "Bennett County Health (CAH)" not "TCOC Primary Care Network"
- [ ] Correct location: Martin, SD 57551
- [ ] Correct distance: 47 miles to Winner Regional Healthcare

##### ✅ Patient Context
- [ ] Maria Redhawk, Age 34
- [ ] Postpartum status mentioned
- [ ] Two children: Sophia (24 months), Elena (infant)
- [ ] NO autism diagnosis for Sophia
- [ ] Pre-diabetic status (not diabetic)

### Phase 4: Code Verification (BACKUP)
**Goal:** If regeneration still shows issues, verify code changes

#### Step 4.1: Verify carePlanGenerator.ts Changes
Check these specific lines:
- Line 240: Organization reference uses patient data
- Lines 445-510: detectSDoHNeeds() uses careGaps parameter
- Lines 697-750: assembleCareTeam() uses patient parameter
- Lines 1212-1280: buildCareTeamFromHolisticPlan() uses patient data

#### Step 4.2: Verify CarePlanPanel.tsx Changes
Check these specific lines:
- Line 113: Care team member uses patient.primaryCareProvider
- Lines 45-53: CARE_GOALS array has 6 goals (not 7)
- No eye exam goal in the array

#### Step 4.3: Check for Compilation Errors
```bash
cd RHTP_Code_Base
npm run build
```
Verify no TypeScript errors related to our changes.

### Phase 5: Testing Protocol (VALIDATION)
**Goal:** Systematic testing to ensure all hallucinations removed

#### Test Case 1: Generate Comprehensive Care Plan
1. Navigate to Care Plan tab
2. Click "Generate AI Care Plan"
3. Verify Clinical Summary section
4. Verify Goals & Interventions section
5. Verify Care Team section
6. Take screenshot for documentation

#### Test Case 2: Generate Holistic Care Plan
1. Navigate to Summary screen
2. Click "Generate Holistic Care Plan"
3. Verify Root Cause section
4. Verify Barrier-First approach
5. Verify Care Team section
6. Take screenshot for documentation

#### Test Case 3: Cross-Reference with Maria's Data
Compare generated plan against Maria_Redhawk_Summary.py:
- [ ] All care gaps addressed
- [ ] All SDoH barriers mentioned
- [ ] Correct providers listed
- [ ] Correct organization
- [ ] No fake data

### Phase 6: Documentation (FINAL)
**Goal:** Document the corrected care plan

#### Step 6.1: Create Corrected Care Plan Document
- Export the generated care plan
- Annotate with verification notes
- Compare to Maria_Redhawk_CORRECTED_CarePlan.md
- Document any remaining discrepancies

#### Step 6.2: Update Testing Documentation
- Update RHTP_Hallucination_Fixes_COMPLETE.md
- Add screenshots of corrected care plan
- Document validation results

## Immediate Action Items

### For Bob (Me):
1. ✅ Create this rebuild plan
2. ⏳ Search for any remaining hallucinations in code
3. ⏳ Verify both generation functions are clean
4. ⏳ Create validation checklist for user

### For User (Richard):
1. ⏳ Hard refresh browser (Cmd+Shift+R)
2. ⏳ Navigate to Care Plan tab
3. ⏳ Click "Generate AI Care Plan" button
4. ⏳ Review generated plan against checklist
5. ⏳ Take screenshot of results
6. ⏳ Report any remaining issues

## Expected Outcome

After regeneration, the care plan should show:

### Care Team
```
✅ Primary Care: Bennett County Health (CAH)
✅ Care Manager: Sarah Johnson
✅ Social Worker: (to be assigned)
✅ Cardiology: (referral pending)
```

### Goals (5-6 total)
```
✅ Goal 1: Complete HbA1c lab test (38 days overdue)
✅ Goal 2: Complete Edinburgh PND screening (427 days overdue)
✅ Goal 3: Schedule well-child visit for Sophia
✅ Goal 4: Address transportation barriers
✅ Goal 5: Enroll in WIC program
✅ Goal 6: Apply for LIHEAP assistance
```

### NO Hallucinations
```
❌ NO Dr. James Whitfield
❌ NO Dr. Emily Chen
❌ NO Angela Torres, NP
❌ NO Maria Garcia, LCSW
❌ NO eye exam goal
❌ NO TCOC organization
❌ NO random SDoH needs
❌ NO fake provider names
```

## Troubleshooting

### If regeneration still shows hallucinations:

1. **Check browser console for errors**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Check Network tab for API calls

2. **Verify code changes were saved**
   - Check file timestamps
   - Verify git status shows changes
   - Re-run npm run dev if needed

3. **Check if old code is cached**
   - Stop the dev server
   - Clear .next directory: `rm -rf .next`
   - Restart: `npm run dev -- --port 4030`

4. **Verify patient data is loading**
   - Check that Maria's data is being passed to generator
   - Verify patient object has primaryCareProvider field
   - Verify patient object has careManager field

## Success Criteria

✅ Care plan generated with NO hallucinations
✅ All provider names from actual patient data
✅ All goals match actual care gaps
✅ All SDoH needs from actual barriers
✅ Organization shows Bennett County Health (CAH)
✅ No fake names anywhere in the plan
✅ User can approve and send plan with confidence

## Timeline

- **Phase 1-2:** 10 minutes (verify code + regenerate)
- **Phase 3:** 5 minutes (validation checklist)
- **Phase 4:** 10 minutes (if needed - code verification)
- **Phase 5:** 15 minutes (systematic testing)
- **Phase 6:** 10 minutes (documentation)

**Total:** 30-50 minutes to complete rebuild and validation

---

**Next Step:** Search for any remaining hallucinations in the codebase, then guide user through regeneration process.