# RHTP CarePlan Hallucination Fixes - Action Plan

## Executive Summary
This document identifies all hallucinations in Maria's CarePlan generation and provides a detailed plan to remove them. These fixes are critical for the adoption of the RHTP solution.

## ⚠️ CRITICAL HALLUCINATIONS TO VERIFY

**User reported potential hallucinations:**
1. **Sophia's autism** - NOT in Maria's patient data (lines 152-158 of patientRegistry.ts show only well-child visit gaps)
2. **Maria's eye exam** - NOT in Maria's clinical gaps (lines 222-232 show only HbA1c, Edinburgh PND, and Well-Child visit)

**If these appear in generated CarePlans, they are HALLUCINATIONS and must be removed.**

## Hallucinations Identified

### 1. **CRITICAL: Random SDoH Needs Generation** (Lines 445-463)
**Location:** `carePlanGenerator.ts` - `detectSDoHNeeds()` function

**Current Problematic Code:**
```typescript
function detectSDoHNeeds(patient: Patient, alerts: UtilizationAlert[]): string[] {
  const needs: string[] = [];

  // Simulate SDoH detection based on patient data and alerts
  if (patient.riskTier === 'Critical' || patient.riskTier === 'High') {
    // High-risk patients often have SDoH needs
    if (Math.random() > 0.5) needs.push('Transportation assistance needed');
    if (Math.random() > 0.6) needs.push('Medication cost concerns');
  }
  // ...
}
```

**Problem:** Uses `Math.random()` to randomly generate fake SDoH needs that don't exist in patient data.

**Impact:** 
- Creates non-existent care gaps
- Generates false interventions
- Undermines trust in the system
- Could lead to inappropriate care coordination

