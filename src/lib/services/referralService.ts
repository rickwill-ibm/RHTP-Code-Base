// ─── referralService.ts ───────────────────────────────────────────────────────
// Barrel re-export — import from here as before.
// Types → referralService.types.ts
// FHIR functions → referralService.fhir.ts

export type {
  ReferralRequest,
  ServiceCompletionRequest,
  ObservationData,
  MeasureReportUpdate,
} from './referralService.types';

export {
  createReferralServiceRequest,
  createReferralTask,
  updateTaskStatus,
  createProcedure,
  createObservations,
  updateMeasureReportForGapClosure,
  createProvenanceRecord,
  initiateReferral,
  completeServiceAndCloseGap,
  validateReferralRequest,
} from './referralService.fhir';

import {
  createReferralServiceRequest,
  createReferralTask,
  updateTaskStatus,
  createProcedure,
  createObservations,
  updateMeasureReportForGapClosure,
  createProvenanceRecord,
  initiateReferral,
  completeServiceAndCloseGap,
  validateReferralRequest,
} from './referralService.fhir';

export const referralService = {
  createReferralServiceRequest,
  createReferralTask,
  updateTaskStatus,
  createProcedure,
  createObservations,
  updateMeasureReportForGapClosure,
  createProvenanceRecord,
  initiateReferral,
  completeServiceAndCloseGap,
  validateReferralRequest,
};
