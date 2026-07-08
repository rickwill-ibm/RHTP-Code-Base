'use client';
// patientContext.tsx — Shared patient state for Dorothy Simmons
// Single source of truth wired to all 11 screens.

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getFhirClient } from './services/fhirClient';
import type { RegistryPatient } from './patientRegistry';

// Note: patientContext reads the runtime flag from fhirClient so it respects
// the UI toggle rather than the build-time env var.
import { getFhirMockMode } from './services/fhirClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export type EpisodeStatus = 'Active' | 'Stable' | 'Closed' | 'Escalated';
export type BHRiskLevel = 'Low' | 'Moderate' | 'High' | 'Crisis';
export type GapStatus = 'Open' | 'In Progress' | 'Closed' | 'Waived';
export type GapDomain = 'Clinical' | 'BH' | 'Social';

// ─── Gap Closure Store Types ──────────────────────────────────────────────────

export type HedisCompliance = 'MET' | 'NOT_MET' | 'PENDING';
export type GapClosureSource = 'PATIENT_DETAIL' | 'SMART_LAUNCH';
export type GapClosureStatus = 'OPEN' | 'CLOSING' | 'CLOSED';

export interface GapClosureEvidence {
  gapId: string;
  status: GapClosureStatus;
  closedAt?: string;
  closedFrom?: GapClosureSource;
  dateOfService?: string;
  performingProvider?: string;
  placeOfService?: string;
  procedureCode?: string;
  resultValue?: number;
  resultUnit?: string;
  hedisCompliance?: HedisCompliance;
  gainshare?: number;
  fhirObservationId?: string;
}

// ─── Gap Closure Store Context ────────────────────────────────────────────────

interface GapClosureStoreValue {
  closures: Record<string, GapClosureEvidence>;
  getGapClosure: (gapId: string) => GapClosureEvidence | undefined;
  startClosing: (gapId: string) => void;
  submitClosure: (evidence: GapClosureEvidence) => void;
  isGapClosed: (gapId: string) => boolean;
  isGapClosing: (gapId: string) => boolean;
}

const GapClosureStoreContext = createContext<GapClosureStoreValue | null>(null);

export function GapClosureStoreProvider({ children }: { children: React.ReactNode }) {
  const [closures, setClosures] = useState<Record<string, GapClosureEvidence>>({});

  const getGapClosure = useCallback((gapId: string) => closures[gapId], [closures]);

  const startClosing = useCallback((gapId: string) => {
    setClosures((prev) => ({
      ...prev,
      [gapId]: { ...prev[gapId], gapId, status: 'CLOSING' },
    }));
  }, []);

  const submitClosure = useCallback((evidence: GapClosureEvidence) => {
    setClosures((prev) => ({
      ...prev,
      [evidence.gapId]: {
        ...evidence,
        status: 'CLOSED',
        closedAt: evidence.closedAt ?? new Date().toISOString(),
        gainshare: 8100,
        procedureCode: evidence.procedureCode ?? '83036',
        resultUnit: evidence.resultUnit ?? '%',
        hedisCompliance:
          evidence.resultValue !== undefined
            ? evidence.resultValue < 8.0
              ? 'MET' :'NOT_MET' :'PENDING',
      },
    }));
  }, []);

  const isGapClosed = useCallback((gapId: string) => closures[gapId]?.status === 'CLOSED', [closures]);
  const isGapClosing = useCallback((gapId: string) => closures[gapId]?.status === 'CLOSING', [closures]);

  return (
    <GapClosureStoreContext.Provider value={{ closures, getGapClosure, startClosing, submitClosure, isGapClosed, isGapClosing }}>
      {children}
    </GapClosureStoreContext.Provider>
  );
}

export function useGapClosureStore() {
  const ctx = useContext(GapClosureStoreContext);
  if (!ctx) throw new Error('useGapClosureStore must be used within GapClosureStoreProvider');
  return ctx;
}

// ─── Existing types (unchanged) ───────────────────────────────────────────────

export interface CareGap {
  id: string;
  domain: GapDomain;
  name: string;
  status: GapStatus;
  daysOpen: number;
  assignedTo: string;
  evidence?: string;
  closedDate?: string;
}

