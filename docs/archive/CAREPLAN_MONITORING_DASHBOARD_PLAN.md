# Care Plan Monitoring Dashboard Plan

## Problem Statement

After generating Maria's comprehensive, actionable care plan, we need a way to:
1. **View the active care plan** - See all goals, interventions, and their status
2. **Monitor progress** - Track which actions are completed, in progress, or pending
3. **Update status** - Mark interventions as completed, add notes, upload documentation
4. **See timeline** - Visualize the care plan timeline and upcoming actions
5. **Track outcomes** - Monitor if care gaps are closing, A1C improving, etc.

## Current State

### Where Care Plans Exist Now
1. **MD Smart Launch** (`/md-smart-launch`) - Generate care plan, but no monitoring
2. **Patient Detail** (`/patient-detail/[id]`) - Has care plan form, but not optimized for monitoring
3. **Care Team Inbox** (`/care-team-inbox`) - Shows tasks, but not full care plan view

### What's Missing
- ❌ No dedicated care plan monitoring view
- ❌ No progress tracking UI
- ❌ No timeline visualization
- ❌ No intervention status updates
- ❌ No outcome tracking dashboard

## Proposed Solution

### Option 1: Dedicated Care Plan Dashboard (RECOMMENDED)
Create a new route: `/care-plan-monitor/[patientId]`

**Pros:**
- Dedicated space for care plan management
- Can be optimized for monitoring workflow
- Clear separation from generation vs monitoring
- Can include rich visualizations

**Cons:**
- New route to implement
- Need navigation from other screens

### Option 2: Enhanced Patient Detail Tab
Add a "Care Plan" tab to existing patient detail page

**Pros:**
- Leverages existing patient detail infrastructure
- All patient info in one place

**Cons:**
- Patient detail page already complex
- Less room for rich monitoring features

### Option 3: Care Team Inbox Enhancement
Expand care team inbox to show full care plan

**Pros:**
- Care coordinators already use this screen
- Task-oriented workflow

**Cons:**
- Inbox is for tasks, not full care plan view
- Would clutter the inbox

## Recommended Approach: Option 1 - Dedicated Dashboard

Create `/care-plan-monitor/[patientId]` with the following sections:

