# Smart Care Plan - Barrier-Aware Intervention Plan

## Executive Summary
Transform the AI-generated care plan from generic appointment-based interventions to **intelligent, barrier-aware alternatives** that adapt to Maria Redhawk's specific circumstances, particularly her transportation barrier.

---

## Problem Statement

### Current State (Not Smart)
The AI care plan generator creates interventions like:
- "Schedule cardiology follow-up appointment"
- "Schedule diabetic eye exam"
- "Schedule nephrology consultation"
- "Schedule nutrition counseling"

### The Issue
**Maria has a documented transportation barrier**, yet the system recommends 4+ in-person appointments without considering:
- ✗ How will she get there?
- ✗ Can any of these be done remotely?
- ✗ Can we consolidate appointments?
- ✗ Should we route transportation support first?

### What's Missing
The care plan generator doesn't:
1. Check for known SDOH barriers
2. Adapt interventions based on barriers
3. Suggest alternative care delivery modalities
4. Prioritize barrier resolution
5. Consolidate appointments to reduce burden

---

## Solution: Context-Aware Care Plan Generation

### Core Principle
**"The system should know what it knows about the patient and act accordingly"**

---

## Implementation Plan

### Phase 1: Barrier Detection & Context Building

#### 1.1 Create Barrier Detection Service
**File**: `src/lib/services/barrierDetectionService.ts`

```typescript
export interface PatientBarrier {
  type: 'transportation' | 'financial' | 'language' | 'technology' | 'housing' | 'food';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  status: 'identified' | 'intervention-planned' | 'intervention-active' | 'resolved';
  identifiedDate: string;
  description: string;
  source: 'screening' | 'referral' | 'encounter' | 'claims';
  interventionStatus?: {
    provider: string;
    status: string;
    expectedResolution?: string;
  };
}

export interface PatientContext {
  barriers: PatientBarrier[];
  preferences: {
    preferredContactMethod?: 'phone' | 'text' | 'email' | 'portal';
    languagePreference?: string;
    bestTimeToContact?: string;
    technologyAccess?: {
      smartphone: boolean;
      computer: boolean;
      internet: boolean;
      videoCapable: boolean;
    };
  };
  socialSupport: {
    hasCaregiver: boolean;
    caregiverAvailability?: string;
    communitySupport?: string[];
  };
  geography: {
    ruralStatus: 'urban' | 'suburban' | 'rural' | 'frontier';
    distanceToNearestProvider?: number; // miles
    publicTransitAvailable: boolean;
  };
}

export function detectBarriers(patientId: string): PatientBarrier[] {
  // Check multiple sources:
  // 1. SDOH screening results
  // 2. Active referrals (e.g., Unite Us transportation)
  // 3. Historical appointment no-shows
  // 4. Social worker notes
  // 5. Care manager assessments
  
  const barriers: PatientBarrier[] = [];
  
  // Example: Maria Redhawk has active transportation referral
  if (patientId === 'patient-001') {
    barriers.push({
      type: 'transportation',
      severity: 'high',
      status: 'intervention-active',
      identifiedDate: '2026-04-15',
      description: 'Patient reports difficulty getting to appointments. Lives in rural area, no reliable transportation.',
      source: 'screening',
      interventionStatus: {
        provider: 'Unite Us',
        status: 'active',
        expectedResolution: '2026-06-30'
      }
    });
  }
  
  return barriers;
}

export function buildPatientContext(patientId: string): PatientContext {
  const barriers = detectBarriers(patientId);
  
  // Build comprehensive context
  return {
    barriers,
    preferences: {
      preferredContactMethod: 'phone',
      languagePreference: 'English',
      bestTimeToContact: 'morning',
      technologyAccess: {
        smartphone: true,
        computer: false,
        internet: true,
        videoCapable: true
      }
    },
    socialSupport: {
      hasCaregiver: false,
      caregiverAvailability: 'none',
      communitySupport: ['Unite Us transportation']
    },
    geography: {
      ruralStatus: 'rural',
      distanceToNearestProvider: 45,
      publicTransitAvailable: false
    }
  };
}
```

