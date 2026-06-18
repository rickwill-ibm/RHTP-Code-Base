'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { mockPatients, mockHCCSuspects, mockCareGaps, referralStore } from '@/lib/mockData';
import { getPatientByFhirId } from '@/lib/patientRegistry';
import Icon from '@/components/ui/AppIcon';
import type { SmartLaunchContext, CdsCard } from '@/lib/smartFhirTypes';
import { generateComprehensiveCarePlan, generateHolisticCarePlan, type GeneratedCarePlan } from '@/lib/services/carePlanGenerator';
import CarePlanForm from '@/app/patient-detail/components/CarePlanForm';
import ReferralModal, { type ReferralFormData } from './ReferralModal';
import GapClosureMetricsPanel from './GapClosureMetricsPanel';

// ─── Types ────────────────────────────────────────────────────────────────────
interface MdSmartSummaryScreenProps {
  launchContext: SmartLaunchContext;
  cdsCards: CdsCard[];
  onAuditEntry?: (action: string, details: Record<string, string>) => void;
  onOpenOrderEntry?: () => void;
}

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
  { key: 'high-risk-transition', label: 'High-Risk Transition', color: 'bg-[#da1e28]', textColor: 'text-[#da1e28]', borderColor: 'border-[#da1e28]', bgLight: 'bg-[#fff1f1]' },
  { key: 'post-acute-recovery', label: 'Post-Acute', color: 'bg-[#0043ce]', textColor: 'text-[#0043ce]', borderColor: 'border-[#0043ce]', bgLight: 'bg-[#edf5ff]' },
];

const CURRENT_PHASE_KEY = 'high-risk-transition';

const SDOH_BADGES = [
  { label: 'Social Risk', value: '53↑', color: 'bg-[#ffe0e0] text-[#da1e28] border-[#ffb3b8]' },
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
  EMR: 'bg-[#d0e2ff] text-[#0043ce]',
  Claims: 'bg-[#fdf6dd] text-[#b45309]',
  HIE: 'bg-[#defbe6] text-[#0e6027]',
  LPR: 'bg-[#f6f2ff] text-[#6929c4]',
};

const GAP_STATUS_STYLE: Record<GapStatusType, { dot: string; badge: string; label: string }> = {
  'In Process': { dot: 'bg-[#0043ce]', badge: 'bg-[#d0e2ff] text-[#0043ce]', label: 'In Process' },
  'Not Started': { dot: 'bg-carbon-gray-40', badge: 'bg-carbon-gray-20 text-carbon-gray-70', label: 'Not Started' },
  'Waiting on Patient': { dot: 'bg-[#f1c21b]', badge: 'bg-[#fdf6dd] text-[#b45309]', label: 'Waiting on Patient' },
};

const REFERRAL_STATUS_STYLE: Record<ReferralStatus, { dot: string; badge: string }> = {
  'Not Sent': { dot: 'bg-carbon-gray-40', badge: 'bg-carbon-gray-20 text-carbon-gray-70' },
  'Pending': { dot: 'bg-[#f1c21b]', badge: 'bg-[#fdf6dd] text-[#b45309]' },
  'Scheduled': { dot: 'bg-[#0043ce]', badge: 'bg-[#d0e2ff] text-[#0043ce]' },
  'Completed': { dot: 'bg-[#24a148]', badge: 'bg-[#defbe6] text-[#0e6027]' },
};

