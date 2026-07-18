'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { mockPatients, mockHCCSuspects, mockCareGaps, referralStore } from '@/lib/mockData';
import { getPatientByFhirId } from '@/lib/patientRegistry';
import Icon from '@/components/ui/AppIcon';
import type { SmartLaunchContext, CdsCard } from '@/lib/smartFhirTypes';
import { generateComprehensiveCarePlan, generateHolisticCarePlan, type GeneratedCarePlan } from '@/lib/services/carePlanGenerator';
import CarePlanForm from '@/app/patient-detail/components/CarePlanForm';
import ReferralModal, { type ReferralFormData } from './ReferralModal';
import GapClosureMetricsPanel from './GapClosureMetricsPanel';
import FhirResourceViewer from './FhirResourceViewer';
import { getFhirClient, getFhirMockMode } from '@/lib/services/fhirClient';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MdSmartSummaryScreenProps {
  launchContext: SmartLaunchContext;
  cdsCards: CdsCard[];
  onAuditEntry?: (action: string, details: Record<string, string>) => void;
  onOpenOrderEntry?: () => void;
  onOpenCdsAlerts?: () => void;
}

// ─── FHIR resource reference shape ───────────────────────────────────────────
interface FhirRef { resourceType: string; resourceId: string; label: string; }

// ─── Visit reasons with FHIR backing ─────────────────────────────────────────
const VISIT_REASONS = [
  {
    id: 'vr-diabetes',
    label: 'Diabetes Follow-Up',
    badge: 'Primary reason',
    badgeColor: 'text-[#706e6b]',
    leftBorder: 'border-l-4 border-[#0070d2]',
    clinicalNotes: 'T2DM (E11.65) — A1C 9.2% as of 2026-02-10 (Labcorp). Target <8%, previous 8.8% (2025-08), trend worsening. Metformin 500 mg BID PDC 61% — intervention recommended. CKD co-management with Nephrology referral pending. Furosemide 20 mg QD for volume management.',
    fhir: { resourceType: 'Condition', resourceId: 'condition-t2dm-maria', label: 'Condition: T2DM (E11.65)' } as FhirRef,
  },
  {
    id: 'vr-transition',
    label: 'High Risk Transition',
    badge: 'Needs review',
    badgeColor: 'text-[#c87400]',
    leftBorder: 'border-l-4 border-[#c87400]',
    clinicalNotes: '47-day high-risk transition phase. 2 ER visits in 60 days (last: 03/29/2026 — acute HF exacerbation). Post-acute follow-up overdue by 7 days. Urgency score 82/100. Social risk 53↑, housing unstable, food insecurity. Consider intensive outreach and transitional care protocol.',
    fhir: { resourceType: 'Flag', resourceId: 'flag-high-risk-maria', label: 'Flag: High-Risk Transition' } as FhirRef,
  },
  {
    id: 'vr-ckd',
    label: 'CKD Worsening',
    badge: 'Monitor closely',
    badgeColor: 'text-[#c87400]',
    leftBorder: 'border-l-4 border-[#c87400]',
    clinicalNotes: 'CKD Stage 3b (N18.32) — eGFR 42 mL/min/1.73m² (2026-03-15, declining from 48 in 2025-12). K+ 5.1 mEq/L — hyperkalemia risk. Potassium Chloride adherence 55% PDC. Nephrology consult recommended. Avoid NSAIDs and nephrotoxic agents. Annual urine microalbumin due.',
    fhir: { resourceType: 'Condition', resourceId: 'condition-ckd-maria', label: 'Condition: CKD Stage 3b (N18.32)' } as FhirRef,
  },
  {
    id: 'vr-a1c',
    label: 'A1C 9.2%',
    badge: 'Out of range',
    badgeColor: 'text-[#c23934]',
    leftBorder: 'border-l-4 border-[#c23934]',
    clinicalNotes: 'HbA1c 9.2% drawn 2026-02-10 at Labcorp (LOINC 4548-4). Target <8.0%. Previous results: 8.8% (2025-08), 8.5% (2025-02). Trend: worsening over 18 months. Metformin adherence 61% PDC. Consider Ozempic titration or specialist endocrinology referral. HEDIS CDC-001 gap open 112 days.',
    fhir: { resourceType: 'Observation', resourceId: 'obs-a1c-maria-20260210', label: 'Observation: HbA1c 9.2% (LOINC 4548-4)' } as FhirRef,
  },
];

type GapStatusType = 'In Process' | 'Not Started' | 'Waiting on Patient';
type SummaryComplexity = 'Concise' | 'Moderate-Detail' | 'High-Detail';
type CloseGapStep = 1 | 2 | 3;
type ConfirmDocStep = 1 | 2 | 3;
type ReferralStatus = 'Not Sent' | 'Pending' | 'Scheduled' | 'Completed';

// ─── Static Data ──────────────────────────────────────────────────────────────
const JOURNEY_PHASES = [
  { key: 'stable-management', label: 'Stable', color: 'bg-[#24a148]', textColor: 'text-[#24a148]', borderColor: 'border-[#24a148]', bgLight: 'bg-[#defbe6]' },
  { key: 'gap-in-care', label: 'Gap in Care', color: 'bg-[#f1c21b]', textColor: 'text-[#b45309]', borderColor: 'border-[#f1c21b]', bgLight: 'bg-[#fdf6dd]' },
  { key: 'deteriorating', label: 'Deteriorating', color: 'bg-[#ff832b]', textColor: 'text-[#ff832b]', borderColor: 'border-[#ff832b]', bgLight: 'bg-[#fff2e8]' },
  { key: 'high-risk-transition', label: 'High-Risk Transition', color: 'bg-[#da1e28]', textColor: 'text-[#da1e28]', borderColor: 'border-[#da1e28]', bgLight: 'bg-[#fce9e9]' },
  { key: 'post-acute-recovery', label: 'Post-Acute', color: 'bg-[#0070d2]', textColor: 'text-[#0070d2]', borderColor: 'border-[#0070d2]', bgLight: 'bg-[#edf5ff]' },
];

const CURRENT_PHASE_KEY = 'high-risk-transition';

const SDOH_BADGES = [
  { label: 'Social Risk', value: '53Γåæ', color: 'bg-[#ffe0e0] text-[#da1e28] border-[#ffb3b8]' },
  { label: 'Food Risk', value: 'High', color: 'bg-[#fdf6dd] text-[#b45309] border-[#f1c21b]' },
  { label: 'Housing', value: 'Unstable', color: 'bg-[#fdf6dd] text-[#b45309] border-[#f1c21b]' },
];

const CARE_GAPS_ENHANCED = [
  { id: 'cg-001', name: 'A1C Control — Diabetes', program: 'HEDIS', cmsMips: 'CDC-001', priority: 'High', status: 'In Process' as GapStatusType, daysOpen: 112 },
  { id: 'cg-002', name: 'SDoH Screening', program: 'MIPS', cmsMips: 'MIPS-487', priority: 'Medium', status: 'In Process' as GapStatusType, daysOpen: 67 },
  { id: 'cg-003', name: 'Mental/Behavioral Health', program: 'MIPS', cmsMips: 'MIPS-134', priority: 'Medium', status: 'Not Started' as GapStatusType, daysOpen: 45 },
  { id: 'cg-004', name: 'Statin Therapy — CVD', program: 'HEDIS', cmsMips: 'SPC-438', priority: 'High', status: 'Waiting on Patient' as GapStatusType, daysOpen: 89 },
  { id: 'cg-005', name: 'Controlling Hypertension', program: 'HEDIS', cmsMips: 'CBP-236', priority: 'High', status: 'Waiting on Patient' as GapStatusType, daysOpen: 134 },
  { id: 'cg-006', name: 'Colorectal Cancer Screening', program: 'HEDIS', cmsMips: 'COL-113', priority: 'Medium', status: 'Not Started' as GapStatusType, daysOpen: 22 },
];

const MEDS_DATA = [
  {
    name: 'Lisinopril 10mg',
    freq: 'QD',
    adherence: 78,
    flag: false,
    ndc: '68180-0513-01',
    prescriber: 'Dr. Sarah Chen, MD',
    datePrescribed: '2024-08-15',
    dosage: '10mg',
    quantity: '90 tablets',
    refills: '3 remaining'
  },
  {
    name: 'Metformin 500mg',
    freq: 'BID',
    adherence: 61,
    flag: true,
    ndc: '00093-7214-01',
    prescriber: 'Dr. Michael Rodriguez, MD',
    datePrescribed: '2024-06-20',
    dosage: '500mg',
    quantity: '180 tablets',
    refills: '2 remaining'
  },
  {
    name: 'Atorvastatin 40mg',
    freq: 'QHS',
    adherence: 84,
    flag: false,
    ndc: '00071-0156-23',
    prescriber: 'Dr. Sarah Chen, MD',
    datePrescribed: '2024-09-10',
    dosage: '40mg',
    quantity: '90 tablets',
    refills: '5 remaining'
  },
  {
    name: 'Furosemide 20mg',
    freq: 'QD',
    adherence: 72,
    flag: false,
    ndc: '00054-3280-25',
    prescriber: 'Dr. James Wilson, MD',
    datePrescribed: '2024-07-05',
    dosage: '20mg',
    quantity: '90 tablets',
    refills: '4 remaining'
  },
  {
    name: 'Potassium Chloride 20mEq',
    freq: 'QD',
    adherence: 55,
    flag: true,
    ndc: '00054-4109-25',
    prescriber: 'Dr. James Wilson, MD',
    datePrescribed: '2024-07-05',
    dosage: '20mEq',
    quantity: '90 tablets',
    refills: '1 remaining'
  },
];

const LABS_DATA = [
  { name: 'A1C', value: '9.2%', date: '2026-02-10', flag: true, ref: '<7.0%' },
  { name: 'eGFR', value: '42', date: '2026-03-15', flag: true, ref: '>60' },
  { name: 'K+', value: '5.1 mEq/L', date: '2026-04-01', flag: true, ref: '3.5–5.0' },
  { name: 'LDL', value: '118 mg/dL', date: '2026-02-10', flag: false, ref: '<100' },
  { name: 'BNP', value: '210 pg/mL', date: '2026-03-20', flag: true, ref: '<100' },
  { name: 'BP', value: '158/96', date: '2026-04-01', flag: true, ref: '<130/80' },
];

const CDI_OPPORTUNITIES = [
  {
    id: 'cdi-001',
    condition: 'T2DM with CKD Stage 3',
    icd: 'E11.65 + N18.32',
    hcc: 'HCC 18 + HCC 136',
    confidence: 91,
    rafDelta: '+0.42',
    revenueDelta: '$3,200',
    evidenceSources: ['EMR', 'Claims', 'HIE'],
    justification: 'Claims data and LPR confirm active T2DM with CKD Stage 3b. A1C 9.2% and eGFR 42 support combined coding. Both conditions require separate HCC capture for accurate RAF.',
    signals: [
      { label: 'A1C', value: '9.2% (2026-02-10)', source: 'EMR', flagged: true },
      { label: 'eGFR', value: '42 (2026-03-15)', source: 'EMR', flagged: true },
      { label: 'Claims DX', value: 'E11.65 coded 2025-11-14', source: 'Claims', flagged: false },
      { label: 'HIE Record', value: 'Nephrology note 2025-12-01', source: 'HIE', flagged: false },
    ],
    icd10Guidance: 'Use E11.65 (T2DM with hyperglycemia) + N18.32 (CKD Stage 3b). Dual coding required for HCC 136 capture.',
    currentCode: 'E11 (Type 2 Diabetes)',
    suggestedCode: 'E11.65 (T2D with hyperglycemia + CKD)',
  },
  {
    id: 'cdi-002',
    condition: 'Heart Failure — HFpEF',
    icd: 'I50.30',
    hcc: 'HCC 85',
    confidence: 87,
    rafDelta: '+0.28',
    revenueDelta: '$2,100',
    evidenceSources: ['EMR', 'Claims'],
    justification: 'Echo confirms EF 55% consistent with HFpEF. BNP 210 pg/mL elevated. Prior year claims coded I50.9 (unspecified) — specificity upgrade required for HCC 85 capture.',
    signals: [
      { label: 'Echo EF', value: '55% (2026-01-15)', source: 'EMR', flagged: false },
      { label: 'BNP', value: '210 pg/mL (2026-03-20)', source: 'EMR', flagged: true },
      { label: 'Prior Claim', value: 'I50.9 coded 2025-09-10', source: 'Claims', flagged: false },
    ],
    icd10Guidance: 'Upgrade from I50.9 to I50.30 (HFpEF, unspecified). Confirm systolic function preserved on echo documentation.',
    currentCode: 'I50.9 (Heart Failure, unspecified)',
    suggestedCode: 'I50.30 (HFpEF, unspecified)',
  },
  {
    id: 'cdi-003',
    condition: 'Atrial Fibrillation',
    icd: 'I48.91',
    hcc: 'HCC 96',
    confidence: 79,
    rafDelta: '+0.19',
    revenueDelta: '$1,450',
    evidenceSources: ['EMR', 'HIE'],
    justification: 'ECG on 2026-01-20 confirms persistent AFib. Not coded in current encounter. HCC 96 requires annual recapture — last coded 2025-08-12.',
    signals: [
      { label: 'ECG', value: 'Persistent AFib (2026-01-20)', source: 'EMR', flagged: true },
      { label: 'Last Coded', value: 'I48.91 — 2025-08-12', source: 'Claims', flagged: false },
    ],
    icd10Guidance: 'Use I48.91 (unspecified AFib). Annual recapture required — HCC 96 does not carry forward.',
    currentCode: 'Not coded this encounter',
    suggestedCode: 'I48.91 (Unspecified AFib)',
  },
];

const CHRONIC_CONDITIONS = [
  { code: 'T2DM', label: 'Type 2 Diabetes', icd: 'E11.65', hcc: 'HCC 18', acuity: 'critical', metric: 'A1C 9.2%', trend: 'worsening' },
  { code: 'CKD', label: 'CKD Stage 3b', icd: 'N18.32', hcc: 'HCC 136', acuity: 'critical', metric: 'eGFR 42', trend: 'worsening' },
  { code: 'HTN', label: 'Hypertension', icd: 'I10', hcc: 'HCC 85', acuity: 'high', metric: 'BP 158/96', trend: 'stable' },
  { code: 'HF', label: 'Heart Failure (HFpEF)', icd: 'I50.30', hcc: 'HCC 85', acuity: 'high', metric: 'EF 55%', trend: 'stable' },
];

