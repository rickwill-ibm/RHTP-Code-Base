// Central Action Registry — role, state, and context guards for all 6 screens
// Every user-facing action in the platform is defined here with its full guard set.

import type { UserRole, HCCStatus, GapStatus, AlertTier, AttributionStatus } from './mockData';

// ─── Entry Context ────────────────────────────────────────────────────────────
export type EntryContext = 'cerner-launch' | 'browse';

// ─── Screen Scope ─────────────────────────────────────────────────────────────
export type ScreenScope =
  | 'contract-selection' |'panel-cohort' |'patient-detail' |'financial-dashboard' |'provider-selection' |'sign-in';

// ─── Patient Tab Scope (sub-scope within patient-detail) ──────────────────────
export type PatientTab = 'risk' | 'clinical' | 'financial' | 'attribution' | 'actions';

// ─── Action Variant ───────────────────────────────────────────────────────────
export type ActionVariant = 'primary' | 'secondary' | 'danger' | 'warning' | 'success';

// ─── Action Category ──────────────────────────────────────────────────────────
export type ActionCategory =
  | 'hcc' |'care-gap' |'utilization' |'task' |'attribution' |'financial' |'clinical' |'navigation' |'export' |'panel';

// ─── State Guard ──────────────────────────────────────────────────────────────
// Describes the data conditions under which an action is available.
export interface StateGuard {
  // HCC suspect must be in one of these statuses (if relevant)
  hccStatus?: HCCStatus[];
  // Care gap must be in one of these statuses (if relevant)
  gapStatus?: GapStatus[];
  // Attribution must be in one of these statuses (if relevant)
  attributionStatus?: AttributionStatus[];
  // Alert tier must match (if relevant)
  alertTier?: AlertTier[];
  // Patient must have open HCC suspects
  requiresOpenHCC?: boolean;
  // Patient must have open care gaps
  requiresOpenGaps?: boolean;
  // Patient must have active utilization alerts
  requiresActiveAlerts?: boolean;
  // Patient must have a confirmed attribution
  requiresConfirmedAttribution?: boolean;
  // Workflow must NOT already be in progress for this action type
  requiresWorkflowIdle?: boolean;
  // Custom predicate label (for display purposes)
  customCondition?: string;
}

// ─── Action Definition ────────────────────────────────────────────────────────
export interface ActionDefinition {
  id: string;
  label: string;
  shortLabel?: string;
  description: string;
  icon: string;
  variant: ActionVariant;
  category: ActionCategory;

  // Role guard — which roles can see/execute this action
  roles: UserRole[];

  // Context guard — which entry contexts surface this action
  contexts: EntryContext[];

  // Screen guard — which screens this action appears on
  screens: ScreenScope[];

  // Tab guard — which patient tabs surface this action (patient-detail only)
  tabs?: PatientTab[];

  // State guard — data conditions required for this action to be available
  stateGuard?: StateGuard;

  // Whether this action initiates a multi-step workflow
  initiatesWorkflow?: WorkflowType;

  // Whether this action is a step within a workflow
  workflowStep?: { workflow: WorkflowType; step: number };

  // Priority order within a panel (lower = shown first)
  priority: number;

  // Whether this action is destructive (requires confirmation)
  requiresConfirmation?: boolean;

  // Audit trail label
  auditLabel: string;
}

// ─── Workflow Types ───────────────────────────────────────────────────────────
export type WorkflowType =
  | 'hcc-confirmation' |'care-gap-closure' |'utilization-escalation' |'attribution-dispute' |'provider-referral' |'stars-payer-bonus' | 'hedis-measure-doc' | 'mips-payment-adj';

// ─── Workflow State ───────────────────────────────────────────────────────────
export type WorkflowStatus = 'idle' | 'in-progress' | 'awaiting-review' | 'completed' | 'rejected';

export interface WorkflowState {
  workflowType: WorkflowType;
  entityId: string; // patientId, hccSuspectId, gapId, etc.
  currentStep: number;
  totalSteps: number;
  status: WorkflowStatus;
  startedAt: string;
  startedBy: string;
  startedByRole: UserRole;
  lastUpdatedAt: string;
  stepHistory: WorkflowStepRecord[];
}

