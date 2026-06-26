# RHTP CarePlan Hallucination Removal - Implementation Plan

**Project:** Remove all hallucinations from RHTP CarePlan generation  
**Priority:** CRITICAL - Required for adoption  
**Timeline:** 2-3 weeks  
**Owner:** Development Team  
**Created:** June 21, 2026

---

## 📋 Executive Summary

This implementation plan provides step-by-step instructions to remove all hallucinations from the RHTP CarePlan generator and implement a contextually-aware, barrier-first care planning approach.

**Key Changes:**
1. Remove `Math.random()` hallucinations from SDoH detection
2. Replace hardcoded fake providers with real patient data
3. Implement barrier-first care planning logic
4. Add contextual patient summary generation
5. Implement appointment bundling logic
6. Add validation to prevent future hallucinations

---

## 🎯 Implementation Phases

### Phase 1: Critical Hallucination Removal (Week 1)
**Priority:** CRITICAL  
**Effort:** 3-5 days  
**Risk:** High - System currently generating false data

### Phase 2: Contextual Awareness Enhancement (Week 2)
**Priority:** HIGH  
**Effort:** 5-7 days  
**Risk:** Medium - New logic required

### Phase 3: Testing & Validation (Week 3)
**Priority:** HIGH  
**Effort:** 3-5 days  
**Risk:** Low - Verification only

---

## 📅 Detailed Implementation Schedule

### WEEK 1: Critical Hallucination Removal

#### Day 1-2: Remove Random SDoH Generation
**File:** `RHTP_Code_Base/src/lib/services/carePlanGenerator.ts`

**Task 1.1: Update detectSDoHNeeds function signature**
```typescript
// BEFORE (Line 445):
function detectSDoHNeeds(patient: Patient, alerts: UtilizationAlert[]): string[] {

// AFTER:
function detectSDoHNeeds(
  patient: Patient, 
  alerts: UtilizationAlert[],
  careGaps: CareGap[]  // Add careGaps parameter
): string[] {
```

**Task 1.2: Replace entire detectSDoHNeeds function body (Lines 445-463)**
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
    // Only process gaps in the 'Social' domain
    if (gap.program !== 'Social' && !gap.measureName.toLowerCase().includes('social')) {
      return; // Skip non-social gaps
    }

    // Check for transportation barriers
    if (gap.measureName.toLowerCase().includes('transportation') ||
        gap.measureName.toLowerCase().includes('transport')) {
      needs.push(`Transportation barrier: ${gap.notes || 'documented'}`);
    }
    
    // Check for childcare needs
    if (gap.measureName.toLowerCase().includes('childcare') ||
        gap.measureName.toLowerCase().includes('child care')) {
      needs.push(`Childcare support: ${gap.notes || 'subsidy enrollment needed'}`);
    }
    
    // Check for food security
    if (gap.measureName.toLowerCase().includes('wic') || 
        gap.measureName.toLowerCase().includes('food') ||
        gap.measureName.toLowerCase().includes('snap')) {
      needs.push(`Food security: ${gap.notes || 'benefit enrollment needed'}`);
    }
    
    // Check for housing
    if (gap.measureName.toLowerCase().includes('housing') ||
        gap.measureName.toLowerCase().includes('liheap') ||
        gap.measureName.toLowerCase().includes('utility')) {
      needs.push(`Housing/utility support: ${gap.notes || 'assistance needed'}`);
    }
  });

  // Check alerts for documented SDoH issues ONLY
  alerts.forEach(alert => {
    if (alert.description.toLowerCase().includes('readmission')) {
      needs.push('Post-discharge support needed');
    }
    if (alert.description.toLowerCase().includes('housing') && 
        !needs.some(n => n.includes('Housing'))) {
      needs.push('Housing stability support needed');
    }
  });

  return needs;
}
```

**Task 1.3: Update analyzePatientData call (Line 377)**
```typescript
// BEFORE:
const sdohNeeds = detectSDoHNeeds(patient, alerts);

