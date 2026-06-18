# Actionable Care Plan Replan

## Problem Identified

The care plan is **too abstract** and **not actionable enough**.

### Current State (TOO VAGUE)
**Goal 3:** "Minimize Appointment Burden Through Smart Scheduling"
- ❌ "Convert eligible appointments to telehealth"
- ❌ "Arrange home-based lab services"
- ❌ "Set up mail-order pharmacy"

**Problem:** These are aspirational goals, not concrete actions. No one can execute "convert appointments to telehealth" - it's too vague.

### Desired State (ACTIONABLE)
**Goal 3:** "Schedule Specific Telehealth and Home Services"
- ✅ "Schedule telehealth appointment for Edinburgh PND screening - Tuesday 3/15 at 2pm"
- ✅ "Order LabCorp home A1C test kit - ships within 3 business days"
- ✅ "Schedule LabCorp in-person visit for HbA1c + CMP - Thursday 3/17 at 10am (during respite care)"
- ✅ "Transfer prescriptions to CVS mail-order pharmacy - 90-day supply"

## User Feedback

> "We're prioritizing now but not acting enough. For example for Goal 3 we say convert all eligible appointments to telehealth. Rather than making that a goal of an intervention, this should be an action. We should see new telehealth appointment scheduling for her post-partum depression screening, home lab kit."

## Key Principles for Actionable Care Plans

### 1. **Be Specific**
- ❌ "Telehealth appointment"
- ✅ "Telehealth appointment for Edinburgh PND screening"

### 2. **Include Dates/Times**
- ❌ "Week 4"
- ✅ "Tuesday, March 15, 2026 at 2:00 PM"

### 3. **Name the Provider/Facility**
- ❌ "Lab services"
- ✅ "LabCorp at 1234 Main St, Rapid City, SD"

### 4. **Include Logistics**
- ❌ "Transportation"
- ✅ "Unite Us transportation pickup at 9:15am, return by 11:30am"

### 5. **Make it Executable**
- ❌ "Convert appointments to telehealth"
- ✅ "Call scheduler at (555) 123-4567 to convert 3/20 cardiology appointment to telehealth"

## Specific Examples for Maria

### Example 1: Edinburgh PND Screening (Depression Gap)

**Current (Vague):**
```
Action: "Edinburgh Postnatal Depression Scale via telehealth"
Provider: "Behavioral Health"
Timeline: "Week 4"
```

**Improved (Actionable):**
```
Action: "Schedule telehealth appointment for Edinburgh PND screening"
Provider: "Dr. Sarah Johnson, Behavioral Health"
Scheduled Date: "Tuesday, March 15, 2026 at 2:00 PM"
Duration: "30 minutes"
Platform: "Zoom link will be sent 24 hours prior"
Expected Outcome: "Depression screening completed, support plan if score > 10"
Status: "Pending - awaiting patient confirmation"
```

### Example 2: A1C Testing (Primary Clinical Gap)

**Current (Vague):**
```
Action: "Complete HbA1c + Comprehensive Metabolic Panel at LabCorp"
Provider: "LabCorp (Rapid City)"
Timeline: "Week 3"
```

**Improved (Actionable):**
```
Action: "Schedule LabCorp appointment for HbA1c + CMP blood draw"
Provider: "LabCorp - 1234 Medical Plaza Dr, Rapid City, SD 57701"
Scheduled Date: "Thursday, March 10, 2026 at 10:00 AM"
Fasting Required: "Yes - 8 hours (water only after 2am)"
Transportation: "Unite Us pickup at 9:15am from home, return by 11:30am"
Respite Care: "Sophia with Autism Support worker 9am-12pm, Elena at adult day care"
Expected Outcome: "A1C result available within 48 hours, PCP review on 3/12"
Status: "Confirmed - appointment booked, transportation arranged"
```

### Example 3: Home Lab Kit (Alternative Option)

**Current (Missing):**
```
No home lab kit option mentioned
```