#### 1.2 Intervention Adaptation Rules
**File**: `src/lib/services/interventionAdaptationRules.ts`

```typescript
export interface InterventionAlternative {
  original: string;
  adapted: string;
  modality: 'in-person' | 'telehealth' | 'home-visit' | 'mobile-clinic' | 'mail-order' | 'phone';
  rationale: string;
  barrierAddressed: string;
  costImpact?: string;
  qualityImpact?: string;
}

export const ADAPTATION_RULES = {
  transportation: {
    // Rule 1: Convert eligible appointments to telehealth
    appointmentToTelehealth: {
      eligible: [
        'follow-up',
        'medication-review',
        'care-coordination',
        'nutrition-counseling',
        'diabetes-education',
        'mental-health',
        'care-management'
      ],
      notEligible: [
        'initial-diagnosis',
        'physical-exam',
        'lab-draw',
        'imaging',
        'procedure'
      ]
    },
    
    // Rule 2: Consolidate appointments
    consolidation: {
      strategy: 'same-day-multiple-specialists',
      rationale: 'Reduce transportation burden by scheduling multiple appointments on same day'
    },
    
    // Rule 3: Home-based alternatives
    homeServices: {
      'lab-draw': 'Mobile phlebotomy service',
      'medication-delivery': 'Mail-order pharmacy',
      'vital-monitoring': 'Remote patient monitoring',
      'physical-therapy': 'Home health PT'
    },
    
    // Rule 4: Transportation coordination
    transportationFirst: {
      priority: 'high',
      action: 'Ensure transportation intervention is active before scheduling appointments'
    }
  },
  
  technology: {
    // If patient lacks video capability
    lowTech: {
      alternatives: ['phone-only', 'text-reminders', 'mail-based']
    }
  },
  
  financial: {
    // Cost-conscious alternatives
    costReduction: {
      'brand-medication': 'generic-equivalent',
      'specialist-visit': 'pcp-with-specialist-consult',
      'in-person': 'telehealth-lower-copay'
    }
  }
};

export function adaptIntervention(
  intervention: string,
  context: PatientContext
): InterventionAlternative | null {
  // Check for transportation barrier
  const hasTransportBarrier = context.barriers.some(
    b => b.type === 'transportation' && b.severity !== 'low'
  );
  
  if (hasTransportBarrier) {
    // Example adaptations
    if (intervention.includes('cardiology follow-up')) {
      return {
        original: 'Schedule in-person cardiology follow-up appointment',
        adapted: 'Schedule telehealth cardiology follow-up via video visit',
        modality: 'telehealth',
        rationale: 'Patient has active transportation barrier. Telehealth reduces travel burden while maintaining quality of care.',
        barrierAddressed: 'transportation',
        costImpact: 'Lower copay ($10 vs $40)',
        qualityImpact: 'Equivalent for follow-up visits'
      };
    }
    
    if (intervention.includes('diabetic eye exam')) {
      return {
        original: 'Schedule diabetic eye exam at ophthalmology clinic',
        adapted: 'Coordinate mobile retinal screening van visit to patient\'s community + teleophthalmology review',
        modality: 'mobile-clinic',
        rationale: 'Patient has transportation barrier. Mobile screening brings service to patient\'s community.',
        barrierAddressed: 'transportation',
        costImpact: 'Covered by HEDIS quality program',
        qualityImpact: 'Equivalent screening quality'
      };
    }
    
    if (intervention.includes('nutrition counseling')) {
      return {
        original: 'Schedule in-person nutrition counseling',
        adapted: 'Enroll in telehealth diabetes self-management education (DSME) program',
        modality: 'telehealth',
        rationale: 'Patient has transportation barrier. Virtual DSME program provides equivalent education without travel.',
        barrierAddressed: 'transportation',
        costImpact: 'No copay (preventive service)',
        qualityImpact: 'Equivalent outcomes for DSME'
      };
    }
    
    if (intervention.includes('lab work') || intervention.includes('HbA1c')) {
      return {
        original: 'Schedule lab appointment for HbA1c test',
        adapted: 'Order mobile phlebotomy home visit for HbA1c + comprehensive metabolic panel',
        modality: 'home-visit',
        rationale: 'Patient has transportation barrier. Home phlebotomy eliminates travel requirement.',
        barrierAddressed: 'transportation',
        costImpact: 'Covered by plan (no additional cost)',
        qualityImpact: 'Equivalent lab quality'
      };
    }
  }
  
  return null;
}
```

