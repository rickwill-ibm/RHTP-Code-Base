# Rural Clinical Care Replan

## Problem Identified

The initial holistic care plan was addressing the root cause (caregiver burden) but **lost sight of the primary clinical care gaps**, particularly:

1. **A1C testing gap** - Maria's diabetes is uncontrolled (A1C 9.2%), needs immediate testing
2. **Transportation practicality** - Generic "transportation services" doesn't address rural reality
3. **Distance to facilities** - LabCorp is 45 miles away in Rapid City
4. **Appointment coordination** - Need to batch appointments to minimize trips

## User Feedback

> "we're no longer addressing her clinical care gaps. How are we addressing her primary A1C gap? the transportation should be arranging her ride to the LabCorp for her bloodwork, helping her schedule her lab appointment to coincide with her transportation. don't forget this is rural health, distance to facility is a factor."

## Root Cause of the Problem

The tiered intervention system was **too abstract**. It said:
- Tier 1: "Respite care" ✓
- Tier 2: "Transportation solutions" ❌ (too vague)
- Tier 4: "Home phlebotomy for HbA1c" ❌ (not realistic in rural SD)

**What was missing:**
- Specific LabCorp scheduling
- Coordination of transportation WITH lab appointment
- Recognition that rural distance requires batching
- Clear focus on closing the A1C gap as priority

## Updated Approach

### Tier 1: Caregiver Support (UNCHANGED)
**Goal:** Establish respite care so Maria can leave home
**Actions:**
- SD Lifespan Respite Care Program
- Autism Family Support for Sophia
- Adult day care for Elena
- Caregiver support group (telehealth)

**Timeline:** Weeks 1-2

### Tier 2: Transportation + Clinical Coordination (UPDATED)
**Goal:** Coordinate transportation to LabCorp AND schedule the A1C test
**Actions:**
1. **Activate Unite Us transportation** - scheduled rides during respite care windows
2. **Schedule LabCorp appointment in Rapid City (45 miles)** - during respite care window
3. **Coordinate transportation pickup/dropoff** with lab appointment time (90 min round trip)
4. **Batch all in-person appointments** on same day as lab visit

**Key Changes:**
- ✅ Specific facility: LabCorp in Rapid City
- ✅ Specific distance: 45 miles
- ✅ Specific coordination: Transportation + Lab appointment + Respite care
- ✅ Rural strategy: Batch appointments to minimize trips

**Timeline:** Weeks 2-3

### Tier 3: Care Delivery Optimization (UNCHANGED)
**Goal:** Maximize telehealth/home visits for ongoing care
**Actions:**
- Consolidated care days
- Convert eligible appointments to telehealth (60% reduction)
- Mail-order pharmacy
- Coordinate family appointments

**Timeline:** Weeks 3-4

### Tier 4: Clinical Care (UPDATED - NOW PRIORITY)
**Goal:** Close A1C gap and other clinical gaps
**Actions:**
1. **Complete HbA1c + CMP at LabCorp** (Week 3) - PRIMARY FOCUS
2. **Telehealth follow-up to review A1C results** (Week 4)
3. **Telehealth cardiology for hypertension** (Week 5)
4. **Schedule diabetic eye exam during next LabCorp trip** (Week 6) - batch with other care
5. **Edinburgh PND screening via telehealth** (Week 4)
6. **Virtual DSME program** (Weeks 5-12)

**Key Changes:**
- ✅ A1C gap is front and center
- ✅ Practical rural solution: LabCorp visit, not "home phlebotomy"
- ✅ Follow-up plan for results
- ✅ Other gaps addressed with appropriate modalities
- ✅ Priority changed from "moderate" to "high"

**Timeline:** Weeks 3-12

### Tier 5: Sustainability (UNCHANGED)
**Goal:** Long-term support systems
**Timeline:** Ongoing

## Technical Changes Made

### 1. Updated `AccessProfile` Interface
Added rural-specific fields:
```typescript
export interface AccessProfile {
  // ... existing fields
  distanceToNearestFacility?: number; // 45 miles to LabCorp
  nearestLabLocation?: string; // "Rapid City"
}
```

### 2. Updated Maria's Context Data
```typescript
accessProfile: {
  ruralStatus: 'rural',
  distanceToProvider: 45,
  distanceToNearestFacility: 45, // LabCorp in Rapid City
  nearestLabLocation: 'Rapid City'
}
```

### 3. Updated Tier 2: Transportation Intervention
**Before:**
```typescript
{
  action: 'Coordinate Unite Us transportation with respite care schedule',
  provider: 'Unite Us',
  timeline: 'Ongoing'
}
```

**After:**
```typescript
{
  action: 'Activate Unite Us transportation for medical appointments',
  provider: 'Unite Us',
  timeline: 'Immediate'
},
{
  action: 'Schedule LabCorp appointment in Rapid City (45 miles)',
  provider: 'LabCorp',
  timeline: 'Week 2',
  expectedOutcome: 'HbA1c + CMP labs scheduled during respite care window'
},
{
  action: 'Coordinate transportation pickup/dropoff with lab appointment time',
  provider: 'Unite Us + Care Coordinator',
  timeline: 'Week 2',
  expectedOutcome: 'Round-trip transportation (90 min total) during respite hours'
},
{
  action: 'Batch all in-person appointments on same day as lab visit',
  provider: 'Care Coordination Team',
  timeline: 'Week 2'
}
```

