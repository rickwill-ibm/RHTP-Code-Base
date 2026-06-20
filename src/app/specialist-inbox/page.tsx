'use client';
import React, { useState, useMemo, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Icon from '@/components/ui/AppIcon';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/lib/appContext';
import { getPatientById } from '@/lib/patientRegistry';
import { effectiveMemberId } from '@/lib/careTeam/identity';
import { getMemberName } from '@/lib/careTeam/members';
import { useGapClosureStore } from '@/lib/patientContext';
import type { GapClosureEvidence } from '@/lib/patientContext';

interface SpecialistTask {
  id: string;
  patient: string;
  patientId: string;
  dob: string;
  requestedIntervention: string;
  referringProvider: string;
  referringOrg: string;
  dueDate: string;
  urgency: 'Routine' | 'Urgent' | 'STAT';
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed';
  specialty: string;
  qualityMeasure: string;
  qualityProgram: string;
  gainShareValue: string;
  sharedSavingsAttribution: string;
  networkIncentiveImpact: string;
  icdCode: string;
  clinicalContext: string;
}

const STATIC_SPECIALIST_TASKS: Omit<SpecialistTask, 'patient' | 'patientId' | 'dob'>[] = [
  {
    id: 'st-001',
    requestedIntervention: 'Cardiology Evaluation — Uncontrolled Hypertension',
    referringProvider: 'Dr. James Whitfield',
    referringOrg: 'Shannon Valley PCP Group',
    dueDate: '2026-06-15',
    urgency: 'Urgent',
    status: 'Pending',
    specialty: 'Cardiology',
    qualityMeasure: 'HEDIS CBP-236 — Controlling Hypertension',
    qualityProgram: 'HEDIS',
    gainShareValue: '$195',
    sharedSavingsAttribution: '$72',
    networkIncentiveImpact: 'High',
    icdCode: 'I10',
    clinicalContext: 'BP 158/96 on 3 medications. HFpEF comorbidity. JNC 8 resistant HTN criteria met.',
  },
];

const OTHER_SPECIALIST_TASKS: SpecialistTask[] = [
  {
    id: 'st-002',
    patient: 'James Wilson',
    patientId: 'PAT-0087',
    dob: '1948-07-22',
    requestedIntervention: 'Nephrology Consult — CKD Stage 3b Monitoring',
    referringProvider: 'Dr. Sarah Johnson',
    referringOrg: 'Ozark Regional FQHC',
    dueDate: '2026-05-30',
    urgency: 'Urgent',
    status: 'Accepted',
    specialty: 'Nephrology',
    qualityMeasure: 'HEDIS CDC-001 — A1C Control',
    qualityProgram: 'HEDIS',
    gainShareValue: '$220',
    sharedSavingsAttribution: '$85',
    networkIncentiveImpact: 'High',
    icdCode: 'N18.32',
    clinicalContext: 'eGFR 42, trending down. T2DM comorbidity. Requires nephrology co-management.',
  },
  {
    id: 'st-003',
    patient: 'Margaret Okonkwo',
    patientId: 'PAT-0113',
    dob: '1955-11-08',
    requestedIntervention: 'Diabetic Eye Exam',
    referringProvider: 'Dr. Sarah Chen',
    referringOrg: 'Winner Community Health FQHC',
    dueDate: '2026-09-30',
    urgency: 'Routine',
    status: 'Pending',
    specialty: 'Ophthalmology',
    qualityMeasure: 'HEDIS EED — Diabetic Eye Exam',
    qualityProgram: 'HEDIS',
    gainShareValue: '$110',
    sharedSavingsAttribution: '$42',
    networkIncentiveImpact: 'Medium',
    icdCode: 'E11.65',
    clinicalContext: 'T2DM diagnosed 2018. No eye exam documented in 24 months. HEDIS EED gap open.',
  },
  {
    id: 'st-004',
    patient: 'James Whitaker',
    patientId: 'PAT-0156',
    dob: '1943-05-30',
    requestedIntervention: 'Colorectal Cancer Screening — Colonoscopy',
    referringProvider: 'Dr. Michael Rivera',
    referringOrg: 'Gregory County Medical Associates',
    dueDate: '2026-12-31',
    urgency: 'Routine',
    status: 'In Progress',
    specialty: 'Gastroenterology',
    qualityMeasure: 'HEDIS COL-113 — Colorectal Cancer Screening',
    qualityProgram: 'HEDIS',
    gainShareValue: '$75',
    sharedSavingsAttribution: '$28',
    networkIncentiveImpact: 'Medium',
    icdCode: 'Z12.11',
    clinicalContext: 'Age 82. No prior colonoscopy documented. FOBT acceptable alternative.',
  },
  {
    id: 'st-005',
    patient: 'Patricia Nguyen',
    patientId: 'PAT-0201',
    dob: '1960-09-17',
    requestedIntervention: 'Pulmonology Follow-up — COPD Exacerbation Risk',
    referringProvider: 'Dr. James Whitfield',
    referringOrg: 'Winner Regional Medical Center',
    dueDate: '2026-06-01',
    urgency: 'STAT',
    status: 'Pending',
    specialty: 'Pulmonology',
    qualityMeasure: 'MIPS-398 — COPD Management',
    qualityProgram: 'MIPS',
    gainShareValue: '$165',
    sharedSavingsAttribution: '$63',
    networkIncentiveImpact: 'High',
    icdCode: 'J44.1',
    clinicalContext: '2 ER visits in 90 days. Spirometry not done in 12 months. High readmission risk.',
  },
];

const URGENCY_STYLE: Record<string, string> = {
  'STAT': 'bg-[#fff1f1] text-[#da1e28] border-[#ffb3b8]',
  'Urgent': 'bg-[#fdf6dd] text-[#b45309] border-[#f1c21b]',
  'Routine': 'bg-[#d0e2ff] text-[#0043ce] border-[#97c1ff]',
};

const STATUS_STYLE: Record<string, string> = {
  'Pending': 'bg-[#fff1f1] text-[#da1e28]',
  'Accepted': 'bg-[#fdf6dd] text-[#b45309]',
  'In Progress': 'bg-[#d0e2ff] text-[#0043ce]',
  'Completed': 'bg-[#defbe6] text-[#0e6027]',
};

export default function SpecialistInboxPage() {
  const router = useRouter();
  const { activePatientId, assignments } = useAppContext();
  const activePatient = getPatientById(activePatientId);
  const { submitClosure, isGapClosed } = useGapClosureStore();

  // Build the first task dynamically from the active patient
  const firstTask: SpecialistTask = {
    ...STATIC_SPECIALIST_TASKS[0],
    patient: activePatient?.name ?? 'Unknown Patient',
    patientId: activePatient?.platformId ?? activePatientId,
    dob: activePatient?.dob ?? '—',
  };

  const SPECIALIST_TASKS: SpecialistTask[] = [firstTask, ...OTHER_SPECIALIST_TASKS];

  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Auto-populate gap closure evidence for Maria Redhawk's task
  const autoPopulateEvidence = useCallback((task: SpecialistTask): GapClosureEvidence => {
    // Parse HbA1c value from clinical context if available
    const clinicalContext = task.clinicalContext || '';
    const hba1cMatch = clinicalContext.match(/(\d+\.?\d*)\s*%/);
    const defaultHbA1c = hba1cMatch ? parseFloat(hba1cMatch[1]) : 6.8;
    
    return {
      gapId: 'CG_MARIA_001',
      status: 'CLOSED',
      closedFrom: 'PATIENT_DETAIL',
      dateOfService: new Date().toISOString().split('T')[0], // Today's date
      performingProvider: task.referringProvider || 'Bennett County Health PCP',
      placeOfService: 'Lab',
      resultValue: defaultHbA1c,
      resultUnit: '%',
      hedisCompliance: defaultHbA1c < 8.0 ? 'MET' : 'NOT_MET',
      gainshare: 8100,
      fhirObservationId: `obs-hba1c-${Date.now()}`,
      closedAt: new Date().toISOString(),
    };
  }, []);

  // Handle gap closure attestation
  const handleAttestAndClose = useCallback((task: SpecialistTask) => {
    setIsSubmitting(true);
    
    // Auto-populate evidence
    const evidence = autoPopulateEvidence(task);
    
    // Submit to gap closure store
    submitClosure(evidence);
    
    // Show success feedback
    setShowSuccessToast(true);
    setSelectedTask(null);
    
    // Navigate to verification screen after brief delay
    setTimeout(() => {
      setIsSubmitting(false);
      router.push('/care-gap-closure-verification');
    }, 1500);
  }, [autoPopulateEvidence, submitClosure, router]);

  const filtered = SPECIALIST_TASKS.filter((t) => {
    const statusMatch = filterStatus === 'All' || t.status === filterStatus;
    const urgencyMatch = filterUrgency === 'All' || t.urgency === filterUrgency;
    return statusMatch && urgencyMatch;
  });

  const totalGainShare = SPECIALIST_TASKS
    .filter((t) => t.status !== 'Completed')
    .reduce((s, t) => s + parseInt(t.gainShareValue.replace('$', '')), 0);

  const pendingCount = SPECIALIST_TASKS.filter((t) => t.status === 'Pending').length;
  const statCount = SPECIALIST_TASKS.filter((t) => t.urgency === 'STAT').length;

  // Get auto-populated evidence for display
  const mariaEvidence = useMemo(() => {
    const mariaTask = SPECIALIST_TASKS.find(t => t.id === 'st-001');
    return mariaTask ? autoPopulateEvidence(mariaTask) : null;
  }, [SPECIALIST_TASKS, autoPopulateEvidence]);

  return (
    <AppLayout
      pageTitle="Specialist Inbox — RHTP Task Queue"
      breadcrumbs={[
        { label: 'RHTP Platform', href: '/contract-program-selection' },
        { label: 'Specialist Inbox' },
      ]}
      contextBanner={
        <div className="bg-[#f6f2ff] border-b border-[#d4bbff] px-6 py-2 flex items-center gap-6 flex-wrap">
          <span className="text-xs font-semibold text-[#6929c4]">Rural Health Transformation Program</span>
          <span className="text-xs text-[#6929c4]">{pendingCount} Pending Tasks</span>
          {statCount > 0 && <span className="text-xs font-bold text-[#da1e28]">⚠ {statCount} STAT</span>}
          <span className="text-xs text-[#6929c4]">Potential Gain Share: ${totalGainShare}</span>
          <span className="ml-auto text-xs text-carbon-gray-50">Data as of May 29, 2026</span>
        </div>
      }
    >
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="mx-6 mt-4 bg-[#defbe6] border border-[#a7f0ba] px-5 py-4 flex items-center gap-4 animate-fade-in">
          <div className="w-10 h-10 bg-[#24a148] flex items-center justify-center flex-shrink-0">
            <Icon name="CheckCircleIcon" size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#0e6027]">Gap Closed Successfully!</p>
            <p className="text-xs text-[#0e6027] mt-0.5">
              HbA1c gap closed for Maria Redhawk · $8,100 gainshare attributed · Navigating to verification...
            </p>
          </div>
          <button
            onClick={() => setShowSuccessToast(false)}
            className="text-[#0e6027] hover:text-[#044317]"
          >
            <Icon name="XMarkIcon" size={16} />
          </button>
        </div>
      )}
      {/* KPI strip */}
      <div className="mx-6 mt-4 mb-4 bg-white border border-carbon-gray-20 grid grid-cols-4 divide-x divide-carbon-gray-20">
        {[
          { label: 'Pending Tasks', value: pendingCount, color: 'text-[#da1e28]' },
          { label: 'STAT Priority', value: statCount, color: 'text-[#da1e28]' },
          { label: 'Potential Gain Share', value: `$${totalGainShare}`, color: 'text-[#24a148]' },
          { label: 'Completion Rate', value: '72%', color: 'text-[#0043ce]' },
        ].map((k) => (
          <div key={k.label} className="px-5 py-4">
            <p className="carbon-label">{k.label}</p>
            <p className={`text-2xl font-bold font-mono mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="px-6 pb-6 space-y-4">
        {/* Filters */}
        <div className="bg-white border border-carbon-gray-20 px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <span className="text-2xs font-semibold text-carbon-gray-50 uppercase tracking-wide">Filter</span>
          {['All', 'Pending', 'Accepted', 'In Progress', 'Completed'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                filterStatus === s ? 'bg-[#0043ce] text-white border-[#0043ce]' : 'bg-white text-carbon-gray-70 border-carbon-gray-20 hover:bg-carbon-gray-10'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="w-px h-4 bg-carbon-gray-20 mx-1" />
          {['All', 'STAT', 'Urgent', 'Routine'].map((u) => (
            <button
              key={u}
              onClick={() => setFilterUrgency(u)}
              className={`px-3 py-1 text-xs font-medium border transition-colors ${
                filterUrgency === u ? 'bg-[#6929c4] text-white border-[#6929c4]' : 'bg-white text-carbon-gray-70 border-carbon-gray-20 hover:bg-carbon-gray-10'
              }`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Task list */}
        <div className="space-y-3">
          {filtered.map((task) => {
            const isSelected = selectedTask === task.id;
            const totalValue = parseInt(task.gainShareValue.replace('$', '')) + parseInt(task.sharedSavingsAttribution.replace('$', ''));
            return (
              <div
                key={task.id}
                className={`bg-white border transition-shadow ${
                  task.urgency === 'STAT' ? 'border-l-4 border-l-[#da1e28] border-carbon-gray-20' :
                  task.urgency === 'Urgent' ? 'border-l-4 border-l-[#b45309] border-carbon-gray-20' :
                  'border border-carbon-gray-20'
                } ${isSelected ? 'ring-2 ring-[#6929c4]' : 'hover:shadow-carbon-md'}`}
              >
                {/* Task header */}
                <div
                  className="px-5 py-4 cursor-pointer"
                  onClick={() => setSelectedTask(isSelected ? null : task.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-2xs font-semibold px-2 py-0.5 border ${URGENCY_STYLE[task.urgency]}`}>
                          {task.urgency}
                        </span>
                        <span className={`text-2xs font-semibold px-2 py-0.5 ${STATUS_STYLE[task.status]}`}>
                          {task.status}
                        </span>
                        <span className="text-2xs font-semibold px-2 py-0.5 bg-[#f6f2ff] text-[#6929c4]">
                          {task.qualityProgram}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-carbon-gray-100">{task.requestedIntervention}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-carbon-gray-50">
                        <span>
                          <span className="font-medium text-carbon-gray-70">{task.patient}</span>
                          <span className="text-carbon-gray-30 mx-1">·</span>
                          <span className="font-mono">{task.patientId}</span>
                          <span className="text-carbon-gray-30 mx-1">·</span>
                          <span>DOB: {task.dob}</span>
                        </span>
                        <span className="text-carbon-gray-30">|</span>
                        <span>{task.specialty}</span>
                        <span className="text-carbon-gray-30">·</span>
                        <span className="font-mono text-carbon-gray-30">ICD: {task.icdCode}</span>
                        {(() => {
                          const cm = getMemberName(effectiveMemberId(task.patientId, assignments) ?? '');
                          return cm ? (
                            <>
                              <span className="text-carbon-gray-30">·</span>
                              <span className="inline-flex items-center gap-1 text-carbon-gray-50">
                                <Icon name="UserCircleIcon" size={11} />
                                CM: <span className="font-medium text-carbon-gray-70">{cm}</span>
                              </span>
                            </>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs font-semibold text-[#24a148]">{task.gainShareValue}</p>
                      <p className="text-2xs text-carbon-gray-50">gain share</p>
                      <p className="text-2xs text-carbon-gray-30 mt-0.5">Due {task.dueDate}</p>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div className="border-t border-carbon-gray-20 px-5 py-4 space-y-4">
                    {/* Quality measure */}
                    <div className="bg-[#f6f2ff] border border-[#d4bbff] px-4 py-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon name="StarIcon" size={14} className="text-[#6929c4]" />
                        <span className="text-xs font-semibold text-[#6929c4]">Quality Measure</span>
                      </div>
                      <p className="text-sm font-medium text-carbon-gray-100">{task.qualityMeasure}</p>
                    </div>

                    {/* Clinical context */}
                    <div className="bg-carbon-gray-10 border border-carbon-gray-20 px-4 py-3">
                      <p className="text-2xs text-carbon-gray-50 uppercase tracking-wide mb-1">Clinical Context</p>
                      <p className="text-xs text-carbon-gray-70">{task.clinicalContext}</p>
                    </div>

                    {/* Referring provider */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-2xs text-carbon-gray-50 uppercase tracking-wide mb-0.5">Referring Provider</p>
                        <p className="text-xs font-medium text-carbon-gray-100">{task.referringProvider}</p>
                        <p className="text-2xs text-carbon-gray-50">{task.referringOrg}</p>
                      </div>
                      <div>
                        <p className="text-2xs text-carbon-gray-50 uppercase tracking-wide mb-0.5">Value Attribution</p>
                        <p className="text-xs font-medium text-carbon-gray-100">
                          Gain Share: <span className="text-[#24a148] font-bold">{task.gainShareValue}</span>
                          <span className="text-carbon-gray-30 mx-1">+</span>
                          Shared Savings: <span className="text-[#0043ce] font-bold">{task.sharedSavingsAttribution}</span>
                        </p>
                        <p className="text-2xs text-carbon-gray-50">Network Impact: {task.networkIncentiveImpact}</p>
                      </div>
                    </div>

                    {/* Inline Attestation Panel for Maria Redhawk */}
                    {task.id === 'st-001' && mariaEvidence && (
                      <div className="border-t border-carbon-gray-20 mt-4 pt-4 bg-[#f0f4ff]">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon name="SparklesIcon" size={14} className="text-[#6929c4]" />
                          <span className="text-xs font-semibold text-[#6929c4]">Auto-Populated Gap Closure Evidence</span>
                          <span className="ml-auto text-2xs text-carbon-gray-50">Review and attest below</span>
                        </div>
                        
                        {/* Auto-populated fields */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-white border border-carbon-gray-20 px-3 py-2">
                            <p className="text-2xs text-carbon-gray-50 mb-0.5">Date of Service</p>
                            <p className="text-xs font-medium text-carbon-gray-100">{mariaEvidence.dateOfService}</p>
                          </div>
                          <div className="bg-white border border-carbon-gray-20 px-3 py-2">
                            <p className="text-2xs text-carbon-gray-50 mb-0.5">Performing Provider</p>
                            <p className="text-xs font-medium text-carbon-gray-100">{mariaEvidence.performingProvider}</p>
                          </div>
                          <div className="bg-white border border-carbon-gray-20 px-3 py-2">
                            <p className="text-2xs text-carbon-gray-50 mb-0.5">Place of Service</p>
                            <p className="text-xs font-medium text-carbon-gray-100">{mariaEvidence.placeOfService}</p>
                          </div>
                          <div className="bg-white border border-[#a7f0ba] px-3 py-2 bg-[#defbe6]">
                            <p className="text-2xs text-[#0e6027] mb-0.5">HbA1c Result</p>
                            <p className="text-xs font-bold text-[#0e6027]">
                              {mariaEvidence.resultValue}% {mariaEvidence.hedisCompliance === 'MET' ? '✓ COMPLIANT' : '✗ NOT MET'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Gainshare preview */}
                        <div className="bg-[#defbe6] border border-[#a7f0ba] px-3 py-2 mb-3 flex items-center justify-between">
                          <span className="text-xs text-[#0e6027]">Gainshare Attribution</span>
                          <span className="text-sm font-bold text-[#0e6027]">${mariaEvidence.gainshare?.toLocaleString()}</span>
                        </div>
                        
                        {/* Attest button */}
                        <button
                          onClick={() => handleAttestAndClose(task)}
                          disabled={isSubmitting}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium bg-[#24a148] text-white hover:bg-[#0e6027] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Icon name="CheckCircleIcon" size={14} />
                          {isSubmitting ? 'Submitting...' : 'Attest & Close Gap'}
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => router.push('/patient-detail')}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#0043ce] text-white hover:bg-[#0035a8] transition-colors"
                      >
                        <Icon name="UserIcon" size={13} />
                        View Patient
                      </button>
                      {task.id === 'st-001' ? (
                        <button
                          onClick={() => handleAttestAndClose(task)}
                          disabled={isSubmitting}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#24a148] text-white hover:bg-[#0e6027] transition-colors disabled:opacity-50"
                        >
                          <Icon name="CheckCircleIcon" size={13} />
                          {isSubmitting ? 'Closing...' : 'Attest & Close Gap'}
                        </button>
                      ) : (
                        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#24a148] text-[#24a148] hover:bg-[#defbe6] transition-colors">
                          <Icon name="CheckCircleIcon" size={13} />
                          Accept Task
                        </button>
                      )}
                      <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-carbon-gray-20 text-carbon-gray-70 hover:bg-carbon-gray-10 transition-colors">
                        <Icon name="DocumentTextIcon" size={13} />
                        Add Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
