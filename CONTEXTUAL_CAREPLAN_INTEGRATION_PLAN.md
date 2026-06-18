# Contextual Care Plan Integration Plan

## Problem Identified

The holistic context-aware services were created but **NOT INTEGRATED** into the actual care plan generation flow. The UI is still using the old `generateComprehensiveCarePlan()` which produces generic, non-contextual plans.

**Evidence from Screenshot**:
- Goal 2: Edinburgh PND Screening → "Appointment" (generic, not contextual)
- Goal 6: Transportation barrier listed as regular goal (should be ROOT CAUSE, Tier 1)
- No indication of caregiver burden being the primary blocker
- No tiered intervention strategy visible
- No adaptation to Maria's reality

## Root Cause of Integration Failure

The new `generateHolisticCarePlan()` function exists but is **never called**. The care plan generation UI components are still calling the old function.

---

## Integration Plan

### Phase 1: Wire Up Holistic Care Plan Generation

#### Step 1.1: Find Where Care Plans Are Generated
Need to locate all places where `generateComprehensiveCarePlan()` is called and replace with `generateHolisticCarePlan()`.

**Files to Check**:
- `src/app/md-smart-launch/components/MdSmartSummaryScreen.tsx` (likely location)
- `src/app/patient-detail/components/CarePlanForm.tsx` (if exists)
- Any other care plan generation triggers

#### Step 1.2: Update Care Plan Generation Calls
Replace:
```typescript
const carePlan = generateComprehensiveCarePlan(input);
```

With:
```typescript
const carePlan = generateHolisticCarePlan(input);
```

#### Step 1.3: Handle Maria-Specific Logic
Add logic to use holistic plan for Maria, fallback to standard for others:
```typescript
const carePlan = patient.id === 'patient-001' || patient.name.includes('Maria')
  ? generateHolisticCarePlan(input)
  : generateComprehensiveCarePlan(input);
```

---

### Phase 2: Display Root Cause Analysis

#### Step 2.1: Add Root Cause Banner
At the TOP of the care plan, before goals, show:

```tsx
{carePlan.rootCauseInsight && (
  <div className="bg-[#fff1f1] border-l-4 border-l-[#da1e28] px-5 py-4 mb-6">
    <div className="flex items-start gap-3">
      <svg className="w-6 h-6 text-[#da1e28] flex-shrink-0 mt-0.5">
        {/* Warning icon */}
      </svg>
      <div>
        <h3 className="text-sm font-bold text-[#da1e28] mb-2">
          🎯 Root Cause Identified: Caregiver Burden
        </h3>
        <p className="text-xs text-carbon-gray-70 mb-3">
          {carePlan.rootCauseInsight}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 border border-carbon-gray-20">
            <p className="text-2xs text-carbon-gray-50 mb-1">Caregiver Burden Score</p>
            <p className="text-xl font-bold text-[#da1e28]">85/100</p>
            <p className="text-2xs text-carbon-gray-50">CRITICAL</p>
          </div>
          <div className="bg-white p-3 border border-carbon-gray-20">
            <p className="text-2xs text-carbon-gray-50 mb-1">Success Probability</p>
            <p className="text-xl font-bold text-[#0f62fe]">85%</p>
            <p className="text-2xs text-carbon-gray-50">With intervention</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-[#d0e2ff] border border-[#97c1ff]">
          <p className="text-xs font-semibold text-[#0043ce] mb-1">
            ✓ Care plan adapted to address root cause first
          </p>
          <p className="text-xs text-carbon-gray-70">
            Tier 1 interventions focus on respite care and caregiver support.
            Clinical care gaps will be addressed once foundation is established.
          </p>
        </div>
      </div>
    </div>
  </div>
)}
```

#### Step 2.2: Add Tier Badges to Goals
Each goal should show its tier and priority:

```tsx
<div className="flex items-center gap-2 mb-2">
  <span className={`px-2 py-1 text-xs font-semibold rounded ${
    goal.tier === 1 ? 'bg-[#da1e28] text-white' :
    goal.tier === 2 ? 'bg-[#ff832b] text-white' :
    goal.tier === 3 ? 'bg-[#f1c21b] text-gray-900' :
    'bg-[#0f62fe] text-white'
  }`}>
    Tier {goal.tier}
  </span>
  {goal.tier === 1 && (
    <span className="px-2 py-1 text-xs font-semibold bg-[#fff1f1] text-[#da1e28] border border-[#da1e28] rounded">
      ⚠️ CRITICAL - Must complete first
    </span>
  )}
</div>
```

---

### Phase 3: Show Contextual Interventions

#### Step 3.1: Display Modality for Each Intervention
Show HOW the intervention will be delivered:

