# Barrier-Aware Care Plan Strategy

## Problem Statement
The current care plan is generating **inefficient, barrier-ignorant interventions** that:
1. Schedule multiple in-person appointments despite known transportation barriers
2. Don't leverage available home-based and telehealth options
3. Create contradictions (recommending home lab kit in one goal, but scheduling in-person visits in another)
4. Treat referrals as appointments (Unite Us should be a referral, not an appointment)
5. Include summary notes as interventions (telehealth notes should be documentation, not actions)

## Core Principle: Barrier-First Design

**If a patient has transportation barriers, the care plan MUST prioritize:**
1. **Home-based services** (highest priority)
2. **Telehealth/Digital** (second priority)
3. **Bundled in-person visits** (only when absolutely necessary)
4. **Never** schedule multiple separate in-person appointments

## Maria's Barriers (From Patient Data)
- **Transportation:** 47 miles to Winner Regional Healthcare
- **Childcare:** Single parent with Sophia (24 months) and Elena (infant)
- **Financial:** $487/month childcare costs, on Medicaid
- **Time:** Caregiver burden score 85/100 (CRITICAL)

## Maria's Actual Care Gaps
1. **HbA1c Lab** (38 days overdue) - Pre-diabetes monitoring
2. **Edinburgh PND Screening** (427 days overdue) - Postpartum depression
3. **Well-Child Visit for Sophia** (21 days overdue) - Pediatric preventive care

## Corrected Care Plan Logic

### Goal 1: Address Transportation & Childcare Barriers (SDoH)
**Type:** Social Determinants of Health
**Priority:** CRITICAL (must be addressed first)

**Interventions:**
1. **Referral** (not appointment): Enroll in Unite Us for transportation assistance
   - Type: Referral
   - Provider: Unite Us Network
   - Timeline: Immediate
   - Expected Outcome: Access to volunteer drivers, medical transportation vouchers
   - Modality: Digital enrollment (via app/website)

2. **Referral** (not appointment): Apply for childcare assistance
   - Type: Referral
   - Provider: SD Medicaid Childcare Assistance Program
   - Timeline: Week 1
   - Expected Outcome: Reduce $487/month childcare burden
   - Modality: Online application

3. **Referral** (not appointment): Enroll in WIC program
   - Type: Referral
   - Provider: SD WIC Program
   - Timeline: Week 1
   - Expected Outcome: $320/month nutrition assistance
   - Modality: Telehealth enrollment call

**NO APPOINTMENTS** - All are referrals/enrollments that can be done remotely

---

### Goal 2: Complete Edinburgh PND Screening (Behavioral Health)
**Type:** Behavioral Health
**Priority:** CRITICAL (427 days overdue)

**Interventions:**
1. **Digital Screening** (not appointment): Complete Edinburgh PND Scale via patient portal
   - Type: Monitoring
   - Provider: Care Manager (via patient portal)
   - Timeline: Week 1
   - Expected Outcome: Complete 10-question screening (10 minutes), score calculated automatically
   - Modality: Digital (patient portal/app)
   - **NO APPOINTMENT NEEDED** - Self-administered screening

2. **Telehealth Follow-up** (conditional): If score > 10, schedule telehealth counseling
   - Type: Appointment (conditional)
   - Provider: Behavioral Health Specialist
   - Timeline: Week 2 (only if screening indicates need)
   - Expected Outcome: Develop mental health support plan
   - Modality: Telehealth (video visit)

**EFFICIENCY:** Digital screening eliminates need for appointment. Only schedule follow-up if clinically indicated.

---

### Goal 3: Complete HbA1c Lab Test (Clinical)
**Type:** Clinical Care
**Priority:** HIGH (38 days overdue)

**Interventions:**
1. **Home Lab Kit** (not appointment): Order at-home HbA1c test kit
   - Type: Procedure
   - Provider: Quest Diagnostics Home Testing
   - Timeline: Week 1
   - Expected Outcome: Mail-order kit arrives in 3-5 days, patient collects sample at home, mails back
   - Modality: Home-based
   - **NO APPOINTMENT NEEDED** - At-home finger stick test

2. **Telehealth Follow-up**: Review A1C results via video visit
   - Type: Appointment
   - Provider: Primary Care Provider
   - Timeline: Week 3 (after results available)
   - Expected Outcome: Review results, adjust pre-diabetes management plan
   - Modality: Telehealth (video visit)

**EFFICIENCY:** Home lab kit eliminates transportation barrier. Only one telehealth appointment needed.

---

### Goal 4: Complete Well-Child Visit for Sophia (Pediatric)
**Type:** Clinical Care
**Priority:** HIGH (21 days overdue)

**Interventions:**
1. **Bundled In-Person Visit** (only when necessary): Schedule well-child visit
   - Type: Appointment
   - Provider: Pediatrician at Bennett County Health
   - Timeline: Week 4 (after transportation assistance is in place)
   - Expected Outcome: Complete 24-month developmental screening, immunizations
   - Modality: In-person (required for physical exam and vaccines)
   - **BUNDLE WITH:** Any other necessary in-person care to minimize trips

**EFFICIENCY:** This is the ONLY in-person appointment. Schedule only after transportation assistance is secured (Goal 1).

---

## Summary: Barrier-Aware Care Plan