---

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Care Plan Monitor - Maria Redhawk                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ 🎯 Root Cause│ │ 📊 Progress  │ │ ⏰ Timeline  │           │
│  │ Caregiver    │ │ 45% Complete │ │ Week 3 of 12 │           │
│  │ Burden       │ │ 9/20 Actions │ │ On Track     │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│  📅 Timeline View                                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Week 1-2  │ Week 3-4  │ Week 5-6  │ Week 7-12          │   │
│  │ ✅ Tier 1 │ 🔄 Tier 2 │ ⏳ Tier 4 │ ⏳ Tier 5         │   │
│  │ Respite   │ Transport │ Clinical  │ Sustainability     │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  🎯 Goals & Interventions (Tiered View)                        │
│                                                                 │
│  ▼ Tier 1: Establish Respite Care (CRITICAL) ✅ COMPLETED     │
│     Goal: Enable Maria to attend medical appointments          │
│     Status: ✅ 4/4 actions completed                           │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ ✅ Complete SD Lifespan Respite Care application    │   │
│     │    Status: Completed 3/8/2026                       │   │
│     │    Note: Intake completed, services start 3/14     │   │
│     │    📎 Application_Confirmation.pdf                  │   │
│     │                                                      │   │
│     │ ✅ Schedule Autism Family Support for Sophia        │   │
│     │    Status: Completed 3/10/2026                      │   │
│     │    Note: Mon/Wed 9am-12pm starting 3/14            │   │
│     │    📎 Autism_Support_Schedule.pdf                   │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Tier 2: Coordinate Transportation (HIGH) 🔄 IN PROGRESS    │
│     Goal: Close A1C gap with coordinated logistics             │
│     Status: 🔄 2/4 actions completed                           │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ ✅ Activate Unite Us transportation services        │   │
│     │    Status: Completed 3/5/2026                       │   │
│     │    Note: Account #12345 active, rides can be booked│   │
│     │                                                      │   │
│     │ ✅ Schedule LabCorp appointment for HbA1c + CMP     │   │
│     │    Status: Confirmed for Thursday, 3/17 at 10am    │   │
│     │    Location: LabCorp - 1234 Medical Plaza, RC      │   │
│     │    Fasting: 8 hours (water only after 2am)         │   │
│     │    📎 Lab_Appointment_Confirmation.pdf              │   │
│     │    [Mark as Completed] [Add Note] [Upload Doc]     │   │
│     │                                                      │   │
│     │ 🔄 Arrange Unite Us transportation                  │   │
│     │    Status: Scheduled for 3/17: Pickup 9:15am       │   │
│     │    Note: Confirmation #67890, driver assigned      │   │
│     │    [Mark as Completed] [Add Note]                  │   │
│     │                                                      │   │
│     │ ⏳ Confirm respite care coverage during lab visit   │   │
│     │    Status: Pending                                  │   │
│     │    Due: 3/16/2026 (1 day before lab)               │   │
│     │    [Mark as Completed] [Add Note]                  │   │
│     └─────────────────────────────────────────────────────┘   │
│                                                                 │
│  ▼ Tier 4: Close Clinical Care Gaps (HIGH) ⏳ PENDING         │
│     Goal: Address A1C, depression, hypertension gaps           │
│     Status: ⏳ 0/6 actions completed                           │
│     ┌─────────────────────────────────────────────────────┐   │
│     │ ⏳ Complete HbA1c + CMP at LabCorp                   │   │
│     │    Scheduled: Thursday, 3/17/2026 at 10:00 AM      │   │
│     │    Location: LabCorp - 1234 Medical Plaza, RC      │   │
│     │    Fasting: Required (8 hours)                      │   │
│     │    [Mark as Completed] [Upload Results]            │   │
│     │                                                      │   │
│     │ ⏳ Schedule telehealth Edinburgh PND screening       │   │
│     │    Provider: Dr. Sarah Johnson, Behavioral Health  │   │
│     │    Proposed: Tuesday, 3/15/2026 at 2:00 PM         │   │
│     │    [Schedule Appointment] [Add to Calendar]        │   │
│     └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  📊 Outcome Tracking                                            │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Care Gaps Status                                        │   │
│  │ ├─ A1C Testing (HEDIS_CDC): ⏳ Scheduled for 3/17      │   │
│  │ ├─ Depression Screening: ⏳ Pending scheduling          │   │
│  │ ├─ BP Control (HEDIS_CBP): ⏳ Pending                   │   │
│  │ └─ Eye Exam (HEDIS_EED): ⏳ Scheduled for 4/14         │   │
│  │                                                          │   │
│  │ Clinical Metrics                                         │   │
│  │ ├─ Last A1C: 9.2% (3 months ago) → Target: < 8.0%     │   │
│  │ ├─ Last BP: 142/88 (1 week ago) → Target: < 130/80    │   │
│  │ └─ Caregiver Burden: 85/100 → Target: < 60            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. **Header Summary Cards**
- Root Cause indicator (Caregiver Burden)
- Overall progress (45% complete, 9/20 actions)
- Timeline status (Week 3 of 12, On Track)

### 2. **Timeline Visualization**
- Horizontal timeline showing all tiers
- Visual indicators: ✅ Completed, 🔄 In Progress, ⏳ Pending
- Week ranges for each tier
- Click to jump to tier details

### 3. **Tiered Goals & Interventions**
- Collapsible sections for each tier
- Status badges: COMPLETED, IN PROGRESS, PENDING
- Action-level tracking with:
  - ✅ Completed actions (with completion date)
  - 🔄 In progress actions (with current status)
  - ⏳ Pending actions (with due date)
- Action buttons:
  - [Mark as Completed]
  - [Add Note]
  - [Upload Document]
  - [Schedule Appointment]
  - [Add to Calendar]

### 4. **Action Detail Cards**
Each action shows:
- **Status icon** (✅ 🔄 ⏳)
- **Action description** (specific, actionable)
- **Provider/Facility** (with address if applicable)
- **Scheduled date/time** (if applicable)
- **Special instructions** (fasting, preparation, etc.)
- **Notes** (care coordinator comments)
- **Attachments** (📎 confirmation PDFs, results, etc.)
- **Action buttons** (context-specific)

