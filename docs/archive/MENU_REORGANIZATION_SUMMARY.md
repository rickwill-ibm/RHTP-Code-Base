# Menu Reorganization Summary - June 19, 2026

## Overview
Complete restructuring of the left-hand navigation menu to improve organization and user experience.

---

## Phase 1: CDP & Agentic Automation Section Removal

### Changes:
- **Moved 4 items** from "CDP & Agentic Automation" to "Backup":
  - CDP Assembly
  - Journey-Aware Context
  - Whole Person Intelligence
  - Signal Disposition Engine

### Impact:
- Removed "CDP & Agentic Automation" section from main menu
- Cleaned up primary navigation by archiving legacy CDP items

---

## Phase 2: Analytics & Network Consolidation

### Changes:
1. **Executive Dashboard** moved from "Analytics & Outcomes" → "Backup"
2. **Referral Tracking** moved from "Network" → "Whole Person Care"
3. **Episodic Management Analytics** moved from "Episodes & Quality" → "Whole Person Care"

### Impact:
- Removed empty "Analytics & Outcomes" section
- Removed empty "Network" section
- Consolidated related functionality into "Whole Person Care"

---

## Phase 3: Care Team Workflows Enhancement

### Changes:
1. **Care Gap Closure** moved from "Episodes & Quality" → "Care Team Workflows"
2. **Referral Tracking** moved from "Whole Person Care" → "Care Team Workflows"

### Impact:
- Removed empty "Episodes & Quality" section
- Strengthened "Care Team Workflows" with clinical workflow items
- Better alignment of care coordination tools

---

## Phase 4: Section Renaming

### Changes:
- **"UHG-Orchestrate-Screens"** renamed to **"Agentic_Orchestrate-Screens"**
- Updated all 11 items in this section with new group name

### Impact:
- Better branding alignment
- Clearer indication of agentic automation capabilities

---

## Phase 5: Collapsible Backup Section

### Changes:
- Made "Backup" section collapsible/expandable
- Defaults to collapsed state
- Click header to toggle visibility
- Shows chevron icon (► collapsed, ▼ expanded)

### Impact:
- Cleaner menu appearance
- Reduced visual clutter
- Easy access to archived items when needed

---

## Final Menu Structure

### 1. RHTP Program (7 items)
- RHTP Overview
- Regions
- Program Networks
- Panel & Cohort
- Care Manager Attribution
- Social Needs Dashboard
- Outcomes Linkage

### 2. Care Team Workflows (7 items)
- Care Team Inbox
- Care Manager Dashboard
- CHW Workflow
- Specialist Inbox
- MD Smart Launch
- **Care Gap Closure** ⭐ (moved from Episodes & Quality)
- **Referral Tracking** ⭐ (moved from Network)

### 3. Whole Person Care (7 items)
- Whole Person Care View
- Citizen Detail
- Social Needs Screening
- Care Team Members
- Program Eligibility
- CBO Directory
- **Episodic Management Analytics** ⭐ (moved from Episodes & Quality)

### 4. Agentic_Orchestrate-Screens (11 items) 🔄 (renamed)
- One Enterprise · Five Entities
- CDP Assembly
- Journey-Aware Context
- Whole Person Care Intelligence
- Signal Disposition Engine
- Agentic Super Orchestration
- Agentic Super Agent
- Family Thread — Dependents
- Caregiver Intelligence — Elena
- Agent Impact Dashboard
- Agent Impact — Reporting
- Live Population Filter

### 5. System (4 items)
- EHR Settings
- FHIR API Tester
- Demo Onboarding
- Demo Deck (PDF)

### 6. Backup (15 items) 📁 (collapsible)
- **Executive Dashboard** ⭐ (moved from Analytics & Outcomes)
- **CDP Assembly** ⭐ (moved from CDP & Agentic Automation)
- **Journey-Aware Context** ⭐ (moved from CDP & Agentic Automation)
- **Whole Person Intelligence** ⭐ (moved from CDP & Agentic Automation)
- **Signal Disposition Engine** ⭐ (moved from CDP & Agentic Automation)
- CDP Assembly View
- Consent & Sovereignty Panel
- Household View
- Agent Coalition Monitor
- Episode Detail
- Financial Dashboard
- Provider Directory
- Referral Journey Tracker
- Submitted Referrals
- Benefit Enrollment Tracker
- Patient Episode Summary

---

## Sections Removed

The following sections were removed as they became empty:
1. ❌ **CDP & Agentic Automation** (all items moved to Backup)
2. ❌ **Analytics & Outcomes** (Executive Dashboard moved to Backup)
3. ❌ **Network** (Referral Tracking moved to Care Team Workflows)
4. ❌ **Episodes & Quality** (items distributed to Care Team Workflows and Whole Person Care)

---

## Technical Changes

### File Modified:
- `src/components/AppLayout.tsx`

### Key Code Changes:
1. Updated `group` property for 9 menu items
2. Modified `groupOrder` array (removed 4 groups)
3. Renamed group from "UHG-Orchestrate-Screens" to "Agentic_Orchestrate-Screens"
4. Added `backupCollapsed` state management
5. Implemented collapsible UI for Backup section with chevron icons

---

## Benefits

### User Experience:
- ✅ Cleaner, more organized navigation
- ✅ Reduced menu clutter (6 sections vs 10 sections)
- ✅ Better grouping of related functionality
- ✅ Collapsible backup section reduces visual noise

### Workflow Efficiency:
- ✅ Care coordination tools consolidated in Care Team Workflows
- ✅ Whole person care items logically grouped
- ✅ Legacy/archived items easily accessible but hidden by default

### Maintainability:
- ✅ Clear separation between active and archived features
- ✅ Easier to add new items to appropriate sections
- ✅ Better alignment with product strategy

---

## Implementation Date
June 19, 2026

## Status
✅ Complete - All changes implemented and tested