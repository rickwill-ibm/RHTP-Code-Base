# Closed Care Gap Loop Implementation Plan

## Executive Summary
Complete the closed care gap workflow for Maria Redhawk (demo patient) with proper navigation, attestation, evidence submission, and gap closure verification across three key screens:
1. **Specialist Inbox** - Gap closure initiation and attestation
2. **MD Smart Launch** - Care plan approval and navigation fix
3. **Care Gap Closure Verification** - Evidence display and confirmation

---

## Current State Analysis

### Issues Identified
1. **Specialist Inbox**: No mechanism to close gaps - missing attestation modal and evidence submission
2. **MD Smart Launch**: Navigation broken after care plan approval - should route to Specialist Inbox
3. **Gap Closure Verification**: Screen exists but not integrated into workflow
4. **Data Flow**: Gap closure store exists but not connected to Specialist Inbox

### Existing Infrastructure
✅ `GapClosureStoreProvider` in `patientContext.tsx` - manages gap closure state
✅ `Care Gap Closure Verification` page - displays closed gap evidence
✅ `useGapClosureStore` hook - provides gap closure methods
✅ Maria Redhawk patient data in registry

---

## Implementation Plan

### Phase 1: Specialist Inbox Gap Closure Modal
**File**: `src/app/specialist-inbox/page.tsx`

#### Changes Required:
1. **Add Gap Closure Modal Component**
   - Modal triggered by "Close Gap" button on Maria Redhawk's task
   - Form fields:
     - Date of Service (date picker)
     - Performing Provider (text input)
     - Place of Service (dropdown: Lab, Office, Hospital)
     - HbA1c Result Value (number input with validation < 15%)
     - Clinical Notes (textarea)
   - Validation:
     - All fields required
     - HbA1c value must be between 4.0 and 14.0
     - Date of service cannot be future date