// AFTER:
const sdohNeeds = detectSDoHNeeds(patient, alerts, careGaps);
```

**Validation:**
- [ ] Run unit tests for detectSDoHNeeds
- [ ] Verify NO random needs generated
- [ ] Verify all needs match care gaps

---

#### Day 3-4: Replace Hardcoded Care Team

**Task 2.1: Update assembleCareTeam function signature (Line 651)**
```typescript
// BEFORE:
function assembleCareTeam(analysis: PatientAnalysis): CareTeamMember[] {

// AFTER:
function assembleCareTeam(
  analysis: PatientAnalysis,
  patient: Patient
): CareTeamMember[] {
```

**Task 2.2: Replace assembleCareTeam function body (Lines 651-737)**
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
    name: patient.primaryCareProvider || 'Primary Care Provider (to be assigned)',
    role: 'Primary Care Physician',
    relationship: 'Primary',
    phone: patient.phone || 'See patient record',
    email: `contact@${(patient.primaryCareProvider || 'provider').toLowerCase().replace(/\s+/g, '')}.health`,
    networkTier: 'Preferred',
    npi: 'See patient record',
  });

  // Add care manager if assigned
  if (patient.careManager) {
    team.push({
      id: `team-${teamCounter++}`,
      name: patient.careManager,
      role: 'Care Manager',
      relationship: 'Care Manager',
      phone: 'See care team assignment',
      email: `${patient.careManager.toLowerCase().replace(/\s+/g, '')}@careteam.health`,
      networkTier: 'Preferred',
      npi: 'See care team assignment',
    });
  }

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

**Task 2.3: Update assembleCareTeam call (Line 296)**
```typescript
// BEFORE:
const careTeam = assembleCareTeam(analysis);

// AFTER:
const careTeam = assembleCareTeam(analysis, patient);
```

**Validation:**
- [ ] Run unit tests for assembleCareTeam
- [ ] Verify NO fake names (Chen, Rodriguez, Whitfield, etc.)
- [ ] Verify patient's actual PCP is used
- [ ] Verify care manager is from patient data

---

#### Day 5: Fix Organization References

**Task 3.1: Update referral organization (Line 240)**
```typescript
// BEFORE:
referringOrganization: 'TCOC Primary Care Network',

// AFTER:
referringOrganization: patient.organization || patient.primaryCareProvider,
```

**Task 3.2: Search and replace all "TCOC" references**
```bash
# Run in terminal:
cd RHTP_Code_Base/src
grep -r "TCOC" . --include="*.ts" --include="*.tsx"
# Replace all instances with patient.organization or appropriate context
```

**Validation:**
- [ ] Search codebase for "TCOC" - should return 0 results
- [ ] Verify all organizations match patient data

---

### WEEK 2: Contextual Awareness Enhancement

#### Day 6-7: Add Contextual Patient Summary

**Task 4.1: Create new function for contextual summary**

Add to `carePlanGenerator.ts` after line 800:

```typescript
/**
 * Generate contextual patient summary that highlights barriers
 * This appears at the top of the care plan
 */
function generateContextualSummary(
  patient: Patient,
  analysis: PatientAnalysis
): string {
  const parts: string[] = [];
  
  // Basic patient info
  parts.push(`${patient.name} is a ${patient.age}-year-old patient`);
  
  // Add episode context if available
  if (patient.episodeType) {
    parts.push(`with ${patient.episodeType.toLowerCase()}`);
  }
  
  // Highlight primary barriers
  const barriers: string[] = [];
  
  // Check for transportation barriers
  const transportGap = analysis.qualityGaps.find(g => 
    g.measureName.toLowerCase().includes('transportation')
  );
  if (transportGap) {
    barriers.push('transportation barriers');
  }
  
  // Check for caregiver burden
  if (analysis.sdohNeeds.some(n => n.toLowerCase().includes('caregiver'))) {
    barriers.push('caregiver burden');
  }
  
  // Check for financial strain
  if (analysis.sdohNeeds.some(n => 
    n.toLowerCase().includes('financial') || 
    n.toLowerCase().includes('food') ||
    n.toLowerCase().includes('housing')
  )) {
    barriers.push('financial strain');
  }
  
  if (barriers.length > 0) {
    parts.push(`with significant barriers including ${barriers.join(', ')}`);
  }
  
  // Add clinical context
  if (analysis.primaryConditions.length > 0) {
    parts.push(`Clinical conditions include ${analysis.primaryConditions.slice(0, 2).join(' and ')}`);
  }
  
  // Highlight what's blocking care
  const blockingBarriers: string[] = [];
  if (transportGap) {
    blockingBarriers.push('transportation access');
  }
  if (analysis.sdohNeeds.some(n => n.toLowerCase().includes('childcare'))) {
    blockingBarriers.push('childcare support');
  }
  
  if (blockingBarriers.length > 0) {
    parts.push(`Primary barriers blocking care access: ${blockingBarriers.join(', ')}`);
  }
  
  return parts.join('. ') + '.';
}
```

**Task 4.2: Add contextual summary to care plan output**

Update `generateComprehensiveCarePlan` function (around line 320):

```typescript
// Add after line 311 (after clinicalSummary generation):
const contextualSummary = generateContextualSummary(patient, analysis);

// Add to return statement (around line 322):
return {
  title,
  description,
  contextualSummary,  // ADD THIS LINE
  clinicalSummary,
  addresses,
  goals,
  interventions,
  careTeam,
  sharedWith,
  priority: analysis.overallPriority,
  estimatedImpact,
  referralsCreated,
};
```

**Task 4.3: Update GeneratedCarePlan interface**

Add to interface (around line 51):

```typescript
export interface GeneratedCarePlan {
  title: string;
  description: string;
  contextualSummary: string;  // ADD THIS LINE
  clinicalSummary: {
    conditions: string[];
    needs: string[];
    goals: string[];
    interventions: string[];
    referrals: string[];
  };
  // ... rest of interface
}
```

**Validation:**
- [ ] Verify contextual summary appears in care plan
- [ ] Verify barriers are highlighted
- [ ] Verify summary is patient-specific

---

#### Day 8-9: Implement Barrier-First Goal Prioritization

**Task 5.1: Add barrier detection to goal generation**

Update `generateGoals` function (starting line 516):

```typescript
function generateGoals(analysis: PatientAnalysis): CarePlanGoal[] {
  const goals: CarePlanGoal[] = [];
  let goalCounter = 1;

  // BARRIER-FIRST APPROACH: Add barrier removal goals FIRST
  
  // Transportation barrier goal (HIGHEST PRIORITY)
  const transportGap = analysis.qualityGaps.find(g => 
    g.measureName.toLowerCase().includes('transportation')
  );
  if (transportGap) {
    goals.push({
      id: `goal-${goalCounter++}`,
      description: 'Remove transportation barrier (KEYSTONE)',
      target: 'Reliable transportation to healthcare facilities',
      status: transportGap.status === 'In Progress' ? 'In Progress' : 'Not Started',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: transportGap.status === 'In Progress' ? 30 : 0,
      notes: `PRIMARY BLOCKER - ${transportGap.notes || 'Prevents all clinical care access'}`,
    });
  }
  
  // Childcare barrier goal (HIGH PRIORITY)
  const childcareGap = analysis.qualityGaps.find(g => 
    g.measureName.toLowerCase().includes('childcare')
  );
  if (childcareGap) {
    goals.push({
      id: `goal-${goalCounter++}`,
      description: 'Resolve childcare barrier (KEYSTONE)',
      target: 'Childcare support enabling appointment attendance',
      status: childcareGap.status === 'In Progress' ? 'In Progress' : 'Not Started',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: childcareGap.status === 'In Progress' ? 30 : 0,
      notes: `SECONDARY BLOCKER - ${childcareGap.notes || 'Prevents appointment attendance'}`,
    });
  }

  // THEN add clinical goals (existing code continues...)
  
  // Goals for HCC documentation
  analysis.hccOpportunities.forEach(hcc => {
    goals.push({
      id: `goal-${goalCounter++}`,
      description: `Document and code ${hcc.hccDescription}`,
      target: `ICD-10: ${hcc.icdCode} documented and submitted`,
      status: 'Not Started',
      dueDate: hcc.submissionDeadline,
      progress: 0,
      notes: `RAF Delta: +${hcc.estimatedRafDelta.toFixed(2)}, Revenue: $${hcc.estimatedRevenueDelta.toLocaleString()}`,
    });
  });

  // Rest of existing goal generation code...
  // (Keep existing quality gaps, utilization risks, SDoH goals)
  
  return goals;
}
```

**Validation:**
- [ ] Verify barrier goals appear FIRST in goal list
- [ ] Verify barrier goals are marked as KEYSTONE
- [ ] Verify clinical goals follow barrier goals

---

#### Day 10-11: Implement Appointment Bundling Logic

**Task 6.1: Create bundling detection function**

Add new function to `carePlanGenerator.ts`:

```typescript
/**
 * Detect opportunities to bundle appointments
 * Returns bundling recommendations
 */
function detectBundlingOpportunities(
  patient: Patient,
  careGaps: CareGap[]
): Array<{
  description: string;
  gaps: CareGap[];
  rationale: string;
}> {
  const bundles: Array<{
    description: string;
    gaps: CareGap[];
    rationale: string;
  }> = [];
  
  // Find clinical gaps that could be bundled
  const clinicalGaps = careGaps.filter(g => 
    g.program === 'Clinical' || g.measureName.toLowerCase().includes('lab') ||
    g.measureName.toLowerCase().includes('exam') || g.measureName.toLowerCase().includes('visit')
  );
  
  // If multiple clinical gaps exist, suggest bundling
  if (clinicalGaps.length >= 2) {
    bundles.push({
      description: `Bundle ${clinicalGaps.length} clinical appointments into single visit`,
      gaps: clinicalGaps,
      rationale: 'Reduces travel burden and increases completion likelihood'
    });
  }
  
  // Check for parent + child gaps (like Maria + Sophia)
  const parentGaps = clinicalGaps.filter(g => 
    !g.measureName.toLowerCase().includes('child') &&
    !g.measureName.toLowerCase().includes('well-child')
  );
  const childGaps = clinicalGaps.filter(g => 
    g.measureName.toLowerCase().includes('child') ||
    g.measureName.toLowerCase().includes('well-child')
  );
  
  if (parentGaps.length > 0 && childGaps.length > 0) {
    bundles.push({
      description: 'Bundle parent and child appointments',
      gaps: [...parentGaps, ...childGaps],
      rationale: 'Single trip for family, reduces childcare barrier'
    });
  }
  
  return bundles;
}
```

**Task 6.2: Add bundling to intervention generation**

Update `generateInterventions` function (around line 576):

```typescript
function generateInterventions(analysis: PatientAnalysis): CarePlanIntervention[] {
  const interventions: CarePlanIntervention[] = [];
  let interventionCounter = 1;

  // ADD BUNDLING INTERVENTIONS FIRST
  const bundlingOpportunities = detectBundlingOpportunities(
    analysis.patient, 
    analysis.qualityGaps
  );
  
  bundlingOpportunities.forEach(bundle => {
    interventions.push({
      id: `intervention-${interventionCounter++}`,
      type: 'Appointment',
      description: bundle.description,
      status: 'Pending',
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: `${bundle.rationale}. Addresses: ${bundle.gaps.map(g => g.measureName).join(', ')}`,
    });
  });

  // Rest of existing intervention generation code...
  // (Keep existing referrals, monitoring, medication review, etc.)
  
  return interventions;
}
```

**Note:** Need to add `patient` to `PatientAnalysis` interface:

```typescript
interface PatientAnalysis {
  patient: Patient;  // ADD THIS LINE
  overallPriority: 'Critical' | 'High' | 'Moderate' | 'Low';
  primaryConditions: string[];
  // ... rest of interface
}
```

And update `analyzePatientData` to include patient:

```typescript
return {
  patient,  // ADD THIS LINE
  overallPriority,
  primaryConditions,
  // ... rest of return
};
```

**Validation:**
- [ ] Verify bundling opportunities are detected
- [ ] Verify bundling interventions appear in care plan
- [ ] Verify rationale explains benefit

---

#### Day 12: Add Validation Layer

**Task 7.1: Create validation function**

Add new file: `RHTP_Code_Base/src/lib/services/carePlanValidator.ts`

```typescript
/**
 * Care Plan Validator
 * Prevents hallucinations by validating all care plan elements against patient data
 */

import type { Patient, CareGap } from '@/lib/types';
import type { GeneratedCarePlan } from './carePlanGenerator';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate care plan against patient data
 * Returns validation result with errors and warnings
 */
export function validateCarePlan(
  carePlan: GeneratedCarePlan,
  patient: Patient,
  careGaps: CareGap[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate care team members
  carePlan.careTeam.forEach(member => {
    // Check for known fake names
    const fakeNames = [
      'Dr. James Whitfield',
      'Dr. Emily Chen',
      'Dr. Michael Rodriguez',
      'Dr. Sarah Johnson',
      'Dr. David Lee',
      'Angela Torres, NP',
      'Maria Garcia, LCSW'
    ];
    
    if (fakeNames.includes(member.name)) {
      errors.push(`HALLUCINATION: Fake provider name detected: ${member.name}`);
    }
    
    // Check for fake organization
    if (member.email && member.email.includes('tcoc.health')) {
      errors.push(`HALLUCINATION: Fake organization detected in email: ${member.email}`);
    }
  });
  
  // Validate goals against care gaps
  carePlan.goals.forEach(goal => {
    // Check for autism-related goals (not in Maria's data)
    if (goal.description.toLowerCase().includes('autism') ||
        goal.description.toLowerCase().includes('developmental delay')) {
      errors.push(`HALLUCINATION: Autism/developmental goal detected but not in patient data: ${goal.description}`);
    }
    
    // Check for eye exam goals (not in Maria's data if she's pre-diabetic)
    if ((goal.description.toLowerCase().includes('eye exam') ||
         goal.description.toLowerCase().includes('retinal')) &&
        !careGaps.some(g => g.measureName.toLowerCase().includes('eye') || 
                           g.measureName.toLowerCase().includes('retinal'))) {
      errors.push(`HALLUCINATION: Eye exam goal detected but not in patient care gaps: ${goal.description}`);
    }
  });
  
  // Validate interventions
  carePlan.interventions.forEach(intervention => {
    // Check for ophthalmology referrals when not needed
    if (intervention.description.toLowerCase().includes('ophthalmology') &&
        !careGaps.some(g => g.measureName.toLowerCase().includes('eye') || 
                           g.measureName.toLowerCase().includes('retinal'))) {
      errors.push(`HALLUCINATION: Ophthalmology referral detected but not in patient care gaps: ${intervention.description}`);
    }
  });
  
  // Validate referrals
  carePlan.referralsCreated.forEach(referral => {
    // Check for inappropriate specialist referrals
    if (referral.specialistType === 'Ophthalmology' &&
        !careGaps.some(g => g.measureName.toLowerCase().includes('eye') || 
                           g.measureName.toLowerCase().includes('retinal'))) {
      errors.push(`HALLUCINATION: Ophthalmology referral created but not in patient care gaps`);
    }
  });
  
  // Check for random SDoH needs
  if (carePlan.clinicalSummary.needs.some(need => 
    need.includes('Transportation assistance needed') && 
    !careGaps.some(g => g.measureName.toLowerCase().includes('transportation'))
  )) {
    warnings.push('POTENTIAL HALLUCINATION: Transportation need mentioned but not in care gaps');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate and throw if invalid
 * Use this in production to prevent hallucinated care plans from being saved
 */
export function validateCarePlanOrThrow(
  carePlan: GeneratedCarePlan,
  patient: Patient,
  careGaps: CareGap[]
): void {
  const result = validateCarePlan(carePlan, patient, careGaps);
  
  if (!result.isValid) {
    const errorMessage = `Care plan validation failed:\n${result.errors.join('\n')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  
  if (result.warnings.length > 0) {
    console.warn('Care plan validation warnings:', result.warnings);
  }
}
```

**Task 7.2: Add validation to care plan generation**

Update `generateComprehensiveCarePlan` function (around line 335):

```typescript
import { validateCarePlanOrThrow } from './carePlanValidator';

export function generateComprehensiveCarePlan(input: ComprehensivePlanInput): GeneratedCarePlan {
  try {
    const { patient, hccSuspects, careGaps, alerts, clinicalData } = input;

    // ... existing code ...

    const carePlan = {
      title,
      description,
      contextualSummary,
      clinicalSummary,
      addresses,
      goals,
      interventions,
      careTeam,
      sharedWith,
      priority: analysis.overallPriority,
      estimatedImpact,
      referralsCreated,
    };

    // VALIDATE BEFORE RETURNING
    validateCarePlanOrThrow(carePlan, patient, careGaps);

    return carePlan;
  } catch (error) {
    console.error('Error in generateComprehensiveCarePlan:', error);
    throw error;
  }
}
```

**Validation:**
- [ ] Run validation tests with known hallucinations
- [ ] Verify validation catches fake names
- [ ] Verify validation catches inappropriate referrals
- [ ] Verify validation allows valid care plans

---

### WEEK 3: Testing & Validation

#### Day 13-14: Unit Testing

**Task 8.1: Create test file**

Create: `RHTP_Code_Base/src/lib/services/__tests__/carePlanGenerator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { generateComprehensiveCarePlan } from '../carePlanGenerator';
import type { Patient, CareGap, HCCSuspect, UtilizationAlert } from '@/lib/types';

describe('CarePlan Generator - No Hallucinations', () => {
  const mariaPatient: Patient = {
    id: 'MARIA_SD_001',
    name: 'Maria Redhawk',
    age: 34,
    dob: '1992-06-15',
    primaryCareProvider: 'Bennett County Health',
    careManager: 'Sarah Johnson',
    organization: 'Bennett County Health (CAH)',
    // ... rest of Maria's data
  };

  const mariaCareGaps: CareGap[] = [
    {
      id: 'mg-1',
      patientId: 'MARIA_SD_001',
      measureId: 'HbA1c',
      measureName: 'HbA1c Lab',
      program: 'Clinical',
      status: 'Open',
      daysOpen: 38,
      dueDate: '2026-06-22',
      assignedTo: 'Bennett County Health',
      closureRequirement: 'HbA1c lab completed',
      notes: 'Pre-diabetes monitoring',
    },
    {
      id: 'mg-6',
      patientId: 'MARIA_SD_001',
      measureId: 'TRANSPORT',
      measureName: 'Transportation Barrier Resolution',
      program: 'Social',
      status: 'In Progress',
      daysOpen: 38,
      assignedTo: 'Sarah Johnson',
      closureRequirement: 'Reliable transportation established',
      notes: '47 miles to Winner Regional Healthcare',
    },
    // ... rest of Maria's gaps
  ];

  it('should NOT generate random SDoH needs', () => {
    const result = generateComprehensiveCarePlan({
      patient: mariaPatient,
      hccSuspects: [],
      careGaps: mariaCareGaps,
      alerts: [],
    });

    // All SDoH needs should match care gaps
    result.clinicalSummary.needs.forEach(need => {
      const matchesGap = mariaCareGaps.some(gap => 
        need.toLowerCase().includes(gap.measureName.toLowerCase())
      );
      expect(matchesGap).toBe(true);
    });
  });

  it('should NOT include fake provider names', () => {
    const result = generateComprehensiveCarePlan({
      patient: mariaPatient,
      hccSuspects: [],
      careGaps: mariaCareGaps,
      alerts: [],
    });

    const fakeNames = [
      'Dr. James Whitfield',
      'Dr. Emily Chen',
      'Dr. Michael Rodriguez',
      'Angela Torres, NP',
    ];

    result.careTeam.forEach(member => {
      expect(fakeNames).not.toContain(member.name);
    });
  });

  it('should use patient\'s actual PCP', () => {
    const result = generateComprehensiveCarePlan({
      patient: mariaPatient,
      hccSuspects: [],
      careGaps: mariaCareGaps,
      alerts: [],
    });

    const pcp = result.careTeam.find(m => m.role === 'Primary Care Physician');
    expect(pcp?.name).toBe('Bennett County Health');
  });

  it('should NOT include autism screening for Sophia', () => {
    const result = generateComprehensiveCarePlan({
      patient: mariaPatient,
      hccSuspects: [],
      careGaps: mariaCareGaps,
      alerts: [],
    });

    result.goals.forEach(goal => {
      expect(goal.description.toLowerCase()).not.toContain('autism');
      expect(goal.description.toLowerCase()).not.toContain('developmental delay');
    });
  });

  it('should NOT include eye exam for pre-diabetic Maria', () => {
    const result = generateComprehensiveCarePlan({
      patient: mariaPatient,
      hccSuspects: [],
      careGaps: mariaCareGaps,
      alerts: [],
    });

    result.goals.forEach(goal => {
      expect(goal.description.toLowerCase()).not.toContain('eye exam');
      expect(goal.description.toLowerCase()).not.toContain('retinal');
    });

    result.referralsCreated.forEach(referral => {
      expect(referral.specialistType).not.toBe('Ophthalmology');
    });
  });

  it('should prioritize barrier removal goals first', () => {
    const result = generateComprehensiveCarePlan({
      patient: mariaPatient,
      hccSuspects: [],
      careGaps: mariaCareGaps,
      alerts: [],
    });

    // First goals should be barrier-related
    const firstGoal = result.goals[0];
    expect(
      firstGoal.description.toLowerCase().includes('transportation') ||
      firstGoal.description.toLowerCase().includes('childcare') ||
      firstGoal.notes?.includes('KEYSTONE')
    ).toBe(true);
  });

  it('should include contextual summary', () => {
    const result = generateComprehensiveCarePlan({
      patient: mariaPatient,
      hccSuspects: [],
      careGaps: mariaCareGaps,
      alerts: [],
    });

    expect(result.contextualSummary).toBeDefined();
    expect(result.contextualSummary.length).toBeGreaterThan(0);
    expect(result.contextualSummary).toContain('Maria Redhawk');
  });
});
```

**Task 8.2: Run tests**
```bash
cd RHTP_Code_Base
npm test -- carePlanGenerator.test.ts
```

**Validation:**
- [ ] All tests pass
- [ ] No hallucinations detected
- [ ] Coverage > 80%

---

#### Day 15-16: Integration Testing

**Task 9.1: Test with Maria's full data**

Create test script: `RHTP_Code_Base/scripts/test-maria-careplan.ts`

```typescript
import { generateComprehensiveCarePlan } from '../src/lib/services/carePlanGenerator';
import { getPatientById } from '../src/lib/patientRegistry';

// Get Maria's full data from registry
const maria = getPatientById('MARIA_SD_001');

if (!maria) {
  console.error('Maria not found in registry');
  process.exit(1);
}

console.log('Generating care plan for Maria Redhawk...\n');

const carePlan = generateComprehensiveCarePlan({
  patient: maria,
  hccSuspects: [], // Add from registry if available
  careGaps: maria.careGaps || [],
  alerts: [],
});

console.log('=== CARE PLAN GENERATED ===\n');
console.log('Title:', carePlan.title);
console.log('\nContextual Summary:');
console.log(carePlan.contextualSummary);
console.log('\nGoals:', carePlan.goals.length);
carePlan.goals.forEach((goal, i) => {
  console.log(`  ${i + 1}. ${goal.description}`);
});
console.log('\nInterventions:', carePlan.interventions.length);
console.log('\nCare Team:', carePlan.careTeam.length);
carePlan.careTeam.forEach((member, i) => {
  console.log(`  ${i + 1}. ${member.name} (${member.role})`);
});
console.log('\nReferrals:', carePlan.referralsCreated.length);
carePlan.referralsCreated.forEach((ref, i) => {
  console.log(`  ${i + 1}. ${ref.specialistType}`);
});

console.log('\n=== VALIDATION CHECKS ===\n');

// Check for hallucinations
const fakeNames = ['Whitfield', 'Chen', 'Rodriguez', 'Torres'];
const hasFakeNames = carePlan.careTeam.some(m => 
  fakeNames.some(fake => m.name.includes(fake))
);
console.log('✓ No fake provider names:', !hasFakeNames ? 'PASS' : 'FAIL');

const hasTCOC = JSON.stringify(carePlan).includes('TCOC');
console.log('✓ No TCOC references:', !hasTCOC ? 'PASS' : 'FAIL');

const hasAutism = JSON.stringify(carePlan).toLowerCase().includes('autism');
console.log('✓ No autism hallucination:', !hasAutism ? 'PASS' : 'FAIL');

const hasEyeExam = carePlan.goals.some(g => 
  g.description.toLowerCase().includes('eye exam') ||
  g.description.toLowerCase().includes('retinal')
);
console.log('✓ No eye exam hallucination:', !hasEyeExam ? 'PASS' : 'FAIL');

const hasBarrierGoals = carePlan.goals.some(g => 
  g.description.toLowerCase().includes('transportation') ||
  g.description.toLowerCase().includes('childcare')
);
console.log('✓ Includes barrier goals:', hasBarrierGoals ? 'PASS' : 'FAIL');

console.log('\n=== TEST COMPLETE ===\n');
```

**Task 9.2: Run integration test**
```bash
cd RHTP_Code_Base
npx tsx scripts/test-maria-careplan.ts
```

**Validation:**
- [ ] All validation checks pass
- [ ] Care plan looks correct
- [ ] No hallucinations present

---

#### Day 17: User Acceptance Testing

**Task 10.1: Create UAT checklist**

Document: `RHTP_UAT_Checklist.md`

```markdown
# RHTP CarePlan UAT Checklist

## Test Scenario 1: Maria Redhawk Care Plan Generation

### Setup
1. [ ] Log into RHTP system
2. [ ] Navigate to Maria Redhawk's patient record (MARIA_SD_001)
3. [ ] Click "Generate Care Plan"

### Validation Checks

#### Care Team (NO HALLUCINATIONS)
- [ ] Primary Care Provider shows "Bennett County Health" (NOT "Dr. James Whitfield")
- [ ] Care Manager shows "Sarah Johnson" (NOT "Angela Torres, NP")
- [ ] NO fake specialist names (Chen, Rodriguez, Lee, etc.)
- [ ] Organization is "Bennett County Health (CAH)" (NOT "TCOC")
- [ ] Phone numbers use (605) area code or "See patient record"

#### Clinical Goals (NO HALLUCINATIONS)
- [ ] HbA1c Lab goal present (Maria's actual gap)
- [ ] Edinburgh PND Screening goal present (Maria's actual gap)
- [ ] Well-Child visit for Sophia present (Maria's actual gap)
- [ ] NO autism screening goal (Sophia doesn't have this)
- [ ] NO eye exam goal (Maria is pre-diabetic, not diabetic)
- [ ] NO retinal screening goal (not in Maria's gaps)

#### Social Needs (NO RANDOM GENERATION)
- [ ] Transportation barrier goal present (documented gap)
- [ ] Childcare subsidy goal present (documented gap)
- [ ] WIC re-enrollment goal present (documented gap)
- [ ] LIHEAP goal present (documented gap)
- [ ] NO random "medication cost concerns" (unless documented)
- [ ] NO random "transportation assistance" (unless documented)

#### Contextual Awareness
- [ ] Contextual summary mentions Maria's barriers
- [ ] Transportation identified as PRIMARY BLOCKER
- [ ] Caregiver burden mentioned (2 children + mother)
- [ ] Barrier goals appear FIRST in goal list
- [ ] Barrier goals marked as "KEYSTONE" or high priority

#### Appointment Bundling
- [ ] Bundling intervention present for Maria's HbA1c + Sophia's well-child
- [ ] Rationale explains benefit (reduces travel burden)
- [ ] Single trip strategy mentioned

#### Referrals (REAL ONLY)
- [ ] SD Medicaid NEMT referral present (real program)
- [ ] Bennett County Action CBO referral present (real organization)
- [ ] Postpartum Support Group referral present (existing referral)
- [ ] SD DSS referrals present (WIC, Childcare, LIHEAP)
- [ ] NO ophthalmology referral (not needed)
- [ ] NO fake specialist referrals

### Pass Criteria
- [ ] ALL validation checks pass
- [ ] NO hallucinations detected
- [ ] Care plan is contextually appropriate
- [ ] Barriers are prioritized
- [ ] All data matches patient record

## Test Scenario 2: Other Patients

Repeat above checks for:
- [ ] Dorothy Simmons (PAT-0042)
- [ ] James Wilson (if available)
- [ ] At least 2 other patients

### Pass Criteria
- [ ] NO hallucinations for any patient
- [ ] Each care plan is patient-specific
- [ ] Barriers are identified and prioritized
- [ ] All referrals are appropriate

## Sign-Off

Tester: ________________  Date: ________

Product Owner: ________________  Date: ________

Technical Lead: ________________  Date: ________
```

**Task 10.2: Conduct UAT with stakeholders**
- [ ] Schedule UAT session
- [ ] Walk through checklist with users
- [ ] Document any issues found
- [ ] Get sign-off

---

## 📊 Success Metrics

### Code Quality Metrics
- [ ] Unit test coverage > 80%
- [ ] All tests passing
- [ ] No linting errors
- [ ] No TypeScript errors

### Functional Metrics
- [ ] 0 hallucinations detected in test cases
- [ ] 100% of care plans validated successfully
- [ ] Barrier goals appear first in 100% of cases
- [ ] Contextual summaries present in 100% of care plans

### User Acceptance Metrics
- [ ] UAT checklist 100% complete
- [ ] Stakeholder sign-off obtained
- [ ] No critical issues reported
- [ ] User satisfaction > 4/5

---

## 🚀 Deployment Plan

### Pre-Deployment
- [ ] All tests passing
- [ ] UAT complete and signed off
- [ ] Code review complete
- [ ] Documentation updated

### Deployment Steps
1. [ ] Create feature branch: `feature/remove-careplan-hallucinations`
2. [ ] Commit all changes with descriptive messages
3. [ ] Push to remote repository
4. [ ] Create pull request with detailed description
5. [ ] Request code review from 2+ team members
6. [ ] Address review comments
7. [ ] Merge to main branch
8. [ ] Deploy to staging environment
9. [ ] Run smoke tests in staging
10. [ ] Deploy to production
11. [ ] Monitor for errors
12. [ ] Verify in production with Maria's data

### Post-Deployment
- [ ] Monitor error logs for 48 hours
- [ ] Verify no hallucinations in production
- [ ] Collect user feedback
- [ ] Document lessons learned

---

## 📝 Rollback Plan

If critical issues are discovered:

1. **Immediate Actions**
   - [ ] Revert to previous version
   - [ ] Notify stakeholders
   - [ ] Document issue

2. **Investigation**
   - [ ] Identify root cause
   - [ ] Create fix
   - [ ] Test fix thoroughly

3. **Re-deployment**
   - [ ] Apply fix
   - [ ] Re-run all tests
   - [ ] Re-deploy with monitoring

---

## 📚 Documentation Updates

### Files to Update
- [ ] `README.md` - Add section on care plan generation
- [ ] `CHANGELOG.md` - Document changes
- [ ] API documentation - Update care plan endpoints
- [ ] User guide - Update care plan generation instructions

### Training Materials
- [ ] Create training video on new care plan features
- [ ] Update user manual
- [ ] Create quick reference guide
- [ ] Schedule training sessions for users

---

## 🎯 Timeline Summary

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Critical Hallucination Removal | 5 days | Day 1 | Day 5 |
| Phase 2: Contextual Awareness Enhancement | 7 days | Day 6 | Day 12 |
| Phase 3: Testing & Validation | 5 days | Day 13 | Day 17 |
| **Total** | **17 days** | **Day 1** | **Day 17** |

**Target Completion:** 3 weeks from start date

---

## ✅ Final Checklist

Before marking this project complete:

- [ ] All code changes implemented
- [ ] All tests passing (unit + integration)
- [ ] UAT complete and signed off
- [ ] Documentation updated
- [ ] Deployed to production
- [ ] No hallucinations detected in production
- [ ] User training complete
- [ ] Stakeholder approval obtained

---

**Implementation Plan Created:** June 21, 2026  
**Created By:** Bob (AI Software Engineer)  
**Status:** Ready for Execution  
**Priority:** CRITICAL - Required for RHTP Adoption