### 4. Updated Tier 4: Clinical Care Intervention
**Before:**
```typescript
{
  action: 'Home phlebotomy for HbA1c + CMP',
  provider: 'Mobile Lab Services',
  timeline: 'Week 4'
}
```

**After:**
```typescript
{
  action: 'Complete HbA1c + Comprehensive Metabolic Panel at LabCorp',
  provider: 'LabCorp (Rapid City)',
  timeline: 'Week 3',
  expectedOutcome: 'A1C gap closed, diabetes control assessed'
},
{
  action: 'Telehealth follow-up to review A1C results and adjust medications',
  provider: 'Primary Care Provider',
  timeline: 'Week 4',
  expectedOutcome: 'Diabetes treatment plan optimized based on results'
}
```

## Care Plan Flow (Updated)

```
Week 1-2: TIER 1 - Establish Respite Care
├─ SD Lifespan Respite Care activated
├─ Autism support for Sophia arranged
├─ Adult day care for Elena scheduled
└─ Maria has 8+ hours/week free time

Week 2-3: TIER 2 - Transportation + Lab Coordination
├─ Unite Us transportation activated
├─ LabCorp appointment scheduled (Rapid City, 45 miles)
├─ Transportation coordinated with lab time
├─ Respite care active during travel
└─ All in-person appointments batched

Week 3: TIER 4 - A1C Testing (PRIMARY CLINICAL GAP)
├─ Maria travels to LabCorp (with transportation)
├─ HbA1c + CMP completed
└─ A1C gap CLOSED

Week 4: TIER 4 - Results Review + Other Gaps
├─ Telehealth PCP visit to review A1C results
├─ Medication adjustments if needed
└─ Edinburgh PND screening via telehealth

Week 5-6: TIER 4 - Additional Clinical Gaps
├─ Telehealth cardiology for hypertension
├─ Diabetic eye exam (batched with next LabCorp trip)
└─ Virtual DSME program begins

Week 3-4: TIER 3 - Care Delivery Optimization
├─ Telehealth appointments maximized
├─ Mail-order pharmacy set up
└─ Family appointments consolidated

Ongoing: TIER 5 - Sustainability
├─ Long-term respite care
├─ Ongoing transportation coordination
└─ Community support systems
```

## Success Metrics (Updated)

### Primary Clinical Outcome
- ✅ **A1C gap closed within 3 weeks** (not 4-6 weeks)
- ✅ **A1C result obtained** to guide treatment
- ✅ **Diabetes management optimized** based on results

### Transportation Coordination
- ✅ **LabCorp appointment scheduled** at specific facility
- ✅ **Transportation coordinated** with lab appointment time
- ✅ **Respite care active** during travel time (90 min round trip)
- ✅ **Zero missed appointments** due to transportation

### Rural Health Strategy
- ✅ **Distance acknowledged**: 45 miles to Rapid City
- ✅ **Appointments batched**: Minimize trips
- ✅ **Telehealth maximized**: 80% of ongoing care
- ✅ **Practical solutions**: Real facilities, not theoretical services

## Key Principles

1. **Clinical gaps are the priority** - Root cause must be addressed, but clinical care can't wait
2. **Rural distance matters** - 45 miles is not the same as 5 miles
3. **Coordination is key** - Transportation + Lab appointment + Respite care must align
4. **Batch appointments** - Every trip should accomplish multiple goals
5. **Be specific** - "LabCorp in Rapid City" not "lab services"
6. **Be practical** - Real facilities, real distances, real coordination

## Files Modified

1. ✅ `src/lib/services/holisticContextEngine.ts`
   - Added `distanceToNearestFacility` and `nearestLabLocation` to `AccessProfile`
   - Updated Maria's context with LabCorp location data

2. ✅ `src/lib/services/tieredInterventionGenerator.ts`
   - Updated Tier 2 transportation to include specific LabCorp coordination
   - Updated Tier 4 clinical care to prioritize A1C gap with practical rural solution
   - Changed Tier 4 priority from "moderate" to "high"

## Next Steps

1. ✅ Test the updated care plan generation
2. ⏳ Verify A1C gap is prominently displayed
3. ⏳ Verify transportation shows LabCorp coordination
4. ⏳ Add UI enhancements (tier badges, modality icons, etc.)

## Expected Care Plan Output

When generating Maria's care plan, providers should now see:

**Tier 1 (Critical):** Establish Respite Care
- Respite care for Sophia and Elena
- Enables Maria to leave home for appointments

**Tier 2 (High):** Coordinate Transportation for Clinical Care
- **Schedule LabCorp appointment in Rapid City (45 miles)**
- **Arrange transportation during respite care window**
- **Coordinate pickup/dropoff with lab time (90 min round trip)**
- Batch all in-person appointments on same day

**Tier 4 (High):** Close Clinical Care Gaps (A1C, Depression, Eye Exam)
- **Complete HbA1c + CMP at LabCorp (Week 3)** ← PRIMARY FOCUS
- Telehealth follow-up to review results (Week 4)
- Edinburgh PND screening via telehealth (Week 4)
- Diabetic eye exam during next LabCorp trip (Week 6)
- Virtual DSME program (Weeks 5-12)

This is now **clinically focused**, **rurally appropriate**, and **practically coordinated**.