export interface PathwayStep {
  id: string;
  label: string;
  completed: boolean;
  date?: string;
  metric?: string;
}

export interface PatientSharedState {
  // Identity
  patientId: string;
  name: string;
  mrn: string;
  age: number;
  gender: string;
  dob: string;
  pcp: string;
  careManager: string;
  careManagerInitials: string;
  organization: string;
  attribution: string;

  // Episode
  episodeType: string;
  episodeStatus: EpisodeStatus;
  episodeDaysActive: number;
  pmpm: number;
  pmpmTarget: number;
  rafScore: number;
  rafDelta: number;
  riskTier: string;
  erRiskPct: number;
  hccSuspects: number;
  hccValue: number;
  lastContact: string;
  attributionDetail: string;

  // BH
  phq9Score: number;
  phq9Trend: string;
  auditC: number;
  traumaFlag: boolean;
  bhRisk: BHRiskLevel;
  bhReferralStatus: string;
  bhReferralDate: string;
  bhProvider: string;
  pamScore: number;
  pamLabel: string;
  patientGoal: string;

  // Social Needs
  transportStatus: string;
  transportReferralId: string;
  referralStatus: string;
  referralDaysOpen: number;
  foodSecurity: string;
  housingStatus: string;
  language: string;
  literacy: string;
  cohortFlag: string;
  ruralDistance: string;
  disparityFlag: string;
  snapStatus: string;

  // Care Gaps
  careGaps: CareGap[];

  // Pathway Progress (Dorothy's whole-person journey)
  pathwaySteps: PathwayStep[];

  // Crisis
  crisisCount30d: number;
  lastCrisisDate: string | null;
  activeCrisis: boolean;
}

// ─── Default Maria Redhawk State ──────────────────────────────────────────────

