# Maria Redhawk Data Inconsistencies Report
## CDP & Agentic Automation Screens vs. PowerPoint Documentation

**Date:** June 19, 2026  
**Reviewer:** Bob (AI Assistant)  
**Source Documents:**
- PowerPoint: `Maria_Redhawk_Comprehensive_Summary.pptx`
- Application Screens: CDP Assembly, Signal Disposition Engine, Agent Coalition Monitor, Whole Person Care Summary

---

## CRITICAL INCONSISTENCIES

### 1. **Elena's Age - MAJOR ERROR**
- **PowerPoint (Correct):** Elena Redhawk is **infant** (newborn)
- **CDP Assembly Screen (Line 42):** "Elena Redhawk (**58y**)"
- **Impact:** This is a critical data error. Elena is Maria's infant daughter, not a 58-year-old. This appears throughout the system.
- **Location:** `cdp-assembly/page.tsx` line 42

### 2. **Elena's Medications - INCORRECT ATTRIBUTION**
- **PowerPoint:** No mention of Elena (infant) taking Metformin or Lisinopril
- **CDP Assembly Screen (Line 38):** "Medications — Metformin · Lisinopril (**Elena**) · Amoxicillin (Sophia)"
- **Signal Disposition Screen (Line 361):** "Maria collecting Elena medications (Metformin + Lisinopril)"
- **Issue:** Metformin and Lisinopril are adult medications for pre-diabetes and hypertension. An infant would not be prescribed these. These are likely Maria's medications, not Elena's.
- **Location:** `cdp-assembly/page.tsx` line 38, `signal-disposition-engine/page.tsx` line 361

### 3. **Caregiver Relationship - REVERSED**
- **PowerPoint (Correct):** Maria is the **caregiver FOR Elena** (her mother caring for infant)
- **CDP Assembly Screen (Line 42):** "Dependents — Sophia Redhawk (24mo) · Elena Redhawk (58y)"
- **CDP Assembly Screen (Line 45):** "Caregiver Burden — Zarit 48 · 18hrs/week · no respite"
- **Issue:** The system shows Elena as a 58-year-old dependent, implying Maria is caring for an elderly person. This is backwards - Elena is Maria's infant daughter.

---

## MODERATE INCONSISTENCIES

### 4. **Care Gap Days Open - DISCREPANCY**
- **PowerPoint:** HbA1c gap open **38 days**
- **Signal Disposition Screen (Line 11):** "HbA1c Gap **45d**"
- **Signal Disposition Screen (Line 354):** "HbA1c lab gap open **38 days**"
- **Issue:** Inconsistent within the same screen (header shows 45d, detail shows 38d)
- **Location:** `signal-disposition-engine/page.tsx` lines 11, 354

### 5. **Edinburgh PND Screening Status**
- **PowerPoint:** Edinburgh PND screening **open 427 days** (entire postpartum period), Score: 11
- **CDP Assembly Screen (Line 36):** "Care Gaps — 3 clinical · 2 BH · 4 social (9 total)"
- **Signal Disposition Screen:** Edinburgh screening mentioned but not prominently featured
- **Issue:** The 427-day open gap for Edinburgh PND is a critical finding in the PowerPoint but not emphasized in screens

### 6. **Episode Status Terminology**
- **PowerPoint:** "Postpartum Health" episode, Status: **Active**, Days Active: 427 days
- **CDP Assembly Screen (Line 37):** "Episodes — Pre-Diabetic ACTIVE · Postpartum **UNMANAGED**"
- **Issue:** "UNMANAGED" vs "Active" - different terminology for same episode
- **Location:** `cdp-assembly/page.tsx` line 37

---

## MINOR INCONSISTENCIES / CLARIFICATIONS NEEDED

### 7. **Risk Score Terminology**
- **PowerPoint:** RAF Score: **2.18** (Δ +0.12)
- **Signal Disposition Screen (Line 9):** Risk: "**HIGH 7.8**"
- **Issue:** Different risk scoring systems used (RAF vs. HIGH 7.8). Need clarification on what "7.8" represents.

### 8. **PMPM Cost**
- **PowerPoint:** PMPM Cost: **$1,240**, Target: $780, Variance: +$460
- **Screens:** No PMPM cost displayed in CDP/Agentic screens
- **Issue:** Financial metrics not visible in reviewed screens

### 9. **Provider Attribution**
- **PowerPoint:** Primary Care Provider: **Bennett County Health**
- **CDP Assembly Screen (Line 39):** "Provider — Bennett County Health **CAH** · Sarah Johnson CM"
- **Issue:** CAH (Critical Access Hospital) designation correct, but Sarah Johnson is listed as Care Manager (CM), not PCP

