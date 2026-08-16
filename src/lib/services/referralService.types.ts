// ─── referralService.types.ts ─────────────────────────────────────────────────
// TypeScript interfaces for the closed-loop referral service.

export interface ReferralRequest {
  patientId: string;
  requesterId: string;
  performerId: string;
  serviceCode: string;
  serviceDisplay: string;
  reasonCode?: string;
  reasonDisplay?: string;
  conditionId?: string;
  careGapId?: string;
  gainshareEligible?: boolean;
  gainshareAmount?: number;
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  notes?: string;
}

export interface ServiceCompletionRequest {
  taskId: string;
  serviceRequestId: string;
  patientId: string;
  performerId: string;
  procedureCode: string;
  procedureDisplay: string;
  performedDate: string;
  observations?: ObservationData[];
  notes?: string;
}

export interface ObservationData {
  code: string;
  codeSystem: string;
  display: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  interpretation?: string;
}

export interface MeasureReportUpdate {
  measureReportId: string;
  patientId: string;
  measureCode: string;
  gapClosed: boolean;
  evidenceReferences: string[];
  closureDate: string;
}