export interface WorkflowStepRecord {
  step: number;
  label: string;
  completedAt: string;
  completedBy: string;
  completedByRole: UserRole;
  notes?: string;
}

// ─── Workflow Definitions ─────────────────────────────────────────────────────
export interface WorkflowDefinition {
  type: WorkflowType;
  label: string;
  description: string;
  steps: WorkflowStepDefinition[];
}

export interface WorkflowStepDefinition {
  step: number;
  label: string;
  description: string;
  requiredRole: UserRole;
  actionId: string; // the action that completes this step
}

export const workflowDefinitions: Record<WorkflowType, WorkflowDefinition> = {
  'hcc-confirmation': {
    type: 'hcc-confirmation',
    label: 'HCC Confirmation',
    description: 'Multi-step workflow to confirm an HCC suspect for RAF submission',
    steps: [
      { step: 1, label: 'Surface Suspect', description: 'HCC suspect identified from EMR/Claims/HIE data', requiredRole: 'care_manager', actionId: 'act-surface-hcc' },
      { step: 2, label: 'Review Evidence', description: 'Care manager reviews supporting evidence sources', requiredRole: 'care_manager', actionId: 'act-review-hcc-evidence' },
      { step: 3, label: 'Escalate to Physician', description: 'Route suspect to assigned physician for clinical review', requiredRole: 'care_manager', actionId: 'act-escalate-hcc' },
      { step: 4, label: 'Physician Confirmation', description: 'Physician confirms or rejects the HCC suspect', requiredRole: 'physician', actionId: 'act-confirm-hcc' },
      { step: 5, label: 'Document & Submit', description: 'Document confirmed HCC and submit to payer for RAF capture', requiredRole: 'physician', actionId: 'act-submit-hcc' },
    ],
  },
  'care-gap-closure': {
    type: 'care-gap-closure',
    label: 'Care Gap Closure',
    description: 'Workflow to close a quality measure care gap',
    steps: [
      { step: 1, label: 'Assign Gap', description: 'Assign open care gap to care coordinator or provider', requiredRole: 'care_manager', actionId: 'act-assign-gap' },
      { step: 2, label: 'Initiate Outreach', description: 'Contact patient to schedule required service', requiredRole: 'care_manager', actionId: 'act-outreach-gap' },
      { step: 3, label: 'Close Gap', description: 'Document gap closure with attestation or service confirmation', requiredRole: 'care_manager', actionId: 'act-close-gap' },
    ],
  },
  'utilization-escalation': {
    type: 'utilization-escalation',
    label: 'Utilization Escalation',
    description: 'Workflow to escalate and intervene on a utilization risk alert',
    steps: [
      { step: 1, label: 'Surface Risk', description: 'Acknowledge the utilization alert and surface the risk to the care team', requiredRole: 'care_manager', actionId: 'act-acknowledge-alert' },
      { step: 2, label: 'Assign Intervention', description: 'Assign an intervention protocol and responsible care team member', requiredRole: 'care_manager', actionId: 'act-assign-intervention' },
      { step: 3, label: 'Document Outcome', description: 'Document the intervention outcome and patient response', requiredRole: 'care_manager', actionId: 'act-document-outcome' },
      { step: 4, label: 'Audit & Close', description: 'Review audit trail and close the escalation workflow', requiredRole: 'care_manager', actionId: 'act-close-escalation' },
    ],
  },
  'attribution-dispute': {
    type: 'attribution-dispute',
    label: 'Attribution Dispute',
    description: 'Workflow to dispute patient attribution with payer',
    steps: [
      { step: 1, label: 'Surface Discrepancy', description: 'Identify and document the attribution discrepancy type and clinical basis', requiredRole: 'care_manager', actionId: 'act-flag-attribution' },
      { step: 2, label: 'Gather Evidence', description: 'Collect clinical evidence sources supporting the dispute (claims, EHR, attestation)', requiredRole: 'care_manager', actionId: 'act-gather-attr-evidence' },
      { step: 3, label: 'Submit to Payer', description: 'Submit formal attribution dispute package to payer with audit trail', requiredRole: 'care_manager', actionId: 'act-dispute-attr' },
    ],
  },
  'provider-referral': {
    type: 'provider-referral',
    label: 'Provider Referral',
    description: 'Workflow to refer patient to a network provider',
    steps: [
      { step: 1, label: 'Identify Need', description: 'Identify referral specialty and clinical need', requiredRole: 'care_manager', actionId: 'act-initiate-referral' },
      { step: 2, label: 'Select Provider', description: 'Select preferred in-network provider', requiredRole: 'care_manager', actionId: 'act-select-provider' },
      { step: 3, label: 'Submit Referral', description: 'Submit referral order to Cerner', requiredRole: 'physician', actionId: 'act-submit-referral' },
    ],
  },
  'stars-payer-bonus': {
    type: 'stars-payer-bonus',
    label: 'STARS Payer Bonus',
    description: 'Workflow to remediate STARS measure gaps and capture payer bonus',
    steps: [
      { step: 1, label: 'Identify Gap', description: 'Surface STARS measure gap and estimate bonus impact', requiredRole: 'care_manager', actionId: 'act-stars-identify' },
      { step: 2, label: 'Remediate Measure', description: 'Assign outreach and document remediation actions', requiredRole: 'care_manager', actionId: 'act-stars-remediate' },
      { step: 3, label: 'Submit to Payer', description: 'Submit bonus claim package to payer with attestation', requiredRole: 'care_manager', actionId: 'act-stars-submit' },
    ],
  },
  'hedis-measure-doc': {
    type: 'hedis-measure-doc',
    label: 'HEDIS Measure Documentation',
    description: 'Workflow to document HEDIS measure compliance and close quality gaps',
    steps: [
      { step: 1, label: 'Assign Measure', description: 'Assign HEDIS measure to responsible care team member', requiredRole: 'care_manager', actionId: 'act-hedis-assign' },
      { step: 2, label: 'Document Evidence', description: 'Upload or attest clinical evidence for measure compliance', requiredRole: 'care_manager', actionId: 'act-hedis-document' },
      { step: 3, label: 'Certify & Close', description: 'Physician certifies documentation and closes the measure', requiredRole: 'physician', actionId: 'act-hedis-certify' },
    ],
  },
  'mips-payment-adj': {
    type: 'mips-payment-adj',
    label: 'MIPS Payment Adjustment Review',
    description: 'Workflow to review MIPS performance and respond to payment adjustment notices',
    steps: [
      { step: 1, label: 'Review Adjustment', description: 'Review CMS payment adjustment notice and score breakdown', requiredRole: 'care_manager', actionId: 'act-mips-review' },
      { step: 2, label: 'Respond / Appeal', description: 'Document response or initiate appeal with supporting evidence', requiredRole: 'care_manager', actionId: 'act-mips-respond' },
      { step: 3, label: 'Audit & Close', description: 'Finalize audit trail and close the adjustment review', requiredRole: 'physician', actionId: 'act-mips-close' },
    ],
  },
};