2. **Add "Close Gap" Button**
   - Replace "Accept Task" button with "Close Gap" for Maria Redhawk's task
   - Only show for task ID 'st-001' (Maria's cardiology task)
   - Button style: Green with CheckCircleIcon

3. **Integrate Gap Closure Store**
   - Import `useGapClosureStore` hook
   - Call `submitClosure()` on form submission
   - Pass gap ID: 'CG_MARIA_001'
   - Include all form data in evidence object

4. **Navigation After Submission**
   - Show success toast: "Gap closed successfully"
   - Wait 1.5 seconds
   - Navigate to `/care-gap-closure-verification`
   - Pass gap ID in URL params or use store

#### Implementation Steps:
```typescript
// 1. Add state for modal
const [showGapClosureModal, setShowGapClosureModal] = useState(false);
const [gapClosureForm, setGapClosureForm] = useState({
  dateOfService: '',
  performingProvider: '',
  placeOfService: 'Lab',
  resultValue: '',
  clinicalNotes: ''
});

// 2. Import gap closure store
const { submitClosure } = useGapClosureStore();

// 3. Handle form submission
const handleSubmitGapClosure = () => {
  // Validate form
  // Submit to store
  submitClosure({
    gapId: 'CG_MARIA_001',
    status: 'CLOSED',
    closedFrom: 'PATIENT_DETAIL',
    dateOfService: gapClosureForm.dateOfService,
    performingProvider: gapClosureForm.performingProvider,
    placeOfService: gapClosureForm.placeOfService,
    resultValue: parseFloat(gapClosureForm.resultValue),
    resultUnit: '%',
    closedAt: new Date().toISOString()
  });
  
  // Navigate to verification
  setTimeout(() => {
    router.push('/care-gap-closure-verification');
  }, 1500);
};

// 4. Replace Accept Task button for Maria
{task.id === 'st-001' && (
  <button
    onClick={() => setShowGapClosureModal(true)}
    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#24a148] text-white hover:bg-[#0e6027] transition-colors"
  >
    <Icon name="CheckCircleIcon" size={13} />
    Close Gap
  </button>
)}
```

---

### Phase 2: MD Smart Launch Navigation Fix
**File**: `src/app/md-smart-launch/page.tsx`

#### Changes Required:
1. **Fix Care Plan Approval Navigation**
   - Locate care plan "Send" button handler
   - Change navigation from broken `/specialist-portal/referrals` to `/specialist-inbox`
   - Add success message before navigation

2. **Update CarePlanPanel Component**
   - File: `src/app/md-smart-launch/components/CarePlanPanel.tsx`
   - Find "Send to Care Team" or "Approve Care Plan" button
   - Update onClick handler to navigate to specialist inbox

#### Implementation Steps:
```typescript
// In CarePlanPanel.tsx or page.tsx
const handleApproveCareplan = () => {
  // Existing approval logic
  pushAudit('careplan-approved', 'Care plan approved and sent to care team', {
    patientId: launchContext.patientId,
    practitionerId: launchContext.practitionerId
  });
  
  // Show success message
  // Navigate to specialist inbox instead of broken route
  setTimeout(() => {
    router.push('/specialist-inbox');
  }, 1500);
};
```

---

### Phase 3: Care Gap Closure Verification Integration
**File**: `src/app/care-gap-closure-verification/page.tsx`

#### Changes Required:
1. **Add Return to Specialist Inbox Button**
   - Add button in top action bar
   - Navigate back to specialist inbox
   - Show "Return to Task Queue" label

2. **Enhance Success Banner**
   - Add animation or celebration effect
   - Show gainshare amount prominently
   - Add "Share Results" button (optional)

3. **Add Print/Export Functionality**
   - Add "Export Evidence" button
   - Generate PDF of gap closure evidence
   - Include all provenance and timeline data

#### Implementation Steps:
```typescript
// Add action buttons
<div className="flex gap-2 mb-4">
  <button
    onClick={() => router.push('/specialist-inbox')}
    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-carbon-gray-20 text-carbon-gray-70 hover:bg-carbon-gray-10"
  >
    <Icon name="ArrowLeftIcon" size={14} />
    Return to Task Queue
  </button>
  <button
    onClick={handleExportEvidence}
    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#0043ce] text-white hover:bg-[#0035a8]"
  >
    <Icon name="DocumentArrowDownIcon" size={14} />
    Export Evidence
  </button>
</div>
```

---

### Phase 4: Complete Workflow Testing

#### Test Scenario: Maria Redhawk Gap Closure Loop
1. **Start**: Navigate to Specialist Inbox
2. **Select Task**: Click on Maria Redhawk's "Cardiology Evaluation — Uncontrolled Hypertension" task
3. **Close Gap**: Click "Close Gap" button
4. **Fill Form**:
   - Date of Service: 2026-06-10
   - Performing Provider: Bennett County Health PCP
   - Place of Service: Lab
   - HbA1c Result: 6.8%
   - Clinical Notes: "HbA1c test completed. Result shows good control."
5. **Submit**: Click "Submit Evidence"
6. **Verify Navigation**: Should navigate to Care Gap Closure Verification screen
7. **Verify Data**: All evidence should display correctly
8. **Return**: Click "Return to Task Queue" to go back to Specialist Inbox

#### Alternative Flow: MD Smart Launch
1. **Start**: Navigate to MD Smart Launch (simulate SMART on FHIR launch)
2. **Review Patient**: View Maria Redhawk's summary
3. **Create Care Plan**: Navigate to Care Plan tab
4. **Approve**: Click "Send to Care Team" or "Approve Care Plan"
5. **Verify Navigation**: Should navigate to Specialist Inbox (not broken route)
6. **Continue**: Follow gap closure flow from Specialist Inbox

---

## Data Flow Diagram

```
┌─────────────────────┐
│  Specialist Inbox   │
│  (Maria's Task)     │
└──────────┬──────────┘
           │
           │ Click "Close Gap"
           ▼
┌─────────────────────┐
│  Gap Closure Modal  │
│  - Date of Service  │
│  - Provider         │
│  - Place of Service │
│  - HbA1c Result     │
│  - Clinical Notes   │
└──────────┬──────────┘
           │
           │ Submit Evidence
           ▼
┌─────────────────────┐
│ GapClosureStore     │
│ submitClosure()     │
│ - gapId: CG_MARIA_001│
│ - status: CLOSED    │
│ - evidence data     │
└──────────┬──────────┘
           │
           │ Navigate
           ▼
┌─────────────────────┐
│ Gap Closure         │
│ Verification Screen │
│ - Evidence Display  │
│ - Provenance        │
│ - Timeline          │
│ - Gainshare: $8,100 │
└─────────────────────┘
```

---

## Alternative Entry Point: MD Smart Launch

```
┌─────────────────────┐
│  MD Smart Launch    │
│  (Care Plan Tab)    │
└──────────┬──────────┘
           │
           │ Approve Care Plan
           ▼
┌─────────────────────┐
│  Specialist Inbox   │
│  (Maria's Task)     │
└──────────┬──────────┘
           │
           │ Continue gap closure flow...
           ▼
```

---

## Technical Implementation Details

### Gap Closure Modal Component Structure
```typescript
interface GapClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  patientName: string;
  gapId: string;
  onSubmit: (evidence: GapClosureEvidence) => void;
}

const GapClosureModal: React.FC<GapClosureModalProps> = ({
  isOpen,
  onClose,
  taskId,
  patientName,
  gapId,
  onSubmit
}) => {
  // Form state and validation
  // Submit handler
  // Return modal JSX
};
```

### Form Validation Rules
```typescript
const validateGapClosureForm = (form: GapClosureForm): string[] => {
  const errors: string[] = [];
  
  if (!form.dateOfService) errors.push('Date of service is required');
  if (new Date(form.dateOfService) > new Date()) errors.push('Date cannot be in the future');
  if (!form.performingProvider) errors.push('Performing provider is required');
  if (!form.placeOfService) errors.push('Place of service is required');
  if (!form.resultValue) errors.push('HbA1c result is required');
  
  const result = parseFloat(form.resultValue);
  if (isNaN(result) || result < 4.0 || result > 14.0) {
    errors.push('HbA1c result must be between 4.0 and 14.0');
  }
  
  return errors;
};
```

---

## Success Criteria

### Functional Requirements
- ✅ Specialist can select Maria Redhawk's task
- ✅ "Close Gap" button visible and functional
- ✅ Gap closure modal opens with form
- ✅ Form validation works correctly
- ✅ Evidence submits to gap closure store
- ✅ Navigation to verification screen works
- ✅ Verification screen displays all evidence
- ✅ MD Smart Launch navigates to Specialist Inbox after care plan approval
- ✅ Return to Specialist Inbox button works

### User Experience Requirements
- ✅ Clear visual feedback on form submission
- ✅ Success message displays before navigation
- ✅ No broken navigation links
- ✅ Smooth transitions between screens
- ✅ Data persists across navigation
- ✅ Gainshare amount prominently displayed

### Data Integrity Requirements
- ✅ Gap closure evidence stored correctly
- ✅ HEDIS compliance calculated automatically
- ✅ Provenance chain maintained
- ✅ Timeline events recorded
- ✅ Gainshare attribution tracked

---

## Implementation Priority

### High Priority (Must Have)
1. Gap closure modal in Specialist Inbox
2. Form validation and submission
3. Navigation to verification screen
4. MD Smart Launch navigation fix

### Medium Priority (Should Have)
1. Success toast messages
2. Return to Specialist Inbox button
3. Enhanced verification screen UI

### Low Priority (Nice to Have)
1. Export evidence functionality
2. Print capability
3. Celebration animation on gap closure

---

## Files to Modify

### Primary Files
1. `src/app/specialist-inbox/page.tsx` - Add gap closure modal and button
2. `src/app/md-smart-launch/page.tsx` - Fix navigation after care plan approval
3. `src/app/md-smart-launch/components/CarePlanPanel.tsx` - Update approval handler
4. `src/app/care-gap-closure-verification/page.tsx` - Add return button

### Supporting Files
- `src/lib/patientContext.tsx` - Already has gap closure store (no changes needed)
- `src/lib/patientRegistry.ts` - Patient data (no changes needed)

---

## Testing Checklist

### Unit Tests
- [ ] Gap closure form validation
- [ ] Gap closure store submission
- [ ] Navigation handlers
- [ ] HEDIS compliance calculation

### Integration Tests
- [ ] Complete gap closure flow from Specialist Inbox
- [ ] Complete gap closure flow from MD Smart Launch
- [ ] Data persistence across navigation
- [ ] Return navigation works correctly

### User Acceptance Tests
- [ ] Demo with Maria Redhawk patient
- [ ] Verify all evidence displays correctly
- [ ] Verify gainshare calculation
- [ ] Verify provenance chain
- [ ] Verify timeline accuracy

---

## Rollout Plan

### Phase 1: Core Functionality (Day 1)
- Implement gap closure modal
- Add form validation
- Connect to gap closure store
- Test basic submission

### Phase 2: Navigation (Day 1)
- Fix MD Smart Launch navigation
- Add navigation to verification screen
- Add return button
- Test complete flow

### Phase 3: Polish (Day 2)
- Add success messages
- Enhance UI/UX
- Add export functionality
- Final testing

### Phase 4: Demo Preparation (Day 2)
- Test with Maria Redhawk patient
- Verify all data displays correctly
- Prepare demo script
- Document workflow

---

## Risk Mitigation

### Risk: Form validation errors
**Mitigation**: Comprehensive validation with clear error messages

### Risk: Navigation breaks existing flows
**Mitigation**: Test all navigation paths, use conditional routing

### Risk: Data not persisting
**Mitigation**: Use gap closure store, verify state management

### Risk: HEDIS compliance calculation incorrect
**Mitigation**: Test with multiple HbA1c values, verify < 8.0 threshold

---

## Success Metrics

### Quantitative
- Gap closure completion time < 2 minutes
- Zero navigation errors
- 100% data persistence
- Correct HEDIS compliance calculation

### Qualitative
- Intuitive user flow
- Clear visual feedback
- Professional UI/UX
- Demo-ready presentation

---

## Next Steps

1. Review and approve this plan
2. Begin Phase 1 implementation
3. Test each phase incrementally
4. Conduct end-to-end testing
5. Prepare demo script
6. Document final workflow

---

**Plan Created**: 2026-06-18
**Author**: Bob (AI Software Engineer)
**Status**: Ready for Implementation