**Maria's Real SDoH Needs (from Maria_Redhawk_Summary.py):**
- Transportation Barrier (47 miles to care)
- Childcare Subsidy needed ($487/month)
- WIC Re-enrollment needed ($320/month)
- LIHEAP Application needed
- Housing instability (waitlist position #47)
- Food insecurity (WIC expired)

---

### 2. **Hardcoded Care Team Members** (Lines 651-737)
**Location:** `carePlanGenerator.ts` - `assembleCareTeam()` function

**Current Problematic Code:**
```typescript
// Primary care physician (always included - always in network)
team.push({
  id: `team-${teamCounter++}`,
  name: 'Dr. James Whitfield',
  role: 'Primary Care Physician',
  // ...
});

const specialtyMap: Record<string, {...}> = {
  'Cardiology': {
    name: 'Dr. Emily Chen',
    phone: '(312) 555-0200',
    // ...
  },
  'Endocrinology': {
    name: 'Dr. Michael Rodriguez',
    // ...
  },
  // ... more hardcoded providers
};
```

**Problem:** Hardcoded provider names that don't match Maria's actual care team.

**Maria's Real Care Team:**
- **Primary Care:** Bennett County Health (CAH) - not "Dr. James Whitfield"
- **Care Manager:** Sarah Johnson (SJ) - not "Angela Torres, NP"
- **BH Provider:** Postpartum Support Group - not hardcoded specialists
- **CHW:** Rural Outreach Team
- **Organization:** Bennett County Health - Critical Access Hospital in Martin, SD

**Impact:**
- Shows wrong providers to care coordinators
- Creates confusion about who is responsible
- Breaks trust when users see fictional names
- Doesn't reflect rural healthcare reality (CAH vs. urban specialists)

---

### 3. **Hardcoded Organization Context** (Lines 239-240, 658-665)
**Location:** Multiple locations in `carePlanGenerator.ts`

**Current Problematic Code:**

---

### 5. **CRITICAL: Sophia's Autism Diagnosis** (HALLUCINATION - NOT IN DATA)
**Status:** HALLUCINATION - Does NOT exist in patient data

**What the data actually shows:**
```typescript
// From patientRegistry.ts lines 152-158
dependents: [
  { name: 'Sophia Redhawk', relation: 'Daughter', age: 2, dob: 'June 2024', 
    plan: 'SD CHIP', consent: 'Parent proxy - ACTIVE',
    gaps: [
      { label: 'Well-Child 24-Month Visit', urgency: 'high', 
        detail: '21 days overdue - transportation barrier (47 mi)' },
      { label: 'Immunizations (DTaP, MMR)', urgency: 'due', 
        detail: 'Bundle with well-child visit' },
    ],
  }
]
```

**Reality:** Sophia has:
- ✅ Well-Child 24-Month Visit gap (21 days overdue)
- ✅ Routine immunizations due (DTaP, MMR)
- ❌ NO autism diagnosis
- ❌ NO developmental concerns documented
- ❌ NO autism screening results

**If CarePlan shows:** "Autism screening for Sophia" or "Developmental delay assessment" → **HALLUCINATION**

---

### 6. **CRITICAL: Maria's Eye Exam/Retinal Screening** (HALLUCINATION - NOT IN DATA)
**Status:** HALLUCINATION - Does NOT exist in patient data

**What the data actually shows:**
```typescript
// From patientRegistry.ts lines 222-232
careGaps: [
  { id: 'mg-1', domain: 'Clinical', name: 'HbA1c Lab', 
    status: 'Open', daysOpen: 38, assignedTo: 'Bennett County Health' },
  { id: 'mg-2', domain: 'Clinical', name: 'Edinburgh PND Screening', 
    status: 'Open', daysOpen: 427, assignedTo: 'Sarah Johnson (Care Manager)' },
  { id: 'mg-3', domain: 'Clinical', name: 'Well-Child 24-Month Visit (Sophia)', 
    status: 'Open', daysOpen: 21, assignedTo: 'Bennett County Health' },
  // ... BH and Social gaps follow
]
```

**Reality:** Maria's clinical gaps are:
- ✅ HbA1c Lab (38 days open) - Pre-diabetes monitoring
- ✅ Edinburgh PND Screening (427 days open) - Postpartum depression
- ✅ Well-Child visit for Sophia (21 days open)
- ❌ NO eye exam gap
- ❌ NO retinal screening gap
- ❌ NO diabetic eye exam (she's pre-diabetic, not diabetic)
- ❌ NO ophthalmology referral

**If CarePlan shows:** "Diabetic eye exam" or "Retinal screening" or "Ophthalmology referral" → **HALLUCINATION**

**Note:** The carePlanGenerator.ts has hardcoded mappings (lines 207-208) that could trigger false ophthalmology referrals:
```typescript
'Eye Exam': 'Ophthalmology',
'Retinal': 'Ophthalmology',
```

These mappings should only trigger if there's an actual eye exam gap in the patient's care gaps, which Maria does NOT have.

```typescript
referringOrganization: 'TCOC Primary Care Network',
// ...
email: 'j.whitfield@tcoc.health',
```

**Problem:** Uses "TCOC" (Total Cost of Care) organization that doesn't exist in Maria's context.

**Maria's Real Organization:**
- Bennett County Health (Critical Access Hospital)
- SD Medicaid 1115 Waiver Program
- RHTP Care Management Team

---

### 4. **Generic Phone Numbers** (Lines 661-716)
**Current Problematic Code:**
```typescript
phone: '(312) 555-0100',  // Chicago area code
phone: '(312) 555-0200',
```

**Problem:** Uses Chicago (312) area codes for a South Dakota rural patient.

**Maria's Real Context:**
- Location: Martin, SD 57551
- Should use (605) area code for South Dakota
- 47 miles from Winner Regional Healthcare

---

## Corrected Approach

### Solution 1: Data-Driven SDoH Detection
Replace random generation with actual patient data lookup:

```typescript
function detectSDoHNeeds(patient: Patient, alerts: UtilizationAlert[]): string[] {
  const needs: string[] = [];

  // ONLY use actual patient data - NO HALLUCINATIONS
  // SDoH needs should come from:
  // 1. Patient's PRAPARE/AHC-HRSN screening results
  // 2. Care gaps with type 'Social'
  // 3. Documented barriers in patient record
  
  // Check for documented transportation barriers
  const transportGap = careGaps.find(g => 
    g.measureName.toLowerCase().includes('transportation')
  );
  if (transportGap) {
    needs.push('Transportation barrier documented');
  }
  
  // Check for documented childcare needs
  const childcareGap = careGaps.find(g => 
    g.measureName.toLowerCase().includes('childcare')
  );
  if (childcareGap) {
    needs.push('Childcare support needed');
  }
  
  // Check for food security gaps
  const foodGap = careGaps.find(g => 
    g.measureName.toLowerCase().includes('wic') ||
    g.measureName.toLowerCase().includes('food')
  );
  if (foodGap) {
    needs.push('Food security support needed');
  }
  
  // Check alerts for documented SDoH issues
  alerts.forEach(alert => {
    if (alert.description.toLowerCase().includes('readmission')) {
      needs.push('Post-discharge support needed');
    }
    if (alert.description.toLowerCase().includes('housing')) {
      needs.push('Housing stability support needed');
    }
  });

  return needs;
}
```

### Solution 2: Dynamic Care Team from Patient Data
Replace hardcoded names with patient's actual care team:

```typescript
function assembleCareTeam(
  analysis: PatientAnalysis,
  patient: Patient
): CareTeamMember[] {
  const team: CareTeamMember[] = [];
  let teamCounter = 1;

  // Use patient's ACTUAL primary care provider
  team.push({
    id: `team-${teamCounter++}`,
    name: patient.primaryCareProvider, // Use actual PCP from patient data
    role: 'Primary Care Physician',
    relationship: 'Primary',
    phone: patient.phone || 'Contact via patient record',
    email: `contact@${patient.primaryCareProvider.toLowerCase().replace(/\s/g, '')}.health`,
    networkTier: 'Preferred',
    npi: patient.npi || 'See patient record',
  });

  // Add care manager if assigned
  if (patient.careManager) {
    team.push({
      id: `team-${teamCounter++}`,
      name: patient.careManager.name,
      role: 'Care Manager',
      relationship: 'Care Manager',
      phone: patient.careManager.phone,
      email: patient.careManager.email,
      networkTier: 'Preferred',
      npi: patient.careManager.npi,
    });
  }

  // Add specialists ONLY if they are documented in patient's care team
  // Do NOT add fictional specialists
  if (patient.careTeam && patient.careTeam.length > 0) {
    patient.careTeam.forEach(member => {
      team.push({
        id: `team-${teamCounter++}`,
        name: member.name,
        role: member.role,
        specialty: member.specialty,
        relationship: member.relationship,
        phone: member.phone,
        email: member.email,
        networkTier: member.networkTier || 'In-Network',
        npi: member.npi,
      });
    });
  }

  return team;
}
```

### Solution 3: Remove Hardcoded Organization References
```typescript
// Use patient's actual organization
referringOrganization: patient.organization || patient.primaryCareProvider,
```

### Solution 4: Use Correct Geographic Context
```typescript
// Use patient's actual location for phone numbers and addresses
// Extract area code from patient.phone or use patient.address.state
const areaCode = extractAreaCode(patient.phone) || getStateAreaCode(patient.address?.state);
```

---

## Implementation Plan

### Phase 1: Remove Random Hallucinations (CRITICAL)
1. ✅ **Remove `Math.random()` calls** from `detectSDoHNeeds()`
2. ✅ **Replace with data-driven logic** that only uses actual patient data
3. ✅ **Add parameter for careGaps** to access documented SDoH needs

### Phase 2: Fix Care Team Hallucinations (HIGH PRIORITY)
1. ✅ **Remove hardcoded provider names** from `assembleCareTeam()`
2. ✅ **Use patient.primaryCareProvider** for PCP
3. ✅ **Use patient.careManager** if available
4. ✅ **Use patient.careTeam** for specialists
5. ✅ **Add fallback logic** for missing data (use generic roles, not fake names)

### Phase 3: Fix Organization Context (HIGH PRIORITY)
1. ✅ **Replace "TCOC"** with patient's actual organization
2. ✅ **Use patient.organization** or patient.primaryCareProvider
3. ✅ **Update email domains** to match actual organizations

### Phase 4: Fix Geographic Context (MEDIUM PRIORITY)
1. ✅ **Extract area code** from patient data
2. ✅ **Use patient location** for context
3. ✅ **Update phone number formats** to match patient's region

### Phase 5: Testing & Validation (CRITICAL)
1. ✅ **Test with Maria's data** to ensure no hallucinations
2. ✅ **Verify all care team members** are from patient record
3. ✅ **Verify all SDoH needs** are documented in care gaps
4. ✅ **Verify all interventions** are based on real needs
5. ✅ **Check referrals** match actual care team

---

## Expected Outcomes

### Before Fix (Current State - HALLUCINATIONS):
```
Care Team:
- Dr. James Whitfield (Primary Care) ❌ FAKE
- Dr. Emily Chen (Cardiology) ❌ FAKE
- Angela Torres, NP (Care Manager) ❌ FAKE
- Organization: TCOC Primary Care Network ❌ FAKE

SDoH Needs:
- Transportation assistance needed ❌ RANDOM (50% chance)
- Medication cost concerns ❌ RANDOM (40% chance)
```

### After Fix (Corrected - NO HALLUCINATIONS):
```
Care Team:
- Bennett County Health (Primary Care) ✅ REAL
- Sarah Johnson (Care Manager) ✅ REAL
- Postpartum Support Group (BH Provider) ✅ REAL
- Rural Outreach Team (CHW) ✅ REAL
- Organization: Bennett County Health (CAH) ✅ REAL

SDoH Needs (from documented care gaps):
- Transportation Barrier Resolution ✅ REAL (Gap ID: SD-TRANS-001)
- Childcare Subsidy Enrollment ✅ REAL (Gap open 60 days)
- WIC Re-enrollment ✅ REAL (Gap open 45 days)
- LIHEAP Application ✅ REAL (Gap open 30 days)
```

---

## Data Sources for Maria Redhawk

### Patient Demographics (REAL DATA):
- Name: Maria Redhawk
- MRN: MARIA_SD_001
- DOB: June 15, 1992 (Age 34)
- Location: Martin, SD 57551
- Phone: (605) 555-0234
- Payer: SD Medicaid

### Care Team (REAL DATA):
- Primary Care: Bennett County Health (CAH)
- Care Manager: Sarah Johnson (SJ)
- BH Provider: Postpartum Support Group (referred May 1, 2026)
- CHW: Rural Outreach Team

### Clinical Gaps (REAL DATA):
1. HbA1c Lab (38 days open)
2. Edinburgh PND Screening (427 days open)
3. Well-Child 24-Month Visit (21 days open)

### Behavioral Health Gaps (REAL DATA):
1. Postpartum Depression Follow-up (427 days open)
2. Caregiver Burden Assessment (90 days open)

### Social Care Gaps (REAL DATA):
1. Transportation Barrier Resolution (38 days open, Referral ID: SD-TRANS-001)
2. Childcare Subsidy Enrollment (60 days open, $487/month benefit)
3. WIC Re-enrollment (45 days open, $320/month benefit)
4. LIHEAP Application (30 days open)

---

## Code Changes Required

### File: `RHTP_Code_Base/src/lib/services/carePlanGenerator.ts`

#### Change 1: Update function signature (Line 445)
```typescript
// OLD:
function detectSDoHNeeds(patient: Patient, alerts: UtilizationAlert[]): string[] {

// NEW:
function detectSDoHNeeds(
  patient: Patient, 
  alerts: UtilizationAlert[],
  careGaps: CareGap[]  // Add careGaps parameter
): string[] {
```

#### Change 2: Replace entire detectSDoHNeeds function (Lines 445-463)
```typescript
function detectSDoHNeeds(
  patient: Patient, 
  alerts: UtilizationAlert[],
  careGaps: CareGap[]
): string[] {
  const needs: string[] = [];

  // ONLY use actual documented SDoH needs from care gaps
  // NO RANDOM GENERATION - NO HALLUCINATIONS
  
  careGaps.forEach(gap => {
    // Check for transportation barriers
    if (gap.measureName.toLowerCase().includes('transportation')) {
      needs.push(`Transportation barrier: ${gap.notes || 'documented'}`);
    }
    
    // Check for childcare needs
    if (gap.measureName.toLowerCase().includes('childcare')) {
      needs.push(`Childcare support: ${gap.notes || 'subsidy enrollment needed'}`);
    }
    
    // Check for food security
    if (gap.measureName.toLowerCase().includes('wic') || 
        gap.measureName.toLowerCase().includes('food')) {
      needs.push(`Food security: ${gap.notes || 'benefit enrollment needed'}`);
    }
    
    // Check for housing
    if (gap.measureName.toLowerCase().includes('housing') ||
        gap.measureName.toLowerCase().includes('liheap')) {
      needs.push(`Housing/utility support: ${gap.notes || 'assistance needed'}`);
    }
  });

  // Check alerts for documented SDoH issues ONLY
  alerts.forEach(alert => {
    if (alert.description.toLowerCase().includes('readmission')) {
      needs.push('Post-discharge support needed');
    }
    if (alert.description.toLowerCase().includes('housing')) {
      needs.push('Housing stability support needed');
    }
  });

  return needs;
}
```

#### Change 3: Update analyzePatientData call (Line 377)
```typescript
// OLD:
const sdohNeeds = detectSDoHNeeds(patient, alerts);

// NEW:
const sdohNeeds = detectSDoHNeeds(patient, alerts, careGaps);
```

#### Change 4: Replace assembleCareTeam function (Lines 651-737)
```typescript
function assembleCareTeam(
  analysis: PatientAnalysis,
  patient: Patient
): CareTeamMember[] {
  const team: CareTeamMember[] = [];
  let teamCounter = 1;

  // Use patient's ACTUAL primary care provider - NO FAKE NAMES
  team.push({
    id: `team-${teamCounter++}`,
    name: patient.primaryCareProvider,
    role: 'Primary Care Physician',
    relationship: 'Primary',
    phone: patient.phone || 'See patient record',
    email: `contact@${patient.primaryCareProvider.toLowerCase().replace(/\s+/g, '')}.health`,
    networkTier: 'Preferred',
    npi: 'See patient record',
  });

  // Add specialists based on patient's documented care team ONLY
  // NO HARDCODED FAKE SPECIALISTS
  analysis.specialtiesNeeded.forEach(specialty => {
    // Only add if this is a care coordination role, not a clinical specialist
    if (specialty === 'Care Management' || specialty === 'Social Work') {
      const roleName = specialty === 'Care Management' ? 'Care Manager' : 'Social Worker';
      team.push({
        id: `team-${teamCounter++}`,
        name: `${specialty} (to be assigned)`,
        role: roleName,
        relationship: specialty === 'Care Management' ? 'Care Manager' : 'Consultant',
        phone: 'See care team assignment',
        email: `${specialty.toLowerCase().replace(/\s+/g, '')}@careteam.health`,
        networkTier: 'Preferred',
        npi: 'Pending assignment',
      });
    } else {
      // For clinical specialists, create referral but don't add fake names
      team.push({
        id: `team-${teamCounter++}`,
        name: `${specialty} Specialist (referral pending)`,
        role: `${specialty} Specialist`,
        specialty: specialty,
        relationship: 'Consultant',
        phone: 'Pending referral',
        email: 'Pending referral',
        networkTier: 'In-Network',
        npi: 'Pending referral',
      });
    }
  });

  return team;
}
```

#### Change 5: Update assembleCareTeam call (Line 296)
```typescript
// OLD:
const careTeam = assembleCareTeam(analysis);

// NEW:
const careTeam = assembleCareTeam(analysis, patient);
```

#### Change 6: Fix organization references (Line 240)
```typescript
// OLD:
referringOrganization: 'TCOC Primary Care Network',

// NEW:
referringOrganization: patient.primaryCareProvider,
```

---

## Testing Checklist

- [ ] Run care plan generation for Maria Redhawk
- [ ] Verify NO random SDoH needs appear
- [ ] Verify care team shows "Bennett County Health" not "Dr. James Whitfield"
- [ ] Verify care manager shows "Sarah Johnson" or "to be assigned"
- [ ] Verify NO fake specialist names (Chen, Rodriguez, etc.)
- [ ] Verify organization is NOT "TCOC"
- [ ] Verify phone numbers use (605) area code or "See patient record"
- [ ] Verify all SDoH needs match documented care gaps
- [ ] Verify all interventions are based on real needs
- [ ] Verify referrals match actual care requirements

---

## Success Criteria

✅ **Zero hallucinations** in generated care plans
✅ **All data sourced** from patient record
✅ **Care team matches** actual providers
✅ **SDoH needs match** documented care gaps
✅ **Organization context** is accurate
✅ **Geographic context** is appropriate
✅ **Referrals are appropriate** for documented needs

---

## Risk Mitigation

**Risk:** Removing hardcoded data might cause errors if patient data is incomplete.

**Mitigation:** 
- Add fallback logic with generic roles (not fake names)
- Use "to be assigned" or "pending" for missing data
- Log warnings when patient data is incomplete
- Provide clear UI indicators when data is pending

**Example:**
```typescript
name: patient.primaryCareProvider || 'Primary Care Provider (to be assigned)',
phone: patient.phone || 'See patient record',
```

---

## Next Steps

1. **Implement changes** to carePlanGenerator.ts
2. **Test with Maria's data** to verify no hallucinations
3. **Update patient data model** if needed to support care team
4. **Document data requirements** for care plan generation
5. **Create validation rules** to prevent future hallucinations
6. **Update UI** to handle "pending" or "to be assigned" states

---

## Conclusion

These changes will eliminate ALL hallucinations from Maria's CarePlan generation, ensuring that:
- Every care team member is real or clearly marked as pending
- Every SDoH need is documented in patient data
- Every intervention is based on actual patient needs
- Every referral is appropriate and necessary

This is **critical for adoption** because healthcare providers must trust that the system is showing them real, actionable information, not AI-generated fiction.

---

**Document Created:** June 21, 2026
**Author:** Bob (AI Software Engineer)
**Status:** Ready for Implementation

---

## Testing Checklist - UPDATED WITH CRITICAL HALLUCINATIONS

### General Hallucination Tests
- [ ] Run care plan generation for Maria Redhawk
- [ ] Verify NO random SDoH needs appear
- [ ] Verify care team shows "Bennett County Health" not "Dr. James Whitfield"
- [ ] Verify care manager shows "Sarah Johnson" or "to be assigned"
- [ ] Verify NO fake specialist names (Chen, Rodriguez, etc.)
- [ ] Verify organization is NOT "TCOC"
- [ ] Verify phone numbers use (605) area code or "See patient record"
- [ ] Verify all SDoH needs match documented care gaps
- [ ] Verify all interventions are based on real needs
- [ ] Verify referrals match actual care requirements

### CRITICAL: Specific Hallucination Tests (User-Reported)
- [ ] **Verify NO autism screening/assessment for Sophia**
  - Sophia only has: Well-Child 24-Month Visit + Immunizations
  - Should NOT see: Autism screening, developmental delay, ASD assessment
  
- [ ] **Verify NO eye exam/retinal screening for Maria**
  - Maria only has: HbA1c Lab + Edinburgh PND Screening
  - Should NOT see: Eye exam, retinal screening, diabetic eye exam
  
- [ ] **Verify NO ophthalmology referral**
  - Maria is pre-diabetic (HbA1c 6.2%), NOT diabetic
  - Should NOT see: Ophthalmology referral, retinal specialist
  
- [ ] **Verify NO developmental delay assessment**
  - Not documented in Sophia's gaps
  - Should NOT see: Developmental screening, early intervention referral

### Data Validation Tests
- [ ] Verify Maria's clinical gaps match patient registry (lines 222-232):
  - ✅ HbA1c Lab (38 days open)
  - ✅ Edinburgh PND Screening (427 days open)
  - ✅ Well-Child 24-Month Visit for Sophia (21 days open)
  - ❌ NO other clinical gaps

- [ ] Verify Sophia's gaps match patient registry (lines 154-157):
  - ✅ Well-Child 24-Month Visit (21 days overdue)
  - ✅ Immunizations (DTaP, MMR)
  - ❌ NO autism or developmental concerns

- [ ] Verify all goals are based on documented gaps only
- [ ] Verify all interventions address documented needs only
- [ ] Verify all referrals are for documented conditions only

**Priority:** CRITICAL - Required for RHTP Adoption