```tsx
<div className="flex items-center gap-2 text-xs text-carbon-gray-70">
  <span className={`px-2 py-0.5 rounded ${
    intervention.modality === 'telehealth' ? 'bg-[#d0e2ff] text-[#0043ce]' :
    intervention.modality === 'home-visit' ? 'bg-[#d2f4ea] text-[#0e6027]' :
    intervention.modality === 'phone' ? 'bg-[#e5f6ff] text-[#0043ce]' :
    'bg-carbon-gray-10 text-carbon-gray-70'
  }`}>
    {intervention.modality === 'telehealth' && '📹 Telehealth'}
    {intervention.modality === 'home-visit' && '🏠 Home Visit'}
    {intervention.modality === 'phone' && '📞 Phone'}
    {intervention.modality === 'in-person' && '🏥 In-Person'}
  </span>
  <span className="text-2xs">
    Burden: {intervention.burdenScore}/100
  </span>
</div>
```

#### Step 3.2: Show Rationale for Adaptation
Explain WHY this modality was chosen:

```tsx
{intervention.adaptationReason && (
  <div className="mt-2 p-2 bg-[#e5f6ff] border-l-2 border-[#0f62fe]">
    <p className="text-2xs text-carbon-gray-70">
      <span className="font-semibold">Why this approach:</span> {intervention.adaptationReason}
    </p>
  </div>
)}
```

---

### Phase 4: Reorder Goals by Tier

#### Step 4.1: Sort Goals by Tier and Priority
```typescript
const sortedGoals = [...goals].sort((a, b) => {
  // Tier 1 (root cause) always first
  if (a.tier !== b.tier) return a.tier - b.tier;
  
  // Within same tier, sort by priority
  const priorityOrder = { critical: 1, high: 2, moderate: 3, low: 4 };
  return priorityOrder[a.priority] - priorityOrder[b.priority];
});
```

#### Step 4.2: Group Goals by Tier
Display goals in clear tier sections:

```tsx
<div className="space-y-6">
  {/* Tier 1: Root Cause */}
  <div className="border-l-4 border-l-[#da1e28] pl-4">
    <h3 className="text-sm font-bold text-[#da1e28] mb-3">
      Tier 1: Address Root Cause (CRITICAL)
    </h3>
    <p className="text-xs text-carbon-gray-70 mb-4">
      These interventions MUST be completed first. All other tiers depend on this foundation.
    </p>
    {tier1Goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
  </div>

  {/* Tier 2: Secondary Barriers */}
  <div className="border-l-4 border-l-[#ff832b] pl-4">
    <h3 className="text-sm font-bold text-[#ff832b] mb-3">
      Tier 2: Address Secondary Barriers
    </h3>
    <p className="text-xs text-carbon-gray-70 mb-4">
      Depends on: Tier 1 completion
    </p>
    {tier2Goals.map(goal => <GoalCard key={goal.id} goal={goal} />)}
  </div>

  {/* Tier 3-5: Continue pattern */}
</div>
```

---

### Phase 5: Update Goal Descriptions to Be Contextual

#### Current (Generic):
```
Goal 2: Edinburgh PND Screening
Intervention: Appointment
```

#### Should Be (Contextual):
```
Goal 2: Address Maternal Mental Health (Tier 4)
Rationale: Maria shows signs of caregiver stress and social isolation. 
          Screening needed once respite care is established.
Intervention: Telehealth screening (evening hours, after Sophia's bedtime)
Modality: 📹 Telehealth
Burden: 10/100 (Very Low)
Why: Telehealth allows Maria to complete screening from home without 
     needing childcare or transportation.
```

---

### Phase 6: Show Dependency Chain

#### Step 6.1: Add "Depends On" Indicators
```tsx
{goal.dependsOn && goal.dependsOn.length > 0 && (
  <div className="mt-2 p-2 bg-[#f4f4f4] border border-carbon-gray-20">
    <p className="text-2xs text-carbon-gray-70">
      <span className="font-semibold">⚠️ Depends on:</span>
    </p>
    <ul className="mt-1 space-y-1">
      {goal.dependsOn.map(dep => (
        <li key={dep} className="text-2xs text-carbon-gray-70 ml-4">
          • {dep}
        </li>
      ))}
    </ul>
  </div>
)}
```

#### Step 6.2: Show "Enables" Indicators
```tsx
{goal.enablesOtherInterventions && (
  <div className="mt-2 p-2 bg-[#d2f4ea] border border-[#24a148]">
    <p className="text-2xs text-[#0e6027]">
      <span className="font-semibold">✓ Enables:</span> All Tier 2-5 interventions
    </p>
  </div>
)}
```

---

### Phase 7: Add Timeline Visualization

#### Step 7.1: Show Expected Timeline
```tsx
<div className="mt-6 p-4 bg-white border border-carbon-gray-20">
  <h3 className="text-sm font-bold mb-3">Expected Timeline</h3>
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-carbon-gray-70">Weeks 1-2</div>
      <div className="flex-1 h-2 bg-[#da1e28] rounded"></div>
      <div className="text-xs text-carbon-gray-70">Tier 1: Respite Care</div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-carbon-gray-70">Weeks 2-3</div>
      <div className="flex-1 h-2 bg-[#ff832b] rounded"></div>
      <div className="text-xs text-carbon-gray-70">Tier 2: Transportation</div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-carbon-gray-70">Weeks 3-4</div>
      <div className="flex-1 h-2 bg-[#f1c21b] rounded"></div>
      <div className="text-xs text-carbon-gray-70">Tier 3: Care Optimization</div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-carbon-gray-70">Weeks 4-12</div>
      <div className="flex-1 h-2 bg-[#0f62fe] rounded"></div>
      <div className="text-xs text-carbon-gray-70">Tier 4: Clinical Care</div>
    </div>
  </div>
</div>
```