---

### Phase 2: Enhanced Care Plan Generator

#### 2.1 Update Care Plan Generator
**File**: `src/lib/services/carePlanGenerator.ts`

**Current Function**: `generateComprehensiveCarePlan()`

**Add New Logic**:

```typescript
import { buildPatientContext, detectBarriers } from './barrierDetectionService';
import { adaptIntervention } from './interventionAdaptationRules';

export function generateComprehensiveCarePlan(input: CarePlanInput): GeneratedCarePlan {
  // STEP 1: Build patient context (NEW)
  const patientContext = buildPatientContext(input.patient.id);
  const barriers = patientContext.barriers;
  
  // STEP 2: Generate base interventions (existing logic)
  const baseInterventions = generateBaseInterventions(input);
  
  // STEP 3: Adapt interventions based on barriers (NEW)
  const adaptedInterventions = baseInterventions.map(intervention => {
    const adaptation = adaptIntervention(intervention.description, patientContext);
    
    if (adaptation) {
      return {
        ...intervention,
        description: adaptation.adapted,
        modality: adaptation.modality,
        originalDescription: adaptation.original,
        adaptationRationale: adaptation.rationale,
        barrierAddressed: adaptation.barrierAddressed,
        costImpact: adaptation.costImpact,
        qualityImpact: adaptation.qualityImpact,
        isAdapted: true
      };
    }
    
    return intervention;
  });
  
  // STEP 4: Add barrier resolution interventions (NEW)
  const barrierInterventions = generateBarrierInterventions(barriers);
  
  // STEP 5: Prioritize interventions (NEW)
  const prioritizedInterventions = prioritizeInterventions(
    [...adaptedInterventions, ...barrierInterventions],
    patientContext
  );
  
  // STEP 6: Add context-aware notes (NEW)
  const contextNotes = generateContextNotes(patientContext, adaptedInterventions);
  
  return {
    ...existingCarePlan,
    interventions: prioritizedInterventions,
    barriers: barriers,
    adaptationSummary: {
      totalInterventions: prioritizedInterventions.length,
      adaptedCount: adaptedInterventions.filter(i => i.isAdapted).length,
      barriersAddressed: barriers.map(b => b.type),
      modalityBreakdown: getModalityBreakdown(prioritizedInterventions)
    },
    contextNotes
  };
}

function generateBarrierInterventions(barriers: PatientBarrier[]): Intervention[] {
  const interventions: Intervention[] = [];
  
  barriers.forEach(barrier => {
    if (barrier.status === 'identified' || barrier.status === 'intervention-planned') {
      // Add intervention to address barrier
      interventions.push({
        id: `barrier-${barrier.type}-${Date.now()}`,
        type: 'barrier-resolution',
        description: `Address ${barrier.type} barrier: ${barrier.description}`,
        status: 'Pending',
        priority: barrier.severity === 'critical' ? 'critical' : 'high',
        dueDate: calculateDueDate(barrier.severity),
        assignedTo: getBarrierSpecialist(barrier.type),
        notes: `Priority intervention to enable other care activities`
      });
    }
  });
  
  return interventions;
}

function prioritizeInterventions(
  interventions: Intervention[],
  context: PatientContext
): Intervention[] {
  // Priority order:
  // 1. Barrier resolution (must come first)
  // 2. Critical clinical needs
  // 3. Preventive care
  // 4. Routine follow-ups
  
  return interventions.sort((a, b) => {
    const priorityOrder = {
      'barrier-resolution': 1,
      'critical': 2,
      'high': 3,
      'moderate': 4,
      'routine': 5
    };
    
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function generateContextNotes(
  context: PatientContext,
  interventions: Intervention[]
): string[] {
  const notes: string[] = [];
  
  // Transportation barrier note
  const transportBarrier = context.barriers.find(b => b.type === 'transportation');
  if (transportBarrier) {
    const adaptedCount = interventions.filter(i => i.barrierAddressed === 'transportation').length;
    notes.push(
      `⚠️ Transportation Barrier Detected: ${adaptedCount} interventions adapted to telehealth/home-based modalities to reduce travel burden. ` +
      `Transportation support via Unite Us is ${transportBarrier.interventionStatus?.status || 'pending'}.`
    );
  }
  
  // Rural geography note
  if (context.geography.ruralStatus === 'rural') {
    notes.push(
      `🏞️ Rural Patient: ${context.geography.distanceToNearestProvider} miles to nearest provider. ` +
      `Care plan prioritizes remote monitoring and consolidated appointments.`
    );
  }
  
  // Technology access note
  if (context.preferences.technologyAccess?.videoCapable) {
    notes.push(
      `📱 Technology Access: Patient has smartphone with video capability. Telehealth visits are feasible.`
    );
  }
  
  return notes;
}
```