// ─── Central Action Registry ──────────────────────────────────────────────────
export const actionRegistry: ActionDefinition[] = [

  // ── HCC Actions ──────────────────────────────────────────────────────────────
  {
    id: 'act-surface-hcc',
    label: 'Surface HCC Suspect',
    description: 'Mark an HCC suspect as surfaced for care manager review',
    icon: 'MagnifyingGlassCircleIcon',
    variant: 'secondary',
    category: 'hcc',
    roles: ['care_manager'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'clinical'],
    stateGuard: { hccStatus: ['Surfaced'] },
    initiatesWorkflow: 'hcc-confirmation',
    priority: 1,
    auditLabel: 'HCC Suspect Surfaced',
  },
  {
    id: 'act-review-hcc-evidence',
    label: 'Review HCC Evidence',
    description: 'Review supporting evidence sources for an HCC suspect',
    icon: 'DocumentMagnifyingGlassIcon',
    variant: 'secondary',
    category: 'hcc',
    roles: ['care_manager'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'clinical'],
    stateGuard: { hccStatus: ['Surfaced', 'Evidence Reviewed'] },
    workflowStep: { workflow: 'hcc-confirmation', step: 2 },
    priority: 2,
    auditLabel: 'HCC Evidence Reviewed',
  },
  {
    id: 'act-escalate-hcc',
    label: 'Escalate to Physician',
    shortLabel: 'Escalate HCC',
    description: 'Route HCC suspect to assigned physician for clinical review',
    icon: 'ArrowUpCircleIcon',
    variant: 'warning',
    category: 'hcc',
    roles: ['care_manager'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail', 'panel-cohort'],
    tabs: ['risk', 'actions'],
    stateGuard: { hccStatus: ['Surfaced', 'Evidence Reviewed'], requiresOpenHCC: true },
    workflowStep: { workflow: 'hcc-confirmation', step: 3 },
    priority: 3,
    auditLabel: 'HCC Escalated to Physician',
  },
  {
    id: 'act-confirm-hcc',
    label: 'Confirm HCC Suspect',
    description: 'Clinically confirm an HCC suspect for RAF submission',
    icon: 'CheckCircleIcon',
    variant: 'primary',
    category: 'hcc',
    roles: ['physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'clinical'],
    stateGuard: { hccStatus: ['Clinician Review'] },
    workflowStep: { workflow: 'hcc-confirmation', step: 4 },
    priority: 1,
    auditLabel: 'HCC Suspect Confirmed',
  },
  {
    id: 'act-reject-hcc',
    label: 'Reject HCC Suspect',
    description: 'Reject HCC suspect with clinical reason — removes from RAF pipeline',
    icon: 'XCircleIcon',
    variant: 'danger',
    category: 'hcc',
    roles: ['physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'clinical'],
    stateGuard: { hccStatus: ['Clinician Review'] },
    priority: 2,
    requiresConfirmation: true,
    auditLabel: 'HCC Suspect Rejected',
  },
  {
    id: 'act-submit-hcc',
    label: 'Submit to Payer',
    description: 'Submit confirmed HCC to payer for RAF score capture',
    icon: 'PaperAirplaneIcon',
    variant: 'primary',
    category: 'hcc',
    roles: ['physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'clinical', 'actions'],
    stateGuard: { hccStatus: ['Documented'] },
    workflowStep: { workflow: 'hcc-confirmation', step: 5 },
    priority: 3,
    auditLabel: 'HCC Submitted to Payer',
  },

  // ── Care Gap Actions ──────────────────────────────────────────────────────────
  {
    id: 'act-assign-gap',
    label: 'Assign Care Gap',
    description: 'Assign open care gap to a care coordinator or provider',
    icon: 'UserPlusIcon',
    variant: 'secondary',
    category: 'care-gap',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail', 'panel-cohort'],
    tabs: ['risk', 'actions'],
    stateGuard: { gapStatus: ['Open'], requiresOpenGaps: true },
    initiatesWorkflow: 'care-gap-closure',
    priority: 4,
    auditLabel: 'Care Gap Assigned',
  },
  {
    id: 'act-outreach-gap',
    label: 'Initiate Patient Outreach',
    description: 'Contact patient to schedule required service for gap closure',
    icon: 'PhoneIcon',
    variant: 'secondary',
    category: 'care-gap',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail'],
    tabs: ['risk', 'actions'],
    stateGuard: { gapStatus: ['Open', 'In Progress'] },
    workflowStep: { workflow: 'care-gap-closure', step: 2 },
    priority: 5,
    auditLabel: 'Patient Outreach Initiated',
  },
  {
    id: 'act-close-gap',
    label: 'Close Care Gap',
    description: 'Document gap closure with attestation or service confirmation',
    icon: 'ClipboardDocumentCheckIcon',
    variant: 'primary',
    category: 'care-gap',
    roles: ['care_manager', 'physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'actions'],
    stateGuard: { gapStatus: ['Open', 'In Progress'] },
    workflowStep: { workflow: 'care-gap-closure', step: 3 },
    priority: 6,
    auditLabel: 'Care Gap Closed',
  },
  {
    id: 'act-defer-gap',
    label: 'Defer Gap',
    description: 'Defer care gap with documented clinical reason',
    icon: 'ClockIcon',
    variant: 'secondary',
    category: 'care-gap',
    roles: ['care_manager', 'physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'actions'],
    stateGuard: { gapStatus: ['Open', 'In Progress'] },
    priority: 7,
    auditLabel: 'Care Gap Deferred',
  },

  // ── Utilization Actions ───────────────────────────────────────────────────────
  {
    id: 'act-acknowledge-alert',
    label: 'Acknowledge Alert',
    description: 'Acknowledge a utilization alert and add to care manager queue',
    icon: 'EyeIcon',
    variant: 'secondary',
    category: 'utilization',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail', 'panel-cohort'],
    tabs: ['risk', 'actions'],
    stateGuard: { requiresActiveAlerts: true },
    initiatesWorkflow: 'utilization-escalation',
    priority: 1,
    auditLabel: 'Utilization Alert Acknowledged',
  },
  {
    id: 'act-assign-intervention',
    label: 'Assign Intervention',
    description: 'Assign a care intervention protocol to address utilization risk',
    icon: 'ClipboardDocumentListIcon',
    variant: 'warning',
    category: 'utilization',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail'],
    tabs: ['risk', 'actions'],
    stateGuard: { alertTier: ['Critical', 'Important'], requiresActiveAlerts: true },
    workflowStep: { workflow: 'utilization-escalation', step: 2 },
    priority: 2,
    auditLabel: 'Intervention Assigned',
  },
  {
    id: 'act-escalate-util',
    label: 'Escalate ER Risk',
    description: 'Initiate ER risk intervention protocol for critical utilization alert',
    icon: 'ExclamationTriangleIcon',
    variant: 'danger',
    category: 'utilization',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail', 'panel-cohort'],
    tabs: ['risk'],
    stateGuard: { alertTier: ['Critical'], requiresActiveAlerts: true },
    workflowStep: { workflow: 'utilization-escalation', step: 3 },
    priority: 3,
    requiresConfirmation: true,
    auditLabel: 'ER Risk Escalated',
  },
  {
    id: 'act-dismiss-alert',
    label: 'Dismiss Alert',
    description: 'Dismiss utilization alert with documented reason',
    icon: 'XMarkIcon',
    variant: 'secondary',
    category: 'utilization',
    roles: ['care_manager', 'physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk'],
    stateGuard: { alertTier: ['Important', 'Informational'] },
    priority: 4,
    requiresConfirmation: true,
    auditLabel: 'Utilization Alert Dismissed',
  },

  // ── Task Actions ──────────────────────────────────────────────────────────────
  {
    id: 'act-assign-task',
    label: 'Assign Task',
    description: 'Create and assign a care management task to a team member',
    icon: 'ClipboardDocumentListIcon',
    variant: 'secondary',
    category: 'task',
    roles: ['care_manager', 'physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail', 'panel-cohort'],
    tabs: ['risk', 'clinical', 'financial', 'attribution', 'actions'],
    priority: 10,
    auditLabel: 'Task Assigned',
  },
  {
    id: 'act-flag-outreach',
    label: 'Flag for Outreach',
    description: 'Flag patient for care manager outreach queue',
    icon: 'FlagIcon',
    variant: 'secondary',
    category: 'task',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['panel-cohort', 'patient-detail'],
    tabs: ['actions'],
    priority: 11,
    auditLabel: 'Patient Flagged for Outreach',
  },

  // ── Attribution Actions ───────────────────────────────────────────────────────
  {
    id: 'act-flag-attribution',
    label: 'Flag Attribution',
    description: 'Flag attribution record for dispute review',
    icon: 'FlagIcon',
    variant: 'warning',
    category: 'attribution',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail'],
    tabs: ['attribution'],
    stateGuard: { attributionStatus: ['Provisional', 'Disputed'] },
    initiatesWorkflow: 'attribution-dispute',
    priority: 1,
    auditLabel: 'Attribution Flagged for Dispute',
  },
  {
    id: 'act-dispute-attr',
    label: 'Dispute Attribution',
    description: 'Submit formal attribution dispute to payer',
    icon: 'QuestionMarkCircleIcon',
    variant: 'secondary',
    category: 'attribution',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail'],
    tabs: ['attribution'],
    stateGuard: { attributionStatus: ['Provisional', 'Disputed'] },
    workflowStep: { workflow: 'attribution-dispute', step: 2 },
    priority: 2,
    requiresConfirmation: true,
    auditLabel: 'Attribution Dispute Submitted',
  },

  // ── Financial Actions ─────────────────────────────────────────────────────────
  {
    id: 'act-flag-cost',
    label: 'Flag High Cost',
    description: 'Flag patient for cost management review',
    icon: 'FlagIcon',
    variant: 'warning',
    category: 'financial',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['patient-detail', 'financial-dashboard'],
    tabs: ['financial'],
    priority: 1,
    auditLabel: 'Patient Flagged for Cost Review',
  },
  {
    id: 'act-export-financial',
    label: 'Export for Payer',
    description: 'Export cost envelope data for payer reconciliation',
    icon: 'ArrowDownTrayIcon',
    variant: 'secondary',
    category: 'financial',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['financial-dashboard', 'patient-detail'],
    tabs: ['financial'],
    priority: 2,
    auditLabel: 'Financial Data Exported',
  },
  {
    id: 'act-request-review',
    label: 'Request Cost Review',
    description: 'Request a formal cost outlier review from the finance team',
    icon: 'DocumentMagnifyingGlassIcon',
    variant: 'secondary',
    category: 'financial',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['financial-dashboard'],
    priority: 3,
    auditLabel: 'Cost Review Requested',
  },

  // ── Clinical Actions ──────────────────────────────────────────────────────────
  {
    id: 'act-update-care-plan',
    label: 'Update Care Plan',
    description: 'Edit active care plan interventions and goals',
    icon: 'DocumentPlusIcon',
    variant: 'secondary',
    category: 'clinical',
    roles: ['physician', 'care_manager'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['clinical', 'actions'],
    priority: 1,
    auditLabel: 'Care Plan Updated',
  },
  {
    id: 'act-submit-order',
    label: 'Submit Order to Cerner',
    description: 'Submit a clinical order directly to the Cerner EMR',
    icon: 'PaperAirplaneIcon',
    variant: 'primary',
    category: 'clinical',
    roles: ['physician'],
    contexts: ['cerner-launch', 'browse'],
    screens: ['patient-detail'],
    tabs: ['clinical'],
    priority: 2,
    auditLabel: 'Order Submitted to Cerner',
  },
  {
    id: 'act-accept-cds',
    label: 'Accept CDS Suggestion',
    description: 'Accept a CDS Hooks clinical decision support suggestion',
    icon: 'CheckCircleIcon',
    variant: 'success',
    category: 'clinical',
    roles: ['physician'],
    contexts: ['cerner-launch', 'browse'],
    screens: ['patient-detail'],
    tabs: ['clinical'],
    priority: 3,
    auditLabel: 'CDS Suggestion Accepted',
  },
  {
    id: 'act-dismiss-cds',
    label: 'Dismiss CDS Card',
    description: 'Dismiss a CDS Hooks suggestion with documented reason',
    icon: 'XMarkIcon',
    variant: 'secondary',
    category: 'clinical',
    roles: ['physician'],
    contexts: ['cerner-launch', 'browse'],
    screens: ['patient-detail'],
    tabs: ['clinical'],
    priority: 4,
    requiresConfirmation: true,
    auditLabel: 'CDS Card Dismissed',
  },

  // ── Navigation / Panel Actions ────────────────────────────────────────────────
  {
    id: 'act-view-patient',
    label: 'View Patient Detail',
    description: 'Navigate to full patient detail record',
    icon: 'UserIcon',
    variant: 'secondary',
    category: 'navigation',
    roles: ['care_manager', 'physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['panel-cohort'],
    priority: 1,
    auditLabel: 'Patient Detail Viewed',
  },
  {
    id: 'act-select-contract',
    label: 'Select Contract',
    description: 'Enter a VBC contract to view its attributed panel',
    icon: 'DocumentTextIcon',
    variant: 'primary',
    category: 'navigation',
    roles: ['care_manager', 'physician'],
    contexts: ['browse'],
    screens: ['contract-selection'],
    priority: 1,
    auditLabel: 'Contract Selected',
  },
  {
    id: 'act-initiate-referral',
    label: 'Initiate Referral',
    description: 'Start a provider referral workflow for this patient',
    icon: 'ArrowTopRightOnSquareIcon',
    variant: 'secondary',
    category: 'navigation',
    roles: ['care_manager', 'physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail', 'provider-selection'],
    tabs: ['clinical', 'actions'],
    initiatesWorkflow: 'provider-referral',
    priority: 5,
    auditLabel: 'Referral Initiated',
  },
  {
    id: 'act-select-provider',
    label: 'Select Provider',
    description: 'Select a preferred in-network provider for referral',
    icon: 'BuildingOffice2Icon',
    variant: 'primary',
    category: 'navigation',
    roles: ['care_manager', 'physician'],
    contexts: ['browse'],
    screens: ['provider-selection'],
    workflowStep: { workflow: 'provider-referral', step: 2 },
    priority: 1,
    auditLabel: 'Provider Selected',
  },
  {
    id: 'act-submit-referral',
    label: 'Submit Referral',
    description: 'Submit referral order to Cerner EMR',
    icon: 'PaperAirplaneIcon',
    variant: 'primary',
    category: 'navigation',
    roles: ['physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['provider-selection'],
    workflowStep: { workflow: 'provider-referral', step: 3 },
    priority: 2,
    auditLabel: 'Referral Submitted',
  },

  // ── Export Actions ────────────────────────────────────────────────────────────
  {
    id: 'act-export-patient',
    label: 'Export Patient Report',
    description: 'Generate PDF patient summary for care coordination',
    icon: 'ArrowDownTrayIcon',
    variant: 'secondary',
    category: 'export',
    roles: ['care_manager', 'physician'],
    contexts: ['browse', 'cerner-launch'],
    screens: ['patient-detail'],
    tabs: ['risk', 'clinical', 'financial', 'attribution', 'actions'],
    priority: 20,
    auditLabel: 'Patient Report Exported',
  },
  {
    id: 'act-export-panel',
    label: 'Export Panel Report',
    description: 'Export full panel cohort data as CSV/Excel',
    icon: 'ArrowDownTrayIcon',
    variant: 'secondary',
    category: 'export',
    roles: ['care_manager'],
    contexts: ['browse'],
    screens: ['panel-cohort'],
    priority: 20,
    auditLabel: 'Panel Report Exported',
  },
];

// ─── Action Availability Engine ───────────────────────────────────────────────

export interface ActionContext {
  role: UserRole;
  entryContext: EntryContext;
  screen: ScreenScope;
  tab?: PatientTab;
  // Current data state for guard evaluation
  patientState?: {
    openHCCSuspects: number;
    openCareGaps: number;
    activeAlerts: number;
    attributionStatus?: AttributionStatus;
    hccStatuses?: HCCStatus[];
    gapStatuses?: GapStatus[];
    alertTiers?: AlertTier[];
  };
}

/**
 * Returns the filtered, ordered list of actions available for the given context.
 * Applies role, context, screen, tab, and state guards.
 */
export function getAvailableActions(ctx: ActionContext): ActionDefinition[] {
  return actionRegistry
    .filter((action) => {
      // Role guard
      if (!action.roles.includes(ctx.role)) return false;

      // Context guard
      if (!action.contexts.includes(ctx.entryContext)) return false;

      // Screen guard
      if (!action.screens.includes(ctx.screen)) return false;

      // Tab guard (only applies on patient-detail screen)
      if (ctx.screen === 'patient-detail' && ctx.tab && action.tabs) {
        if (!action.tabs.includes(ctx.tab)) return false;
      }

      // State guards
      if (action.stateGuard && ctx.patientState) {
        const sg = action.stateGuard;
        const ps = ctx.patientState;

        if (sg.requiresOpenHCC && ps.openHCCSuspects === 0) return false;
        if (sg.requiresOpenGaps && ps.openCareGaps === 0) return false;
        if (sg.requiresActiveAlerts && ps.activeAlerts === 0) return false;
        if (sg.requiresConfirmedAttribution && ps.attributionStatus !== 'Confirmed') return false;

        if (sg.hccStatus && ps.hccStatuses) {
          const hasMatch = ps.hccStatuses.some((s) => sg.hccStatus!.includes(s));
          if (!hasMatch) return false;
        }

        if (sg.gapStatus && ps.gapStatuses) {
          const hasMatch = ps.gapStatuses.some((s) => sg.gapStatus!.includes(s));
          if (!hasMatch) return false;
        }

        if (sg.alertTier && ps.alertTiers) {
          const hasMatch = ps.alertTiers.some((t) => sg.alertTier!.includes(t));
          if (!hasMatch) return false;
        }

        if (sg.attributionStatus && ps.attributionStatus) {
          if (!sg.attributionStatus.includes(ps.attributionStatus)) return false;
        }
      }

      return true;
    })
    .sort((a, b) => a.priority - b.priority);
}

/**
 * Returns a single action definition by ID.
 */
export function getActionById(id: string): ActionDefinition | undefined {
  return actionRegistry.find((a) => a.id === id);
}

/**
 * Returns all actions for a given workflow type.
 */
export function getWorkflowActions(workflowType: WorkflowType): ActionDefinition[] {
  return actionRegistry.filter(
    (a) =>
      a.initiatesWorkflow === workflowType ||
      a.workflowStep?.workflow === workflowType
  );
}

/**
 * Returns the next step action for a workflow given current step.
 */
export function getNextWorkflowAction(
  workflowType: WorkflowType,
  currentStep: number,
  role: UserRole
): ActionDefinition | undefined {
  const def = workflowDefinitions[workflowType];
  const nextStep = def.steps.find((s) => s.step === currentStep + 1 && s.requiredRole === role);
  if (!nextStep) return undefined;
  return getActionById(nextStep.actionId);
}

// ─── Audit Trail Entry ────────────────────────────────────────────────────────
export interface AuditEntry {
  id: string;
  actionId: string;
  auditLabel: string;
  entityId?: string;
  entityType?: 'patient' | 'hcc' | 'gap' | 'alert' | 'contract' | 'provider';
  performedBy: string;
  performedByRole: UserRole;
  entryContext: EntryContext;
  screen: ScreenScope;
  tab?: PatientTab;
  timestamp: string;
  notes?: string;
  workflowType?: WorkflowType;
  workflowStep?: number;
}

/**
 * Creates a new audit entry for a performed action.
 */
export function createAuditEntry(
  action: ActionDefinition,
  ctx: ActionContext,
  performedBy: string,
  entityId?: string,
  entityType?: AuditEntry['entityType'],
  notes?: string
): AuditEntry {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    actionId: action.id,
    auditLabel: action.auditLabel,
    entityId,
    entityType,
    performedBy,
    performedByRole: ctx.role,
    entryContext: ctx.entryContext,
    screen: ctx.screen,
    tab: ctx.tab,
    timestamp: new Date().toISOString(),
    notes,
    workflowType: action.initiatesWorkflow ?? action.workflowStep?.workflow,
    workflowStep: action.workflowStep?.step,
  };
}