const RECENT_ACTIVITY = [
  { date: '04/01/2026', type: 'Lab', desc: 'BMP + A1C drawn', flag: true },
  { date: '03/29/2026', type: 'ER', desc: 'ER visit — chest pain', flag: true },
  { date: '03/19/2026', type: 'Visit', desc: 'Diabetes F/U — Dr. Whitfield', flag: false },
  { date: '03/17/2026', type: 'BP', desc: 'BP Check 158/96', flag: true },
  { date: '02/18/2026', type: 'ER', desc: 'ER visit — dyspnea', flag: true },
];

const VITALS_TREND = [
  { label: 'BP Systolic', unit: 'mmHg', values: [142, 148, 155, 158], dates: ['Q3 25', 'Q4 25', 'Q1 26', 'Apr 26'], flag: true },
  { label: 'A1C', unit: '%', values: [8.1, 8.6, 9.0, 9.2], dates: ['Q3 25', 'Q4 25', 'Q1 26', 'Apr 26'], flag: true },
  { label: 'eGFR', unit: 'mL/min', values: [51, 48, 44, 42], dates: ['Q3 25', 'Q4 25', 'Q1 26', 'Apr 26'], flag: true },
];

const ACTIVE_REFERRALS = [
  { id: 'ref-001', specialty: 'Cardiology', provider: 'Dr. Patel', tier: 'Tier 1', status: 'Pending' as ReferralStatus, urgency: 'Routine', date: '2026-03-28', reason: 'HFpEF follow-up, BNP elevation' },
  { id: 'ref-002', specialty: 'Nephrology', provider: 'Unassigned', tier: '—', status: 'Not Sent' as ReferralStatus, urgency: 'Urgent', date: '2026-04-01', reason: 'CKD Stage 3b progression, eGFR 42' },
  { id: 'ref-003', specialty: 'Ophthalmology', provider: 'Dr. Chen', tier: 'Tier 2', status: 'Scheduled' as ReferralStatus, urgency: 'Routine', date: '2026-04-15', reason: 'Annual diabetic eye exam' },
  { id: 'ref-004', specialty: 'Endocrinology', provider: 'Dr. Reyes', tier: 'Tier 1', status: 'Completed' as ReferralStatus, urgency: 'Routine', date: '2026-02-20', reason: 'T2DM management — A1C 9.2%' },
];

const SOURCE_BADGE: Record<string, string> = {
  EMR: 'bg-[#d0e2ff] text-[#0070d2]',
  Claims: 'bg-[#fdf6dd] text-[#b45309]',
  HIE: 'bg-[#defbe6] text-[#0e6027]',
  LPR: 'bg-[#f6f2ff] text-[#6929c4]',
};

const GAP_STATUS_STYLE: Record<GapStatusType, { dot: string; badge: string; label: string }> = {
  'In Process': { dot: 'bg-[#0070d2]', badge: 'bg-[#d0e2ff] text-[#0070d2]', label: 'In Process' },
  'Not Started': { dot: 'bg-carbon-gray-40', badge: 'bg-carbon-gray-20 text-[#706e6b]', label: 'Not Started' },
  'Waiting on Patient': { dot: 'bg-[#f1c21b]', badge: 'bg-[#fdf6dd] text-[#b45309]', label: 'Waiting on Patient' },
};

const REFERRAL_STATUS_STYLE: Record<ReferralStatus, { dot: string; badge: string }> = {
  'Not Sent': { dot: 'bg-carbon-gray-40', badge: 'bg-carbon-gray-20 text-[#706e6b]' },
  'Pending': { dot: 'bg-[#f1c21b]', badge: 'bg-[#fdf6dd] text-[#b45309]' },
  'Scheduled': { dot: 'bg-[#0070d2]', badge: 'bg-[#d0e2ff] text-[#0070d2]' },
  'Completed': { dot: 'bg-[#24a148]', badge: 'bg-[#defbe6] text-[#0e6027]' },
};

const ENCOUNTER_TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'results', label: 'Results' },
  { key: 'orders', label: 'Orders' },
  { key: 'plan', label: 'Plan' },
  { key: 'return', label: 'Γå⌐ Return to Cerner' },
];

// ─── Sparkline Component ──────────────────────────────────────────────────────
function Sparkline({ values, flag }: { values: number[]; flag: boolean }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 90;
  const h = 28;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  const color = flag ? '#da1e28' : '#24a148';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 6) - 3;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