**Improved (Actionable):**
```
Action: "Order LabCorp Pixel home A1C test kit"
Provider: "LabCorp Pixel by Labcorp"
Order Date: "Monday, March 7, 2026"
Delivery: "Ships within 3 business days to home address"
Instructions: "Kit includes lancet, collection card, prepaid return envelope"
Collection: "Patient collects sample at home, mails back same day"
Results: "Available in 3-5 days after lab receives sample"
Cost: "$0 copay with Medicaid"
Expected Outcome: "A1C result without travel burden"
Status: "Alternative to in-person visit if respite care unavailable"
```

### Example 4: Telehealth Cardiology (Hypertension)

**Current (Vague):**
```
Action: "Telehealth cardiology consultation for hypertension management"
Provider: "Cardiologist"
Timeline: "Week 5"
```

**Improved (Actionable):**
```
Action: "Schedule telehealth cardiology follow-up for BP management"
Provider: "Dr. Michael Chen, Cardiology - TCOC Health"
Scheduled Date: "Monday, March 21, 2026 at 3:00 PM"
Duration: "20 minutes"
Platform: "MyChart video visit"
Preparation: "Take BP readings 3x daily for 7 days prior (log provided)"
Medications to Review: "Lisinopril 10mg, Metoprolol 25mg"
Expected Outcome: "BP medication adjustment if readings > 130/80"
Status: "Pending - patient to confirm availability"
```

### Example 5: Respite Care Activation (Tier 1)

**Current (Vague):**
```
Action: "Refer to South Dakota Lifespan Respite Care Program"
Provider: "SD Department of Social Services"
Timeline: "Immediate"
```

**Improved (Actionable):**
```
Action: "Complete SD Lifespan Respite Care application and schedule intake"
Provider: "SD Lifespan Respite Care - (605) 555-1234"
Application Deadline: "Friday, March 4, 2026"
Intake Appointment: "Tuesday, March 8, 2026 at 10:00 AM (telehealth)"
Documents Needed: "Medicaid card, proof of address, dependent medical records"
Services Requested: "8 hours/week in-home respite for Sophia (autism) and Elena (frail)"
Expected Start Date: "Week of March 14, 2026"
Expected Outcome: "Maria has 8+ hours/week free for medical appointments"
Status: "In Progress - care coordinator assisting with application"
```

## Implementation Strategy

### Phase 1: Update Tiered Intervention Generator
Modify `tieredInterventionGenerator.ts` to generate **specific, actionable** interventions:

1. **Include specific dates** - Calculate actual dates, not just "Week 3"
2. **Include specific providers** - Real names/facilities when possible
3. **Include logistics** - Transportation times, fasting requirements, etc.
4. **Include preparation steps** - What patient needs to do beforehand
5. **Include expected outcomes** - What success looks like
6. **Include status tracking** - Pending, Confirmed, Completed

### Phase 2: Add Scheduling Intelligence
For each action, determine:
- **Best time slot** based on respite care availability
- **Coordination needs** - Does this require transportation? Respite care?
- **Dependencies** - What must happen first?
- **Alternatives** - Home kit vs in-person? Telehealth vs office visit?

### Phase 3: Create Action Templates
Build templates for common actions:
- `scheduleLabAppointment(facility, tests, date, time, transportation)`
- `scheduleTelehealthVisit(provider, reason, date, time, platform)`
- `orderHomeTestKit(type, vendor, deliveryAddress)`
- `arrangeTransportation(pickup, destination, returnTime)`
- `activateRespiteCare(hours, schedule, dependents)`

## Expected Output

When Maria's care plan is generated, providers should see:

### Tier 1: Establish Respite Care
**Goal:** Enable Maria to attend medical appointments

**Actions:**
1. ✅ **Complete SD Lifespan Respite Care application**
   - Deadline: Friday, March 4, 2026
   - Intake: Tuesday, March 8 at 10am (telehealth)
   - Documents: Medicaid card, proof of address, medical records
   - Expected start: Week of March 14