### 10. **Transportation Distance**
- **PowerPoint:** Distance to Care: **47 miles** to Winner Regional
- **Signal Disposition Screen (Line 368):** "Transportation barrier HIGH — **47 miles** to Bennett County Health"
- **Issue:** Inconsistent facility names (Winner Regional vs. Bennett County Health)

---

## DATA ACCURACY ISSUES

### 11. **Consent Layer Status**
- **PowerPoint:** No specific consent layer breakdown mentioned
- **CDP Assembly Screen (Line 41):** "Consent — Layer 1 ACTIVE · Layer 2 ACTIVE · Layer 3 ACTIVE · Layer 4 **PENDING**"
- **CDP Assembly Screen (Line 182):** "Layer 4 (Elena caregiver): PENDING — household view partial"
- **Issue:** Layer 4 pending status related to "Elena caregiver" - but Elena is an infant, not a caregiver

### 12. **Pharmacy Pickup Pattern**
- **PowerPoint:** No mention of pharmacy pickup patterns
- **CDP Assembly Screen (Line 44):** "Pharmacy Intelligence — Martin Pharmacy **2x/month family pickup**"
- **Signal Disposition Screen (Line 361):** "Martin Pharmacy pickup pattern flagged: Maria collecting Elena medications (Metformin + Lisinopril) on **irregular cadence**"
- **Issue:** Contradictory - "2x/month" suggests regular, but "irregular cadence" suggests inconsistent

### 13. **Zarit Score Context**
- **PowerPoint:** Caregiver Burden Assessment - Status: **Open**, Days Open: 90 days, Context: "Single parent caring for 24-month-old and infant"
- **CDP Assembly Screen (Line 45):** "Caregiver Burden — Zarit **48** · 18hrs/week · no respite"
- **Signal Disposition Screen (Line 374):** "Caregiver burden Zarit 48 — moderate-high threshold. **18hrs/week informal caregiving for Elena**"
- **Issue:** The "18hrs/week caregiving for Elena" makes sense if Elena were elderly (as incorrectly shown as 58y), but not for an infant. All parents care for infants full-time.

---

## MISSING DATA ELEMENTS

### 14. **Well-Child Visit for Sophia**
- **PowerPoint:** Well-Child 24-Month Visit (Sophia) - Status: **Open**, Days Open: 21 days
- **Screens:** Not prominently featured in CDP/Agentic screens reviewed
- **Issue:** Important pediatric care gap not visible

### 15. **Social Care Gaps Detail**
- **PowerPoint:** Lists 4 specific social care gaps:
  1. Transportation Barrier Resolution (38 days open)
  2. Childcare Subsidy Enrollment (60 days open)
  3. WIC Re-enrollment (45 days open)
  4. LIHEAP Application (30 days open)
- **CDP Assembly Screen (Line 43):** "Benefits — WIC LAPSED · Childcare Subsidy ELIGIBLE_NOT_ENROLLED"
- **Issue:** Only 2 of 4 social gaps shown in CDP screen

### 16. **Housing Status**
- **PowerPoint:** Housing: Rental Assistance Waitlist, Position: **#47**
- **Screens:** Not visible in reviewed CDP/Agentic screens
- **Issue:** Important SDOH factor not displayed

---

## SUMMARY OF CRITICAL FIXES NEEDED

### **MUST FIX IMMEDIATELY:**
1. **Elena's age:** Change from 58y to "infant" or specific age in months
2. **Medication attribution:** Metformin and Lisinopril belong to Maria, not Elena (infant)
3. **Caregiver relationship:** Clarify Maria is caregiver FOR Elena (mother-infant), not the reverse
4. **Consent Layer 4:** Update description - should not reference "Elena caregiver"

### **SHOULD FIX:**
5. **Care gap days:** Standardize HbA1c gap days (38 vs 45)
6. **Episode terminology:** Align "UNMANAGED" vs "Active" status
7. **Pharmacy pickup:** Resolve "2x/month" vs "irregular cadence" contradiction
8. **Zarit caregiving hours:** Reframe context - caring for infant + toddler, not elderly person

### **NICE TO HAVE:**
9. Add PMPM cost metrics to CDP screens
10. Display all 4 social care gaps consistently
11. Show housing waitlist position
12. Feature Sophia's well-child visit gap more prominently
13. Clarify risk scoring system (RAF 2.18 vs HIGH 7.8)
14. Standardize facility names (Winner Regional vs Bennett County Health)

---

## RECOMMENDATIONS

1. **Data Validation:** Implement age validation rules - flag when infant/child ages appear as adult ages
2. **Medication Safety:** Add medication-age appropriateness checks
3. **Relationship Validation:** Ensure caregiver relationships are logically consistent with ages
4. **Cross-Screen Consistency:** Implement single source of truth for key metrics (gap days, costs, etc.)
5. **Comprehensive Gap Display:** Ensure all documented care gaps appear in relevant screens

---

**End of Report**