### 5. **Outcome Tracking Panel**
- **Care Gaps Status** - Which gaps are closed, in progress, pending
- **Clinical Metrics** - Latest values vs targets
- **Trend indicators** - Improving, stable, declining

---

## Technical Implementation

### Route Structure
```
/care-plan-monitor/[patientId]
```

### New Files to Create

#### 1. `src/app/care-plan-monitor/[patientId]/page.tsx`
Main dashboard page component

#### 2. `src/app/care-plan-monitor/[patientId]/components/`
- `CarePlanHeader.tsx` - Summary cards
- `CarePlanTimeline.tsx` - Timeline visualization
- `TieredGoalSection.tsx` - Collapsible tier sections
- `ActionCard.tsx` - Individual action with status
- `OutcomeTracker.tsx` - Care gaps and metrics
- `ActionStatusButton.tsx` - Mark complete, add note, etc.

#### 3. `src/lib/stores/carePlanStore.ts`
Zustand store for care plan state management
```typescript
interface CarePlanStore {
  activePlans: Map<string, CarePlan>;
  updateActionStatus: (patientId, actionId, status) => void;
  addActionNote: (patientId, actionId, note) => void;
  uploadDocument: (patientId, actionId, file) => void;
  getPatientPlan: (patientId) => CarePlan | null;
}
```

#### 4. `src/lib/services/carePlanProgressTracker.ts`
Service for calculating progress, next actions, etc.
```typescript
class CarePlanProgressTracker {
  calculateOverallProgress(plan: CarePlan): number;
  getNextActions(plan: CarePlan): Action[];
  getOverdueActions(plan: CarePlan): Action[];
  getTierProgress(plan: CarePlan, tier: number): TierProgress;
}
```

---

## Navigation Integration

### Add Links to Care Plan Monitor

#### 1. From MD Smart Launch
After generating care plan, show button:
```
[View Care Plan Monitor] → /care-plan-monitor/patient-001
```

#### 2. From Patient Detail
Add tab or button:
```
Tabs: Overview | Care Gaps | [Care Plan Monitor] | Documents
```

#### 3. From Care Team Inbox
Add link in patient row:
```
Maria Redhawk | 5 open tasks | [View Care Plan] →
```

#### 4. From Specialist Inbox
After closing gap, show:
```
Gap closed! [View Full Care Plan] →
```

---

## User Workflows

### Workflow 1: Care Coordinator Monitoring
1. Navigate to `/care-plan-monitor/patient-001`
2. See timeline: Week 3 of 12, Tier 2 in progress
3. Expand Tier 2 section
4. See LabCorp appointment scheduled for tomorrow
5. Click [Confirm respite care coverage]
6. Add note: "Confirmed with Autism Support - Sophia covered 9am-12pm"
7. Click [Mark as Completed]
8. System updates progress: 3/4 actions completed

### Workflow 2: Provider Reviewing Progress
1. Navigate to care plan monitor
2. See Outcome Tracking panel
3. Notice A1C test scheduled for 3/17
4. Click on action to see details
5. Add to calendar
6. Set reminder to review results on 3/19

### Workflow 3: Updating After Lab Visit
1. Maria completes LabCorp visit on 3/17
2. Care coordinator opens care plan monitor
3. Finds "Complete HbA1c + CMP at LabCorp" action
4. Clicks [Mark as Completed]
5. Clicks [Upload Results]
6. Uploads lab results PDF
7. System automatically:
   - Marks action complete
   - Updates progress (10/20 actions)
   - Triggers next action (PCP telehealth review)
   - Updates care gap status (A1C gap → Results pending)

### Workflow 4: Scheduling Follow-up
1. Care coordinator sees "Schedule telehealth Edinburgh PND screening"
2. Clicks [Schedule Appointment]
3. Modal opens with:
   - Provider: Dr. Sarah Johnson
   - Proposed time: Tuesday, 3/15 at 2pm
   - Platform: Zoom
4. Confirms appointment
5. System:
   - Marks action as "Scheduled"
   - Sends calendar invite to Maria
   - Updates action status
   - Adds confirmation note

---

## Data Model

