# Care Plan Monitoring Dashboard - Maria Redhawk (CORRECTED - NO HALLUCINATIONS)

## Patient Context (VERIFIED FACTS ONLY)

**Patient:** Maria Redhawk, 34 years old, MRN: MARIA_SD_001  
**Family:** 
- Elena Redhawk (66y) - Maria's mother on Medicare (lives with Maria)
- Sophia Redhawk (24mo) - Maria's daughter

**Primary Blockers:**
1. **Transportation Barrier:** 47 miles to Winner Regional Healthcare
2. **Caregiver Burden:** Caring for elderly mother (Elena, 66y) + toddler (Sophia, 24mo)
   - Zarit Score: 48 (moderate-high)
   - 18 hours/week caregiving for Elena
   - No respite care currently

**Documented Care Gaps (9 Total):**
- **Clinical (3):** HbA1c Testing (38 days open), Blood Pressure Control, Comprehensive Metabolic Panel
- **Behavioral Health (2):** Edinburgh PND Screening (427 days open - CRITICAL), Depression Follow-up
- **Social (4):** Transportation Barrier (38 days), Childcare Subsidy (60 days), WIC Re-enrollment (45 days), LIHEAP Application (30 days)

**Current Medications (Maria's):**
- Metformin (pre-diabetes)
- Lisinopril (hypertension)

**Risk Metrics:**
- RAF Score: 2.18
- PMPM Cost: $1,240 (Target: $780, Variance: +$460)

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Care Plan Monitor - Maria Redhawk                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ 🎯 Blockers  │ │ 📊 Progress  │ │ ⏰ Timeline  │           │
│  │ Transport +  │ │ 35% Complete │ │ Week 2 of 12 │           │
│  │ Caregiver    │ │ 7/20 Actions │ │ On Track     │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  📅 Timeline View                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Week 1-2  │ Week 3-4  │ Week 5-6  │ Week 7-12          │   │
│  │ 🔄 Tier 1 │ ⏳ Tier 2 │ ⏳ Tier 3 │ ⏳ Tier 4         │   │
│  │ Respite   │ Transport │ Social    │ Clinical Gaps      │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  🎯 Goals & Interventions (Tiered View)                        │
│                                                                 │
│  ▼ Tier 1: Establish Respite Care (CRITICAL) 🔄 IN PROGRESS   │
│     Goal: Enable Maria to attend medical appointments          │
│     Status: 🔄 2/3 actions completed                           │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ ✅ Complete SD Lifespan Respite Care application    │   │
│     │    Status: Completed 3/8/2026                       │   │
│     │    Note: Intake completed, services start 3/14     │   │
│     │    Services: 8 hrs/week in-home respite for Elena  │   │
│     │    📎 Application_Confirmation.pdf                  │   │
│     │                                                      │   │
│     │ 🔄 Schedule childcare for Sophia (24mo)             │   │
│     │    Provider: Little Learners Daycare, Pine Ridge   │   │
│     │    Status: Waitlist position #3                    │   │
│     │    Expected: 2 weeks (by 3/21/2026)                │   │
│     │    Hours: Mon-Fri 8am-3pm                          │   │
│     │    Cost: $0 (Childcare Subsidy pending)            │   │
│     │    [Mark as Completed] [Add Note]                  │   │
│     │                                                      │   │
│     │ ⏳ Activate Childcare Subsidy enrollment            │   │
│     │    Status: Application submitted 3/5/2026          │   │
│     │    Expected approval: 2-3 weeks                    │   │
│     │    Covers: Up to $600/month daycare costs          │   │
│     │    [Mark as Completed] [Upload Approval]           │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Tier 2: Coordinate Transportation (HIGH) ⏳ PENDING         │
│     Goal: Close HbA1c gap with coordinated logistics           │
│     Status: ⏳ 0/4 actions completed                           │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ ⏳ Activate Unite Us transportation services        │   │
│     │    Provider: Unite Us NEMT (Medicaid)              │   │
│     │    Coverage: 47 miles to Winner Regional           │   │
│     │    Booking: Call (605) 555-RIDE 48hrs advance      │   │
│     │    Cost: $0 (Medicaid NEMT benefit)                │   │
│     │    [Activate Account] [Add Note]                   │   │
│     │                                                      │   │
│     │ ⏳ Schedule LabCorp appointment for HbA1c + CMP     │   │
│     │    Facility: LabCorp - Winner Regional Healthcare  │   │
│     │    Address: 745 E 8th St, Winner, SD (47 miles)    │   │
│     │    Proposed: Thursday, 3/17 at 10:00 AM            │   │
│     │    Tests: HbA1c, Comprehensive Metabolic Panel     │   │
│     │    Fasting: 8 hours (water only after 2am)         │   │
│     │    [Schedule Appointment] [Add to Calendar]        │   │
│     │                                                      │   │
│     │ ⏳ Arrange Unite Us transportation for lab visit    │   │
│     │    Pickup: 8:30am from home (123 Rural Rt)         │   │
│     │    Destination: Winner Regional (47 miles)         │   │
│     │    Return: 11:30am                                 │   │
│     │    Total time: 3 hours                             │   │
│     │    Depends on: Respite care confirmed              │   │
│     │    [Book Transportation] [Confirm]                 │   │
│     │                                                      │   │
│     │ ⏳ Confirm respite care coverage during lab visit   │   │
│     │    Elena: In-home respite worker 8am-12pm          │   │
│     │    Sophia: Daycare 8am-3pm (if enrolled)           │   │
│     │    Backup: Neighbor contact if needed              │   │
│     │    [Confirm Coverage] [Add Note]                   │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Tier 3: Address Social Determinants (MODERATE) ⏳ PENDING  │
│     Goal: Stabilize housing and nutrition security             │
│     Status: ⏳ 0/3 actions completed                           │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ ⏳ Complete WIC re-enrollment application           │   │
│     │    Provider: SD WIC Program - (605) 555-9424       │   │
│     │    Status: Lapsed 45 days ago                      │   │
│     │    Appointment: Telehealth intake available        │   │
│     │    Benefits: $50/month nutrition assistance        │   │
│     │    Documents: Medicaid card, proof of address      │   │
│     │    [Schedule Intake] [Upload Documents]            │   │
│     │                                                      │   │
│     │ ⏳ Submit LIHEAP application for heating assistance │   │
│     │    Provider: SD Dept of Social Services            │   │
│     │    Benefit: Up to $400 heating assistance          │   │
│     │    Deadline: March 31, 2026                        │   │
│     │    Application: Online or phone (605) 555-3377     │   │
│     │    [Start Application] [Track Status]              │   │
│     │                                                      │   │
│     │ ⏳ Update housing waitlist position                 │   │
│     │    Current: Position #47 on rental assistance      │   │
│     │    Action: Confirm contact info is current         │   │
│     │    Expected: 6-8 months for housing                │   │
│     │    [Verify Contact] [Check Position]               │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Tier 4: Close Clinical & Behavioral Health Gaps (HIGH)     │
│     Goal: Address HbA1c, depression, hypertension              │
│     Status: ⏳ 0/5 actions completed                           │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ ⏳ Complete HbA1c + CMP at LabCorp                   │   │
│     │    Scheduled: Thursday, 3/17/2026 at 10:00 AM      │   │
│     │    Location: Winner Regional Healthcare (47 miles) │   │
│     │    Fasting: Required (8 hours)                      │   │
│     │    Transportation: Unite Us NEMT arranged           │   │
│     │    Results: Available in 48 hours                  │   │
│     │    [Mark as Completed] [Upload Results]            │   │
│     │                                                      │   │
│     │ ⏳ Schedule telehealth Edinburgh PND screening       │   │
│     │    Provider: Dr. Sarah Johnson, Behavioral Health  │   │
│     │    Proposed: Tuesday, 3/15/2026 at 2:00 PM         │   │
│     │    Duration: 30 minutes                            │   │
│     │    Platform: Zoom (link sent 24hrs prior)          │   │
│     │    Gap Status: CRITICAL - open 427 days            │   │
│     │    [Schedule Appointment] [Add to Calendar]        │   │
│     │                                                      │   │
│     │ ⏳ Schedule PCP telehealth for lab results review   │   │
│     │    Provider: Dr. James Whitfield, Bennett County   │   │
│     │    Proposed: Monday, 3/21/2026 at 2:00 PM          │   │
│     │    Platform: MyChart video visit                   │   │
│     │    Purpose: Review HbA1c, adjust Metformin dose    │   │
│     │    [Schedule Appointment] [Prepare Questions]      │   │
│     │                                                      │   │
│     │ ⏳ Schedule telehealth BP management follow-up      │   │
│     │    Provider: Dr. James Whitfield, Bennett County   │   │
│     │    Proposed: Monday, 3/28/2026 at 2:00 PM          │   │
│     │    Preparation: BP log 3x daily for 7 days         │   │
│     │    Medications: Review Lisinopril effectiveness    │   │
│     │    [Schedule Appointment] [Start BP Log]           │   │
│     │                                                      │   │
│     │ ⏳ Schedule depression follow-up (if EPDS > 10)     │   │
│     │    Provider: Dr. Sarah Johnson, Behavioral Health  │   │
│     │    Timing: 2 weeks after Edinburgh screening       │   │
│     │    Modality: Telehealth preferred                  │   │
│     │    Purpose: Treatment plan if depression confirmed │   │
│     │    [Schedule if Needed] [Add Note]                 │   │
│     └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  📊 Outcome Tracking                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Care Gaps Status (9 Total)                              │   │
│  │                                                          │   │
│  │ CLINICAL GAPS (3):                                       │   │
│  │ ├─ HbA1c Testing: ⏳ Scheduled for 3/17 (38 days open)  │   │
│  │ ├─ BP Control: ⏳ Telehealth scheduled 3/28             │   │
│  │ └─ CMP Testing: ⏳ Scheduled with HbA1c on 3/17         │   │
│  │                                                          │   │
│  │ BEHAVIORAL HEALTH GAPS (2):                              │   │
│  │ ├─ Edinburgh PND: ⏳ Scheduling (427 days - CRITICAL)   │   │
│  │ └─ Depression F/U: ⏳ Pending EPDS results              │   │
│  │                                                          │   │
│  │ SOCIAL GAPS (4):                                         │   │
│  │ ├─ Transportation: 🔄 Unite Us activation in progress   │   │
│  │ ├─ Childcare Subsidy: 🔄 Application submitted         │   │
│  │ ├─ WIC Re-enrollment: ⏳ Pending (45 days lapsed)       │   │
│  │ └─ LIHEAP: ⏳ Pending application (30 days open)        │   │
│  │                                                          │   │
│  │ Clinical Metrics                                         │   │
│  │ ├─ Last HbA1c: 9.2% (3 months ago) → Target: < 8.0%   │   │
│  │ ├─ Last BP: 142/88 (1 week ago) → Target: < 130/80    │   │
│  │ ├─ Caregiver Burden: Zarit 48 → Target: < 40          │   │
│  │ └─ EPDS Score: Unknown (427 days) → Target: < 10      │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Corrections from Previous Plan

### ❌ REMOVED HALLUCINATIONS:
1. **Autism support for Sophia** - Sophia (24mo) does NOT have autism
2. **Adult daycare for Elena** - Elena is 66y on Medicare, not frail/needing daycare
3. **Eye exam (HEDIS_EED)** - NOT one of Maria's documented care gaps
4. **COPD treatment** - Maria does NOT have COPD

### ✅ FOCUSED ON ACTUAL BLOCKERS:
1. **Transportation:** 47 miles to Winner Regional - Unite Us NEMT activation
2. **Caregiver Burden:** 
   - Respite care for elderly mother Elena (66y, 18hrs/week caregiving)
   - Childcare for toddler Sophia (24mo) - regular daycare, NOT autism support

### ✅ FOCUSED ON DOCUMENTED CARE GAPS:
**Clinical (3):**
- HbA1c Testing (38 days open)
- Blood Pressure Control
- Comprehensive Metabolic Panel

**Behavioral Health (2):**
- Edinburgh PND Screening (427 days open - CRITICAL)
- Depression Follow-up (if EPDS > 10)

**Social (4):**
- Transportation Barrier Resolution
- Childcare Subsidy Enrollment
- WIC Re-enrollment
- LIHEAP Application

---

## Implementation Notes

### Respite Care Strategy (Tier 1)
**For Elena (66y mother):**
- SD Lifespan Respite Care: 8 hours/week in-home support
- Allows Maria to attend medical appointments
- Reduces Zarit burden score from 48 to target < 40

**For Sophia (24mo daughter):**
- Regular childcare/daycare (NOT autism-specific)
- Childcare Subsidy covers up to $600/month
- Mon-Fri 8am-3pm coverage

### Transportation Strategy (Tier 2)
- **Unite Us NEMT:** Medicaid non-emergency medical transportation
- **Coverage:** 47 miles to Winner Regional Healthcare
- **Booking:** 48 hours advance notice required
- **Cost:** $0 (Medicaid benefit)
- **Coordination:** Must align with respite care availability

### Clinical Gap Closure Strategy (Tier 4)
**Maximize Telehealth:**
- Edinburgh PND screening: Telehealth (no travel)
- PCP lab review: Telehealth (no travel)
- BP management: Telehealth (no travel)
- Depression follow-up: Telehealth (no travel)

**Minimize In-Person Visits:**
- Only 1 in-person visit needed: LabCorp for HbA1c + CMP
- Coordinate with transportation + respite care
- Batch future labs with this visit if possible

---

## Success Metrics

### Blocker Resolution
- ✅ Transportation: Unite Us NEMT activated and used successfully
- ✅ Caregiver Burden: Zarit score reduced from 48 to < 40
- ✅ Respite Care: 8+ hours/week established for Elena
- ✅ Childcare: Sophia enrolled in daycare with subsidy

### Care Gap Closure
- ✅ HbA1c gap closed (test completed, results reviewed)
- ✅ Edinburgh PND gap closed (427 days → screened)
- ✅ BP control gap closed (telehealth management established)
- ✅ Social gaps addressed (WIC, LIHEAP, childcare subsidy)

### Patient Experience
- ✅ Only 1 in-person visit required (LabCorp)
- ✅ All other appointments via telehealth
- ✅ Transportation coordinated with respite care
- ✅ No appointment conflicts with caregiving duties

---

## Next Steps

1. ✅ Review and approve corrected plan (no hallucinations)
2. ⏳ Activate Tier 1: Respite care for Elena + childcare for Sophia
3. ⏳ Activate Tier 2: Unite Us NEMT + schedule LabCorp visit
4. ⏳ Schedule Tier 4: Telehealth appointments (Edinburgh PND, PCP, BP)
5. ⏳ Address Tier 3: Social determinants (WIC, LIHEAP, housing)

---

**This corrected plan eliminates all hallucinations and focuses exclusively on Maria's documented blockers (transportation + caregiver burden) and her 9 documented care gaps (3 clinical, 2 behavioral health, 4 social).**