// ─── Close Gap Modal ──────────────────────────────────────────────────────────
function CloseGapModal({ gap, onClose, onComplete }: { gap: typeof CARE_GAPS_ENHANCED[0]; onClose: () => void; onComplete: (gapId: string) => void }) {
  const [step, setStep] = useState<CloseGapStep>(1);
  const [method, setMethod] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [attested, setAttested] = useState(false);
  const METHODS = ['Performed in this encounter', 'Performed previously — date picker', 'Patient declined — reason required', 'Medically excluded — exclusion code required'];
  const SOURCES = ['EMR', 'HIE', 'CLAIMS', 'Patient Report'];
  const toggleSource = (s: string) => setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-carbon-gray-20 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-[#3e3e3c]">Close Care Gap</p>
            <p className="text-2xs text-[#706e6b] mt-0.5">Mrs. Alex Kirby — {gap.name} · {gap.cmsMips}</p>
          </div>
          <button onClick={onClose} className="text-[#706e6b] hover:text-[#3e3e3c] p-1"><Icon name="XMarkIcon" size={16} /></button>
        </div>
        <div className="flex border-b border-carbon-gray-20">
          {[{ n: 1, label: 'Closure Method' }, { n: 2, label: 'Evidence & Documentation' }, { n: 3, label: 'Confirm & Sign' }].map(({ n, label }) => (
            <div key={n} className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-2xs font-semibold border-b-2 transition-colors ${step === n ? 'border-[#0070d2] text-[#0070d2] bg-[#edf5ff]' : step > n ? 'border-[#24a148] text-[#24a148]' : 'border-transparent text-[#8a8886]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold flex-shrink-0 ${step === n ? 'bg-[#0070d2] text-white' : step > n ? 'bg-[#24a148] text-white' : 'bg-carbon-gray-20 text-[#706e6b]'}`}>{step > n ? 'Γ£ô' : n}</span>
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#3e3e3c] mb-3">How was this gap addressed?</p>
              {METHODS.map((m) => (
                <label key={m} className="flex items-center gap-3 px-3 py-2.5 border border-carbon-gray-20 cursor-pointer hover:bg-carbon-gray-10 transition-colors">
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-[#0070d2]" />
                  <span className="text-xs text-[#3e3e3c]">{m}</span>
                </label>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#3e3e3c] mb-2">Supporting Sources</p>
                <div className="flex gap-2 flex-wrap">
                  {SOURCES.map((s) => (
                    <button key={s} onClick={() => toggleSource(s)} className={`text-xs font-semibold px-3 py-1.5 border transition-colors ${sources.includes(s) ? 'bg-[#0070d2] text-white border-[#0070d2]' : 'bg-white text-[#706e6b] border-carbon-gray-30 hover:border-[#0070d2]'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#3e3e3c] mb-2">Clinical Note</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Enter clinical note supporting gap closure..." className="w-full border border-carbon-gray-30 px-3 py-2 text-xs text-[#3e3e3c] resize-none focus:outline-none focus:border-[#0070d2]" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#f4f6f9] border border-carbon-gray-20 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-[#3e3e3c] mb-2">Closure Summary</p>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">Gap</span><span className="font-medium text-[#3e3e3c]">{gap.name}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">Measure</span><span className="font-medium text-[#3e3e3c]">{gap.cmsMips}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">Method</span><span className="font-medium text-[#3e3e3c]">{method || '—'}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">Evidence Sources</span><span className="font-medium text-[#3e3e3c]">{sources.join(', ') || '—'}</span></div>
              </div>
              <div className="bg-[#defbe6] border border-[#a7f0ba] px-3 py-2 flex items-center gap-2">
                <Icon name="TrophyIcon" size={12} className="text-[#0e6027]" />
                <p className="text-2xs text-[#0e6027] font-semibold">MIPS Quality Score Impact: Est. +4 pts upon closure</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 accent-[#0070d2]" />
                <span className="text-2xs text-[#706e6b] leading-relaxed">I attest that the information provided is accurate and complete to the best of my clinical knowledge. This documentation will be submitted to the payer for quality measure credit.</span>
              </label>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-carbon-gray-20 flex items-center justify-between">
          <button onClick={onClose} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-10 transition-colors">Cancel</button>
          <div className="flex items-center gap-2">
            {step > 1 && <button onClick={() => setStep((s) => (s - 1) as CloseGapStep)} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-10 transition-colors">ΓåÉ Back</button>}
            {step < 3 ? (
              <button onClick={() => setStep((s) => (s + 1) as CloseGapStep)} disabled={step === 1 && !method} className="text-xs px-4 py-1.5 bg-[#0070d2] text-white hover:bg-[#005fb2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Next ΓåÆ</button>
            ) : (
              <button onClick={() => { onComplete(gap.id); onClose(); }} disabled={!attested} className="text-xs px-4 py-1.5 bg-[#0e6027] text-white hover:bg-[#0a4d1e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Confirm & Close Gap</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm & Document Modal ─────────────────────────────────────────────────
function ConfirmDocumentModal({ cdi, onClose, onComplete }: { cdi: typeof CDI_OPPORTUNITIES[0]; onClose: () => void; onComplete: (cdiId: string) => void }) {
  const [step, setStep] = useState<ConfirmDocStep>(1);
  const [icdOverride, setIcdOverride] = useState(cdi.suggestedCode);
  const [submitTarget, setSubmitTarget] = useState<'EMR' | 'Payer' | 'Both'>('Both');
  const [attested, setAttested] = useState(false);
  const rafDeltaNum = parseFloat(cdi.rafDelta);
  const revenueNum = parseInt(cdi.revenueDelta.replace(/[$,]/g, ''));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-carbon-gray-20 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-[#3e3e3c]">Confirm Diagnosis & Document</p>
            <p className="text-2xs text-[#706e6b] mt-0.5">Mrs. Alex Kirby — {cdi.condition}</p>
          </div>
          <button onClick={onClose} className="text-[#706e6b] hover:text-[#3e3e3c] p-1"><Icon name="XMarkIcon" size={16} /></button>
        </div>
        <div className="flex border-b border-carbon-gray-20">
          {[{ n: 1, label: 'Evidence Review' }, { n: 2, label: 'ICD-10 Confirmation' }, { n: 3, label: 'Sign & Submit' }].map(({ n, label }) => (
            <div key={n} className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-2xs font-semibold border-b-2 transition-colors ${step === n ? 'border-[#b45309] text-[#b45309] bg-[#fdf6dd]' : step > n ? 'border-[#24a148] text-[#24a148]' : 'border-transparent text-[#8a8886]'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold flex-shrink-0 ${step === n ? 'bg-[#b45309] text-white' : step > n ? 'bg-[#24a148] text-white' : 'bg-carbon-gray-20 text-[#706e6b]'}`}>{step > n ? 'Γ£ô' : n}</span>
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap mb-3">{cdi.evidenceSources.map((src) => (<span key={src} className={`text-2xs font-semibold px-2 py-0.5 ${SOURCE_BADGE[src] || 'bg-carbon-gray-20 text-[#706e6b]'}`}>{src}</span>))}</div>
              <div className="space-y-1.5">{cdi.signals.map((sig, i) => (<div key={i} className={`flex items-center gap-2 px-3 py-2 text-2xs border ${sig.flagged ? 'bg-[#fff8f8] border-[#ffb3b8]' : 'bg-white border-carbon-gray-20'}`}><span className={`font-semibold px-1.5 py-0.5 text-2xs ${SOURCE_BADGE[sig.source] || ''}`}>{sig.source}</span><span className="text-[#706e6b]">{sig.label}:</span><span className={`font-medium ${sig.flagged ? 'text-[#da1e28]' : 'text-[#3e3e3c]'}`}>{sig.value}</span></div>))}</div>
              <div className="bg-white border border-carbon-gray-20 px-3 py-2"><p className="text-2xs font-semibold text-[#706e6b] mb-1 uppercase tracking-wide">Clinical Justification</p><p className="text-2xs text-[#706e6b] leading-relaxed">{cdi.justification}</p></div>
              <div className="flex items-center gap-4 bg-[#f4f6f9] px-3 py-2">
                <div><p className="text-2xs text-[#706e6b]">Confidence</p><p className="text-sm font-bold font-mono text-[#24a148]">{cdi.confidence}%</p></div>
                <div><p className="text-2xs text-[#706e6b]">RAF Delta</p><p className="text-sm font-bold font-mono text-[#0e6027]">{cdi.rafDelta}</p></div>
                <div><p className="text-2xs text-[#706e6b]">Revenue at Risk</p><p className="text-sm font-bold font-mono text-[#b45309]">{cdi.revenueDelta}</p></div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="bg-[#f4f6f9] border border-carbon-gray-20 px-3 py-2.5"><p className="text-2xs text-[#706e6b] mb-0.5">Current Code</p><p className="text-xs font-mono font-semibold text-[#3e3e3c]">{cdi.currentCode}</p></div>
                <div className="bg-[#defbe6] border border-[#a7f0ba] px-3 py-2.5"><p className="text-2xs text-[#0e6027] mb-0.5">Suggested Specificity Upgrade</p><p className="text-xs font-mono font-semibold text-[#0e6027]">{cdi.suggestedCode}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#3e3e3c] mb-1.5">Override / Modify ICD-10</p>
                <input type="text" value={icdOverride} onChange={(e) => setIcdOverride(e.target.value)} className="w-full border border-carbon-gray-30 px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#b45309]" />
              </div>
              <div className="bg-[#fdf6dd] border border-[#f1c21b] px-4 py-3">
                <p className="text-2xs font-semibold text-[#b45309] mb-2">RAF Impact Estimate</p>
                <div className="flex items-center gap-6">
                  <div><p className="text-2xs text-[#706e6b]">RAF Delta</p><p className="text-lg font-bold font-mono text-[#0e6027]">{rafDeltaNum > 0 ? '+' : ''}{rafDeltaNum.toFixed(2)}</p></div>
                  <div><p className="text-2xs text-[#706e6b]">Est. Revenue Impact</p><p className="text-lg font-bold font-mono text-[#b45309]">${revenueNum.toLocaleString()}</p></div>
                  <div><p className="text-2xs text-[#706e6b]">Submission Deadline</p><p className="text-xs font-semibold text-[#3e3e3c]">Dec 31, 2026</p></div>
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#f4f6f9] border border-carbon-gray-20 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-[#3e3e3c] mb-2">Submission Summary</p>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">Condition</span><span className="font-medium text-[#3e3e3c]">{cdi.condition}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">ICD-10 Code</span><span className="font-mono font-medium text-[#3e3e3c]">{icdOverride}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">RAF Delta</span><span className="font-mono font-semibold text-[#0e6027]">{cdi.rafDelta}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-[#706e6b]">Revenue Impact</span><span className="font-mono font-semibold text-[#b45309]">{cdi.revenueDelta}</span></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#3e3e3c] mb-2">Submit To</p>
                <div className="flex gap-2">
                  {(['EMR', 'Payer', 'Both'] as const).map((t) => (
                    <button key={t} onClick={() => setSubmitTarget(t)} className={`text-xs font-semibold px-4 py-2 border transition-colors ${submitTarget === t ? 'bg-[#0070d2] text-white border-[#0070d2]' : 'bg-white text-[#706e6b] border-carbon-gray-30 hover:border-[#0070d2]'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 accent-[#0070d2]" />
                <span className="text-2xs text-[#706e6b] leading-relaxed">I attest that this diagnosis is supported by clinical evidence documented in the medical record and meets the criteria for the specified ICD-10 code.</span>
              </label>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-carbon-gray-20 flex items-center justify-between">
          <button onClick={onClose} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-10 transition-colors">Cancel</button>
          <div className="flex items-center gap-2">
            {step > 1 && <button onClick={() => setStep((s) => (s - 1) as ConfirmDocStep)} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-10 transition-colors">ΓåÉ Back</button>}
            {step < 3 ? (
              <button onClick={() => setStep((s) => (s + 1) as ConfirmDocStep)} className="text-xs px-4 py-1.5 bg-[#b45309] text-white hover:bg-[#8a3d07] transition-colors">Next ΓåÆ</button>
            ) : (
              <button onClick={() => { onComplete(cdi.id); onClose(); }} disabled={!attested} className="text-xs px-4 py-1.5 bg-[#0e6027] text-white hover:bg-[#0a4d1e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Sign & Submit to {submitTarget}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Referral Triage Actions ──────────────────────────────────────────────────
function ReferralTriageMenu({ referral, onAction }: { referral: typeof ACTIVE_REFERRALS[0]; onAction: (refId: string, action: string) => void }) {
  const [open, setOpen] = useState(false);
  const actions: Record<ReferralStatus, Array<{ label: string; icon: string; color: string }>> = {
    'Not Sent': [
      { label: 'Approve & Send', icon: 'CheckCircleIcon', color: 'text-[#0e6027]' },
      { label: 'Modify', icon: 'PencilSquareIcon', color: 'text-[#0070d2]' },
      { label: 'Cancel', icon: 'XCircleIcon', color: 'text-[#da1e28]' },
    ],
    'Pending': [
      { label: 'Upgrade Urgency', icon: 'ArrowUpCircleIcon', color: 'text-[#da1e28]' },
      { label: 'Add Clinical Note', icon: 'PencilSquareIcon', color: 'text-[#0070d2]' },
      { label: 'Cancel', icon: 'XCircleIcon', color: 'text-[#da1e28]' },
      { label: 'Reassign Provider', icon: 'ArrowPathIcon', color: 'text-[#b45309]' },
    ],
    'Scheduled': [
      { label: 'Add Note', icon: 'PencilSquareIcon', color: 'text-[#0070d2]' },
      { label: 'View Appointment', icon: 'CalendarIcon', color: 'text-[#0070d2]' },
      { label: 'Cancel', icon: 'XCircleIcon', color: 'text-[#da1e28]' },
    ],
    'Completed': [
      { label: 'View Outcome', icon: 'DocumentTextIcon', color: 'text-[#0070d2]' },
      { label: 'Create Follow-up', icon: 'PlusCircleIcon', color: 'text-[#0e6027]' },
    ],
  };
  const menuActions = actions[referral.status];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-2xs font-semibold px-2 py-1 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-10 transition-colors flex items-center gap-1 whitespace-nowrap"
      >
        Actions <Icon name={open ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={9} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-0.5 z-20 bg-white border border-carbon-gray-20 shadow-lg min-w-[160px]">
          {menuActions.map((act) => (
            <button
              key={act.label}
              onClick={() => { onAction(referral.id, act.label); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-2xs hover:bg-carbon-gray-10 transition-colors text-left"
            >
              <Icon name={act.icon as any} size={11} className={act.color} />
              <span className="text-[#3e3e3c]">{act.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Pagination helpers (module-level) ───────────────────────────────────────
const PAGE_SIZE = 5;

function paginate<T>(arr: T[], page: number): T[] {
  return arr.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
}

function PanelPager({ total, page, onPage }: { total: number; page: number; onPage: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="border-t border-carbon-gray-20 px-3 py-1.5 flex items-center justify-between bg-[#f4f6f9] flex-shrink-0">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="text-2xs font-semibold px-2 py-0.5 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ΓåÉ Prev
      </button>
      <span className="text-2xs text-[#706e6b]">
        {page + 1} / {totalPages}
        <span className="ml-1 text-[#8a8886]">({total} total)</span>
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
        className="text-2xs font-semibold px-2 py-0.5 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next ΓåÆ
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MdSmartSummaryScreen({ launchContext, cdsCards, onAuditEntry, onOpenOrderEntry, onOpenCdsAlerts }: MdSmartSummaryScreenProps) {
  // Get Maria Redhawk from patient registry using FHIR ID
  const registryPatient = getPatientByFhirId(launchContext.patientId);

  // Use registry patient data, or fall back to mock patient for display purposes only
  const patient = mockPatients.find((p) => p.id === launchContext.patientId) || mockPatients[0];
  const hccSuspects = mockHCCSuspects.filter((h) => h.patientId === patient.id).slice(0, 3);
  
  // Create display patient object that prioritizes registry data over mock data
  const displayPatient = registryPatient ? {
    ...patient,
    name: registryPatient.name,
    id: launchContext.patientId,
    dob: registryPatient.dob,
    age: registryPatient.age,
  } : patient;
  const patientPhotoInitial = displayPatient.name?.charAt(0) || 'P';

  // ── FHIR-backed Coverage & Consent ──────────────────────────────────────────
  // Defaults (mock / fallback values shown until FHIR fetch resolves)
  const [coverageData, setCoverageData] = useState<{
    primary: string; memberId: string; secondary: string; pcp: string;
  }>({
    primary: patient.payer ?? 'CMS / Medicare Advantage',
    memberId: patient.insuranceId ?? 'MCR-4472910',
    secondary: 'State Medicaid Wrap',
    pcp: launchContext.practitionerName ?? 'Bennett County Health PCP',
  });
  const [consentsData, setConsentsData] = useState<string[]>(['SMART on FHIR', 'Release of Information', 'Care Coordination']);
  const [fhirCoverageRef, setFhirCoverageRef] = useState<FhirRef | null>(null);
  const [fhirConsentRef, setFhirConsentRef] = useState<FhirRef | null>(null);

  useEffect(() => {
    if (getFhirMockMode()) return; // stay with mock defaults
    const client = getFhirClient();
    // Fetch Coverage
    client.search<{ entry?: { resource?: Record<string, unknown> }[] }>(
      'Coverage', { patient: launchContext.patientId, status: 'active', _count: 5 }
    ).then(bundle => {
      const entries = bundle.entry ?? [];
      if (entries.length > 0) {
        const r0 = entries[0].resource ?? {};
        const r1 = entries[1]?.resource ?? {};
        setCoverageData({
          primary: String((r0 as any)?.payor?.[0]?.display ?? coverageData.primary),
          memberId: String((r0 as any)?.subscriberId ?? coverageData.memberId),
          secondary: String((r1 as any)?.payor?.[0]?.display ?? coverageData.secondary),
          pcp: coverageData.pcp,
        });
        if (r0.id) setFhirCoverageRef({ resourceType: 'Coverage', resourceId: String(r0.id), label: 'Coverage: Primary Insurance' });
      }
    }).catch(() => {}); // silently fall back

    // Fetch Consent
    client.search<{ entry?: { resource?: Record<string, unknown> }[] }>(
      'Consent', { patient: launchContext.patientId, status: 'active', _count: 10 }
    ).then(bundle => {
      const entries = bundle.entry ?? [];
      if (entries.length > 0) {
        const names = entries.map(e => String((e.resource as any)?.scope?.coding?.[0]?.display ?? (e.resource as any)?.id ?? 'Consent'));
        setConsentsData(names);
        const firstId = String(entries[0].resource?.id ?? '');
        if (firstId) setFhirConsentRef({ resourceType: 'Consent', resourceId: firstId, label: 'Consent record' });
      }
    }).catch(() => {}); // silently fall back
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchContext.patientId]);

  // Convenience aliases
  const primaryInsurance = coverageData.primary;
  const secondaryInsurance = coverageData.secondary;
  const patientConsents = consentsData;
  
  // CRITICAL: Use ONLY registry care gaps for Maria Redhawk - no fallback to mockCareGaps
  // This ensures the care plan matches the PowerPoint exactly (9 gaps: 3 Clinical, 2 BH, 4 Social)
  const careGaps = registryPatient?.careGaps.map(gap => ({
    id: gap.id,
    patientId: launchContext.patientId, // Use FHIR ID, not mock patient ID
    measureId: gap.id,
    measureName: gap.name,
    program: gap.domain === 'Clinical' ? 'HEDIS' : gap.domain === 'BH' ? 'MIPS' : 'HEDIS' as 'HEDIS' | 'STARS' | 'MIPS',
    status: gap.status as 'Open' | 'In Progress' | 'Closed' | 'Excluded' | 'Expired',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    daysOpen: gap.daysOpen,
    lastActionDate: new Date(Date.now() - gap.daysOpen * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedTo: gap.assignedTo,
    notes: `${gap.domain} gap - ${gap.daysOpen} days open`,
    closureRequirement: gap.name,
  })) || []; // Empty array if registry patient not found - DO NOT use mockCareGaps
  
  console.log('≡ƒöì DEBUG - Final Care Gaps Count:', careGaps.length);
  console.log('≡ƒöì DEBUG - Care Gap Names:', careGaps.map(g => g.measureName));

  // ── FHIR viewer modal state ──────────────────────────────────────────────
  const [fhirViewer, setFhirViewer] = useState<FhirRef | null>(null);

  // ── Visit reason accordion state ─────────────────────────────────────────
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  // ── Care-gaps panel scroll ref ───────────────────────────────────────────
  const careGapsRef = useRef<HTMLDivElement>(null);

  const [activeEncounterTab, setActiveEncounterTab] = useState('summary');
  const [journeyExpanded, setJourneyExpanded] = useState(false);
  const [complexity, setComplexity] = useState<SummaryComplexity>('Moderate-Detail');
  const [showCdi, setShowCdi] = useState(false);
  const [expandedCdi, setExpandedCdi] = useState<string | null>(null);
  const [canViewFinancials, setCanViewFinancials] = useState(false);
  const [closeGapTarget, setCloseGapTarget] = useState<typeof CARE_GAPS_ENHANCED[0] | null>(null);
  const [confirmDocTarget, setConfirmDocTarget] = useState<typeof CDI_OPPORTUNITIES[0] | null>(null);
  const [closedGaps, setClosedGaps] = useState<string[]>([]);
  const [confirmedCdis, setConfirmedCdis] = useState<string[]>([]);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string>('Conditions');
  const [showFhirDrawer, setShowFhirDrawer] = useState(false);
  
  // Care Plan Generation State
  const [showGeneratedPlan, setShowGeneratedPlan] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedCarePlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Referral State
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralSuccess, setReferralSuccess] = useState<string | null>(null);

  // ── Pagination state (5 rows per page) ──────────────────────────────────
  const [chronicPage, setChronicPage] = useState(0);
  const [medsPage, setMedsPage] = useState(0);
  const [gapsPage, setGapsPage] = useState(0);
  const [labsPage, setLabsPage] = useState(0);
  const [cdiPage, setCdiPage] = useState(0);
  const [vitalsPage, setVitalsPage] = useState(0);
  const [referralsPage, setReferralsPage] = useState(0);
  const [activityPage, setActivityPage] = useState(0);

  const currentPhaseIdx = JOURNEY_PHASES.findIndex((p) => p.key === CURRENT_PHASE_KEY);
  const currentPhase = JOURNEY_PHASES[currentPhaseIdx];
  const totalRafAtRisk = CDI_OPPORTUNITIES.reduce((s, c) => s + parseFloat(c.rafDelta), 0);
  const totalRevenueAtRisk = CDI_OPPORTUNITIES.reduce((s, c) => s + parseInt(c.revenueDelta.replace(/[$,]/g, '')), 0);

  const handleGapClose = useCallback((gapId: string) => {
    setClosedGaps((prev) => [...prev, gapId]);
    onAuditEntry?.('care-gap-closed', { gapId, action: 'Close Gap modal completed' });
  }, [onAuditEntry]);

  const handleCdiConfirm = useCallback((cdiId: string) => {
    setConfirmedCdis((prev) => [...prev, cdiId]);
    onAuditEntry?.('dx-confirmed', { cdiId, action: 'Confirm & Document modal completed' });
  }, [onAuditEntry]);

  const router = useRouter();

  const handleGenerateComprehensive = async () => {
    setIsGenerating(true);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      console.log('Starting care plan generation with:', {
        patient: patient?.id,
        hccSuspectsCount: hccSuspects?.length,
        careGapsCount: careGaps?.length
      });

      // Use holistic care plan for Maria Redhawk, standard for others
      const generated = (patient.id === 'patient-001' || patient.name.toLowerCase().includes('maria'))
        ? generateHolisticCarePlan({
            patient,
            hccSuspects,
            careGaps,
            alerts: [], // No alerts in this context
          })
        : generateComprehensiveCarePlan({
            patient,
            hccSuspects: [], // Don't generate goals from HCC suspects - only use care gaps
            careGaps,
            alerts: [], // Don't generate goals from alerts
        clinicalData: null,
      });

      console.log('Care plan generated successfully:', generated?.title);
      console.log(`Γ£à ${referralStore.getAllReferrals().length} referrals created and ready for doctor approval`);

      setGeneratedPlan(generated);
      setShowGeneratedPlan(true);
      onAuditEntry?.('care-plan-generated', { patientId: patient.id, planTitle: generated.title });
    } catch (error) {
      console.error('FULL Error generating care plan:', error);
      console.error('Error stack:', (error as Error)?.stack);
      alert(`Failed to generate care plan: ${(error as Error)?.message || 'Unknown error'}. Check console for details.`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveCarePlan = (planData: any) => {
    console.log('Doctor approved and sent care plan:', planData);
    onAuditEntry?.('care-plan-saved', { patientId: patient.id });
    
    // Show confirmation dialog with option to switch to Specialist View
    const switchToSpecialist = window.confirm(
      'Care Plan generated, switch to Specialist View?\n\n' +
      `${referralStore.getAllReferrals().length} referrals have been sent to the Specialist Portal.\n\n` +
      'Click OK to view referrals in Specialist Portal, or Cancel to stay on this page.'
    );

    if (switchToSpecialist) {
      console.log('≡ƒöä Navigating to Specialist Inbox...');
      router.push('/specialist-inbox');
    } else {
      // Stay on page, close the care plan form
      setShowGeneratedPlan(false);
      setGeneratedPlan(null);
    }
  };

  const handleCancelCarePlan = () => {
    setShowGeneratedPlan(false);
    setGeneratedPlan(null);
  };

  const handleReferralAction = useCallback((refId: string, action: string) => {
    onAuditEntry?.('referral-triage', { refId, action });
  }, [onAuditEntry]);

  const handleReferralSubmit = useCallback((referralData: ReferralFormData) => {
    // Generate unique IDs
    const referralId = `ref-${Date.now()}`;
    const serviceRequestId = `sr-${Date.now()}`;
    
    // Create referral object
    const newReferral = {
      referralId,
      serviceRequestId,
      patientName: displayPatient.name,
      patientId: displayPatient.id,
      patientDOB: displayPatient.dob,
      referringProvider: 'Dr. Sarah Chen, MD',
      referringOrganization: 'Primary Care Clinic',
      referralDate: new Date().toISOString().split('T')[0],
      urgency: referralData.priority,
      specialistType: referralData.specialistType,
      clinicalNotes: referralData.clinicalNotes,
      careGap: {
        measure: CARE_GAPS_ENHANCED.find(g => g.id === referralData.careGapId)?.cmsMips || '',
        description: referralData.careGapName,
        daysOpen: CARE_GAPS_ENHANCED.find(g => g.id === referralData.careGapId)?.daysOpen || 0,
        gainshareAmount: 450, // Could be calculated based on gap type
        targetCriteria: 'Gap closure criteria',
        currentValue: 'Current status'
      },
      status: 'pending' as const,
      appointmentDate: undefined,
      clinicalContext: {
        primaryDiagnosis: 'See clinical notes',
        icd10: 'TBD',
      }
    };

    // Add to shared store
    referralStore.addReferral(newReferral);

    // Log audit entry
    onAuditEntry?.('referral-created', {
      referralId,
      patientId: patient.id,
      specialistType: referralData.specialistType,
      careGapId: referralData.careGapId
    });

    // Show success message
    setReferralSuccess(referralId);
    setShowReferralModal(false);

    // Auto-hide success message after 10 seconds
    setTimeout(() => setReferralSuccess(null), 10000);
  }, [patient, onAuditEntry]);

  // Demo Reset Handler
  const handleDemoReset = useCallback(() => {
    const confirmed = window.confirm(
      '≡ƒöä Reset Demo Data?\n\n' +
      'This will:\n' +
      '• Clear all created referrals (except initial 3 samples)\n' +
      '• Reset all care gaps to "Open" status\n' +
      '• Clear gainshare records\n' +
      '• Reset quality metrics to baseline\n\n' +
      'This is useful for running the demo multiple times.\n\n' +
      'Continue with reset?'
    );

    if (confirmed) {
      referralStore.resetDemo();
      setClosedGaps([]);
      setConfirmedCdis([]);
      setReferralSuccess(null);
      alert('Γ£à Demo data has been reset!\n\nYou can now run through the demo workflow again.');
      onAuditEntry?.('demo-reset', { timestamp: new Date().toISOString() });
    }
  }, [onAuditEntry]);

  // If showing generated plan form, render it full screen
  if (showGeneratedPlan && generatedPlan) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#f4f6f9]">
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          <button
            onClick={handleCancelCarePlan}
            className="flex items-center gap-2 text-sm text-[#0f62fe] hover:text-[#0070d2] font-medium mb-4"
          >
            <Icon name="ArrowLeftIcon" size={16} />
            Back to Patient Summary
          </button>
          <CarePlanForm
            mode="create"
            generatedPlan={generatedPlan}
            patientId={patient.id}
            onSave={handleSaveCarePlan}
            onCancel={handleCancelCarePlan}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#f3f2f1]">

      {/* ── FHIR Resource Viewer modal ────────────────────────────────────── */}
      {fhirViewer && (
        <FhirResourceViewer
          resourceType={fhirViewer.resourceType}
          resourceId={fhirViewer.resourceId}
          label={fhirViewer.label}
          onClose={() => setFhirViewer(null)}
        />
      )}

      {/* ── ER/Admission Alert Banner ─────────────────────────────────────── */}
      <div className="bg-[#fef3cd] border-b border-[#e8a200] px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <Icon name="ExclamationTriangleIcon" size={14} className="text-[#c87400]" />
        <span className="text-xs font-medium text-[#3e2800]">Recent ER utilization noted (03/29/2026) · 2 visits in 60 days</span>
        <button
          onClick={() => setFhirViewer({ resourceType: 'Flag', resourceId: 'flag-high-risk-maria', label: 'Flag: High-Risk Transition' })}
          className="ml-auto text-xs font-semibold px-3 py-1 border border-[#c87400] bg-white text-[#c87400] hover:bg-[#fef3cd] transition-colors flex-shrink-0"
        >
          Review Transition Plan
        </button>
      </div>

      {/* ── Gap Closure Metrics Panel (shows when gaps are closed) ─────────── */}
      <div className="flex-shrink-0">
        <GapClosureMetricsPanel
          patientId={displayPatient.id}
          patientName={displayPatient.name}
        />
      </div>

      {/* ── Encounter-phase top tabs + Complexity selector ────────────────── */}
      <div className="bg-[#14304a] border-b border-[#1c4060] flex items-center flex-shrink-0 px-2">
        {ENCOUNTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveEncounterTab(tab.key); if (tab.key === 'orders') onOpenOrderEntry?.(); }}
            className={`px-3 py-2 text-2xs font-semibold border-b-2 transition-colors whitespace-nowrap ${activeEncounterTab === tab.key ? 'border-[#f0ab00] text-white bg-[#1c4060]' : 'border-transparent text-[#a8c0d6] hover:text-white hover:bg-[#1c4060]'}`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 px-2">
          <span className="text-2xs text-[#a8c0d6] mr-1">Summary</span>
          {(['Concise', 'Moderate-Detail', 'High-Detail'] as SummaryComplexity[]).map((c) => (
            <button key={c} onClick={() => setComplexity(c)} className={`text-2xs font-medium px-2 py-1 border transition-colors ${complexity === c ? 'bg-[#0070d2] border-[#0070d2] text-white' : 'bg-transparent border-transparent text-[#a8c0d6] hover:bg-[#1c4060] hover:border-[#3b6fa8] hover:text-white'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 space-y-3 bg-[#f3f2f1]">

          {/* ── EMR-STYLE PATIENT HEADER ───────────────────────────────────── */}
          <div className="sticky top-0 z-20 bg-[#f3f2f1] -mx-3 px-3 pb-3">
            <div className="bg-white border border-[#dddbda] shadow-sm">
            <div className="px-3 py-1.5 border-b border-[#dddbda] bg-[#f4f6f9]">
              <div className="flex items-center gap-2">
                {/* Avatar */}
                <div className="w-8 h-8 rounded border border-[#dddbda] bg-[#e8f4fb] flex items-center justify-center text-xs font-bold text-[#16325c] flex-shrink-0">
                  {patientPhotoInitial}
                </div>
                {/* Name + demographics */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-sm font-semibold text-[#16325c] leading-none">{displayPatient.name}</h2>
                    <span className="text-2xs font-semibold px-1 py-0.5 bg-[#fce8b2] text-[#7c4c00] border border-[#f0c56c] rounded-sm leading-none">High Risk</span>
                    <span className="text-2xs font-medium px-1 py-0.5 bg-[#e8f4fb] text-[#0070d2] border border-[#b3d6f5] rounded-sm leading-none">Cerner</span>
                  </div>
                  <div className="flex items-center gap-3 text-2xs flex-wrap mt-0.5">
                    <span><span className="text-[#706e6b] mr-0.5">DOB</span><span className="font-medium text-[#3e3e3c]">{patient.dob}</span></span>
                    <span><span className="text-[#706e6b] mr-0.5">Age/Sex</span><span className="font-medium text-[#3e3e3c]">{patient.age} · {patient.gender}</span></span>
                    <span><span className="text-[#706e6b] mr-0.5">MRN</span><span className="font-medium font-mono text-[#3e3e3c]">{patient.mrn}</span></span>
                    <span><span className="text-[#706e6b] mr-0.5">Enc</span><span className="font-medium font-mono text-[#3e3e3c]">{launchContext.encounterId}</span></span>
                    <span><span className="text-[#706e6b] mr-0.5">Allergies</span><span className="font-medium text-[#c23934]">Penicillin, Sulfa</span></span>
                  </div>
                </div>
                {/* Coverage + Consents — two equal columns */}
                <div className="flex items-stretch gap-0 flex-shrink-0 border-l border-[#dddbda] ml-1">
                  {/* Coverage */}
                  <div className="text-2xs px-3 py-0.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-[#16325c] leading-none">Coverage</p>
                      {fhirCoverageRef && (
                        <button onClick={() => setFhirViewer(fhirCoverageRef)} className="text-2xs text-[#0070d2] hover:underline leading-none">→ FHIR</button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[#706e6b] whitespace-nowrap">Primary</span>
                        <span className="font-medium text-[#3e3e3c] truncate max-w-[140px]">{primaryInsurance}</span>
                        <span className="text-[#706e6b] whitespace-nowrap ml-1">ID</span>
                        <span className="font-medium font-mono text-[#3e3e3c]">{patient.insuranceId}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[#706e6b] whitespace-nowrap">Secondary</span>
                        <span className="font-medium text-[#3e3e3c] truncate max-w-[140px]">{secondaryInsurance}</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[#706e6b] whitespace-nowrap">PCP</span>
                        <span className="font-medium text-[#3e3e3c] truncate max-w-[180px]">{launchContext.practitionerName}</span>
                      </div>
                    </div>
                  </div>
                  {/* Consents */}
                  <div className="text-2xs px-3 py-0.5 border-l border-[#dddbda]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-[#16325c] leading-none">Consents &amp; Social</p>
                      {fhirConsentRef && (
                        <button onClick={() => setFhirViewer(fhirConsentRef)} className="text-2xs text-[#0070d2] hover:underline leading-none">→ FHIR</button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap mb-0.5">
                      {patientConsents.map((consent) => (
                        <span key={consent} className="text-2xs font-medium px-1 py-0.5 border border-[#b3d6f5] bg-[#e8f4fb] text-[#0070d2] rounded-sm leading-none">{consent}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {SDOH_BADGES.map((b) => (
                        <span key={b.label} className="text-2xs font-medium px-1 py-0.5 border border-[#dddbda] bg-[#f4f6f9] text-[#706e6b] rounded-sm leading-none">{b.label}: {b.value}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

              <div className="px-4 py-2 bg-[#e8f4fb] border-b border-[#b3d6f5]">
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setJourneyExpanded(!journeyExpanded)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#b3d6f5] hover:bg-[#f0f9ff] transition-colors rounded-sm">
                    <Icon name="ExclamationTriangleIcon" size={11} className="text-[#c87400]" />
                    <span className="text-2xs font-semibold text-[#16325c] whitespace-nowrap">Clinical Risk Context</span>
                    <span className="text-2xs text-[#706e6b]">47d</span>
                    <Icon name={journeyExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={10} className="text-[#706e6b]" />
                  </button>
                  <div className="px-3 py-1.5 bg-white border border-[#b3d6f5] text-2xs text-[#706e6b] rounded-sm">RAF <span className="ml-1 text-sm font-bold font-mono text-[#16325c]">{patient.rafScore.toFixed(2)}</span></div>
                  <div className="px-3 py-1.5 bg-white border border-[#b3d6f5] text-2xs text-[#706e6b] rounded-sm">ER Risk <span className="ml-1 text-sm font-bold font-mono text-[#c23934]">{Math.round(patient.predictedErRisk * 100)}%</span></div>
                  <div className="px-3 py-1.5 bg-white border border-[#b3d6f5] text-2xs text-[#706e6b] rounded-sm">Open Gaps <span className="ml-1 text-sm font-bold font-mono text-[#0070d2]">{patient.openCareGaps}</span></div>
                  <div className="px-3 py-1.5 bg-white border border-[#b3d6f5] text-2xs text-[#706e6b] rounded-sm">HCC Suspects <span className="ml-1 text-sm font-bold font-mono text-[#c87400]">{patient.openHCCSuspects}</span></div>
                </div>
              </div>

              {journeyExpanded && (
                <div className="px-4 py-3 border-t border-carbon-gray-20 bg-white">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        {JOURNEY_PHASES.map((phase, idx) => {
                          const isActive = phase.key === CURRENT_PHASE_KEY;
                          const isPast = idx < currentPhaseIdx;
                          return (
                            <React.Fragment key={phase.key}>
                              <div className={`flex items-center gap-1 ${isActive ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-40'}`}>
                                <div className={`flex items-center justify-center w-4 h-4 rounded-full ${isActive ? phase.color : isPast ? 'bg-carbon-gray-50' : 'bg-white border border-carbon-gray-30'}`}>
                                  {isActive && <Icon name="ExclamationTriangleIcon" size={8} className="text-white" />}
                                  {isPast && <Icon name="CheckIcon" size={8} className="text-white" />}
                                </div>
                                <span className={`text-2xs font-semibold ${isActive ? phase.textColor : 'text-[#706e6b]'}`}>{phase.label}</span>
                              </div>
                              {idx < JOURNEY_PHASES.length - 1 && <div className="w-3 h-px bg-carbon-gray-30" />}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <p className="text-xs font-bold text-[#3e3e3c] mb-1">High-Risk Transition · 47 days in phase</p>
                      <p className="text-2xs text-[#706e6b] leading-relaxed mb-2">Recent ER utilization, deteriorating chronic condition control, and multiple open care gaps indicate elevated near-term risk. Trajectory: <span className="font-semibold text-[#da1e28]">Worsening</span></p>
                      <p className="text-2xs text-[#706e6b]"><span className="font-medium">Next milestone:</span> Post-acute follow-up due within 7 days</p>
                    </div>
                    <div className="lg:w-[260px] flex-shrink-0">
                      <div className="border border-carbon-gray-20 bg-[#fafafa] px-3 py-2 mb-2 text-center lg:text-right">
                        <p className="text-2xs text-[#706e6b]">Urgency Score</p>
                        <p className="text-xl font-bold font-mono text-[#3e3e3c]">82</p>
                        <p className="text-2xs text-[#706e6b]">/100</p>
                      </div>
                      <div className="grid grid-cols-1 gap-1">
                        {[{ label: 'A1C', value: '9.2% (2026-02-10)' }, { label: 'ER Visits (90d)', value: '2 visits — $11,000' }, { label: 'BP Control', value: '158/96 (2026-04-01)' }, { label: 'Med Adherence', value: '61% PDC' }].map((sig, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2 py-1 border bg-white border-carbon-gray-20 text-2xs">
                            <div className="w-1 h-1 rounded-full bg-[#da1e28] flex-shrink-0" />
                            <span className="text-[#706e6b] truncate">{sig.label}:</span>
                            <span className="font-medium text-[#3e3e3c] truncate">{sig.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── TODAY'S VISIT / ACTIONS REQUIRED ───────────────────────────── */}
          {patient && (hccSuspects.length > 0 || careGaps.length > 0) && (
            <div className="bg-white border border-[#dddbda] shadow-sm">
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#dddbda]">
                <div className="px-4 py-4 bg-white">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="CalendarIcon" size={15} className="text-[#0070d2]" />
                    <h3 className="text-sm font-bold text-[#3e3e3c]">Today&apos;s Visit</h3>
                  </div>
                  <div className="rounded-md border border-[#dddbda] bg-white overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#dddbda] bg-[#f4f6f9]">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-[#706e6b]">Clinical Focus</p>
                    </div>
                    <div className="divide-y divide-[#edf1f4] text-sm text-[#3e3e3c]">
                      {VISIT_REASONS.map((vr) => (
                        <div key={vr.id} className={`${vr.leftBorder}`}>
                          <button
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#f9fafb] transition-colors text-left"
                            onClick={() => setExpandedVisit(expandedVisit === vr.id ? null : vr.id)}
                          >
                            <span className="font-medium text-sm text-[#3e3e3c]">{vr.label}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-2xs font-medium ${vr.badgeColor}`}>{vr.badge}</span>
                              <Icon name={expandedVisit === vr.id ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={11} className="text-[#706e6b]" />
                            </div>
                          </button>
                          {expandedVisit === vr.id && (
                            <div className="px-3 pb-2.5 bg-[#f9fafb] border-t border-[#edf1f4]">
                              <p className="text-2xs text-[#3e3e3c] leading-relaxed mt-2 mb-1.5">{vr.clinicalNotes}</p>
                              <button
                                onClick={() => setFhirViewer(vr.fhir)}
                                className="text-2xs font-semibold text-[#0070d2] hover:underline"
                              >
                                → View {vr.fhir.resourceType} in FHIR
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4 bg-[#f4f6f9]">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon name="ClipboardDocumentListIcon" size={15} className="text-[#0e6027]" />
                    <h3 className="text-sm font-bold text-[#3e3e3c]">Actions Required</h3>
                  </div>
                  <div className="rounded-md border border-[#dddbda] bg-white overflow-hidden mb-4">
                    <div className="px-3 py-2 border-b border-[#dddbda] bg-[#f4f6f9]">
                      <p className="text-2xs font-semibold uppercase tracking-wide text-[#706e6b]">Clinician Worklist</p>
                    </div>
                    <div className="divide-y divide-[#edf1f4] text-sm text-[#3e3e3c]">
                      {/* P1 — CDS Alerts row */}
                      {cdsCards.length > 0 && (
                        <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-[#fff8f8]">
                          <div className="flex items-center gap-1.5">
                            <Icon name="ExclamationCircleIcon" size={13} className="text-[#c23934] flex-shrink-0" />
                            <span className="font-medium text-[#c23934]">{cdsCards.filter(c => c.indicator === 'critical').length > 0 ? `${cdsCards.filter(c => c.indicator === 'critical').length} Critical` : `${cdsCards.length}`} CDS Alert{cdsCards.length !== 1 ? 's' : ''}</span>
                          </div>
                          <button onClick={onOpenCdsAlerts} className="text-2xs font-semibold text-[#c23934] hover:text-[#a51f1a]">Review alerts</button>
                        </div>
                      )}
                      {/* P5 — Care Gaps: "Open actions" scrolls to care gaps panel */}
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="font-medium">{careGaps.length} Care Gaps</span>
                        <button
                          onClick={() => careGapsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                          className="text-2xs font-semibold text-[#0070d2] hover:text-[#005fb2]"
                        >
                          Open actions
                        </button>
                      </div>
                      {/* P5 — HCC Suspects: "Review documentation" opens FHIR CDI viewer */}
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="font-medium">{hccSuspects.length} HCC Suspects</span>
                        <button
                          onClick={() => setShowCdi(true)}
                          className="text-2xs font-semibold text-[#0070d2] hover:text-[#005fb2]"
                        >
                          Review documentation
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="font-medium">Referral Needed</span>
                        <button onClick={() => setShowReferralModal(true)} className="text-2xs font-semibold text-[#0070d2] hover:text-[#005fb2]">Create referral</button>
                      </div>
                      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="font-medium">{generatedPlan ? 'Draft Plan Ready' : 'Draft Plan'}</span>
                        <span className={`text-2xs font-medium ${generatedPlan ? 'text-[#0e6027]' : 'text-[#706e6b]'}`}>{generatedPlan ? 'Available for review' : 'Pending generation'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap lg:justify-end">
                    {generatedPlan ? (
                      <button
                        onClick={() => {
                          setShowGeneratedPlan(true);
                          setShowPatientHistory(false);
                        }}
                        className="px-4 py-2 bg-[#198038] text-white text-sm font-semibold hover:bg-[#166f31] transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        <Icon name="DocumentTextIcon" size={16} />
                        View Care Plan
                      </button>
                    ) : (
                      <button
                        onClick={handleGenerateComprehensive}
                        disabled={isGenerating}
                        className="px-4 py-2 bg-[#0f62fe] text-white text-sm font-semibold hover:bg-[#0353e9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                      >
                        {isGenerating ? (
                          <>
                            <Icon name="ArrowPathIcon" size={16} className="animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Icon name="SparklesIcon" size={16} />
                            Generate Draft Plan
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Patient History Summary/Details (Collapsible) ── */}
          <div className="bg-white border border-[#dddbda] shadow-sm">
            {/* Collapsible Header */}
            <button
              onClick={() => setShowPatientHistory(!showPatientHistory)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f4f6f9] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon name="DocumentTextIcon" size={16} className="text-[#0070d2]" />
                <span className="text-sm font-bold text-[#3e3e3c]">
                  {showPatientHistory ? 'FHIR Patient Detail View' : 'Patient Summary View'}
                </span>
                <span className="text-xs text-[#706e6b]">
                  {showPatientHistory ? 'Return to the summary panel view' : 'Open detailed FHIR-backed patient chart review'}
                </span>
              </div>
              <Icon
                name={showPatientHistory ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                size={20}
                className="text-[#706e6b]"
              />
            </button>

            {/* Collapsed View - High-Level Summary */}
            {!showPatientHistory && (
              <div className="border-t border-[#dddbda] p-4 bg-[#f4f6f9]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-[#3e3e3c]">Patient Summary Snapshot</p>
                    <p className="text-2xs text-[#706e6b]">Default summary view sourced from the current patient chart</p>
                  </div>
                  <button
                    onClick={() => setShowPatientHistory(true)}
                    className="px-3 py-1.5 text-2xs font-semibold bg-[#e8f4fb] text-[#0070d2] border border-[#b3d6f5] hover:bg-[#dbeafe] transition-colors"
                  >
                    Switch to FHIR Detail View
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-3 border border-[#dddbda]">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="HeartIcon" size={14} className="text-[#da1e28]" />
                      <h4 className="text-xs font-bold text-[#3e3e3c]">Active Conditions</h4>
                    </div>
                    <p className="text-2xl font-bold text-[#3e3e3c] mb-1">4</p>
                    <p className="text-2xs text-[#706e6b]">2 High Severity</p>
                  </div>
                  <div className="bg-white p-3 border border-[#dddbda]">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="BeakerIcon" size={14} className="text-[#0070d2]" />
                      <h4 className="text-xs font-bold text-[#3e3e3c]">Medications</h4>
                    </div>
                    <p className="text-2xl font-bold text-[#3e3e3c] mb-1">5</p>
                    <p className="text-2xs text-[#da1e28]">2 Low Adherence</p>
                  </div>
                  <div className="bg-white p-3 border border-[#dddbda]">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="ChartBarIcon" size={14} className="text-[#b45309]" />
                      <h4 className="text-xs font-bold text-[#3e3e3c]">Labs & Vitals</h4>
                    </div>
                    <p className="text-2xl font-bold text-[#3e3e3c] mb-1">6</p>
                    <p className="text-2xs text-[#da1e28]">4 Out of Range</p>
                  </div>
                  <div className="bg-white p-3 border border-[#dddbda]">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="DocumentTextIcon" size={14} className="text-[#24a148]" />
                      <h4 className="text-xs font-bold text-[#3e3e3c]">Care Plans</h4>
                    </div>
                    <p className="text-2xl font-bold text-[#3e3e3c] mb-1">{generatedPlan ? '1' : '0'}</p>
                    <p className="text-2xs text-[#706e6b]">{generatedPlan ? 'AI Generated' : 'None Active'}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white border border-carbon-gray-20">
                  <p className="text-xs text-[#706e6b]">
                    <strong>Key Patient Needs:</strong> High-risk patient with uncontrolled diabetes (A1C 9.2%),
                    declining kidney function (eGFR 42), and medication adherence issues. Requires immediate intervention
                    for chronic disease management and care coordination.
                  </p>
                </div>
              </div>
            )}

            {/* Expanded View - Summary + Drawer Launch */}
            {showPatientHistory && (
              <div className="border-t border-carbon-gray-20 p-4 bg-white">
                <div className="border border-carbon-gray-20 bg-[#f4f6f9] p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon name="DocumentTextIcon" size={16} className="text-[#0070d2]" />
                      <h4 className="text-xs font-bold text-[#3e3e3c]">FHIR Chart Review</h4>
                    </div>
                    <p className="text-2xs text-[#706e6b]">
                      Open the patient’s detailed FHIR resources in a dedicated drawer to review conditions, medications, labs, allergies, procedures, encounters, immunizations, and care plans without crowding the main summary.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowFhirDrawer(true)}
                    className="px-4 py-2 bg-[#0070d2] text-white text-xs font-semibold hover:bg-[#002d9c] transition-colors inline-flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                    Open FHIR Chart Review
                  </button>
                </div>
              </div>
            )}
          </div>


          {/* ── PRIMARY CLINICAL ROW ───────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 items-start">
            {/* CONDITIONS */}
            <div className="bg-white border border-[#dddbda] shadow-sm flex flex-col">
              <div className="px-3 py-2.5 border-b border-[#dddbda] flex items-center gap-2 flex-shrink-0 bg-[#f4f6f9] min-h-[42px]">
                <Icon name="HeartIcon" size={13} className="text-[#da1e28]" />
                <span className="text-xs font-semibold text-[#3e3e3c]">Conditions</span>
                <span className="ml-auto text-2xs font-semibold bg-[#fce9e9] text-[#c23934] border border-[#f5a9a9] px-1.5 py-0.5">{CHRONIC_CONDITIONS.length}</span>
              </div>
              <div className="divide-y divide-carbon-gray-10 flex-1">
                {paginate(CHRONIC_CONDITIONS, chronicPage).map((cond) => (
                  <div key={cond.code} className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${cond.acuity === 'critical' ? 'bg-[#da1e28]' : 'bg-[#f1c21b]'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#3e3e3c] leading-tight">{cond.label}</p>
                        <p className="text-2xs text-[#706e6b] mt-0.5">{cond.icd} · <span className="font-mono">{cond.hcc}</span></p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-2xs font-mono font-bold ${cond.acuity === 'critical' ? 'text-[#da1e28]' : 'text-[#b45309]'}`}>{cond.metric}</span>
                          <span className={`text-2xs px-1.5 py-0.5 font-medium border ${cond.trend === 'worsening' ? 'bg-[#fce9e9] text-[#c23934] border-[#f5a9a9]' : 'bg-[#f0fff4] text-[#0e6027] border-[#b6e2c2]'}`}>
                            {cond.trend === 'worsening' ? 'Γåô Worsening' : 'ΓåÆ Stable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <PanelPager total={CHRONIC_CONDITIONS.length} page={chronicPage} onPage={setChronicPage} />
            </div>

            {/* MEDICATIONS */}
            <div className="bg-white border border-[#dddbda] shadow-sm flex flex-col">
              <div className="px-3 py-2.5 border-b border-[#dddbda] flex items-center gap-2 flex-shrink-0 bg-[#f4f6f9] min-h-[42px]">
                <Icon name="PlusCircleIcon" size={13} className="text-[#0e6027]" />
                <span className="text-xs font-semibold text-[#3e3e3c]">Medications</span>
                <span className="ml-auto text-2xs font-medium text-[#706e6b]">{MEDS_DATA.length} active</span>
              </div>
              <div className="divide-y divide-carbon-gray-10 flex-1">
                {paginate(MEDS_DATA, medsPage).map((med, idx) => (
                  <div key={idx} className={`px-3 py-2.5 ${med.flag ? 'bg-[#fffafa]' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {med.flag && <Icon name="ExclamationCircleIcon" size={10} className="text-[#da1e28] flex-shrink-0" />}
                      <p className="text-2xs font-medium text-[#3e3e3c] flex-1 truncate">{med.name}</p>
                      <span className="text-2xs text-[#706e6b] flex-shrink-0">{med.freq}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-carbon-gray-20">
                        <div className={`h-full ${med.adherence >= 80 ? 'bg-[#24a148]' : med.adherence >= 65 ? 'bg-[#f1c21b]' : 'bg-[#da1e28]'}`} style={{ width: `${med.adherence}%` }} />
                      </div>
                      <span className={`text-2xs font-mono font-bold flex-shrink-0 ${med.adherence >= 80 ? 'text-[#24a148]' : med.adherence >= 65 ? 'text-[#b45309]' : 'text-[#da1e28]'}`}>{med.adherence}%</span>
                    </div>
                  </div>
                ))}
              </div>
              <PanelPager total={MEDS_DATA.length} page={medsPage} onPage={setMedsPage} />
            </div>

            {/* LABS & TRENDS */}
            <div className="bg-white border border-[#dddbda] shadow-sm flex flex-col">
              <div className="px-3 py-2.5 border-b border-[#dddbda] flex items-center gap-2 flex-shrink-0 bg-[#f4f6f9] min-h-[42px]">
                <Icon name="BeakerIcon" size={13} className="text-[#0070d2]" />
                <span className="text-xs font-semibold text-[#3e3e3c]">Labs & Trends</span>
                <span className="ml-auto text-2xs font-medium text-[#c23934]">{LABS_DATA.filter((l) => l.flag).length} flagged</span>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 divide-x divide-y divide-carbon-gray-10 border-b border-[#dddbda]">
                  {paginate(LABS_DATA, labsPage).map((lab, idx) => (
                    <div key={idx} className={`px-3 py-2.5 ${lab.flag ? 'bg-[#fffafa]' : ''}`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        {lab.flag && <Icon name="ExclamationCircleIcon" size={9} className="text-[#da1e28]" />}
                        <p className="text-2xs text-[#706e6b] truncate">{lab.name}</p>
                      </div>
                      <p className={`text-sm font-mono font-bold ${lab.flag ? 'text-[#da1e28]' : 'text-[#3e3e3c]'}`}>{lab.value}</p>
                      <p className="text-2xs text-[#8a8886]">Ref: {lab.ref}</p>
                      <p className="text-2xs text-[#aeaeae]">{lab.date}</p>
                    </div>
                  ))}
                </div>
                <div className="divide-y divide-carbon-gray-10">
                  {paginate(VITALS_TREND, vitalsPage).map((vt, idx) => (
                    <div key={idx} className="px-3 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-[#3e3e3c]">{vt.label}</p>
                        <div className="text-right">
                          <span className={`text-sm font-bold font-mono ${vt.flag ? 'text-[#da1e28]' : 'text-[#24a148]'}`}>{vt.values[vt.values.length - 1]}</span>
                          <span className="text-2xs text-[#706e6b] ml-1">{vt.unit}</span>
                          {vt.flag && <span className="ml-1 text-2xs font-bold text-[#da1e28]">Γåæ</span>}
                        </div>
                      </div>
                      <Sparkline values={vt.values} flag={vt.flag} />
                      <div className="flex justify-between mt-1">
                        <span className="text-2xs text-[#8a8886]">{vt.dates[0]}</span>
                        <span className="text-2xs text-[#8a8886]">{vt.dates[vt.dates.length - 1]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 divide-x divide-carbon-gray-20">
                <PanelPager total={LABS_DATA.length} page={labsPage} onPage={setLabsPage} />
                <PanelPager total={VITALS_TREND.length} page={vitalsPage} onPage={setVitalsPage} />
              </div>
            </div>
          </div>

          {/* ── SECONDARY CLINICAL / ADMIN ROW ─────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 items-start">
            {/* OPEN CARE GAPS */}
            <div ref={careGapsRef} className="bg-white border border-[#dddbda] shadow-sm flex flex-col">
              <div className="px-3 py-2.5 border-b border-[#dddbda] flex items-center gap-2 flex-wrap flex-shrink-0 bg-[#f4f6f9] min-h-[42px]">
                <Icon name="ClipboardDocumentListIcon" size={13} className="text-[#0070d2]" />
                <span className="text-xs font-semibold text-[#3e3e3c]">Open Care Gaps</span>
                <span className="ml-auto bg-[#fce9e9] text-[#c23934] border border-[#f5a9a9] text-2xs font-semibold px-1.5 py-0.5">{CARE_GAPS_ENHANCED.filter((g) => !closedGaps.includes(g.id)).length}</span>
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="px-2 py-1 text-2xs font-semibold bg-[#e8f4fb] text-[#0070d2] border border-[#b3d6f5] hover:bg-[#dbeafe] transition-colors flex items-center gap-1"
                  title="Create referral for care gap"
                >
                  <Icon name="PaperAirplaneIcon" size={12} />
                  Create Referral
                </button>
                <button
                  onClick={handleDemoReset}
                  className="px-2 py-1 text-2xs font-semibold bg-white text-[#706e6b] border border-[#dddbda] hover:bg-[#f4f6f9] transition-colors flex items-center gap-1"
                  title="Reset demo data for next demo run"
                >
                  <Icon name="ArrowPathIcon" size={12} />
                  Reset Demo
                </button>
              </div>
              <div className="px-3 py-1.5 bg-[#f4f6f9] border-b border-[#dddbda] flex items-center gap-1 flex-shrink-0">
                <span className="text-2xs px-1 py-0.5 bg-[#d0e2ff] text-[#0070d2] font-semibold">HEDIS</span>
                <span className="text-2xs px-1 py-0.5 bg-[#defbe6] text-[#0e6027] font-semibold">MIPS</span>
                <span className="text-2xs text-[#8a8886] italic ml-1">STARS excluded</span>
              </div>
              <div className="flex-1 divide-y divide-carbon-gray-10">
                {paginate(CARE_GAPS_ENHANCED, gapsPage).map((gap) => {
                  const isClosed = closedGaps.includes(gap.id);
                  const statusStyle = GAP_STATUS_STYLE[gap.status];
                  const programColor = gap.program === 'HEDIS' ? 'bg-[#d0e2ff] text-[#0070d2]' : 'bg-[#defbe6] text-[#0e6027]';
                  return (
                    <div key={gap.id} className={`px-3 py-2 ${isClosed ? 'opacity-50 bg-[#defbe6]' : ''}`}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`text-2xs font-semibold px-1 py-0.5 flex-shrink-0 ${programColor}`}>{gap.program}</span>
                          <p className="text-2xs font-medium text-[#3e3e3c] truncate">{gap.name}</p>
                        </div>
                        <span className="text-2xs font-mono text-[#706e6b] flex-shrink-0">{gap.cmsMips}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
                          <span className={`text-2xs font-semibold px-1 py-0.5 ${statusStyle.badge}`}>{isClosed ? 'Closed Γ£ô' : statusStyle.label}</span>
                        </div>
                        {!isClosed && (
                          gap.status === 'Not Started' ? (
                            <button onClick={() => setCloseGapTarget(gap)} className="text-2xs font-semibold px-2 py-0.5 bg-[#0070d2] text-white hover:bg-[#005fb2] transition-colors">Close Gap</button>
                          ) : gap.status === 'Waiting on Patient' ? (
                            <button className="text-2xs font-semibold px-2 py-0.5 bg-[#f1c21b] text-[#b45309] hover:bg-[#e8b800] transition-colors">Remind</button>
                          ) : (
                            <button className="text-2xs font-semibold px-2 py-0.5 border border-[#0070d2] text-[#0070d2] hover:bg-[#edf5ff] transition-colors">View</button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-[#dddbda] px-3 py-1.5 bg-[#f4f6f9] flex items-center gap-1.5 flex-shrink-0">
                <Icon name="TrophyIcon" size={10} className="text-[#0e6027]" />
                <span className="text-2xs text-[#706e6b]">MIPS Impact: <span className="font-mono font-semibold text-[#0070d2]">Est. +12 pts</span></span>
              </div>
              <PanelPager total={CARE_GAPS_ENHANCED.length} page={gapsPage} onPage={setGapsPage} />
            </div>

            {/* ACTIVE REFERRALS */}
            <div className="bg-white border border-[#dddbda] shadow-sm flex flex-col">
              <div className="px-3 py-2.5 border-b border-[#dddbda] flex items-center gap-2 flex-shrink-0 bg-[#f4f6f9] min-h-[42px]">
                <Icon name="ArrowTopRightOnSquareIcon" size={13} className="text-[#6929c4]" />
                <span className="text-xs font-semibold text-[#3e3e3c]">Active Referrals</span>
                <span className="ml-auto bg-[#f3ebff] text-[#6929c4] border border-[#d4bbff] text-2xs font-semibold px-1.5 py-0.5">{ACTIVE_REFERRALS.filter((r) => r.status !== 'Completed').length}</span>
              </div>
              <div className="flex-1 divide-y divide-carbon-gray-10">
                {paginate(ACTIVE_REFERRALS, referralsPage).map((ref) => {
                  const statusStyle = REFERRAL_STATUS_STYLE[ref.status];
                  return (
                    <div key={ref.id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-2xs font-semibold text-[#3e3e3c]">{ref.specialty}</p>
                          <p className="text-2xs text-[#706e6b] truncate">{ref.provider}{ref.tier !== '—' ? ` · ${ref.tier}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span className={`text-2xs font-semibold px-1.5 py-0.5 ${statusStyle.badge}`}>{ref.status}</span>
                        </div>
                      </div>
                      <p className="text-2xs text-[#706e6b] mb-2 leading-tight">{ref.reason}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className={`text-2xs font-semibold px-1.5 py-0.5 ${ref.urgency === 'Urgent' ? 'bg-[#ffe0e0] text-[#da1e28]' : 'bg-carbon-gray-10 text-[#706e6b]'}`}>{ref.urgency}</span>
                          <span className="text-2xs text-[#8a8886]">{ref.date}</span>
                        </div>
                        <ReferralTriageMenu referral={ref} onAction={handleReferralAction} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <PanelPager total={ACTIVE_REFERRALS.length} page={referralsPage} onPage={setReferralsPage} />
            </div>

            {/* POTENTIAL UNDIAGNOSED CONDITIONS */}
            <div className="bg-white border border-[#dddbda] shadow-sm flex flex-col">
              <div className="px-3 py-2.5 border-b border-[#dddbda] flex items-center gap-2 flex-shrink-0 bg-[#f4f6f9] min-h-[42px]">
                <Icon name="DocumentMagnifyingGlassIcon" size={13} className="text-[#b45309]" />
                <span className="text-xs font-semibold text-[#3e3e3c]">Potential Undiagnosed</span>
                <button
                  onClick={() => setShowCdi(!showCdi)}
                  className={`ml-auto relative inline-flex h-4 w-8 items-center rounded-full transition-colors flex-shrink-0 ${showCdi ? 'bg-[#b45309]' : 'bg-carbon-gray-30'}`}
                  role="switch"
                  aria-checked={showCdi}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${showCdi ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {!showCdi ? (
                <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                  <Icon name="DocumentMagnifyingGlassIcon" size={24} className="text-[#aeaeae] mx-auto mb-2" />
                  <p className="text-2xs text-[#706e6b] mb-1">Toggle to reveal CDI opportunities</p>
                  <p className="text-xs font-bold text-[#b45309]">{CDI_OPPORTUNITIES.length} suspects</p>
                  <p className="text-xs font-bold text-[#b45309]">${(totalRevenueAtRisk / 1000).toFixed(1)}K at risk</p>
                  <p className="text-2xs text-[#8a8886] mt-1">RAF +{totalRafAtRisk.toFixed(2)}</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 divide-y divide-carbon-gray-10">
                    {paginate(CDI_OPPORTUNITIES, cdiPage).map((cdi) => {
                      const isExpanded = expandedCdi === cdi.id;
                      const isConfirmed = confirmedCdis.includes(cdi.id);
                      return (
                        <div key={cdi.id} className={isConfirmed ? 'opacity-50' : ''}>
                          <div className="px-3 py-2">
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <div className="min-w-0">
                                <p className="text-2xs font-semibold text-[#3e3e3c] leading-tight">{cdi.condition}</p>
                                <p className="text-2xs text-[#706e6b]">{cdi.icd} · {cdi.hcc}</p>
                              </div>
                              <span className="text-2xs font-mono font-bold text-[#0e6027] flex-shrink-0">{cdi.rafDelta}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-carbon-gray-20">
                                <div className={`h-full ${cdi.confidence >= 85 ? 'bg-[#24a148]' : 'bg-[#f1c21b]'}`} style={{ width: `${cdi.confidence}%` }} />
                              </div>
                              <span className="text-2xs font-mono text-[#706e6b]">{cdi.confidence}%</span>
                              <button
                                onClick={() => setExpandedCdi(isExpanded ? null : cdi.id)}
                                className={`text-2xs font-semibold px-1.5 py-0.5 border transition-colors flex items-center gap-0.5 ${isExpanded ? 'bg-[#b45309] text-white border-[#b45309]' : 'bg-white text-[#b45309] border-[#b45309] hover:bg-[#fdf6dd]'}`}
                              >
                                DX Evidence <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={8} />
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="bg-[#fdf6dd] border-t border-[#f1c21b] px-3 py-2.5 space-y-2">
                              <div className="flex flex-wrap gap-1">{cdi.evidenceSources.map((src) => (<span key={src} className={`text-2xs font-semibold px-1.5 py-0.5 ${SOURCE_BADGE[src] || 'bg-carbon-gray-20 text-[#706e6b]'}`}>{src}</span>))}</div>
                              <div className="space-y-1">{cdi.signals.map((sig, i) => (<div key={i} className={`flex items-center gap-1.5 px-2 py-1 text-2xs border ${sig.flagged ? 'bg-[#fff8f8] border-[#ffb3b8]' : 'bg-white border-carbon-gray-20'}`}><span className={`font-semibold px-1 py-0.5 text-2xs ${SOURCE_BADGE[sig.source] || ''}`}>{sig.source}</span><span className="text-[#706e6b]">{sig.label}:</span><span className={`font-medium ${sig.flagged ? 'text-[#da1e28]' : 'text-[#3e3e3c]'}`}>{sig.value}</span></div>))}</div>
                              <p className="text-2xs text-[#706e6b] bg-white border border-carbon-gray-20 px-2 py-1.5 leading-relaxed">{cdi.justification}</p>
                              <div className="bg-[#d0e2ff] border border-[#97c1ff] px-2 py-1.5 flex items-start gap-1.5">
                                <Icon name="InformationCircleIcon" size={10} className="text-[#0070d2] flex-shrink-0 mt-0.5" />
                                <p className="text-2xs text-[#0070d2]">{cdi.icd10Guidance}</p>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                {isConfirmed ? (
                                  <span className="text-2xs font-semibold text-[#24a148] flex items-center gap-1"><Icon name="CheckCircleIcon" size={11} /> Confirmed</span>
                                ) : (
                                  <button onClick={() => setConfirmDocTarget(cdi)} className="text-2xs font-semibold px-2.5 py-1.5 bg-[#0e6027] text-white hover:bg-[#0a4d1e] transition-colors flex items-center gap-1">
                                    <Icon name="CheckIcon" size={10} /> Confirm & Document ΓåÆ
                                  </button>
                                )}
                                <button onClick={() => setExpandedCdi(null)} className="text-2xs px-2 py-1.5 border border-carbon-gray-30 text-[#706e6b] hover:bg-carbon-gray-10 transition-colors">Defer</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <PanelPager total={CDI_OPPORTUNITIES.length} page={cdiPage} onPage={setCdiPage} />
                </>
              )}
            </div>
          </div>

          {/* ── RECENT CLINICAL ACTIVITY TIMELINE ──────────────────────────── */}
          <div className="bg-white border border-[#dddbda] shadow-sm flex flex-col">
            <div className="px-3 py-2.5 border-b border-[#dddbda] flex items-center gap-2 flex-shrink-0 bg-[#f4f6f9]">
              <Icon name="ClockIcon" size={13} className="text-[#0070d2]" />
              <span className="text-xs font-semibold text-[#3e3e3c]">Recent Clinical Activity Timeline</span>
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#e5e7eb]" />
                <div className="space-y-0">
                  {paginate(RECENT_ACTIVITY, activityPage).map((act, idx) => (
                    <div key={idx} className="relative flex gap-3">
                      <div className="relative z-10 flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-1 border-2 border-white ${act.flag ? 'bg-[#b42318]' : 'bg-[#3b82d4]'}`} />
                      </div>
                      <div className={`flex-1 pb-4 pl-1 ${idx < paginate(RECENT_ACTIVITY, activityPage).length - 1 ? 'border-b border-[#f0f1f3]' : ''}`}>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-2xs font-semibold px-1.5 py-0.5 border ${act.type === 'ER' ? 'bg-[#fce9e9] text-[#c23934] border-[#f5a9a9]' : act.type === 'Lab' ? 'bg-[#edf5ff] text-[#0070d2] border-[#c6dcff]' : 'bg-[#f4f6f9] text-[#706e6b] border-[#e5e7eb]'}`}>{act.type}</span>
                          <p className="text-xs font-medium text-[#3e3e3c]">{act.desc}</p>
                          {act.flag && <Icon name="ExclamationCircleIcon" size={12} className="text-[#c23934]" />}
                        </div>
                        <p className="text-2xs text-[#706e6b]">{act.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <PanelPager total={RECENT_ACTIVITY.length} page={activityPage} onPage={setActivityPage} />
          </div>

          {/* ── COMPACT FINANCIALS PANEL ────────────────────────────────────── */}
          <div className="bg-white border border-[#dddbda]">
            <div className="px-4 py-3 border-b border-carbon-gray-20 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon name="CurrencyDollarIcon" size={15} className="text-[#0e6027]" />
                  <span className="text-sm font-bold text-[#3e3e3c]">Value-Based Performance & Financials</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xs text-[#706e6b]">Contract:</span>
                  <span className="text-2xs font-semibold text-[#3e3e3c]">Humana MA-PD 2026 VBP</span>
                  <span className="text-2xs text-[#706e6b]">·</span>
                  <span className="text-2xs text-[#706e6b]">{canViewFinancials ? 'Financial signals visible' : 'Toggle to enable VBP financial signals'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setCanViewFinancials(!canViewFinancials)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${canViewFinancials ? 'bg-[#0e6027]' : 'bg-carbon-gray-30'}`}
                  role="switch"
                  aria-checked={canViewFinancials}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${canViewFinancials ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs font-semibold text-[#706e6b]">{canViewFinancials ? 'On' : 'Off'}</span>
              </div>
            </div>

            {canViewFinancials ? (
              <div className="px-4 py-4 space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-[#fdf6dd] border border-[#f1c21b] px-3 py-2.5">
                    <p className="text-2xs text-[#706e6b] mb-1">RAF Revenue at Risk</p>
                    <p className="text-xl font-bold font-mono text-[#b45309]">${(totalRevenueAtRisk / 1000).toFixed(1)}K</p>
                    <p className="text-2xs text-[#706e6b] mt-1">{CDI_OPPORTUNITIES.length} HCC suspects · RAF +{totalRafAtRisk.toFixed(2)}</p>
                  </div>
                  <div className="bg-[#defbe6] border border-[#a7f0ba] px-3 py-2.5">
                    <p className="text-2xs text-[#706e6b] mb-1">VBP Projected Savings</p>
                    <p className="text-xl font-bold font-mono text-[#0e6027]">$4,200</p>
                    <p className="text-2xs text-[#706e6b] mt-1">Gap closure — 5 measures</p>
                  </div>
                  <div className="bg-[#edf5ff] border border-[#97c1ff] px-3 py-2.5">
                    <p className="text-2xs text-[#706e6b] mb-1">Prior Auth Signals</p>
                    <p className="text-xl font-bold font-mono text-[#0070d2]">2 pending</p>
                    <p className="text-2xs text-[#706e6b] mt-1">Nephrology · Renal US</p>
                  </div>
                  <div className="bg-[#f6f2ff] border border-[#d4bbff] px-3 py-2.5">
                    <p className="text-2xs text-[#706e6b] mb-1">MIPS Quality Impact</p>
                    <p className="text-xl font-bold font-mono text-[#6929c4]">+12 pts</p>
                    <p className="text-2xs text-[#706e6b] mt-1">If all open gaps closed</p>
                  </div>
                </div>

                {hccSuspects.length > 0 && (
                  <div className="border border-carbon-gray-20">
                    <div className="px-3 py-2 bg-carbon-gray-10 flex items-center justify-between gap-2">
                      <span className="text-2xs font-semibold text-[#706e6b] uppercase tracking-wide">HCC Suspect Revenue Breakdown</span>
                      <span className="text-2xs text-[#706e6b]">{hccSuspects.length} items</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-carbon-gray-10">
                      {hccSuspects.map((hcc) => (
                        <div key={hcc.id} className="px-4 py-2.5">
                          <p className="text-2xs font-medium text-[#3e3e3c]">{hcc.hccDescription}</p>
                          <p className="text-sm font-bold font-mono text-[#b45309] mt-0.5">+${hcc.estimatedRevenueDelta.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-5 flex items-center gap-3 bg-[#f4f6f9]">
                <Icon name="LockClosedIcon" size={18} className="text-[#aeaeae] flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#706e6b]">Financial signals hidden</p>
                  <p className="text-2xs text-[#706e6b]">Enable the toggle above to view VBP performance data, RAF revenue at risk, and prior auth signals</p>
                </div>
              </div>
            )}

            <div className="border-t border-[#d4bbff] bg-[#f6f2ff] px-4 py-2.5 flex items-start gap-2">
              <Icon name="ShieldCheckIcon" size={12} className="text-[#6929c4] flex-shrink-0 mt-0.5" />
              <p className="text-2xs text-[#6929c4] leading-relaxed">
                <span className="font-semibold">VBP Disclaimer:</span> Incentives per 2026 VBP contract with Humana MA-PD. Subject to CMS AKS VBE safe harbor and Stark VBE exception. Quality-based only — not tied to referral volume or patient steering. Financial signals are for care coordination purposes only.
              </p>
            </div>

            <div className="border-t border-carbon-gray-20 bg-[#f4f6f9] px-4 py-2 flex items-start gap-2">
              <Icon name="InformationCircleIcon" size={11} className="text-[#8a8886] flex-shrink-0 mt-0.5" />
              <p className="text-2xs text-[#706e6b] leading-relaxed">
                <span className="font-semibold">CMS-0057-F:</span> Provider remittances and payer-to-provider financial data excluded per CMS Provider Access API rule (CMS-0057-F). This display is compliant with applicable information blocking and interoperability regulations.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}
      {closeGapTarget && (
        <CloseGapModal gap={closeGapTarget} onClose={() => setCloseGapTarget(null)} onComplete={handleGapClose} />
      )}
      {confirmDocTarget && (
        <ConfirmDocumentModal cdi={confirmDocTarget} onClose={() => setConfirmDocTarget(null)} onComplete={handleCdiConfirm} />
      )}

      {/* Referral Modal */}
      <ReferralModal
        isOpen={showReferralModal}
        onClose={() => setShowReferralModal(false)}
        onSubmit={handleReferralSubmit}
        careGaps={CARE_GAPS_ENHANCED.filter(g => !closedGaps.includes(g.id))}
        patientName={displayPatient.name}
        patientId={displayPatient.id}
      />

      {/* Success Message */}
      {referralSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-600 text-white px-6 py-4 shadow-xl max-w-md animate-slide-up">
          <div className="flex items-start gap-3">
            <Icon name="CheckCircleIcon" size={24} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm mb-1">Referral Created Successfully!</p>
              <p className="text-xs mb-3">
                Referral ID: {referralSuccess} has been sent to the specialist portal.
              </p>
              <a
                href="/specialist-inbox"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold bg-white text-green-600 px-3 py-1.5 hover:bg-green-50 transition-colors"
              >
                <Icon name="ArrowTopRightOnSquareIcon" size={14} />
                View in Specialist Portal
              </a>
            </div>
            <button
              onClick={() => setReferralSuccess(null)}
              className="text-white hover:text-green-100 transition-colors"
            >
              <Icon name="XMarkIcon" size={20} />
            </button>
          </div>
        </div>
      )}

      {showFhirDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close FHIR chart review"
            onClick={() => setShowFhirDrawer(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="relative h-full w-full max-w-[960px] bg-white border-l border-carbon-gray-20 shadow-2xl flex flex-col">
            <div className="px-4 py-3 border-b border-carbon-gray-20 flex items-center justify-between bg-[#f4f6f9]">
              <div>
                <h3 className="text-sm font-bold text-[#3e3e3c]">FHIR Chart Review</h3>
                <p className="text-2xs text-[#706e6b] mt-1">Review patient resources without leaving the summary workspace</p>
              </div>
              <button
                onClick={() => setShowFhirDrawer(false)}
                className="p-1 text-[#706e6b] hover:text-[#3e3e3c] transition-colors"
              >
                <Icon name="XMarkIcon" size={20} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <div className="grid h-full grid-cols-[250px_1fr] divide-x divide-carbon-gray-20">
                <div className="bg-[#f4f6f9] overflow-y-auto">
                  <div className="p-3 border-b border-carbon-gray-20">
                    <h4 className="text-xs font-bold text-[#3e3e3c]">FHIR Resources</h4>
                    <p className="text-2xs text-[#706e6b] mt-1">Select a resource to view details</p>
                  </div>
                  <div className="divide-y divide-carbon-gray-20">
                    {[
                      { name: 'Conditions', icon: 'HeartIcon', count: 4 },
                      { name: 'Medications', icon: 'BeakerIcon', count: 5 },
                      { name: 'Labs & Vitals', icon: 'ChartBarIcon', count: 6 },
                      { name: 'Allergies', icon: 'ExclamationTriangleIcon', count: 2 },
                      { name: 'Procedures', icon: 'WrenchScrewdriverIcon', count: 3 },
                      { name: 'Immunizations', icon: 'ShieldCheckIcon', count: 8 },
                      { name: 'Encounters', icon: 'CalendarIcon', count: 12 },
                      { name: 'Care Plans', icon: 'DocumentTextIcon', count: 1 },
                    ].map((resource) => (
                      <button
                        key={resource.name}
                        onClick={() => setSelectedResource(resource.name)}
                        className={`w-full px-3 py-2.5 flex items-center justify-between hover:bg-carbon-gray-10 transition-colors ${
                          selectedResource === resource.name ? 'bg-white border-l-2 border-[#0f62fe]' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Icon name={resource.icon as any} size={14} className={selectedResource === resource.name ? 'text-[#0f62fe]' : 'text-[#706e6b]'} />
                          <span className={`text-xs ${selectedResource === resource.name ? 'font-bold text-[#3e3e3c]' : 'text-[#706e6b]'}`}>
                            {resource.name}
                          </span>
                        </div>
                        <span className={`text-2xs font-bold px-1.5 py-0.5 ${
                          selectedResource === resource.name
                            ? 'bg-[#0f62fe] text-white'
                            : 'bg-carbon-gray-20 text-[#706e6b]'
                        }`}>
                          {resource.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 overflow-y-auto">
                  {selectedResource === 'Conditions' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Active Conditions</h4>
                      <div className="space-y-3">
                        {[
                          { name: 'Type 2 Diabetes with Hyperglycemia', code: 'E11.65', onset: '2018-03-15', status: 'Active', severity: 'High' },
                          { name: 'Chronic Kidney Disease Stage 3b', code: 'N18.32', onset: '2020-11-20', status: 'Active', severity: 'High' },
                          { name: 'Heart Failure with Preserved EF', code: 'I50.30', onset: '2021-06-10', status: 'Active', severity: 'Moderate' },
                          { name: 'Essential Hypertension', code: 'I10', onset: '2015-01-05', status: 'Active', severity: 'Moderate' },
                        ].map((condition, idx) => (
                          <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[#3e3e3c]">{condition.name}</p>
                                <p className="text-2xs text-[#706e6b] mt-0.5">ICD-10: {condition.code}</p>
                              </div>
                              <span className={`text-2xs font-bold px-2 py-0.5 ${
                                condition.severity === 'High' ? 'bg-[#ffe0e0] text-[#da1e28]' : 'bg-[#fdf6dd] text-[#b45309]'
                              }`}>
                                {condition.severity}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-2xs text-[#706e6b]">
                              <span>Onset: {condition.onset}</span>
                              <span>•</span>
                              <span>Status: {condition.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResource === 'Medications' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Current Medications</h4>
                      <div className="space-y-3">
                        {MEDS_DATA.map((med, idx) => (
                          <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[#3e3e3c]">{med.name}</p>
                                <p className="text-2xs text-[#706e6b] mt-0.5">Frequency: {med.freq} • Dosage: {med.dosage}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-bold ${med.flag ? 'text-[#da1e28]' : 'text-[#24a148]'}`}>
                                  {med.adherence}%
                                </p>
                                <p className="text-2xs text-[#706e6b]">Adherence</p>
                              </div>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Prescribing Provider:</span>
                                <span className="text-[#706e6b] font-medium">{med.prescriber}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Date Prescribed:</span>
                                <span className="text-[#706e6b]">{med.datePrescribed}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">NDC Number:</span>
                                <span className="text-[#706e6b] font-mono">{med.ndc}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Quantity:</span>
                                <span className="text-[#706e6b]">{med.quantity}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Refills:</span>
                                <span className="text-[#706e6b]">{med.refills}</span>
                              </div>
                            </div>
                            
                            {med.flag && (
                              <div className="flex items-center gap-1.5 mt-2 text-2xs text-[#da1e28]">
                                <Icon name="ExclamationTriangleIcon" size={12} />
                                <span>Low adherence - intervention recommended</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResource === 'Labs & Vitals' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Recent Labs & Vitals</h4>
                      <div className="space-y-3">
                        {LABS_DATA.map((lab, idx) => (
                          <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[#3e3e3c]">{lab.name}</p>
                                <p className="text-2xs text-[#706e6b] mt-0.5">Reference: {lab.ref}</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-xs font-bold ${lab.flag ? 'text-[#da1e28]' : 'text-[#3e3e3c]'}`}>
                                  {lab.value}
                                </p>
                                <p className="text-2xs text-[#706e6b]">{lab.date}</p>
                              </div>
                            </div>
                            {lab.flag && (
                              <div className="flex items-center gap-1.5 mt-2 text-2xs text-[#da1e28]">
                                <Icon name="ExclamationTriangleIcon" size={12} />
                                <span>Out of range - requires attention</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResource === 'Allergies' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Known Allergies</h4>
                      <div className="space-y-3">
                        {[
                          {
                            allergen: 'Penicillin',
                            specificAllergen: 'Penicillin G and derivatives',
                            reaction: 'Anaphylaxis',
                            severity: 'Severe',
                            onset: '1995-06-12',
                            diagnosedBy: 'Dr. Robert Martinez, MD',
                            diagnosedDate: '1995-06-12',
                            verificationStatus: 'Confirmed',
                            notes: 'Patient experienced severe anaphylactic reaction requiring epinephrine'
                          },
                          {
                            allergen: 'Sulfa Drugs',
                            specificAllergen: 'Sulfamethoxazole/Trimethoprim',
                            reaction: 'Rash',
                            severity: 'Moderate',
                            onset: '2010-03-20',
                            diagnosedBy: 'Dr. Emily Thompson, MD',
                            diagnosedDate: '2010-03-20',
                            verificationStatus: 'Confirmed',
                            notes: 'Generalized maculopapular rash developed within 48 hours of administration'
                          },
                        ].map((allergy, idx) => (
                          <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[#3e3e3c]">{allergy.allergen}</p>
                                <p className="text-2xs text-[#706e6b] mt-0.5">Specific: {allergy.specificAllergen}</p>
                              </div>
                              <span className={`text-2xs font-bold px-2 py-0.5 ${
                                allergy.severity === 'Severe' ? 'bg-[#ffe0e0] text-[#da1e28]' : 'bg-[#fdf6dd] text-[#b45309]'
                              }`}>
                                {allergy.severity}
                              </span>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                              <div className="flex items-start justify-between text-2xs">
                                <span className="text-[#706e6b]">Reaction Type:</span>
                                <span className="text-[#706e6b] font-medium">{allergy.reaction}</span>
                              </div>
                              <div className="flex items-start justify-between text-2xs">
                                <span className="text-[#706e6b]">Diagnosed By:</span>
                                <span className="text-[#706e6b]">{allergy.diagnosedBy}</span>
                              </div>
                              <div className="flex items-start justify-between text-2xs">
                                <span className="text-[#706e6b]">Date Diagnosed:</span>
                                <span className="text-[#706e6b]">{allergy.diagnosedDate}</span>
                              </div>
                              <div className="flex items-start justify-between text-2xs">
                                <span className="text-[#706e6b]">Verification:</span>
                                <span className="text-[#706e6b]">{allergy.verificationStatus}</span>
                              </div>
                              {allergy.notes && (
                                <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                  <p className="text-2xs text-[#706e6b] mb-1">Clinical Notes:</p>
                                  <p className="text-2xs text-[#706e6b] italic">{allergy.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResource === 'Care Plans' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Active Care Plans</h4>
                      {generatedPlan ? (
                        <div className="space-y-3">
                          <div className="border border-[#0070d2] bg-[#edf5ff] p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Icon name="SparklesIcon" size={16} className="text-[#0070d2]" />
                                  <p className="text-sm font-bold text-[#3e3e3c]">{generatedPlan.title}</p>
                                </div>
                                <p className="text-xs text-[#706e6b] mb-2">{generatedPlan.description}</p>
                                <div className="flex items-center gap-4 text-2xs text-[#706e6b]">
                                  <span>Created: {new Date().toLocaleDateString()}</span>
                                  <span>•</span>
                                  <span>Type: AI-Generated Comprehensive Plan</span>
                                  <span>•</span>
                                  <span>Status: Active</span>
                                </div>
                              </div>
                              <span className="text-2xs font-bold px-2 py-1 bg-[#0070d2] text-white whitespace-nowrap">
                                AI Generated
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div className="bg-white p-2 border border-carbon-gray-20">
                                <p className="text-2xs text-[#706e6b] mb-1">Goals</p>
                                <p className="text-sm font-bold text-[#3e3e3c]">{generatedPlan.goals?.length || 0}</p>
                              </div>
                              <div className="bg-white p-2 border border-carbon-gray-20">
                                <p className="text-2xs text-[#706e6b] mb-1">Interventions</p>
                                <p className="text-sm font-bold text-[#3e3e3c]">
                                  {generatedPlan.goals?.reduce((sum, g) => sum + (g.interventions?.length || 0), 0) || 0}
                                </p>
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-[#97c1ff]">
                              <p className="text-xs font-semibold text-[#3e3e3c] mb-2">Key Focus Areas:</p>
                              <div className="flex flex-wrap gap-2">
                                {generatedPlan.goals?.slice(0, 3).map((goal, idx) => (
                                  <span key={idx} className="text-2xs px-2 py-1 bg-white border border-carbon-gray-20 text-[#706e6b]">
                                    {goal.description}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setShowGeneratedPlan(true);
                                setShowPatientHistory(false);
                                setShowFhirDrawer(false);
                              }}
                              className="mt-3 w-full px-4 py-2 bg-[#0070d2] text-white text-xs font-semibold hover:bg-[#002d9c] transition-colors flex items-center justify-center gap-2"
                            >
                              <Icon name="DocumentTextIcon" size={14} />
                              View Full Care Plan
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-carbon-gray-20 bg-[#f4f6f9]">
                          <Icon name="DocumentTextIcon" size={48} className="text-[#aeaeae] mx-auto mb-3" />
                          <p className="text-sm text-[#706e6b] font-semibold mb-2">No Active Care Plans</p>
                          <p className="text-xs text-[#706e6b] mb-4">Generate a comprehensive AI-powered care plan to get started</p>
                          <button
                            onClick={() => {
                              setShowFhirDrawer(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 bg-[#0070d2] text-white text-xs font-semibold hover:bg-[#002d9c] transition-colors inline-flex items-center gap-2"
                          >
                            <Icon name="SparklesIcon" size={14} />
                            Go to AI Care Plan Generator
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedResource === 'Procedures' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Recent Procedures</h4>
                      <div className="space-y-3">
                        {[
                          {
                            name: 'Echocardiogram',
                            cptCode: '93306',
                            date: '2026-01-15',
                            orderingProvider: 'Dr. James Wilson, MD',
                            performingProvider: 'Dr. Lisa Anderson, MD',
                            facility: 'Memorial Cardiology Center',
                            status: 'Completed',
                            indication: 'Evaluation of heart failure symptoms',
                            findings: 'EF 55%, preserved systolic function, mild diastolic dysfunction'
                          },
                          {
                            name: 'Renal Ultrasound',
                            cptCode: '76770',
                            date: '2025-12-10',
                            orderingProvider: 'Dr. Sarah Chen, MD',
                            performingProvider: 'Dr. Robert Kim, MD',
                            facility: 'Regional Imaging Center',
                            status: 'Completed',
                            indication: 'CKD Stage 3 monitoring',
                            findings: 'Bilateral kidneys normal size, no hydronephrosis, cortical thinning consistent with CKD'
                          },
                          {
                            name: 'Colonoscopy',
                            cptCode: '45378',
                            date: '2025-09-22',
                            orderingProvider: 'Dr. Michael Rodriguez, MD',
                            performingProvider: 'Dr. Patricia Lee, MD',
                            facility: 'Endoscopy Associates',
                            status: 'Completed',
                            indication: 'Colorectal cancer screening',
                            findings: 'Two small polyps removed, benign adenomas, recommend repeat in 5 years'
                          },
                        ].map((procedure, idx) => (
                          <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[#3e3e3c]">{procedure.name}</p>
                                <p className="text-2xs text-[#706e6b] mt-0.5">CPT: {procedure.cptCode}</p>
                              </div>
                              <span className="text-2xs font-bold px-2 py-0.5 bg-[#defbe6] text-[#24a148]">
                                {procedure.status}
                              </span>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Date Performed:</span>
                                <span className="text-[#706e6b]">{procedure.date}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Ordering Provider:</span>
                                <span className="text-[#706e6b]">{procedure.orderingProvider}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Performing Provider:</span>
                                <span className="text-[#706e6b]">{procedure.performingProvider}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Facility:</span>
                                <span className="text-[#706e6b]">{procedure.facility}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                <p className="text-2xs text-[#706e6b] mb-1">Indication:</p>
                                <p className="text-2xs text-[#706e6b]">{procedure.indication}</p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                <p className="text-2xs text-[#706e6b] mb-1">Key Findings:</p>
                                <p className="text-2xs text-[#706e6b] italic">{procedure.findings}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResource === 'Encounters' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Recent Encounters</h4>
                      <div className="space-y-3">
                        {[
                          {
                            type: 'Office Visit',
                            date: '2026-04-15',
                            provider: 'Dr. Sarah Chen, MD',
                            facility: 'Primary Care Clinic',
                            chiefComplaint: 'Follow-up for diabetes and hypertension',
                            diagnosis: 'T2DM with CKD, HTN',
                            status: 'Completed'
                          },
                          {
                            type: 'Cardiology Consultation',
                            date: '2026-03-20',
                            provider: 'Dr. James Wilson, MD',
                            facility: 'Memorial Cardiology Center',
                            chiefComplaint: 'Heart failure management',
                            diagnosis: 'HFpEF, stable',
                            status: 'Completed'
                          },
                          {
                            type: 'Emergency Department',
                            date: '2026-02-05',
                            provider: 'Dr. Amanda Foster, MD',
                            facility: 'Memorial Hospital ED',
                            chiefComplaint: 'Shortness of breath',
                            diagnosis: 'Acute on chronic HF exacerbation',
                            status: 'Completed'
                          },
                        ].map((encounter, idx) => (
                          <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[#3e3e3c]">{encounter.type}</p>
                                <p className="text-2xs text-[#706e6b] mt-0.5">{encounter.facility}</p>
                              </div>
                              <span className="text-2xs font-bold px-2 py-0.5 bg-[#defbe6] text-[#24a148]">
                                {encounter.status}
                              </span>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Date:</span>
                                <span className="text-[#706e6b]">{encounter.date}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Provider:</span>
                                <span className="text-[#706e6b]">{encounter.provider}</span>
                              </div>
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                <p className="text-2xs text-[#706e6b] mb-1">Chief Complaint:</p>
                                <p className="text-2xs text-[#706e6b]">{encounter.chiefComplaint}</p>
                              </div>
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                <p className="text-2xs text-[#706e6b] mb-1">Diagnosis:</p>
                                <p className="text-2xs text-[#706e6b] font-medium">{encounter.diagnosis}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResource === 'Immunizations' && (
                    <div>
                      <h4 className="text-sm font-bold text-[#3e3e3c] mb-3">Immunization History</h4>
                      <div className="space-y-3">
                        {[
                          {
                            vaccine: 'Influenza (Flu)',
                            cvxCode: '141',
                            date: '2025-10-15',
                            provider: 'Dr. Sarah Chen, MD',
                            facility: 'Primary Care Clinic',
                            lotNumber: 'FL2025-A123',
                            manufacturer: 'Sanofi Pasteur',
                            site: 'Left deltoid',
                            route: 'Intramuscular'
                          },
                          {
                            vaccine: 'Pneumococcal (PPSV23)',
                            cvxCode: '33',
                            date: '2024-03-10',
                            provider: 'Dr. Michael Rodriguez, MD',
                            facility: 'Primary Care Clinic',
                            lotNumber: 'PN2024-B456',
                            manufacturer: 'Merck',
                            site: 'Right deltoid',
                            route: 'Intramuscular'
                          },
                          {
                            vaccine: 'COVID-19 (Moderna)',
                            cvxCode: '207',
                            date: '2023-09-20',
                            provider: 'Pharmacy Technician',
                            facility: 'CVS Pharmacy',
                            lotNumber: 'CV2023-C789',
                            manufacturer: 'Moderna',
                            site: 'Left deltoid',
                            route: 'Intramuscular'
                          },
                        ].map((immunization, idx) => (
                          <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-[#3e3e3c]">{immunization.vaccine}</p>
                                <p className="text-2xs text-[#706e6b] mt-0.5">CVX Code: {immunization.cvxCode}</p>
                              </div>
                              <span className="text-2xs font-bold px-2 py-0.5 bg-[#defbe6] text-[#24a148]">
                                Administered
                              </span>
                            </div>
                            
                            <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Date Given:</span>
                                <span className="text-[#706e6b]">{immunization.date}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Provider:</span>
                                <span className="text-[#706e6b]">{immunization.provider}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Facility:</span>
                                <span className="text-[#706e6b]">{immunization.facility}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Manufacturer:</span>
                                <span className="text-[#706e6b]">{immunization.manufacturer}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Lot Number:</span>
                                <span className="text-[#706e6b] font-mono">{immunization.lotNumber}</span>
                              </div>
                              <div className="flex items-center justify-between text-2xs">
                                <span className="text-[#706e6b]">Site/Route:</span>
                                <span className="text-[#706e6b]">{immunization.site} / {immunization.route}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!['Conditions', 'Medications', 'Labs & Vitals', 'Allergies', 'Care Plans', 'Procedures', 'Encounters', 'Immunizations'].includes(selectedResource) && (
                    <div className="text-center py-8">
                      <Icon name="DocumentTextIcon" size={48} className="text-[#aeaeae] mx-auto mb-3" />
                      <p className="text-sm text-[#706e6b] font-semibold">{selectedResource}</p>
                      <p className="text-xs text-[#706e6b] mt-1">Detailed view coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