---

## Implementation Checklist

### Backend Integration
- [ ] Find where `generateComprehensiveCarePlan()` is called
- [ ] Replace with `generateHolisticCarePlan()` for Maria
- [ ] Test that holistic plan is generated
- [ ] Verify root cause analysis is included

### UI Updates
- [ ] Add root cause banner at top of care plan
- [ ] Add tier badges to each goal
- [ ] Reorder goals by tier (1-5)
- [ ] Group goals into tier sections
- [ ] Show modality for each intervention
- [ ] Display burden scores
- [ ] Add adaptation rationale
- [ ] Show dependency indicators
- [ ] Add timeline visualization

### Content Updates
- [ ] Rewrite goal descriptions to be contextual
- [ ] Add "why this approach" explanations
- [ ] Show caregiver burden score
- [ ] Display success probability
- [ ] Highlight that Tier 1 must come first

### Testing
- [ ] Generate care plan for Maria
- [ ] Verify Tier 1 shows respite care as CRITICAL
- [ ] Verify transportation is Tier 2 (not standalone goal)
- [ ] Verify clinical interventions are Tier 4 (not immediate)
- [ ] Verify all interventions show appropriate modality
- [ ] Verify root cause banner displays correctly

---

## Expected Result

### Before (Current - Generic)
```
Goal 1: Document diabetes
Goal 2: Edinburgh PND Screening → Appointment
Goal 3: Close HbA1c gap
Goal 4: Blood pressure control
Goal 5: Eye exam
Goal 6: Address transportation barrier
```
**Problem**: No context, no prioritization, no adaptation

### After (Contextual)
```
🎯 ROOT CAUSE: Caregiver Burden (85/100 - CRITICAL)
Maria cannot attend appointments because she cares for Sophia (8, autism) 
and Elena (68, frail) with no respite care. Success probability: 15% → 85%

═══════════════════════════════════════════════════════════

TIER 1: ADDRESS ROOT CAUSE (CRITICAL) ⚠️
Must complete before other interventions

Goal 1: Establish Respite Care and Caregiver Support
├─ Refer to SD Lifespan Respite Care (4-8 hrs/week)
├─ Connect with Autism Family Support for Sophia
├─ Arrange adult day care for Elena
└─ Enroll in caregiver support group
Burden: 20/100 (Low) | Enables: All Tier 2-5 interventions

═══════════════════════════════════════════════════════════

TIER 2: TRANSPORTATION (Depends on Tier 1)

Goal 2: Caregiver-Friendly Transportation
├─ Coordinate Unite Us with respite care schedule
└─ Arrange family-friendly transport (wheelchair + child seat)
Burden: 25/100 (Low)

═══════════════════════════════════════════════════════════

TIER 3: OPTIMIZE CARE DELIVERY (Depends on Tier 1-2)

Goal 3: Minimize Appointment Burden
├─ Consolidated care days (all appointments same day)
├─ Convert 60% to telehealth
├─ Home-based labs
└─ Mail-order pharmacy
Burden: 15/100 (Very Low) | Result: Max 1 visit/month

═══════════════════════════════════════════════════════════

TIER 4: CLINICAL CARE (Depends on Tier 1-3)

Goal 4: Close HbA1c Care Gap
└─ 🏠 Home phlebotomy for HbA1c + CMP
   Why: Home visit eliminates need for transportation and childcare
   Burden: 10/100 (Very Low)

Goal 5: Address Maternal Mental Health
└─ 📹 Telehealth Edinburgh PND screening (evening hours)
   Why: Evening telehealth allows completion after Sophia's bedtime
   Burden: 10/100 (Very Low)

Goal 6: Blood Pressure Control
└─ 📹 Telehealth cardiology follow-up
   Why: Telehealth eliminates 90-mile round trip
   Burden: 10/100 (Very Low)

Goal 7: Diabetic Eye Exam
└─ 🚐 Mobile retinal screening (comes to community)
   Why: Mobile clinic eliminates transportation barrier
   Burden: 15/100 (Very Low)
```

**Result**: Contextual, prioritized, adapted to Maria's reality

---

## Next Steps

1. **Find care plan generation call** - Locate where UI calls the generator
2. **Wire up holistic function** - Replace old function with new one
3. **Update UI components** - Add root cause banner, tier badges, modality indicators
4. **Test with Maria** - Verify contextual plan displays correctly
5. **Iterate** - Refine based on what we see

**This will make the system truly contextually aware.**