const defaultMariaState: PatientSharedState = {
  patientId: 'MARIA_SD_001',
  name: 'Maria Redhawk',
  mrn: 'MRN-SD-001',
  age: 34,
  gender: 'F',
  dob: '1992-03-22',
  pcp: 'Bennett County Health PCP',
  careManager: 'Sarah Johnson',
  careManagerInitials: 'SJ',
  organization: 'Bennett County Health Services',
  attribution: 'Confirmed · Medicaid RHTP Track 3',

  episodeType: 'Pre-Diabetic / Postpartum',
  episodeStatus: 'Active',
  episodeDaysActive: 427,
  pmpm: 1240,
  pmpmTarget: 890,
  rafScore: 1.42,
  rafDelta: 0.12,
  riskTier: 'Moderate — 38% ER risk',
  erRiskPct: 38,
  hccSuspects: 2,
  hccValue: 8400,
  lastContact: 'May 28, 2026',
  attributionDetail: 'Confirmed · Medicaid RHTP Track 3',

  phq9Score: 12,
  phq9Trend: '↑ Edinburgh PND 427d unmanaged',
  auditC: 0,
  traumaFlag: false,
  bhRisk: 'Moderate',
  bhReferralStatus: 'Referred — not enrolled',
  bhReferralDate: 'Apr 15',
  bhProvider: 'Postpartum Support Group — Bennett County',
  pamScore: 2,
  pamLabel: 'Struggling',
  patientGoal: "'Take care of Sophia and get back on my feet'",

  transportStatus: 'Active',
  transportReferralId: 'Unite Us #TU-SD-48821',
  referralStatus: 'Active',
  referralDaysOpen: 12,
  foodSecurity: 'SNAP expired T+47d — unmet need',
  housingStatus: 'Waitlist #47 — SDHDA',
  language: 'English / Lakota',
  literacy: 'moderate',
  cohortFlag: 'Postpartum · Frontier SD · Oglala Lakota',
  ruralDistance: '47 miles to Bennett County Health',
  disparityFlag: 'AI/AN · Rural frontier · Medicaid',
  snapStatus: 'Expired — renewal overdue',

  careGaps: [
    { id: 'mg-1', domain: 'Clinical', name: 'A1C Recheck (Pre-Diabetic)', status: 'Open', daysOpen: 38, assignedTo: 'Bennett County Health PCP' },
    { id: 'mg-2', domain: 'Clinical', name: 'Postpartum Visit (427d overdue)', status: 'Open', daysOpen: 427, assignedTo: 'Bennett County Health PCP' },
    { id: 'mg-3', domain: 'Clinical', name: 'Well-Child 24mo — Sophia (21d overdue)', status: 'Open', daysOpen: 21, assignedTo: 'Bennett County Health PCP' },
    { id: 'mg-4', domain: 'BH', name: 'Edinburgh PND Screening (427d)', status: 'Open', daysOpen: 427, assignedTo: 'Sarah Johnson' },
    { id: 'mg-5', domain: 'BH', name: 'Postpartum Support Group Enrollment', status: 'In Progress', daysOpen: 14, assignedTo: 'Sarah Johnson' },
    { id: 'mg-6', domain: 'Social', name: 'SNAP Renewal (T+47d overdue)', status: 'Open', daysOpen: 47, assignedTo: 'Bennett County Action CBO' },
    { id: 'mg-7', domain: 'Social', name: 'WIC Enrollment (eligible — not enrolled)', status: 'Open', daysOpen: 60, assignedTo: 'Bennett County Action CBO' },
    { id: 'mg-8', domain: 'Social', name: 'Childcare Subsidy (CCAP) Enrollment', status: 'Open', daysOpen: 60, assignedTo: 'Bennett County Action CBO' },
    { id: 'mg-9', domain: 'Social', name: 'Housing Waitlist Follow-up (#47)', status: 'In Progress', daysOpen: 90, assignedTo: 'Sarah Johnson' },
  ],

  pathwaySteps: [
    { id: 'mps-1', label: 'PRAPARE Screening', completed: true, date: 'Apr 15', metric: '5 unmet needs' },
    { id: 'mps-2', label: 'Transport Referral', completed: true, date: 'Apr 18', metric: 'NEMT Active' },
    { id: 'mps-3', label: 'SNAP Renewal', completed: false, date: 'Overdue T+47d', metric: '$281/mo' },
    { id: 'mps-4', label: 'WIC + CCAP Enroll', completed: false, date: 'Pending', metric: '$807/mo value' },
    { id: 'mps-5', label: 'A1C Recheck', completed: false, metric: 'Goal: <6.5%' },
  ],

  crisisCount30d: 0,
  lastCrisisDate: null,
  activeCrisis: false,
};

// ─── Default Dorothy Simmons State ───────────────────────────────────────────