---

### Phase 3: Smart Intervention Examples for Maria

#### Maria's Profile
- **Barriers**: Transportation (high severity, Unite Us intervention active)
- **Geography**: Rural South Dakota, 45 miles to nearest provider
- **Technology**: Has smartphone, video capable
- **Conditions**: T2DM, CKD Stage 3b, HTN, HFpEF, AFib

#### Current (Not Smart) vs. Smart Interventions

| Current Intervention | Smart Alternative | Modality | Rationale |
|---------------------|-------------------|----------|-----------|
| Schedule cardiology follow-up appointment | **Telehealth cardiology follow-up via video visit** | Telehealth | Transportation barrier + follow-up visit (no physical exam needed) |
| Schedule diabetic eye exam | **Mobile retinal screening van + teleophthalmology review** | Mobile Clinic | Transportation barrier + HEDIS requirement + mobile screening available in rural SD |
| Schedule nutrition counseling | **Enroll in virtual DSME program (6 sessions)** | Telehealth | Transportation barrier + DSME covered as preventive service |
| Schedule nephrology consultation | **Telehealth nephrology consult + home-based lab draw** | Hybrid | Transportation barrier + CKD monitoring can be done remotely |
| Order HbA1c lab test | **Mobile phlebotomy home visit for comprehensive labs** | Home Visit | Transportation barrier + consolidate all lab needs |
| Schedule medication review | **Telepharmacy medication therapy management (MTM)** | Phone | Transportation barrier + MTM can be done by phone |
| Refer to physical therapy | **Home health PT evaluation + exercise program** | Home Visit | Transportation barrier + PT can be done at home |
| Schedule annual wellness visit | **Consolidate with cardiology visit (same day, same location)** | In-Person | When patient does travel, maximize value by scheduling multiple appointments |

---

### Phase 4: UI Enhancements

#### 4.1 Show Barrier Context in Care Plan
Add a banner at the top of the generated care plan:

```typescript
{barriers.length > 0 && (
  <div className="bg-[#fff1f1] border border-[#ffb3b8] px-5 py-4 mb-4">
    <div className="flex items-start gap-3">
      <Icon name="ExclamationTriangleIcon" size={20} className="text-[#da1e28] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-[#da1e28] mb-2">
          Barriers Detected - Care Plan Adapted
        </p>
        {barriers.map(barrier => (
          <div key={barrier.type} className="mb-2">
            <p className="text-xs font-medium text-carbon-gray-100">
              {barrier.type.toUpperCase()}: {barrier.description}
            </p>
            {barrier.interventionStatus && (
              <p className="text-xs text-carbon-gray-70 mt-1">
                Intervention: {barrier.interventionStatus.provider} - {barrier.interventionStatus.status}
              </p>
            )}
          </div>
        ))}
        <p className="text-xs text-carbon-gray-70 mt-2">
          ✓ {adaptedCount} interventions adapted to address barriers
        </p>
      </div>
    </div>
  </div>
)}
```

#### 4.2 Show Adaptation Badges on Interventions

```typescript
{intervention.isAdapted && (
  <div className="mt-2 p-3 bg-[#d0e2ff] border border-[#97c1ff]">
    <div className="flex items-start gap-2">
      <Icon name="SparklesIcon" size={14} className="text-[#0043ce] flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs font-semibold text-[#0043ce] mb-1">
          Smart Adaptation Applied
        </p>
        <p className="text-xs text-carbon-gray-70">
          <span className="font-medium">Original:</span> {intervention.originalDescription}
        </p>
        <p className="text-xs text-carbon-gray-70 mt-1">
          <span className="font-medium">Adapted:</span> {intervention.description}
        </p>
        <p className="text-xs text-carbon-gray-70 mt-1">
          <span className="font-medium">Rationale:</span> {intervention.adaptationRationale}
        </p>
        <div className="flex items-center gap-3 mt-2 text-2xs">
          <span className="px-2 py-0.5 bg-white border border-[#97c1ff] text-[#0043ce]">
            {intervention.modality}
          </span>
          <span className="text-carbon-gray-50">
            Barrier: {intervention.barrierAddressed}
          </span>
          {intervention.costImpact && (
            <span className="text-[#24a148]">
              💰 {intervention.costImpact}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
)}
```

#### 4.3 Modality Summary

```typescript
<div className="bg-white border border-carbon-gray-20 px-5 py-4">
  <h3 className="text-sm font-semibold text-carbon-gray-100 mb-3">
    Care Delivery Modalities
  </h3>
  <div className="grid grid-cols-4 gap-3">
    {Object.entries(modalityBreakdown).map(([modality, count]) => (
      <div key={modality} className="text-center p-3 bg-carbon-gray-10 border border-carbon-gray-20">
        <p className="text-xl font-bold text-[#0043ce]">{count}</p>
        <p className="text-xs text-carbon-gray-70 capitalize">{modality}</p>
      </div>
    ))}
  </div>
  <p className="text-xs text-carbon-gray-50 mt-3">
    ✓ Care plan optimized for patient's transportation barrier and rural location
  </p>
</div>
```

---

### Phase 5: Implementation Priority

#### High Priority (Implement First)
1. ✅ Barrier detection service
2. ✅ Transportation barrier adaptations
3. ✅ Telehealth conversion rules
4. ✅ UI banner showing barriers
5. ✅ Adaptation badges on interventions

#### Medium Priority
1. ✅ Home-based service alternatives
2. ✅ Appointment consolidation logic
3. ✅ Mobile clinic integration
4. ✅ Cost impact calculations
5. ✅ Modality summary dashboard

#### Low Priority (Future)
1. ✅ Machine learning for adaptation rules
2. ✅ Predictive barrier detection
3. ✅ Outcome tracking by modality
4. ✅ Patient preference learning
5. ✅ Community resource integration

---

## Example: Maria's Smart Care Plan

### Before (Not Smart)
```
Interventions:
1. Schedule cardiology follow-up appointment
2. Schedule diabetic eye exam
3. Schedule nutrition counseling
4. Schedule nephrology consultation
5. Order HbA1c lab test
6. Schedule medication review

Total: 6 in-person appointments
Transportation burden: HIGH
Likelihood of completion: LOW
```