const ENCOUNTER_TABS = [
  { key: 'summary', label: 'Summary' },
  { key: 'results', label: 'Results' },
  { key: 'orders', label: 'Orders' },
  { key: 'plan', label: 'Plan' },
  { key: 'return', label: '↩ Return to Cerner' },
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
            <p className="text-xs font-bold text-carbon-gray-100">Close Care Gap</p>
            <p className="text-2xs text-carbon-gray-50 mt-0.5">Mrs. Alex Kirby — {gap.name} · {gap.cmsMips}</p>
          </div>
          <button onClick={onClose} className="text-carbon-gray-50 hover:text-carbon-gray-100 p-1"><Icon name="XMarkIcon" size={16} /></button>
        </div>
        <div className="flex border-b border-carbon-gray-20">
          {[{ n: 1, label: 'Closure Method' }, { n: 2, label: 'Evidence & Documentation' }, { n: 3, label: 'Confirm & Sign' }].map(({ n, label }) => (
            <div key={n} className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-2xs font-semibold border-b-2 transition-colors ${step === n ? 'border-[#0043ce] text-[#0043ce] bg-[#edf5ff]' : step > n ? 'border-[#24a148] text-[#24a148]' : 'border-transparent text-carbon-gray-40'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold flex-shrink-0 ${step === n ? 'bg-[#0043ce] text-white' : step > n ? 'bg-[#24a148] text-white' : 'bg-carbon-gray-20 text-carbon-gray-50'}`}>{step > n ? '✓' : n}</span>
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-carbon-gray-100 mb-3">How was this gap addressed?</p>
              {METHODS.map((m) => (
                <label key={m} className="flex items-center gap-3 px-3 py-2.5 border border-carbon-gray-20 cursor-pointer hover:bg-carbon-gray-10 transition-colors">
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="accent-[#0043ce]" />
                  <span className="text-xs text-carbon-gray-100">{m}</span>
                </label>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-carbon-gray-100 mb-2">Supporting Sources</p>
                <div className="flex gap-2 flex-wrap">
                  {SOURCES.map((s) => (
                    <button key={s} onClick={() => toggleSource(s)} className={`text-xs font-semibold px-3 py-1.5 border transition-colors ${sources.includes(s) ? 'bg-[#0043ce] text-white border-[#0043ce]' : 'bg-white text-carbon-gray-70 border-carbon-gray-30 hover:border-[#0043ce]'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-carbon-gray-100 mb-2">Clinical Note</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="Enter clinical note supporting gap closure..." className="w-full border border-carbon-gray-30 px-3 py-2 text-xs text-carbon-gray-100 resize-none focus:outline-none focus:border-[#0043ce]" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#f4f4f4] border border-carbon-gray-20 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-carbon-gray-100 mb-2">Closure Summary</p>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">Gap</span><span className="font-medium text-carbon-gray-100">{gap.name}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">Measure</span><span className="font-medium text-carbon-gray-100">{gap.cmsMips}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">Method</span><span className="font-medium text-carbon-gray-100">{method || '—'}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">Evidence Sources</span><span className="font-medium text-carbon-gray-100">{sources.join(', ') || '—'}</span></div>
              </div>
              <div className="bg-[#defbe6] border border-[#a7f0ba] px-3 py-2 flex items-center gap-2">
                <Icon name="TrophyIcon" size={12} className="text-[#0e6027]" />
                <p className="text-2xs text-[#0e6027] font-semibold">MIPS Quality Score Impact: Est. +4 pts upon closure</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 accent-[#0043ce]" />
                <span className="text-2xs text-carbon-gray-70 leading-relaxed">I attest that the information provided is accurate and complete to the best of my clinical knowledge. This documentation will be submitted to the payer for quality measure credit.</span>
              </label>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-carbon-gray-20 flex items-center justify-between">
          <button onClick={onClose} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-10 transition-colors">Cancel</button>
          <div className="flex items-center gap-2">
            {step > 1 && <button onClick={() => setStep((s) => (s - 1) as CloseGapStep)} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-10 transition-colors">← Back</button>}
            {step < 3 ? (
              <button onClick={() => setStep((s) => (s + 1) as CloseGapStep)} disabled={step === 1 && !method} className="text-xs px-4 py-1.5 bg-[#0043ce] text-white hover:bg-[#0035b3] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Next →</button>
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
            <p className="text-xs font-bold text-carbon-gray-100">Confirm Diagnosis & Document</p>
            <p className="text-2xs text-carbon-gray-50 mt-0.5">Mrs. Alex Kirby — {cdi.condition}</p>
          </div>
          <button onClick={onClose} className="text-carbon-gray-50 hover:text-carbon-gray-100 p-1"><Icon name="XMarkIcon" size={16} /></button>
        </div>
        <div className="flex border-b border-carbon-gray-20">
          {[{ n: 1, label: 'Evidence Review' }, { n: 2, label: 'ICD-10 Confirmation' }, { n: 3, label: 'Sign & Submit' }].map(({ n, label }) => (
            <div key={n} className={`flex-1 flex items-center gap-2 px-4 py-2.5 text-2xs font-semibold border-b-2 transition-colors ${step === n ? 'border-[#b45309] text-[#b45309] bg-[#fdf6dd]' : step > n ? 'border-[#24a148] text-[#24a148]' : 'border-transparent text-carbon-gray-40'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-2xs font-bold flex-shrink-0 ${step === n ? 'bg-[#b45309] text-white' : step > n ? 'bg-[#24a148] text-white' : 'bg-carbon-gray-20 text-carbon-gray-50'}`}>{step > n ? '✓' : n}</span>
              {label}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap mb-3">{cdi.evidenceSources.map((src) => (<span key={src} className={`text-2xs font-semibold px-2 py-0.5 ${SOURCE_BADGE[src] || 'bg-carbon-gray-20 text-carbon-gray-70'}`}>{src}</span>))}</div>
              <div className="space-y-1.5">{cdi.signals.map((sig, i) => (<div key={i} className={`flex items-center gap-2 px-3 py-2 text-2xs border ${sig.flagged ? 'bg-[#fff8f8] border-[#ffb3b8]' : 'bg-white border-carbon-gray-20'}`}><span className={`font-semibold px-1.5 py-0.5 text-2xs ${SOURCE_BADGE[sig.source] || ''}`}>{sig.source}</span><span className="text-carbon-gray-70">{sig.label}:</span><span className={`font-medium ${sig.flagged ? 'text-[#da1e28]' : 'text-carbon-gray-100'}`}>{sig.value}</span></div>))}</div>
              <div className="bg-white border border-carbon-gray-20 px-3 py-2"><p className="text-2xs font-semibold text-carbon-gray-70 mb-1 uppercase tracking-wide">Clinical Justification</p><p className="text-2xs text-carbon-gray-70 leading-relaxed">{cdi.justification}</p></div>
              <div className="flex items-center gap-4 bg-[#f4f4f4] px-3 py-2">
                <div><p className="text-2xs text-carbon-gray-50">Confidence</p><p className="text-sm font-bold font-mono text-[#24a148]">{cdi.confidence}%</p></div>
                <div><p className="text-2xs text-carbon-gray-50">RAF Delta</p><p className="text-sm font-bold font-mono text-[#0e6027]">{cdi.rafDelta}</p></div>
                <div><p className="text-2xs text-carbon-gray-50">Revenue at Risk</p><p className="text-sm font-bold font-mono text-[#b45309]">{cdi.revenueDelta}</p></div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="bg-[#f4f4f4] border border-carbon-gray-20 px-3 py-2.5"><p className="text-2xs text-carbon-gray-50 mb-0.5">Current Code</p><p className="text-xs font-mono font-semibold text-carbon-gray-100">{cdi.currentCode}</p></div>
                <div className="bg-[#defbe6] border border-[#a7f0ba] px-3 py-2.5"><p className="text-2xs text-[#0e6027] mb-0.5">Suggested Specificity Upgrade</p><p className="text-xs font-mono font-semibold text-[#0e6027]">{cdi.suggestedCode}</p></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-carbon-gray-100 mb-1.5">Override / Modify ICD-10</p>
                <input type="text" value={icdOverride} onChange={(e) => setIcdOverride(e.target.value)} className="w-full border border-carbon-gray-30 px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#b45309]" />
              </div>
              <div className="bg-[#fdf6dd] border border-[#f1c21b] px-4 py-3">
                <p className="text-2xs font-semibold text-[#b45309] mb-2">RAF Impact Estimate</p>
                <div className="flex items-center gap-6">
                  <div><p className="text-2xs text-carbon-gray-50">RAF Delta</p><p className="text-lg font-bold font-mono text-[#0e6027]">{rafDeltaNum > 0 ? '+' : ''}{rafDeltaNum.toFixed(2)}</p></div>
                  <div><p className="text-2xs text-carbon-gray-50">Est. Revenue Impact</p><p className="text-lg font-bold font-mono text-[#b45309]">${revenueNum.toLocaleString()}</p></div>
                  <div><p className="text-2xs text-carbon-gray-50">Submission Deadline</p><p className="text-xs font-semibold text-carbon-gray-100">Dec 31, 2026</p></div>
                </div>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-[#f4f4f4] border border-carbon-gray-20 px-4 py-3 space-y-2">
                <p className="text-xs font-semibold text-carbon-gray-100 mb-2">Submission Summary</p>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">Condition</span><span className="font-medium text-carbon-gray-100">{cdi.condition}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">ICD-10 Code</span><span className="font-mono font-medium text-carbon-gray-100">{icdOverride}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">RAF Delta</span><span className="font-mono font-semibold text-[#0e6027]">{cdi.rafDelta}</span></div>
                <div className="flex justify-between text-2xs"><span className="text-carbon-gray-50">Revenue Impact</span><span className="font-mono font-semibold text-[#b45309]">{cdi.revenueDelta}</span></div>
              </div>
              <div>
                <p className="text-xs font-semibold text-carbon-gray-100 mb-2">Submit To</p>
                <div className="flex gap-2">
                  {(['EMR', 'Payer', 'Both'] as const).map((t) => (
                    <button key={t} onClick={() => setSubmitTarget(t)} className={`text-xs font-semibold px-4 py-2 border transition-colors ${submitTarget === t ? 'bg-[#0043ce] text-white border-[#0043ce]' : 'bg-white text-carbon-gray-70 border-carbon-gray-30 hover:border-[#0043ce]'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 accent-[#0043ce]" />
                <span className="text-2xs text-carbon-gray-70 leading-relaxed">I attest that this diagnosis is supported by clinical evidence documented in the medical record and meets the criteria for the specified ICD-10 code.</span>
              </label>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-carbon-gray-20 flex items-center justify-between">
          <button onClick={onClose} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-10 transition-colors">Cancel</button>
          <div className="flex items-center gap-2">
            {step > 1 && <button onClick={() => setStep((s) => (s - 1) as ConfirmDocStep)} className="text-xs px-3 py-1.5 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-10 transition-colors">← Back</button>}
            {step < 3 ? (
              <button onClick={() => setStep((s) => (s + 1) as ConfirmDocStep)} className="text-xs px-4 py-1.5 bg-[#b45309] text-white hover:bg-[#8a3d07] transition-colors">Next →</button>
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
      { label: 'Modify', icon: 'PencilSquareIcon', color: 'text-[#0043ce]' },
      { label: 'Cancel', icon: 'XCircleIcon', color: 'text-[#da1e28]' },
    ],
    'Pending': [
      { label: 'Upgrade Urgency', icon: 'ArrowUpCircleIcon', color: 'text-[#da1e28]' },
      { label: 'Add Clinical Note', icon: 'PencilSquareIcon', color: 'text-[#0043ce]' },
      { label: 'Cancel', icon: 'XCircleIcon', color: 'text-[#da1e28]' },
      { label: 'Reassign Provider', icon: 'ArrowPathIcon', color: 'text-[#b45309]' },
    ],
    'Scheduled': [
      { label: 'Add Note', icon: 'PencilSquareIcon', color: 'text-[#0043ce]' },
      { label: 'View Appointment', icon: 'CalendarIcon', color: 'text-[#0043ce]' },
      { label: 'Cancel', icon: 'XCircleIcon', color: 'text-[#da1e28]' },
    ],
    'Completed': [
      { label: 'View Outcome', icon: 'DocumentTextIcon', color: 'text-[#0043ce]' },
      { label: 'Create Follow-up', icon: 'PlusCircleIcon', color: 'text-[#0e6027]' },
    ],
  };
  const menuActions = actions[referral.status];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-2xs font-semibold px-2 py-1 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-10 transition-colors flex items-center gap-1 whitespace-nowrap"
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
              <span className="text-carbon-gray-100">{act.label}</span>
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
    <div className="border-t border-carbon-gray-20 px-3 py-1.5 flex items-center justify-between bg-[#f4f4f4] flex-shrink-0">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 0}
        className="text-2xs font-semibold px-2 py-0.5 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>
      <span className="text-2xs text-carbon-gray-50">
        {page + 1} / {totalPages}
        <span className="ml-1 text-carbon-gray-40">({total} total)</span>
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages - 1}
        className="text-2xs font-semibold px-2 py-0.5 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MdSmartSummaryScreen({ launchContext, onAuditEntry, onOpenOrderEntry }: MdSmartSummaryScreenProps) {
  // Get Maria Redhawk from patient registry using FHIR ID
  const registryPatient = getPatientByFhirId(launchContext.patientId);
  
  console.log('🔍 DEBUG - Launch Context Patient ID:', launchContext.patientId);
  console.log('🔍 DEBUG - Registry Patient Found:', registryPatient ? 'YES' : 'NO');
  console.log('🔍 DEBUG - Registry Patient Name:', registryPatient?.name);
  console.log('🔍 DEBUG - Registry Care Gaps Count:', registryPatient?.careGaps?.length);
  
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
  
  console.log('🔍 DEBUG - Final Care Gaps Count:', careGaps.length);
  console.log('🔍 DEBUG - Care Gap Names:', careGaps.map(g => g.measureName));

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
      console.log(`✅ ${referralStore.getAllReferrals().length} referrals created and ready for doctor approval`);

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
      console.log('🔄 Navigating to Specialist Inbox...');
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
      '🔄 Reset Demo Data?\n\n' +
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
      alert('✅ Demo data has been reset!\n\nYou can now run through the demo workflow again.');
      onAuditEntry?.('demo-reset', { timestamp: new Date().toISOString() });
    }
  }, [onAuditEntry]);

  // If showing generated plan form, render it full screen
  if (showGeneratedPlan && generatedPlan) {
    return (
      <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#f4f4f4]">
        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          <button
            onClick={handleCancelCarePlan}
            className="flex items-center gap-2 text-sm text-[#0f62fe] hover:text-[#0043ce] font-medium mb-4"
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
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-[#f4f4f4]">

      {/* ── ER/Admission Alert Banner ─────────────────────────────────────── */}
      <div className="bg-[#da1e28] text-white px-4 py-2 flex items-center gap-3 flex-shrink-0">
        <Icon name="ExclamationTriangleIcon" size={14} />
        <span className="text-xs font-bold">⚠ Patient seen in ER (03/29/2026) — High utilization risk · 2 ER visits in 60 days</span>
        <button className="ml-auto text-xs font-semibold px-3 py-1 bg-white text-[#da1e28] hover:bg-[#ffe0e0] transition-colors flex-shrink-0">Escalate Now</button>
      </div>

      {/* ── Gap Closure Metrics Panel (shows when gaps are closed) ─────────── */}
      <div className="flex-shrink-0">
        <GapClosureMetricsPanel
          patientId={displayPatient.id}
          patientName={displayPatient.name}
        />
      </div>

      {/* ── Encounter-phase top tabs + Complexity selector ────────────────── */}
      <div className="bg-white border-b border-carbon-gray-20 flex items-center flex-shrink-0">
        {ENCOUNTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveEncounterTab(tab.key); if (tab.key === 'orders') onOpenOrderEntry?.(); }}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${activeEncounterTab === tab.key ? 'border-[#6929c4] text-[#6929c4] bg-[#f6f2ff]' : 'border-transparent text-carbon-gray-70 hover:text-carbon-gray-100 hover:bg-carbon-gray-10'}`}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 px-3">
          <span className="text-2xs text-carbon-gray-50 mr-1">Summary:</span>
          {(['Concise', 'Moderate-Detail', 'High-Detail'] as SummaryComplexity[]).map((c) => (
            <button key={c} onClick={() => setComplexity(c)} className={`text-2xs font-semibold px-2 py-1 transition-colors ${complexity === c ? 'bg-[#6929c4] text-white' : 'bg-carbon-gray-10 text-carbon-gray-70 hover:bg-carbon-gray-20'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-3 space-y-3">

          {/* ── PATIENT HEADER ─────────────────────────────────────────────── */}
          <div className="bg-white border border-carbon-gray-20">
            {/* Identity row */}
            <div className="px-4 py-3 flex items-start gap-3 border-b border-carbon-gray-20">
              <div className="w-10 h-10 bg-carbon-gray-90 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{displayPatient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="text-sm font-bold text-carbon-gray-100">{displayPatient.name}</h2>
                  <span className="text-2xs font-bold px-1.5 py-0.5 bg-[#ffe0e0] text-[#da1e28] border border-[#ffb3b8]">Critical Risk</span>
                  <span className="text-2xs font-semibold px-1.5 py-0.5 bg-[#f6f2ff] text-[#6929c4] border border-[#d4bbff]">⚡ Cerner</span>
                </div>
                <div className="flex items-center gap-3 text-2xs text-carbon-gray-50 flex-wrap mb-2">
                  <span>DOB: {patient.dob}</span>
                  <span>Age: {patient.age}</span>
                  <span>{patient.gender}</span>
                  <span className="font-mono">{patient.mrn}</span>
                  <span>Enc: <span className="font-mono text-carbon-gray-70">{launchContext.encounterId}</span></span>
                </div>
                {/* SDoH Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {SDOH_BADGES.map((b) => (
                    <span key={b.label} className={`text-2xs font-semibold px-2 py-0.5 border ${b.color}`}>{b.label}: {b.value}</span>
                  ))}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xs text-carbon-gray-50">{patient.payer}</p>
                <p className="text-2xs font-mono text-carbon-gray-70">ID: {patient.insuranceId}</p>
                <p className="text-2xs text-carbon-gray-40 mt-1">{launchContext.practitionerName}</p>
              </div>
            </div>

            {/* ── PROMINENT JOURNEY STRIP ──────────────────────────────────── */}
            <div className="px-4 py-4 border-b border-carbon-gray-20 bg-[#fafafa]">
              <div className="flex items-center gap-0 mb-3">
                {JOURNEY_PHASES.map((phase, idx) => {
                  const isActive = phase.key === CURRENT_PHASE_KEY;
                  const isPast = idx < currentPhaseIdx;
                  return (
                    <React.Fragment key={phase.key}>
                      <div
                        className={`flex flex-col items-center cursor-pointer transition-opacity ${isActive ? 'opacity-100' : isPast ? 'opacity-70' : 'opacity-35'}`}
                        onClick={() => isActive && setJourneyExpanded(!journeyExpanded)}
                      >
                        <div className={`relative flex items-center justify-center ${isActive ? 'w-7 h-7' : 'w-5 h-5'} rounded-full border-2 transition-all ${isActive ? `${phase.color} border-transparent shadow-lg` : isPast ? 'bg-carbon-gray-50 border-carbon-gray-50' : 'bg-white border-carbon-gray-30'}`}>
                          {isActive && <Icon name="ExclamationTriangleIcon" size={12} className="text-white" />}
                          {isPast && <Icon name="CheckIcon" size={9} className="text-white" />}
                          {isActive && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#da1e28] animate-pulse" />
                          )}
                        </div>
                        <span className={`mt-1.5 whitespace-nowrap font-semibold transition-all ${isActive ? `text-xs ${phase.textColor}` : isPast ? 'text-carbon-gray-50 text-2xs' : 'text-carbon-gray-40 text-2xs'}`}>
                          {phase.label}
                        </span>
                        {isActive && (
                          <span className="text-2xs text-[#da1e28] font-bold mt-0.5">47d ▼</span>
                        )}
                      </div>
                      {idx < JOURNEY_PHASES.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-5 transition-colors ${idx < currentPhaseIdx ? 'bg-carbon-gray-50' : 'bg-carbon-gray-20'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Journey accordion */}
              {journeyExpanded && (
                <div className="bg-red-50 border border-red-200 px-4 py-3 mb-3 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-bold text-red-700 mb-1">High-Risk Transition · 47 days in phase</p>
                      <p className="text-2xs text-gray-700 leading-relaxed mb-2">Recent ER utilization, deteriorating chronic condition control, and multiple open care gaps indicate elevated near-term risk. Trajectory: <span className="font-semibold text-red-700">Worsening ↓</span></p>
                      <p className="text-2xs text-gray-600"><span className="font-medium">Next milestone:</span> Post-acute follow-up due within 7 days</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xs text-gray-600">Urgency Score</p>
                      <p className="text-2xl font-bold font-mono text-red-700">82</p>
                      <p className="text-2xs text-gray-600">/100</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {[{ label: 'A1C', value: '9.2% (2026-02-10)', flagged: true }, { label: 'ER Visits (90d)', value: '2 visits — $11,000', flagged: true }, { label: 'BP Control', value: '158/96 (2026-04-01)', flagged: true }, { label: 'Med Adherence', value: '61% PDC', flagged: true }].map((sig, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 border bg-white border-red-200 text-2xs">
                        <div className="w-1 h-1 rounded-full bg-red-600 flex-shrink-0" />
                        <span className="text-gray-600 truncate">{sig.label}:</span>
                        <span className="font-medium text-red-700 truncate">{sig.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KPI pills row */}
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setJourneyExpanded(!journeyExpanded)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors shadow-sm">
                  <Icon name="ExclamationTriangleIcon" size={11} className="text-red-700" />
                  <span className="text-xs font-bold text-red-700 whitespace-nowrap">High-Risk Transition</span>
                  <span className="text-xs text-red-600">· 47d</span>
                  <Icon name={journeyExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={10} className="text-red-700" />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 shadow-sm">
                  <span className="text-xs text-gray-600">RAF</span>
                  <span className="text-base font-bold font-mono text-gray-900">{patient.rafScore.toFixed(2)}</span>
                  <span className="text-xs text-green-700">+{patient.rafScoreDelta.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 shadow-sm">
                  <span className="text-xs text-gray-600">ER 30d</span>
                  <span className="text-base font-bold font-mono text-amber-700">{Math.round(patient.predictedErRisk * 100)}%</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 shadow-sm">
                  <span className="text-xs text-gray-600">Open Gaps</span>
                  <span className="text-base font-bold font-mono text-blue-700">{patient.openCareGaps}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 shadow-sm">
                  <span className="text-xs text-gray-600">HCC Suspects</span>
                  <span className="text-base font-bold font-mono text-orange-700">{patient.openHCCSuspects}</span>
                </div>
              </div>
            </div>
          </div>
          {/* ── AI-POWERED CARE PLAN GENERATION BANNER — Prominent display below risk scores ── */}
          {patient && (hccSuspects.length > 0 || careGaps.length > 0) && (
            <div className={`relative z-10 ${generatedPlan ? 'bg-gradient-to-r from-[#0f5323] to-[#198038]' : 'bg-gradient-to-r from-[#1e3a8a] to-[#1e40af]'} border ${generatedPlan ? 'border-[#198038]' : 'border-[#1e40af]'} p-6 text-white shadow-lg`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name={generatedPlan ? "CheckCircleIcon" : "SparklesIcon"} size={28} className="text-white" />
                    <div>
                      <h3 className="text-xl font-semibold">
                        {generatedPlan ? 'Care Plan generated, switch to Specialist View' : 'Generate Suggested Draft Care Plan'}
                      </h3>
                      {!generatedPlan && (
                        <p className="text-sm opacity-90 mt-1">For Doctor to approve or adjust</p>
                      )}
                    </div>
                  </div>
                  {generatedPlan ? (
                    <>
                      <p className="text-sm mb-4 opacity-90">
                        Comprehensive care plan created with {generatedPlan.goals?.length || 0} goals and {generatedPlan.goals?.reduce((sum, g) => sum + (g.interventions?.length || 0), 0) || 0} interventions. View in Patient History → Care Plans section.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Icon name="DocumentTextIcon" size={16} />
                          <span>{generatedPlan.goals?.length || 0} Goals</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="ClipboardDocumentListIcon" size={16} />
                          <span>{generatedPlan.goals?.reduce((sum, g) => sum + (g.interventions?.length || 0), 0) || 0} Interventions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="CalendarIcon" size={16} />
                          <span>Created {new Date().toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="CheckCircleIcon" size={16} />
                          <span>Ready for Review</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm mb-4 opacity-90">
                        Automatically generate a holistic care plan that addresses ALL patient needs in one comprehensive plan:
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        {hccSuspects.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Icon name="DocumentTextIcon" size={16} />
                            <span>{hccSuspects.length} HCC Suspects</span>
                          </div>
                        )}
                        {careGaps.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Icon name="FlagIcon" size={16} />
                            <span>{careGaps.length} Care Gaps</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Icon name="ExclamationTriangleIcon" size={16} />
                          <span>High-Risk Patient</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon name="UserGroupIcon" size={16} />
                          <span>Multi-Specialty</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs opacity-75">
                        <Icon name="ClockIcon" size={14} />
                        <span>3-Click Workflow: Generate → Review → Approve & Send</span>
                      </div>
                    </>
                  )}
                </div>
                {generatedPlan ? (
                  <button
                    onClick={() => {
                      setShowGeneratedPlan(true);
                      setShowPatientHistory(false);
                    }}
                    className="px-6 py-3 bg-white text-[#0f5323] text-base font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap shadow-sm"
                  >
                    <Icon name="DocumentTextIcon" size={20} />
                    View Care Plan
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateComprehensive}
                    disabled={isGenerating}
                    className="px-6 py-3 bg-white text-[#1e3a8a] text-base font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap shadow-sm"
                  >
                    {isGenerating ? (
                      <>
                        <Icon name="ArrowPathIcon" size={20} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Icon name="SparklesIcon" size={20} />
                        Generate Draft Plan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Patient History Summary/Details (Collapsible) ── */}
          <div className="bg-white border border-carbon-gray-20">
            {/* Collapsible Header */}
            <button
              onClick={() => setShowPatientHistory(!showPatientHistory)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-carbon-gray-10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon name="DocumentTextIcon" size={16} className="text-[#0043ce]" />
                <span className="text-sm font-bold text-carbon-gray-100">
                  {showPatientHistory ? 'Patient History Details' : 'Patient History Summary'}
                </span>
                <span className="text-xs text-carbon-gray-50">
                  {showPatientHistory ? 'Click to collapse to summary view' : 'Click to expand for detailed FHIR resources'}
                </span>
              </div>
              <Icon
                name={showPatientHistory ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                size={20}
                className="text-carbon-gray-70"
              />
            </button>

            {/* Collapsed View - High-Level Summary */}
            {!showPatientHistory && (
              <div className="border-t border-carbon-gray-20 p-4 bg-[#f4f4f4]">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-3 border border-carbon-gray-20">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="HeartIcon" size={14} className="text-[#da1e28]" />
                      <h4 className="text-xs font-bold text-carbon-gray-100">Active Conditions</h4>
                    </div>
                    <p className="text-2xl font-bold text-carbon-gray-100 mb-1">4</p>
                    <p className="text-2xs text-carbon-gray-50">2 High Severity</p>
                  </div>
                  <div className="bg-white p-3 border border-carbon-gray-20">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="BeakerIcon" size={14} className="text-[#0043ce]" />
                      <h4 className="text-xs font-bold text-carbon-gray-100">Medications</h4>
                    </div>
                    <p className="text-2xl font-bold text-carbon-gray-100 mb-1">5</p>
                    <p className="text-2xs text-[#da1e28]">2 Low Adherence</p>
                  </div>
                  <div className="bg-white p-3 border border-carbon-gray-20">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="ChartBarIcon" size={14} className="text-[#b45309]" />
                      <h4 className="text-xs font-bold text-carbon-gray-100">Labs & Vitals</h4>
                    </div>
                    <p className="text-2xl font-bold text-carbon-gray-100 mb-1">6</p>
                    <p className="text-2xs text-[#da1e28]">4 Out of Range</p>
                  </div>
                  <div className="bg-white p-3 border border-carbon-gray-20">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="DocumentTextIcon" size={14} className="text-[#24a148]" />
                      <h4 className="text-xs font-bold text-carbon-gray-100">Care Plans</h4>
                    </div>
                    <p className="text-2xl font-bold text-carbon-gray-100 mb-1">{generatedPlan ? '1' : '0'}</p>
                    <p className="text-2xs text-carbon-gray-50">{generatedPlan ? 'AI Generated' : 'None Active'}</p>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-white border border-carbon-gray-20">
                  <p className="text-xs text-carbon-gray-70">
                    <strong>Key Patient Needs:</strong> High-risk patient with uncontrolled diabetes (A1C 9.2%),
                    declining kidney function (eGFR 42), and medication adherence issues. Requires immediate intervention
                    for chronic disease management and care coordination.
                  </p>
                </div>
              </div>
            )}

            {/* Expanded View - Master-Detail Layout */}
            {showPatientHistory && (
              <div className="border-t border-carbon-gray-20">
                <div className="grid grid-cols-[250px_1fr] divide-x divide-carbon-gray-20">
                  {/* Left Column: Resource List */}
                  <div className="bg-[#f4f4f4]">
                    <div className="p-3 border-b border-carbon-gray-20">
                      <h4 className="text-xs font-bold text-carbon-gray-100">FHIR Resources</h4>
                      <p className="text-2xs text-carbon-gray-50 mt-1">Select a resource to view details</p>
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
                            <Icon name={resource.icon as any} size={14} className={selectedResource === resource.name ? 'text-[#0f62fe]' : 'text-carbon-gray-70'} />
                            <span className={`text-xs ${selectedResource === resource.name ? 'font-bold text-carbon-gray-100' : 'text-carbon-gray-70'}`}>
                              {resource.name}
                            </span>
                          </div>
                          <span className={`text-2xs font-bold px-1.5 py-0.5 ${
                            selectedResource === resource.name
                              ? 'bg-[#0f62fe] text-white'
                              : 'bg-carbon-gray-20 text-carbon-gray-70'
                          }`}>
                            {resource.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Resource Details */}
                  <div className="bg-white p-4">
                    {selectedResource === 'Conditions' && (
                      <div>
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Active Conditions</h4>
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
                                  <p className="text-xs font-semibold text-carbon-gray-100">{condition.name}</p>
                                  <p className="text-2xs text-carbon-gray-50 mt-0.5">ICD-10: {condition.code}</p>
                                </div>
                                <span className={`text-2xs font-bold px-2 py-0.5 ${
                                  condition.severity === 'High' ? 'bg-[#ffe0e0] text-[#da1e28]' : 'bg-[#fdf6dd] text-[#b45309]'
                                }`}>
                                  {condition.severity}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-2xs text-carbon-gray-50">
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
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Current Medications</h4>
                        <div className="space-y-3">
                          {MEDS_DATA.map((med, idx) => (
                            <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-carbon-gray-100">{med.name}</p>
                                  <p className="text-2xs text-carbon-gray-50 mt-0.5">Frequency: {med.freq} • Dosage: {med.dosage}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xs font-bold ${med.flag ? 'text-[#da1e28]' : 'text-[#24a148]'}`}>
                                    {med.adherence}%
                                  </p>
                                  <p className="text-2xs text-carbon-gray-50">Adherence</p>
                                </div>
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Prescribing Provider:</span>
                                  <span className="text-carbon-gray-70 font-medium">{med.prescriber}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Date Prescribed:</span>
                                  <span className="text-carbon-gray-70">{med.datePrescribed}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">NDC Number:</span>
                                  <span className="text-carbon-gray-70 font-mono">{med.ndc}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Quantity:</span>
                                  <span className="text-carbon-gray-70">{med.quantity}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Refills:</span>
                                  <span className="text-carbon-gray-70">{med.refills}</span>
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
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Recent Labs & Vitals</h4>
                        <div className="space-y-3">
                          {LABS_DATA.map((lab, idx) => (
                            <div key={idx} className="border border-carbon-gray-20 p-3 hover:bg-carbon-gray-10 transition-colors">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-xs font-semibold text-carbon-gray-100">{lab.name}</p>
                                  <p className="text-2xs text-carbon-gray-50 mt-0.5">Reference: {lab.ref}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-xs font-bold ${lab.flag ? 'text-[#da1e28]' : 'text-carbon-gray-100'}`}>
                                    {lab.value}
                                  </p>
                                  <p className="text-2xs text-carbon-gray-50">{lab.date}</p>
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
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Known Allergies</h4>
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
                                  <p className="text-xs font-semibold text-carbon-gray-100">{allergy.allergen}</p>
                                  <p className="text-2xs text-carbon-gray-50 mt-0.5">Specific: {allergy.specificAllergen}</p>
                                </div>
                                <span className={`text-2xs font-bold px-2 py-0.5 ${
                                  allergy.severity === 'Severe' ? 'bg-[#ffe0e0] text-[#da1e28]' : 'bg-[#fdf6dd] text-[#b45309]'
                                }`}>
                                  {allergy.severity}
                                </span>
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                                <div className="flex items-start justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Reaction Type:</span>
                                  <span className="text-carbon-gray-70 font-medium">{allergy.reaction}</span>
                                </div>
                                <div className="flex items-start justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Diagnosed By:</span>
                                  <span className="text-carbon-gray-70">{allergy.diagnosedBy}</span>
                                </div>
                                <div className="flex items-start justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Date Diagnosed:</span>
                                  <span className="text-carbon-gray-70">{allergy.diagnosedDate}</span>
                                </div>
                                <div className="flex items-start justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Verification:</span>
                                  <span className="text-carbon-gray-70">{allergy.verificationStatus}</span>
                                </div>
                                {allergy.notes && (
                                  <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                    <p className="text-2xs text-carbon-gray-50 mb-1">Clinical Notes:</p>
                                    <p className="text-2xs text-carbon-gray-70 italic">{allergy.notes}</p>
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
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Active Care Plans</h4>
                        {generatedPlan ? (
                          <div className="space-y-3">
                            <div className="border border-[#0043ce] bg-[#edf5ff] p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Icon name="SparklesIcon" size={16} className="text-[#0043ce]" />
                                    <p className="text-sm font-bold text-carbon-gray-100">{generatedPlan.title}</p>
                                  </div>
                                  <p className="text-xs text-carbon-gray-70 mb-2">{generatedPlan.description}</p>
                                  <div className="flex items-center gap-4 text-2xs text-carbon-gray-50">
                                    <span>Created: {new Date().toLocaleDateString()}</span>
                                    <span>•</span>
                                    <span>Type: AI-Generated Comprehensive Plan</span>
                                    <span>•</span>
                                    <span>Status: Active</span>
                                  </div>
                                </div>
                                <span className="text-2xs font-bold px-2 py-1 bg-[#0043ce] text-white whitespace-nowrap">
                                  AI Generated
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3 mt-3">
                                <div className="bg-white p-2 border border-carbon-gray-20">
                                  <p className="text-2xs text-carbon-gray-50 mb-1">Goals</p>
                                  <p className="text-sm font-bold text-carbon-gray-100">{generatedPlan.goals?.length || 0}</p>
                                </div>
                                <div className="bg-white p-2 border border-carbon-gray-20">
                                  <p className="text-2xs text-carbon-gray-50 mb-1">Interventions</p>
                                  <p className="text-sm font-bold text-carbon-gray-100">
                                    {generatedPlan.goals?.reduce((sum, g) => sum + (g.interventions?.length || 0), 0) || 0}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-[#97c1ff]">
                                <p className="text-xs font-semibold text-carbon-gray-100 mb-2">Key Focus Areas:</p>
                                <div className="flex flex-wrap gap-2">
                                  {generatedPlan.goals?.slice(0, 3).map((goal, idx) => (
                                    <span key={idx} className="text-2xs px-2 py-1 bg-white border border-carbon-gray-20 text-carbon-gray-70">
                                      {goal.description}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setShowGeneratedPlan(true);
                                  setShowPatientHistory(false);
                                }}
                                className="mt-3 w-full px-4 py-2 bg-[#0043ce] text-white text-xs font-semibold hover:bg-[#002d9c] transition-colors flex items-center justify-center gap-2"
                              >
                                <Icon name="DocumentTextIcon" size={14} />
                                View Full Care Plan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 border border-carbon-gray-20 bg-[#f4f4f4]">
                            <Icon name="DocumentTextIcon" size={48} className="text-carbon-gray-30 mx-auto mb-3" />
                            <p className="text-sm text-carbon-gray-70 font-semibold mb-2">No Active Care Plans</p>
                            <p className="text-xs text-carbon-gray-50 mb-4">Generate a comprehensive AI-powered care plan to get started</p>
                            <button
                              onClick={() => {
                                setShowPatientHistory(false);
                                // Scroll to AI banner
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-4 py-2 bg-[#0043ce] text-white text-xs font-semibold hover:bg-[#002d9c] transition-colors inline-flex items-center gap-2"
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
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Recent Procedures</h4>
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
                                  <p className="text-xs font-semibold text-carbon-gray-100">{procedure.name}</p>
                                  <p className="text-2xs text-carbon-gray-50 mt-0.5">CPT: {procedure.cptCode}</p>
                                </div>
                                <span className="text-2xs font-bold px-2 py-0.5 bg-[#defbe6] text-[#24a148]">
                                  {procedure.status}
                                </span>
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Date Performed:</span>
                                  <span className="text-carbon-gray-70">{procedure.date}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Ordering Provider:</span>
                                  <span className="text-carbon-gray-70">{procedure.orderingProvider}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Performing Provider:</span>
                                  <span className="text-carbon-gray-70">{procedure.performingProvider}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Facility:</span>
                                  <span className="text-carbon-gray-70">{procedure.facility}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                  <p className="text-2xs text-carbon-gray-50 mb-1">Indication:</p>
                                  <p className="text-2xs text-carbon-gray-70">{procedure.indication}</p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                  <p className="text-2xs text-carbon-gray-50 mb-1">Key Findings:</p>
                                  <p className="text-2xs text-carbon-gray-70 italic">{procedure.findings}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResource === 'Encounters' && (
                      <div>
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Recent Encounters</h4>
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
                                  <p className="text-xs font-semibold text-carbon-gray-100">{encounter.type}</p>
                                  <p className="text-2xs text-carbon-gray-50 mt-0.5">{encounter.facility}</p>
                                </div>
                                <span className="text-2xs font-bold px-2 py-0.5 bg-[#defbe6] text-[#24a148]">
                                  {encounter.status}
                                </span>
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Date:</span>
                                  <span className="text-carbon-gray-70">{encounter.date}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Provider:</span>
                                  <span className="text-carbon-gray-70">{encounter.provider}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                  <p className="text-2xs text-carbon-gray-50 mb-1">Chief Complaint:</p>
                                  <p className="text-2xs text-carbon-gray-70">{encounter.chiefComplaint}</p>
                                </div>
                                <div className="mt-2 pt-2 border-t border-carbon-gray-20">
                                  <p className="text-2xs text-carbon-gray-50 mb-1">Diagnosis:</p>
                                  <p className="text-2xs text-carbon-gray-70 font-medium">{encounter.diagnosis}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedResource === 'Immunizations' && (
                      <div>
                        <h4 className="text-sm font-bold text-carbon-gray-100 mb-3">Immunization History</h4>
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
                                  <p className="text-xs font-semibold text-carbon-gray-100">{immunization.vaccine}</p>
                                  <p className="text-2xs text-carbon-gray-50 mt-0.5">CVX Code: {immunization.cvxCode}</p>
                                </div>
                                <span className="text-2xs font-bold px-2 py-0.5 bg-[#defbe6] text-[#24a148]">
                                  Administered
                                </span>
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-carbon-gray-20 space-y-1">
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Date Given:</span>
                                  <span className="text-carbon-gray-70">{immunization.date}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Provider:</span>
                                  <span className="text-carbon-gray-70">{immunization.provider}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Facility:</span>
                                  <span className="text-carbon-gray-70">{immunization.facility}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Manufacturer:</span>
                                  <span className="text-carbon-gray-70">{immunization.manufacturer}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Lot Number:</span>
                                  <span className="text-carbon-gray-70 font-mono">{immunization.lotNumber}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xs">
                                  <span className="text-carbon-gray-50">Site/Route:</span>
                                  <span className="text-carbon-gray-70">{immunization.site} / {immunization.route}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {!['Conditions', 'Medications', 'Labs & Vitals', 'Allergies', 'Care Plans', 'Procedures', 'Encounters', 'Immunizations'].includes(selectedResource) && (
                      <div className="text-center py-8">
                        <Icon name="DocumentTextIcon" size={48} className="text-carbon-gray-30 mx-auto mb-3" />
                        <p className="text-sm text-carbon-gray-70 font-semibold">{selectedResource}</p>
                        <p className="text-xs text-carbon-gray-50 mt-1">Detailed view coming soon</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>


          {/* ── ROW 1: 4 columns — Chronic Conditions | Medications | Open Care Gaps | Labs & Vitals ── */}
          <div className="grid grid-cols-4 gap-3">

            {/* CHRONIC CONDITIONS */}
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="HeartIcon" size={13} className="text-[#da1e28]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Chronic Conditions</span>
                <span className="ml-auto text-2xs font-bold bg-[#ffe0e0] text-[#da1e28] px-1.5 py-0.5">{CHRONIC_CONDITIONS.length}</span>
              </div>
              <div className="divide-y divide-carbon-gray-10 flex-1">
                {paginate(CHRONIC_CONDITIONS, chronicPage).map((cond) => (
                  <div key={cond.code} className="px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${cond.acuity === 'critical' ? 'bg-[#da1e28]' : 'bg-[#f1c21b]'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-carbon-gray-100 leading-tight">{cond.label}</p>
                        <p className="text-2xs text-carbon-gray-50 mt-0.5">{cond.icd} · <span className="font-mono">{cond.hcc}</span></p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-2xs font-mono font-bold ${cond.acuity === 'critical' ? 'text-[#da1e28]' : 'text-[#b45309]'}`}>{cond.metric}</span>
                          <span className={`text-2xs px-1 py-0.5 font-semibold ${cond.trend === 'worsening' ? 'bg-[#ffe0e0] text-[#da1e28]' : 'bg-[#defbe6] text-[#0e6027]'}`}>
                            {cond.trend === 'worsening' ? '↓ Worsening' : '→ Stable'}
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
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="PlusCircleIcon" size={13} className="text-[#0e6027]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Medications</span>
                <span className="ml-auto text-2xs text-carbon-gray-50">{MEDS_DATA.length} active</span>
              </div>
              <div className="divide-y divide-carbon-gray-10 flex-1">
                {paginate(MEDS_DATA, medsPage).map((med, idx) => (
                  <div key={idx} className={`px-3 py-2.5 ${med.flag ? 'bg-[#fff8f8]' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {med.flag && <Icon name="ExclamationCircleIcon" size={10} className="text-[#da1e28] flex-shrink-0" />}
                      <p className="text-2xs font-medium text-carbon-gray-100 flex-1 truncate">{med.name}</p>
                      <span className="text-2xs text-carbon-gray-50 flex-shrink-0">{med.freq}</span>
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

            {/* OPEN CARE GAPS */}
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="ClipboardDocumentListIcon" size={13} className="text-[#0043ce]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Open Care Gaps</span>
                <span className="ml-auto bg-[#da1e28] text-white text-2xs font-bold px-1.5 py-0.5">{CARE_GAPS_ENHANCED.filter((g) => !closedGaps.includes(g.id)).length}</span>
                <button
                  onClick={() => setShowReferralModal(true)}
                  className="ml-2 px-2 py-1 text-2xs font-semibold bg-[#0043ce] text-white hover:bg-[#0035b3] transition-colors flex items-center gap-1"
                  title="Create referral for care gap"
                >
                  <Icon name="PaperAirplaneIcon" size={12} />
                  Create Referral
                </button>
                <button
                  onClick={handleDemoReset}
                  className="ml-1 px-2 py-1 text-2xs font-semibold bg-[#8a3d07] text-white hover:bg-[#6f3106] transition-colors flex items-center gap-1"
                  title="Reset demo data for next demo run"
                >
                  <Icon name="ArrowPathIcon" size={12} />
                  Reset Demo
                </button>
              </div>
              {/* Sub-header */}
              <div className="px-3 py-1.5 bg-carbon-gray-10 border-b border-carbon-gray-20 flex items-center gap-1 flex-shrink-0">
                <span className="text-2xs px-1 py-0.5 bg-[#d0e2ff] text-[#0043ce] font-semibold">HEDIS</span>
                <span className="text-2xs px-1 py-0.5 bg-[#defbe6] text-[#0e6027] font-semibold">MIPS</span>
                <span className="text-2xs text-carbon-gray-40 italic ml-1">STARS excluded</span>
              </div>
              <div className="flex-1 divide-y divide-carbon-gray-10">
                {paginate(CARE_GAPS_ENHANCED, gapsPage).map((gap) => {
                  const isClosed = closedGaps.includes(gap.id);
                  const statusStyle = GAP_STATUS_STYLE[gap.status];
                  const programColor = gap.program === 'HEDIS' ? 'bg-[#d0e2ff] text-[#0043ce]' : 'bg-[#defbe6] text-[#0e6027]';
                  return (
                    <div key={gap.id} className={`px-3 py-2 ${isClosed ? 'opacity-50 bg-[#defbe6]' : ''}`}>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1 min-w-0">
                          <span className={`text-2xs font-semibold px-1 py-0.5 flex-shrink-0 ${programColor}`}>{gap.program}</span>
                          <p className="text-2xs font-medium text-carbon-gray-100 truncate">{gap.name}</p>
                        </div>
                        <span className="text-2xs font-mono text-carbon-gray-50 flex-shrink-0">{gap.cmsMips}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusStyle.dot}`} />
                          <span className={`text-2xs font-semibold px-1 py-0.5 ${statusStyle.badge}`}>{isClosed ? 'Closed ✓' : statusStyle.label}</span>
                        </div>
                        {!isClosed && (
                          gap.status === 'Not Started' ? (
                            <button onClick={() => setCloseGapTarget(gap)} className="text-2xs font-semibold px-2 py-0.5 bg-[#0043ce] text-white hover:bg-[#0035b3] transition-colors">Close Gap</button>
                          ) : gap.status === 'Waiting on Patient' ? (
                            <button className="text-2xs font-semibold px-2 py-0.5 bg-[#f1c21b] text-[#b45309] hover:bg-[#e8b800] transition-colors">Remind</button>
                          ) : (
                            <button className="text-2xs font-semibold px-2 py-0.5 border border-[#0043ce] text-[#0043ce] hover:bg-[#edf5ff] transition-colors">View</button>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-carbon-gray-20 px-3 py-1.5 bg-[#f4f4f4] flex items-center gap-1.5 flex-shrink-0">
                <Icon name="TrophyIcon" size={10} className="text-[#0e6027]" />
                <span className="text-2xs text-carbon-gray-70">MIPS Impact: <span className="font-mono font-semibold text-[#0043ce]">Est. +12 pts</span></span>
              </div>
              <PanelPager total={CARE_GAPS_ENHANCED.length} page={gapsPage} onPage={setGapsPage} />
            </div>

            {/* LABS & VITALS */}
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="BeakerIcon" size={13} className="text-[#0043ce]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Labs & Vitals</span>
                <span className="ml-auto text-2xs text-[#da1e28] font-semibold">{LABS_DATA.filter((l) => l.flag).length} flagged</span>
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-2 divide-x divide-y divide-carbon-gray-10">
                  {paginate(LABS_DATA, labsPage).map((lab, idx) => (
                    <div key={idx} className={`px-3 py-2.5 ${lab.flag ? 'bg-[#fff8f8]' : ''}`}>
                      <div className="flex items-center gap-1 mb-0.5">
                        {lab.flag && <Icon name="ExclamationCircleIcon" size={9} className="text-[#da1e28]" />}
                        <p className="text-2xs text-carbon-gray-50 truncate">{lab.name}</p>
                      </div>
                      <p className={`text-sm font-mono font-bold ${lab.flag ? 'text-[#da1e28]' : 'text-carbon-gray-100'}`}>{lab.value}</p>
                      <p className="text-2xs text-carbon-gray-40">Ref: {lab.ref}</p>
                      <p className="text-2xs text-carbon-gray-30">{lab.date}</p>
                    </div>
                  ))}
                </div>
              </div>
              <PanelPager total={LABS_DATA.length} page={labsPage} onPage={setLabsPage} />
            </div>
          </div>

          {/* ── ROW 2: 4 columns — Potential Undiagnosed | Vitals Trend | Recent Clinical Activity | Active Referrals ── */}
          {/* NOTE: Recent Clinical Activity is col 3, Active Referrals is col 4 (swapped per request) */}
          <div className="grid grid-cols-4 gap-3">

            {/* POTENTIAL UNDIAGNOSED CONDITIONS */}
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="DocumentMagnifyingGlassIcon" size={13} className="text-[#b45309]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Potential Undiagnosed</span>
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
                  <Icon name="DocumentMagnifyingGlassIcon" size={24} className="text-carbon-gray-30 mx-auto mb-2" />
                  <p className="text-2xs text-carbon-gray-50 mb-1">Toggle to reveal CDI opportunities</p>
                  <p className="text-xs font-bold text-[#b45309]">{CDI_OPPORTUNITIES.length} suspects</p>
                  <p className="text-xs font-bold text-[#b45309]">${(totalRevenueAtRisk / 1000).toFixed(1)}K at risk</p>
                  <p className="text-2xs text-carbon-gray-40 mt-1">RAF +{totalRafAtRisk.toFixed(2)}</p>
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
                                <p className="text-2xs font-semibold text-carbon-gray-100 leading-tight">{cdi.condition}</p>
                                <p className="text-2xs text-carbon-gray-50">{cdi.icd} · {cdi.hcc}</p>
                              </div>
                              <span className="text-2xs font-mono font-bold text-[#0e6027] flex-shrink-0">{cdi.rafDelta}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-carbon-gray-20">
                                <div className={`h-full ${cdi.confidence >= 85 ? 'bg-[#24a148]' : 'bg-[#f1c21b]'}`} style={{ width: `${cdi.confidence}%` }} />
                              </div>
                              <span className="text-2xs font-mono text-carbon-gray-70">{cdi.confidence}%</span>
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
                              <div className="flex flex-wrap gap-1">{cdi.evidenceSources.map((src) => (<span key={src} className={`text-2xs font-semibold px-1.5 py-0.5 ${SOURCE_BADGE[src] || 'bg-carbon-gray-20 text-carbon-gray-70'}`}>{src}</span>))}</div>
                              <div className="space-y-1">{cdi.signals.map((sig, i) => (<div key={i} className={`flex items-center gap-1.5 px-2 py-1 text-2xs border ${sig.flagged ? 'bg-[#fff8f8] border-[#ffb3b8]' : 'bg-white border-carbon-gray-20'}`}><span className={`font-semibold px-1 py-0.5 text-2xs ${SOURCE_BADGE[sig.source] || ''}`}>{sig.source}</span><span className="text-carbon-gray-70">{sig.label}:</span><span className={`font-medium ${sig.flagged ? 'text-[#da1e28]' : 'text-carbon-gray-100'}`}>{sig.value}</span></div>))}</div>
                              <p className="text-2xs text-carbon-gray-70 bg-white border border-carbon-gray-20 px-2 py-1.5 leading-relaxed">{cdi.justification}</p>
                              <div className="bg-[#d0e2ff] border border-[#97c1ff] px-2 py-1.5 flex items-start gap-1.5">
                                <Icon name="InformationCircleIcon" size={10} className="text-[#0043ce] flex-shrink-0 mt-0.5" />
                                <p className="text-2xs text-[#0043ce]">{cdi.icd10Guidance}</p>
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                {isConfirmed ? (
                                  <span className="text-2xs font-semibold text-[#24a148] flex items-center gap-1"><Icon name="CheckCircleIcon" size={11} /> Confirmed</span>
                                ) : (
                                  <button onClick={() => setConfirmDocTarget(cdi)} className="text-2xs font-semibold px-2.5 py-1.5 bg-[#0e6027] text-white hover:bg-[#0a4d1e] transition-colors flex items-center gap-1">
                                    <Icon name="CheckIcon" size={10} /> Confirm & Document →
                                  </button>
                                )}
                                <button onClick={() => setExpandedCdi(null)} className="text-2xs px-2 py-1.5 border border-carbon-gray-30 text-carbon-gray-70 hover:bg-carbon-gray-10 transition-colors">Defer</button>
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

            {/* VITALS TREND SPARKLINES */}
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="ArrowTrendingUpIcon" size={13} className="text-[#da1e28]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Vitals Trend</span>
                <span className="ml-auto text-2xs text-carbon-gray-50">4 quarters</span>
              </div>
              <div className="flex-1 divide-y divide-carbon-gray-10">
                {paginate(VITALS_TREND, vitalsPage).map((vt, idx) => (
                  <div key={idx} className="px-3 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-carbon-gray-100">{vt.label}</p>
                      <div className="text-right">
                        <span className={`text-sm font-bold font-mono ${vt.flag ? 'text-[#da1e28]' : 'text-[#24a148]'}`}>{vt.values[vt.values.length - 1]}</span>
                        <span className="text-2xs text-carbon-gray-50 ml-1">{vt.unit}</span>
                        {vt.flag && <span className="ml-1 text-2xs font-bold text-[#da1e28]">↑</span>}
                      </div>
                    </div>
                    <Sparkline values={vt.values} flag={vt.flag} />
                    <div className="flex justify-between mt-1">
                      <span className="text-2xs text-carbon-gray-40">{vt.dates[0]}</span>
                      <span className="text-2xs text-carbon-gray-40">{vt.dates[vt.dates.length - 1]}</span>
                    </div>
                  </div>
                ))}
              </div>
              <PanelPager total={VITALS_TREND.length} page={vitalsPage} onPage={setVitalsPage} />
            </div>

            {/* RECENT CLINICAL ACTIVITY — moved to col 3 (one left) */}
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="ClockIcon" size={13} className="text-[#0043ce]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Recent Clinical Activity</span>
              </div>
              <div className="flex-1 divide-y divide-carbon-gray-10">
                {paginate(RECENT_ACTIVITY, activityPage).map((act, idx) => (
                  <div key={idx} className={`px-3 py-3 flex items-start gap-2.5 ${act.flag ? 'bg-[#fff8f8]' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${act.flag ? 'bg-[#da1e28]' : 'bg-carbon-gray-40'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-2xs font-bold px-1.5 py-0.5 flex-shrink-0 ${act.type === 'ER' ? 'bg-[#ffe0e0] text-[#da1e28]' : act.type === 'Lab' ? 'bg-[#d0e2ff] text-[#0043ce]' : 'bg-carbon-gray-10 text-carbon-gray-70'}`}>{act.type}</span>
                        <p className="text-xs font-medium text-carbon-gray-100 truncate">{act.desc}</p>
                      </div>
                      <p className="text-2xs text-carbon-gray-40">{act.date}</p>
                    </div>
                    {act.flag && <Icon name="ExclamationCircleIcon" size={12} className="text-[#da1e28] flex-shrink-0 mt-0.5" />}
                  </div>
                ))}
              </div>
              <PanelPager total={RECENT_ACTIVITY.length} page={activityPage} onPage={setActivityPage} />
            </div>

            {/* ACTIVE REFERRALS + MD TRIAGE — moved to col 4 (one right) */}
            <div className="bg-white border border-carbon-gray-20 flex flex-col">
              <div className="px-3 py-2.5 border-b border-carbon-gray-20 flex items-center gap-2 flex-shrink-0">
                <Icon name="ArrowTopRightOnSquareIcon" size={13} className="text-[#6929c4]" />
                <span className="text-xs font-semibold text-carbon-gray-100">Active Referrals</span>
                <span className="ml-auto bg-[#6929c4] text-white text-2xs font-bold px-1.5 py-0.5">{ACTIVE_REFERRALS.filter((r) => r.status !== 'Completed').length}</span>
              </div>
              <div className="flex-1 divide-y divide-carbon-gray-10">
                {paginate(ACTIVE_REFERRALS, referralsPage).map((ref) => {
                  const statusStyle = REFERRAL_STATUS_STYLE[ref.status];
                  return (
                    <div key={ref.id} className="px-3 py-2.5">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="text-2xs font-semibold text-carbon-gray-100">{ref.specialty}</p>
                          <p className="text-2xs text-carbon-gray-50 truncate">{ref.provider}{ref.tier !== '—' ? ` · ${ref.tier}` : ''}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          <span className={`text-2xs font-semibold px-1.5 py-0.5 ${statusStyle.badge}`}>{ref.status}</span>
                        </div>
                      </div>
                      <p className="text-2xs text-carbon-gray-50 mb-2 leading-tight">{ref.reason}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className={`text-2xs font-semibold px-1.5 py-0.5 ${ref.urgency === 'Urgent' ? 'bg-[#ffe0e0] text-[#da1e28]' : 'bg-carbon-gray-10 text-carbon-gray-70'}`}>{ref.urgency}</span>
                          <span className="text-2xs text-carbon-gray-40">{ref.date}</span>
                        </div>
                        <ReferralTriageMenu referral={ref} onAction={handleReferralAction} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <PanelPager total={ACTIVE_REFERRALS.length} page={referralsPage} onPage={setReferralsPage} />
            </div>
          </div>

          {/* ── ROW 3: Full-width Financials Toggle Panel ─────────────────── */}
          <div className="bg-white border border-carbon-gray-20">
            {/* Header with toggle */}
            <div className="px-4 py-3 border-b border-carbon-gray-20 flex items-center gap-3">
              <Icon name="CurrencyDollarIcon" size={15} className="text-[#0e6027]" />
              <span className="text-sm font-bold text-carbon-gray-100">Value-Based Performance & Financials</span>
              <div className="flex items-center gap-2 ml-2">
                <button
                  onClick={() => setCanViewFinancials(!canViewFinancials)}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${canViewFinancials ? 'bg-[#0e6027]' : 'bg-carbon-gray-30'}`}
                  role="switch"
                  aria-checked={canViewFinancials}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${canViewFinancials ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-xs text-carbon-gray-50">{canViewFinancials ? 'Financial signals visible' : 'Toggle to enable VBP financial signals'}</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-2xs text-carbon-gray-50">Contract:</span>
                <span className="text-2xs font-semibold text-carbon-gray-100">Humana MA-PD 2026 VBP</span>
              </div>
            </div>

            {canViewFinancials ? (
              <div className="px-4 py-4">
                <div className="grid grid-cols-4 gap-4 mb-4">
                  {/* RAF Revenue at Risk */}
                  <div className="bg-[#fdf6dd] border border-[#f1c21b] px-4 py-3">
                    <p className="text-2xs text-carbon-gray-50 mb-1">RAF Revenue at Risk</p>
                    <p className="text-2xl font-bold font-mono text-[#b45309]">${(totalRevenueAtRisk / 1000).toFixed(1)}K</p>
                    <p className="text-2xs text-carbon-gray-50 mt-1">{CDI_OPPORTUNITIES.length} HCC suspects · RAF +{totalRafAtRisk.toFixed(2)}</p>
                  </div>
                  {/* VBP Projected Savings */}
                  <div className="bg-[#defbe6] border border-[#a7f0ba] px-4 py-3">
                    <p className="text-2xs text-carbon-gray-50 mb-1">VBP Projected Savings</p>
                    <p className="text-2xl font-bold font-mono text-[#0e6027]">$4,200</p>
                    <p className="text-2xs text-carbon-gray-50 mt-1">Gap closure — 5 measures</p>
                  </div>
                  {/* Prior Auth Signals */}
                  <div className="bg-[#edf5ff] border border-[#97c1ff] px-4 py-3">
                    <p className="text-2xs text-carbon-gray-50 mb-1">Prior Auth Signals</p>
                    <p className="text-2xl font-bold font-mono text-[#0043ce]">2 pending</p>
                    <p className="text-2xs text-carbon-gray-50 mt-1">Nephrology · Renal US</p>
                  </div>
                  {/* MIPS Quality Impact */}
                  <div className="bg-[#f6f2ff] border border-[#d4bbff] px-4 py-3">
                    <p className="text-2xs text-carbon-gray-50 mb-1">MIPS Quality Impact</p>
                    <p className="text-2xl font-bold font-mono text-[#6929c4]">+12 pts</p>
                    <p className="text-2xs text-carbon-gray-50 mt-1">If all open gaps closed</p>
                  </div>
                </div>
                {/* HCC suspect revenue breakdown */}
                {hccSuspects.length > 0 && (
                  <div className="border border-carbon-gray-20 divide-y divide-carbon-gray-10">
                    <div className="px-3 py-1.5 bg-carbon-gray-10 flex items-center gap-2">
                      <span className="text-2xs font-semibold text-carbon-gray-70 uppercase tracking-wide">HCC Suspect Revenue Breakdown</span>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-carbon-gray-10">
                      {hccSuspects.map((hcc) => (
                        <div key={hcc.id} className="px-4 py-2.5">
                          <p className="text-2xs font-medium text-carbon-gray-100">{hcc.hccDescription}</p>
                          <p className="text-sm font-bold font-mono text-[#b45309] mt-0.5">+${hcc.estimatedRevenueDelta.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-6 flex items-center justify-center gap-3">
                <Icon name="LockClosedIcon" size={20} className="text-carbon-gray-30" />
                <div>
                  <p className="text-sm font-semibold text-carbon-gray-70">Financial signals hidden</p>
                  <p className="text-2xs text-carbon-gray-50">Enable the toggle above to view VBP performance data, RAF revenue at risk, and prior auth signals</p>
                </div>
              </div>
            )}

            {/* VBP Disclaimer — ALWAYS VISIBLE */}
            <div className="border-t border-[#d4bbff] bg-[#f6f2ff] px-4 py-2.5 flex items-start gap-2">
              <Icon name="ShieldCheckIcon" size={12} className="text-[#6929c4] flex-shrink-0 mt-0.5" />
              <p className="text-2xs text-[#6929c4] leading-relaxed">
                <span className="font-semibold">VBP Disclaimer:</span> Incentives per 2026 VBP contract with Humana MA-PD. Subject to CMS AKS VBE safe harbor and Stark VBE exception. Quality-based only — not tied to referral volume or patient steering. Financial signals are for care coordination purposes only.
              </p>
            </div>

            {/* CMS-0057-F Note — ALWAYS VISIBLE */}
            <div className="border-t border-carbon-gray-20 bg-[#f4f4f4] px-4 py-2 flex items-start gap-2">
              <Icon name="InformationCircleIcon" size={11} className="text-carbon-gray-40 flex-shrink-0 mt-0.5" />
              <p className="text-2xs text-carbon-gray-50 leading-relaxed">
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
    </div>
  );
}