const defaultDorothyState: PatientSharedState = {
  patientId: 'PAT-0042',
  name: 'Dorothy Simmons',
  mrn: 'MRN-0042',
  age: 75,
  gender: 'F',
  dob: '1951-03-14',
  pcp: 'Dr. Whitfield',
  careManager: 'Sarah Johnson',
  careManagerInitials: 'SJ',
  organization: 'Ozark Regional FQHC',
  attribution: 'Confirmed · MSSP Trk 3',

  episodeType: 'COPD Exacerbation',
  episodeStatus: 'Active',
  episodeDaysActive: 14,
  pmpm: 2840,
  pmpmTarget: 890,
  rafScore: 3.42,
  rafDelta: 0.18,
  riskTier: 'Critical — 84% ER risk',
  erRiskPct: 84,
  hccSuspects: 4,
  hccValue: 24800,
  lastContact: 'Mar 28, 2026',
  attributionDetail: 'Confirmed · MSSP Trk 3',

  phq9Score: 14,
  phq9Trend: '↑ from 10 (3 months ago)',
  auditC: 2,
  traumaFlag: false,
  bhRisk: 'Moderate',
  bhReferralStatus: 'Open',
  bhReferralDate: 'Mar 15',
  bhProvider: 'Cascade Valley BH',
  pamScore: 1,
  pamLabel: 'Overwhelmed',
  patientGoal: "'Stay home with my family'",

  transportStatus: 'Active',
  transportReferralId: 'Unite Us #TU-48821',
  referralStatus: 'Pending',
  referralDaysOpen: 18,
  foodSecurity: 'Screened — no flag',
  housingStatus: 'Stable',
  language: 'English',
  literacy: 'moderate',
  cohortFlag: 'Ag worker · Seasonal flag',
  ruralDistance: '38 miles to FQHC',
  disparityFlag: 'None identified',
  snapStatus: 'Active',

  careGaps: [
    { id: 'gap-1', domain: 'Clinical', name: 'Spirometry (COPD)', status: 'Open', daysOpen: 42, assignedTo: 'Dr. Whitfield' },
    { id: 'gap-2', domain: 'Clinical', name: 'Flu Vaccine', status: 'In Progress', daysOpen: 18, assignedTo: 'Sarah Johnson' },
    { id: 'gap-3', domain: 'Clinical', name: 'Medication Reconciliation', status: 'Open', daysOpen: 14, assignedTo: 'Sarah Johnson' },
    { id: 'gap-4', domain: 'Clinical', name: 'A1C Recheck', status: 'Open', daysOpen: 61, assignedTo: 'Dr. Whitfield' },
    { id: 'gap-5', domain: 'Clinical', name: 'Retinal Exam', status: 'Open', daysOpen: 90, assignedTo: 'Dr. Whitfield' },
    { id: 'gap-6', domain: 'Clinical', name: 'Nephropathy Screening', status: 'Open', daysOpen: 30, assignedTo: 'Dr. Whitfield' },
    { id: 'gap-7', domain: 'BH', name: 'PHQ-9 Follow-up', status: 'In Progress', daysOpen: 21, assignedTo: 'Cascade Valley BH' },
    { id: 'gap-8', domain: 'BH', name: 'Trauma Screening (ACE)', status: 'Open', daysOpen: 45, assignedTo: 'Sarah Johnson' },
    { id: 'gap-9', domain: 'Social', name: 'Transport Referral — Active', status: 'In Progress', daysOpen: 18, assignedTo: 'Maria Gonzalez' },
    { id: 'gap-10', domain: 'Social', name: 'Housing Stability Plan', status: 'Open', daysOpen: 33, assignedTo: 'Maria Gonzalez' },
    { id: 'gap-11', domain: 'Social', name: 'SNAP Re-certification', status: 'Open', daysOpen: 12, assignedTo: 'Maria Gonzalez' },
  ],

  pathwaySteps: [
    { id: 'ps-1', label: 'Food Insecurity Screening', completed: true, date: 'Jan 8', metric: 'SNAP enrolled' },
    { id: 'ps-2', label: 'SNAP Enrollment', completed: true, date: 'Feb 2', metric: 'Active' },
    { id: 'ps-3', label: 'BH Engagement (12-wk)', completed: false, date: 'In progress', metric: 'Wk 6 of 12' },
    { id: 'ps-4', label: 'A1C Recheck', completed: false, date: 'Due Jun 7', metric: 'Last: 9.2' },
    { id: 'ps-5', label: 'A1C Target 7.1', completed: false, metric: 'Goal' },
  ],

  crisisCount30d: 1,
  lastCrisisDate: '2026-04-15',
  activeCrisis: false,
};

// ─── Context Shape ────────────────────────────────────────────────────────────