2. ✅ **Schedule Autism Family Support for Sophia**
   - Provider: Autism Speaks SD - (605) 555-2345
   - Service: In-home support 2x/week (Mon/Wed 9am-12pm)
   - Start date: Monday, March 14, 2026
   - Cost: $0 (Medicaid waiver)

3. ✅ **Arrange adult day care for Elena**
   - Provider: Senior Services SD - (605) 555-3456
   - Service: 3 days/week (Tue/Thu/Fri 8am-3pm)
   - Start date: Tuesday, March 15, 2026
   - Cost: $0 (Medicaid)

### Tier 2: Coordinate Transportation + Lab Visit
**Goal:** Close A1C gap with coordinated logistics

**Actions:**
1. ✅ **Schedule LabCorp appointment for HbA1c + CMP**
   - Facility: LabCorp - 1234 Medical Plaza, Rapid City (45 miles)
   - Date: Thursday, March 17, 2026 at 10:00 AM
   - Fasting: 8 hours (water only after 2am)
   - Tests: HbA1c, Comprehensive Metabolic Panel
   - Results: Available in 48 hours

2. ✅ **Arrange Unite Us transportation**
   - Pickup: 9:15am from home (123 Rural Route, Pine Ridge)
   - Destination: LabCorp Rapid City
   - Return: 11:30am
   - Total time: 2 hours 15 minutes
   - Cost: $0 (Medicaid NEMT)

3. ✅ **Confirm respite care during travel**
   - Sophia: Autism support worker 9am-12pm
   - Elena: Adult day care 8am-3pm
   - Backup: Neighbor contact if needed

4. ✅ **Schedule PCP telehealth follow-up for results**
   - Provider: Dr. James Whitfield
   - Date: Monday, March 21, 2026 at 2:00 PM
   - Platform: MyChart video visit
   - Purpose: Review A1C, adjust diabetes medications

### Tier 4: Address Other Clinical Gaps
**Goal:** Close remaining quality gaps with minimal burden

**Actions:**
1. ✅ **Schedule telehealth Edinburgh PND screening**
   - Provider: Dr. Sarah Johnson, Behavioral Health
   - Date: Tuesday, March 15, 2026 at 2:00 PM
   - Duration: 30 minutes
   - Platform: Zoom (link sent 24hrs prior)
   - Outcome: Depression screening, support plan if needed

2. ✅ **Schedule telehealth cardiology for hypertension**
   - Provider: Dr. Michael Chen, Cardiology
   - Date: Monday, March 21, 2026 at 3:00 PM
   - Preparation: BP log 3x daily for 7 days
   - Medications to review: Lisinopril, Metoprolol

3. ✅ **Schedule diabetic eye exam (batch with next LabCorp trip)**
   - Provider: Dr. Lisa Park, Ophthalmology (same building as LabCorp)
   - Date: Thursday, April 14, 2026 at 11:00 AM
   - Transportation: Same Unite Us ride as quarterly labs
   - Dilation: Yes - bring sunglasses

## Success Metrics

### Actionability Score
- ✅ Every action has a specific date/time
- ✅ Every action has a named provider/facility
- ✅ Every action includes logistics (transportation, respite care, etc.)
- ✅ Every action has clear expected outcome
- ✅ Every action can be executed without additional clarification

### Patient Experience
- ✅ Maria knows exactly what to do and when
- ✅ All logistics are coordinated (transportation + respite care)
- ✅ No surprises (fasting requirements, preparation steps clear)
- ✅ Minimal burden (telehealth maximized, trips batched)

### Provider Experience
- ✅ Care coordinator can execute plan immediately
- ✅ No need to "figure out" vague instructions
- ✅ All appointments can be booked in one session
- ✅ Dependencies and timing are clear

## Next Steps

1. ✅ Update `tieredInterventionGenerator.ts` to generate specific, actionable interventions
2. ⏳ Add date calculation logic (convert "Week 3" to actual dates)
3. ⏳ Add provider/facility details for each action type
4. ⏳ Add logistics coordination (transportation + respite care timing)
5. ⏳ Test with Maria's care plan generation
6. ⏳ Verify all actions are executable without clarification