### Total Appointments Required: 2 (both telehealth) + 1 (in-person, bundled)
1. ✅ **Telehealth:** PND follow-up (conditional, only if screening indicates need)
2. ✅ **Telehealth:** A1C results review
3. ✅ **In-Person:** Well-child visit (required, but scheduled after transportation secured)

### Total Referrals: 3 (all digital/remote)
1. ✅ Unite Us transportation assistance
2. ✅ Childcare assistance application
3. ✅ WIC enrollment

### Total Digital/Home-Based: 2
1. ✅ Edinburgh PND screening (patient portal)
2. ✅ HbA1c home lab kit

### Efficiency Gains
- **Before:** 5+ in-person appointments requiring transportation, childcare
- **After:** 1 in-person appointment (only when necessary)
- **Transportation trips saved:** 4+ trips (188+ miles)
- **Childcare costs saved:** $150+ (4 appointments × $37.50/hour)
- **Time saved:** 8+ hours of travel time

---

## Implementation Changes Needed

### File: carePlanGenerator.ts

#### Function: `generateComprehensiveCarePlan()`
**Changes:**
1. Check for transportation barriers in patient data
2. If transportation barriers exist, prioritize:
   - Home-based services (lab kits, home visits)
   - Telehealth (video visits)
   - Digital tools (app-based screenings)
3. Only schedule in-person appointments when clinically required
4. Bundle all in-person appointments into single visit when possible

#### Function: `detectSDoHNeeds()`
**Changes:**
1. Return SDoH needs as **referrals**, not appointments
2. Mark modality as 'digital' or 'phone' for remote enrollment
3. Don't create appointment interventions for social services

#### Function: `generateGoalsFromGaps()`
**Changes:**
1. For behavioral health screenings: Use digital/portal-based when possible
2. For lab tests: Check if home lab kit is available
3. For follow-ups: Default to telehealth unless in-person required
4. Add logic to detect contradictions (don't recommend both home lab AND in-person lab)

---

## Intervention Type Classification

### Referral (not appointment)
- Social service enrollments (Unite Us, WIC, LIHEAP)
- Program applications (childcare assistance, housing)
- Specialist referrals (pending scheduling)
- Community resource connections

### Monitoring (not appointment)
- Digital screenings (Edinburgh PND, PHQ-9)
- Home-based measurements (BP monitoring, glucose checks)
- Patient portal questionnaires
- App-based assessments

### Appointment (only when necessary)
- Telehealth video visits (preferred)
- In-person visits (only when clinically required)
- Home visits (for homebound patients)

### Procedure (not appointment)
- Home lab kits (mail-order)
- Medication delivery
- DME delivery
- Vaccine administration (can be bundled)

---

## Care Plan Generation Algorithm

```
1. Analyze patient barriers
   - Transportation? → Prioritize home/telehealth
   - Childcare? → Minimize appointments
   - Financial? → Use covered services
   - Digital access? → Leverage patient portal

2. For each care gap:
   a. Can it be addressed digitally? → Use digital tool
   b. Can it be addressed at home? → Use home service
   c. Can it be addressed via telehealth? → Use video visit
   d. Must be in-person? → Bundle with other in-person needs

3. Generate interventions:
   - SDoH needs → Referrals (digital enrollment)
   - Behavioral screenings → Digital/portal-based
   - Lab tests → Home kits when available
   - Follow-ups → Telehealth by default
   - Physical exams → In-person (bundle all together)

4. Validate consistency:
   - No contradictions (home lab vs in-person lab)
   - No duplicate modalities for same service
   - All in-person visits bundled when possible
   - Transportation assistance secured before in-person visits
```

---

## Expected Outcome

### Before (Barrier-Ignorant)
```
Goal 1: Address SDoH
  - Intervention 1: Appointment at Unite Us office
  - Intervention 2: Appointment at WIC office

Goal 2: Depression Screening
  - Intervention 1: Appointment for Edinburgh PND

Goal 3: A1C Test
  - Intervention 1: Appointment at lab
  - Intervention 2: Appointment for results

Goal 4: Well-Child Visit
  - Intervention 1: Appointment at pediatrician

Total: 6 in-person appointments, 282 miles of travel
```

### After (Barrier-Aware)
```
Goal 1: Address SDoH
  - Intervention 1: Referral to Unite Us (digital)
  - Intervention 2: Referral to WIC (telehealth enrollment)

Goal 2: Depression Screening
  - Intervention 1: Digital screening via patient portal
  - Intervention 2: Telehealth follow-up (if needed)

Goal 3: A1C Test
  - Intervention 1: Home lab kit (mail-order)
  - Intervention 2: Telehealth results review

Goal 4: Well-Child Visit
  - Intervention 1: In-person visit (bundled, after transportation secured)

Total: 1 in-person appointment, 94 miles of travel
Savings: 5 appointments, 188 miles, $150+ childcare costs
```

---

## Next Steps

1. **Update carePlanGenerator.ts** with barrier-aware logic
2. **Update tieredInterventionGenerator.ts** with modality prioritization
3. **Add intervention type validation** (referral vs appointment vs monitoring)
4. **Add consistency checks** (no contradictions in modalities)
5. **Test with Maria's data** to verify barrier-aware plan generation

---

**Key Principle:** Every intervention should ask: "Can this be done without requiring the patient to travel?" If yes, use that modality. If no, bundle with other necessary in-person care.