interface PatientContextValue {
  patient: PatientSharedState;
  updateEpisodeStatus: (status: EpisodeStatus) => void;
  updateBHRisk: (risk: BHRiskLevel) => void;
  closeGap: (gapId: string, evidence: string) => void;
  updateGapStatus: (gapId: string, status: GapStatus) => void;
  completePathwayStep: (stepId: string, metric?: string) => void;
  updateCrisisState: (active: boolean) => void;
  updateSocialNeed: (field: keyof PatientSharedState, value: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const PatientContext = createContext<PatientContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

// Map registry patient data to PatientSharedState shape
function buildStateFromRegistry(platformId: string): PatientSharedState | null {
  try {
    const registry = require('./patientRegistry');
    const rp = registry.getPatientById(platformId);
    if (!rp) return null;

    return {
      patientId: rp.platformId,
      name: rp.name,
      mrn: rp.ehrMrn,
      age: rp.age,
      gender: rp.gender,
      dob: rp.dob,
      pcp: rp.pcp,
      careManager: rp.careManager,
      careManagerInitials: rp.careManagerInitials,
      organization: rp.organization,
      attribution: rp.attribution,

      episodeType: rp.episodeType,
      episodeStatus: rp.episodeStatus as EpisodeStatus,
      episodeDaysActive: rp.episodeDaysActive,
      pmpm: rp.pmpm,
      pmpmTarget: rp.pmpmTarget,
      rafScore: rp.rafScore,
      rafDelta: 0.12,
      riskTier: rp.riskLabel,
      erRiskPct: rp.erRiskPct,
      hccSuspects: rp.hccSuspects,
      hccValue: rp.hccValue,
      lastContact: rp.lastContact,
      attributionDetail: rp.attribution,

      phq9Score: rp.bhScore ?? 0,
      phq9Trend: rp.bhScoreLabel,
      auditC: rp.auditC,
      traumaFlag: false,
      bhRisk: rp.bhRisk as BHRiskLevel,
      bhReferralStatus: rp.bhReferralStatus,
      bhReferralDate: '',
      bhProvider: rp.bhProvider,
      pamScore: 2,
      pamLabel: rp.burdenScore,
      patientGoal: rp.patientGoal,

      transportStatus: rp.transportStatus,
      transportReferralId: '',
      referralStatus: 'Active',
      referralDaysOpen: 0,
      foodSecurity: rp.foodSecurity,
      housingStatus: rp.housingStatus,
      language: rp.language,
      literacy: 'moderate',
      cohortFlag: rp.cohortFlag,
      ruralDistance: rp.ruralDistance,
      disparityFlag: rp.disparityFlag,
      snapStatus: rp.snapStatus,

      careGaps: rp.careGaps.map((g: any) => ({
        id: g.id,
        domain: g.domain as GapDomain,
        name: g.name,
        status: g.status as GapStatus,
        daysOpen: g.daysOpen,
        assignedTo: g.assignedTo,
      })),

      pathwaySteps: rp.pathwaySteps.map((s: any) => ({
        id: s.id,
        label: s.label,
        completed: s.status === 'completed',
        date: s.date,
        metric: s.metric,
      })),

      crisisCount30d: 0,
      lastCrisisDate: null,
      activeCrisis: false,
    };
  } catch {
    return null;
  }
}

/** Map a RegistryPatient fetched from FHIR into a PatientSharedState */
function buildStateFromFhirPatient(rp: RegistryPatient): PatientSharedState {
  return {
    patientId: rp.platformId,
    name: rp.name,
    mrn: rp.ehrMrn,
    age: rp.age,
    gender: rp.gender,
    dob: rp.dob,
    pcp: rp.pcp,
    careManager: rp.careManager,
    careManagerInitials: rp.careManagerInitials,
    organization: rp.organization,
    attribution: rp.attribution,
    episodeType: rp.episodeType,
    episodeStatus: rp.episodeStatus as EpisodeStatus,
    episodeDaysActive: rp.episodeDaysActive,
    pmpm: rp.pmpm,
    pmpmTarget: rp.pmpmTarget,
    rafScore: rp.rafScore,
    rafDelta: 0,
    riskTier: rp.riskLabel,
    erRiskPct: rp.erRiskPct,
    hccSuspects: rp.hccSuspects,
    hccValue: rp.hccValue,
    lastContact: rp.lastContact,
    attributionDetail: rp.attribution,
    phq9Score: rp.bhScore ?? 0,
    phq9Trend: rp.bhScoreLabel,
    auditC: rp.auditC,
    traumaFlag: false,
    bhRisk: rp.bhRisk as BHRiskLevel,
    bhReferralStatus: rp.bhReferralStatus,
    bhReferralDate: '',
    bhProvider: rp.bhProvider,
    pamScore: 2,
    pamLabel: rp.burdenScore,
    patientGoal: rp.patientGoal,
    transportStatus: rp.transportStatus,
    transportReferralId: '',
    referralStatus: 'Active',
    referralDaysOpen: 0,
    foodSecurity: rp.foodSecurity,
    housingStatus: rp.housingStatus,
    language: rp.language,
    literacy: 'moderate',
    cohortFlag: rp.cohortFlag,
    ruralDistance: rp.ruralDistance,
    disparityFlag: rp.disparityFlag,
    snapStatus: rp.snapStatus,
    careGaps: rp.careGaps.map((g) => ({
      id: g.id,
      domain: g.domain as GapDomain,
      name: g.name,
      status: g.status as GapStatus,
      daysOpen: g.daysOpen,
      assignedTo: g.assignedTo,
    })),
    pathwaySteps: rp.pathwaySteps.map((s) => ({
      id: s.id,
      label: s.label,
      completed: s.status === 'completed',
      date: s.date,
      metric: s.metric,
    })),
    crisisCount30d: 0,
    lastCrisisDate: null,
    activeCrisis: false,
  };
}

export function PatientContextProvider({ patientId, children }: { patientId?: string; children: React.ReactNode }) {
  const getInitialState = (): PatientSharedState => {
    if (!patientId) return defaultMariaState;
    const registryState = buildStateFromRegistry(patientId);
    if (registryState) return registryState;
    if (patientId === 'PAT-0042' || patientId === 'patient-001') return defaultDorothyState;
    if (patientId === 'MARIA_SD_001' || patientId === 'patient-maria' || patientId === '') return defaultMariaState;
    return defaultMariaState;
  };

  const [patient, setPatient] = useState<PatientSharedState>(getInitialState);

  // When running against a live FHIR server, overlay the state with live data.
  useEffect(() => {
    if (getFhirMockMode() || !patientId) return;
    // patientId may be a platform ID (MARIA_SD_001) or a FHIR id (patient-maria-001).
    // Try FHIR lookup by stripping the "patient/" prefix if present.
    const fhirId = patientId.replace(/^patient\//, '');
    getFhirClient()
      .getRegistryPatient(fhirId)
      .then((rp) => {
        if (rp) setPatient(buildStateFromFhirPatient(rp));
      })
      .catch((err) => {
        console.warn('[PatientContext] FHIR patient load failed, keeping mock state:', err);
      });
  }, [patientId]);

  const updateEpisodeStatus = useCallback((status: EpisodeStatus) => {
    setPatient((p) => ({ ...p, episodeStatus: status }));
  }, []);

  const updateBHRisk = useCallback((risk: BHRiskLevel) => {
    setPatient((p) => ({ ...p, bhRisk: risk }));
  }, []);

  const closeGap = useCallback((gapId: string, evidence: string) => {
    setPatient((p) => ({
      ...p,
      careGaps: p.careGaps.map((g) =>
        g.id === gapId ? { ...g, status: 'Closed' as GapStatus, evidence, closedDate: new Date().toLocaleDateString() } : g
      ),
    }));
  }, []);

  const updateGapStatus = useCallback((gapId: string, status: GapStatus) => {
    setPatient((p) => ({
      ...p,
      careGaps: p.careGaps.map((g) => (g.id === gapId ? { ...g, status } : g)),
    }));
  }, []);

  const completePathwayStep = useCallback((stepId: string, metric?: string) => {
    setPatient((p) => ({
      ...p,
      pathwaySteps: p.pathwaySteps.map((s) =>
        s.id === stepId ? { ...s, completed: true, metric: metric ?? s.metric } : s
      ),
    }));
  }, []);

  const updateCrisisState = useCallback((active: boolean) => {
    setPatient((p) => ({
      ...p,
      activeCrisis: active,
      crisisCount30d: active ? p.crisisCount30d + 1 : p.crisisCount30d,
    }));
  }, []);

  const updateSocialNeed = useCallback((field: keyof PatientSharedState, value: string) => {
    setPatient((p) => ({ ...p, [field]: value }));
  }, []);

  return (
    <PatientContext.Provider
      value={{
        patient,
        updateEpisodeStatus,
        updateBHRisk,
        closeGap,
        updateGapStatus,
        completePathwayStep,
        updateCrisisState,
        updateSocialNeed,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePatientContext() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error('usePatientContext must be used within PatientContextProvider');
  return ctx;
}
