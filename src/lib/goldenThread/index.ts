/**
 * Golden Thread — public surface (increments GT-3, GT-5, GT-6, GT-7, GT-8).
 *
 * SMART-launched Financial Clearance: Eligibility → Medical Necessity →
 * Prior Auth → Patient Estimation, unified by the Evidence Record, differentiated
 * by gold carding, propensity-to-deny, and reviewer work queues.
 */
export {
  runMedicalNecessity,
  type StageOrder,
  type MedicalNecessityResult,
  type MedicalNecessityVM,
  type RemediationOption,
  type RunContext,
  type NetOutcome,
} from './medicalNecessity';
export { runEligibility, type CoverageInfo, type EligibilityVM } from './eligibility';
export {
  estimatePatientCost,
  MOCK_ALLOWED_AMOUNTS,
  type BenefitDesign,
  type EstimateInput,
  type PatientEstimateVM,
  type PayPropensityBand,
} from './patientEstimation';
export {
  routeToQueue,
  isSlaBreached,
  type QueueName,
  type WorkItem,
  type RouteInput,
} from './workQueue';
export {
  advance,
  FC_INITIAL,
  FC_STAGES,
  type FcStage,
  type FcEvent,
  type FcContext,
  type FcTransition,
} from './financialClearanceMachine';
export { generateQuestionnaireFromPolicy, type GeneratedQuestionnaire } from './dtrFromPolicy';
export {
  runFinancialClearance,
  type OrchestratorDeps,
  type ThreadResult,
} from './threadOrchestrator';
export {
  projectThreadInputs,
  coverageToInfo,
  providerNpiFrom,
  type ThreadInputs,
} from './fromFhirBundle';
export {
  validateOrderCode,
  validateNpi,
  validatePatientId,
  validateClearanceRequest,
  validateEvidenceId,
  type ValidationResult,
} from './validate';
export {
  selectDtrGenerator,
  deterministicDtrGenerator,
  aiDtrGenerator,
  aiDtrConfigFromEnv,
  DtrNotConfiguredError,
  type DtrGenerator,
  type AiDtrConfig,
} from './dtr/generator';