### After (Smart & Barrier-Aware)
```
⚠️ BARRIERS DETECTED
Transportation: High severity - Unite Us intervention active
Rural location: 45 miles to nearest provider

ADAPTED INTERVENTIONS:

1. [PRIORITY] Confirm Unite Us transportation support active
   Status: In Progress | Provider: Unite Us

2. Telehealth cardiology follow-up via video visit
   ✓ Adapted from in-person visit
   Modality: Telehealth | Cost: $10 copay (vs $40)
   Rationale: Transportation barrier + follow-up visit

3. Mobile retinal screening van + teleophthalmology review
   ✓ Adapted from clinic visit
   Modality: Mobile Clinic | Cost: Covered by HEDIS
   Rationale: Transportation barrier + mobile screening available

4. Virtual DSME program (6 sessions)
   ✓ Adapted from in-person counseling
   Modality: Telehealth | Cost: No copay (preventive)
   Rationale: Transportation barrier + equivalent outcomes

5. Telehealth nephrology consult + home lab draw
   ✓ Adapted from clinic visit
   Modality: Hybrid | Cost: $10 telehealth + $0 home draw
   Rationale: Transportation barrier + CKD monitoring

6. Mobile phlebotomy home visit (comprehensive labs)
   ✓ Adapted from lab appointment
   Modality: Home Visit | Cost: Covered by plan
   Rationale: Transportation barrier + consolidate all labs

7. Telepharmacy MTM session
   ✓ Adapted from in-person review
   Modality: Phone | Cost: No copay
   Rationale: Transportation barrier + phone-based MTM

SUMMARY:
Total interventions: 7
In-person visits: 0 (until transportation resolved)
Telehealth visits: 3
Home visits: 2
Mobile clinic: 1
Phone: 1

Transportation burden: MINIMIZED
Likelihood of completion: HIGH
Cost savings: $120 in copays
```

---

## Success Metrics

### Provider Experience
- ✅ Care plan shows barrier awareness
- ✅ Interventions are realistic and achievable
- ✅ Rationale is clear and documented
- ✅ Modality breakdown is visible

### Patient Experience
- ✅ Reduced travel burden
- ✅ Lower out-of-pocket costs
- ✅ Higher likelihood of completion
- ✅ Better health outcomes

### System Intelligence
- ✅ Context-aware decision making
- ✅ Barrier detection from multiple sources
- ✅ Automatic intervention adaptation
- ✅ Prioritization based on barriers

### Business Impact
- ✅ Higher care plan completion rates
- ✅ Better quality measure performance
- ✅ Reduced no-show rates
- ✅ Improved patient satisfaction
- ✅ Lower total cost of care

---

## Implementation Timeline

### Week 1: Foundation
- Create barrier detection service
- Build patient context builder
- Define adaptation rules

### Week 2: Core Logic
- Update care plan generator
- Implement intervention adaptation
- Add barrier resolution interventions

### Week 3: UI Enhancement
- Add barrier context banner
- Show adaptation badges
- Create modality summary

### Week 4: Testing & Refinement
- Test with Maria Redhawk scenario
- Validate adaptations
- Refine rules based on feedback

---

## Files to Create/Modify

### New Files
1. `src/lib/services/barrierDetectionService.ts`
2. `src/lib/services/interventionAdaptationRules.ts`
3. `src/lib/services/modalityOptimizer.ts`

### Modified Files
1. `src/lib/services/carePlanGenerator.ts` - Add barrier-aware logic
2. `src/app/patient-detail/components/CarePlanForm.tsx` - Show adaptations
3. `src/app/md-smart-launch/components/CarePlanPanel.tsx` - Display barrier context

---

## Next Steps

1. Review and approve this plan
2. Prioritize which adaptations to implement first
3. Begin with barrier detection service
4. Test with Maria Redhawk scenario
5. Iterate based on feedback

---

**Plan Created**: 2026-06-18
**Focus**: Context-aware, barrier-informed care planning
**Goal**: "The system should know what it knows and act accordingly"