### CarePlan Interface (Enhanced)
```typescript
interface CarePlan {
  id: string;
  patientId: string;
  generatedDate: string;
  status: 'active' | 'completed' | 'paused';
  rootCause: RootCauseInfo;
  tiers: TierSection[];
  overallProgress: number; // 0-100
  timeline: Timeline;
  outcomes: OutcomeTracking;
}

interface TierSection {
  tier: 1 | 2 | 3 | 4 | 5;
  title: string;
  priority: 'critical' | 'high' | 'moderate';
  status: 'completed' | 'in-progress' | 'pending';
  progress: number; // 0-100
  goals: Goal[];
}

interface Goal {
  id: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
  actions: Action[];
}

interface Action {
  id: string;
  description: string;
  provider: string;
  scheduledDate?: string;
  status: 'completed' | 'in-progress' | 'pending' | 'scheduled';
  completedDate?: string;
  notes: ActionNote[];
  attachments: Attachment[];
  instructions?: string;
  modality: 'in-person' | 'telehealth' | 'home-visit' | 'phone';
}

interface ActionNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

interface Attachment {
  id: string;
  filename: string;
  type: 'confirmation' | 'results' | 'documentation';
  uploadedDate: string;
  url: string;
}

interface OutcomeTracking {
  careGaps: CareGapStatus[];
  clinicalMetrics: ClinicalMetric[];
}

interface CareGapStatus {
  gapId: string;
  gapName: string;
  status: 'open' | 'scheduled' | 'results-pending' | 'closed';
  scheduledDate?: string;
  closedDate?: string;
  relatedActions: string[]; // Action IDs
}

interface ClinicalMetric {
  name: string;
  currentValue: string;
  targetValue: string;
  lastUpdated: string;
  trend: 'improving' | 'stable' | 'declining';
}
```

---

## Implementation Phases

### Phase 1: Basic Monitoring View (MVP)
- ✅ Create route `/care-plan-monitor/[patientId]`
- ✅ Display tiered goals and actions
- ✅ Show action status (completed, in progress, pending)
- ✅ Basic progress calculation
- ✅ Navigation from MD Smart Launch

**Estimated Time:** 4-6 hours

### Phase 2: Status Updates
- ✅ Mark actions as completed
- ✅ Add notes to actions
- ✅ Update progress automatically
- ✅ Store state in Zustand

**Estimated Time:** 3-4 hours

### Phase 3: Timeline & Visualization
- ✅ Timeline component
- ✅ Progress bars
- ✅ Summary cards
- ✅ Outcome tracking panel

**Estimated Time:** 4-5 hours

### Phase 4: Document Management
- ✅ Upload attachments
- ✅ View/download documents
- ✅ Link documents to actions

**Estimated Time:** 3-4 hours

### Phase 5: Advanced Features
- ✅ Calendar integration
- ✅ Automated reminders
- ✅ Care gap auto-closure
- ✅ Trend analysis

**Estimated Time:** 6-8 hours

---

## Success Metrics

### User Experience
- ✅ Care coordinators can see full care plan in < 5 seconds
- ✅ Updating action status takes < 10 seconds
- ✅ Finding next action takes < 3 seconds
- ✅ Overall progress is immediately visible

### Clinical Outcomes
- ✅ Care gap closure rate increases by 30%
- ✅ Appointment no-show rate decreases by 40%
- ✅ Care plan adherence increases to > 80%
- ✅ Time to close gaps decreases by 25%

### System Performance
- ✅ Page load time < 2 seconds
- ✅ Status updates persist immediately
- ✅ Real-time progress calculation
- ✅ Supports 100+ concurrent users

---

## Next Steps

1. ✅ Review and approve this plan
2. ⏳ Create Phase 1 implementation (basic monitoring view)
3. ⏳ Test with Maria's care plan
4. ⏳ Iterate based on feedback
5. ⏳ Implement Phases 2-5

## Questions to Consider

1. **Access Control:** Who can view/edit care plans? (Care coordinators, providers, patients?)
2. **Notifications:** Should we send alerts for overdue actions?
3. **Audit Trail:** Do we need to track who made what changes?
4. **Patient Portal:** Should patients see their own care plan?
5. **Integration:** Should this sync with EHR systems?

---

**This plan provides a comprehensive solution for monitoring Maria's care plan progress and can be extended to all patients in the system.**