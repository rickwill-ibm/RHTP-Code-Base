'use client';
import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useAppContext } from '@/lib/appContext';

// ─── Demo Sequence Definition ─────────────────────────────────────────────────

interface DemoStep {
  route: string;
  label: string;
  storyBeat: string;
  stepNum: number;
  // If set, this patient ID is activated before navigating to this step
  activePatient?: string;
}

interface DemoPersona {
  id: string;
  role: string;
  title: string;
  color: string;
  bgLight: string;
  textColor: string;
  initials: string;
  steps: DemoStep[];
}

const DEMO_PERSONAS: DemoPersona[] = [
  {
    id: 'state-executive',
    role: 'P1',
    title: 'State Medicaid Executive',
    color: '#0043ce',
    bgLight: '#d0e2ff',
    textColor: '#001d6c',
    initials: 'SE',
    steps: [
      { stepNum: 1, route: '/contract-program-selection', label: 'RHTP Overview', storyBeat: 'All-program view — Clinical + BH + Social KPIs' },
      { stepNum: 2, route: '/region-view', label: 'Regions', storyBeat: 'Regional rollup — Clinical + Social + BH benchmarking' },
      { stepNum: 3, route: '/executive-outcomes-dashboard', label: 'Executive Dashboard', storyBeat: 'Whole-person outcomes delivered' },
      { stepNum: 4, route: '/financial-dashboard', label: 'Financial Dashboard (Braided Funding)', storyBeat: 'Braided funding streams + shared savings model' },
      { stepNum: 5, route: '/social-needs-dashboard', label: 'Social Needs Dashboard', storyBeat: 'Population screening funnel + dual-need cohort' },
      { stepNum: 6, route: '/outcomes-linkage', label: 'Outcomes Linkage', storyBeat: 'Housing → ED reduction, food → A1C — ROI proof' },
    ],
  },
  {
    id: 'network-director',
    role: 'P2',
    title: 'Network / Population Health Director',
    color: '#6929c4',
    bgLight: '#f6f2ff',
    textColor: '#31135e',
    initials: 'ND',
    steps: [
      { stepNum: 7, route: '/provider-level', label: 'Program Networks', storyBeat: 'Clinical / BH / CBO network tabs — org-level performance' },
      { stepNum: 8, route: '/physician-view', label: 'Care Team Members', storyBeat: 'PCPs + BH counselors + CHW supervisors — role-typed metrics' },
      { stepNum: 9, route: '/stars-hedis-mips', label: 'Care Manager Attribution', storyBeat: 'Clinical + BH + Social program quality measures — 5 tabs' },
    ],
  },
  {
    id: 'physician',
    role: 'P3',
    title: 'Primary Care Physician',
    color: '#007d79',
    bgLight: '#d9fbfb',
    textColor: '#004144',
    initials: 'MD',
    steps: [
      { stepNum: 10, route: '/md-smart-launch', label: 'MD Smart Launch', storyBeat: 'SMART on FHIR entry — embedded in EMR' },
      { stepNum: 11, route: '/panel-cohort-view', label: 'Panel & Cohort (Medicaid RHTP Track 3)', storyBeat: 'Attributed panel — PCP / CHW / BH three-column attribution', activePatient: 'MARIA_SD_001' },
      { stepNum: 12, route: '/patient-detail', label: 'Patient Detail — Whole Person Care Plan', storyBeat: 'Whole Person Care Plan tab + AI care plan + gain-share', activePatient: 'MARIA_SD_001' },
    ],
  },
  {
    id: 'care-manager',
    role: 'P4',
    title: 'Care Manager',
    color: '#da1e28',
    bgLight: '#fff1f1',
    textColor: '#750e13',
    initials: 'CM',
    steps: [
      { stepNum: 13, route: '/care-manager', label: 'Care Manager Worklist', storyBeat: 'Clinical/BH/Social filter — BH risk flags + social needs per row', activePatient: 'MARIA_SD_001' },
      { stepNum: 14, route: '/patient-episode-summary', label: 'Patient Episode Summary', storyBeat: 'All episodes for a patient' },
      { stepNum: 15, route: '/episode-detail', label: 'Episode Detail', storyBeat: 'Episode deep-dive — care setting timeline' },
      { stepNum: 16, route: '/episodic-management-analytics', label: 'Episodic Analytics', storyBeat: 'Clinical + BH Episodes + Social Program Outcomes tabs' },
    ],
  },
  {
    id: 'chw',
    role: 'P5',
    title: 'Community Health Worker',
    color: '#198038',
    bgLight: '#defbe6',
    textColor: '#044317',
    initials: 'CW',
    steps: [
      { stepNum: 17, route: '/chw-workflow', label: 'CHW Workflow', storyBeat: 'Home Visit Schedule — Start Visit, Clinical, Reschedule actions', activePatient: 'MARIA_SD_001' },
      { stepNum: 18, route: '/social-needs-screening', label: 'Social Needs Screening', storyBeat: 'PRAPARE screening → social Task creation', activePatient: 'MARIA_SD_001' },
      { stepNum: 19, route: '/program-eligibility', label: 'Program Eligibility', storyBeat: 'Eligible programs from screening results', activePatient: 'MARIA_SD_001' },
      { stepNum: 20, route: '/benefit-enrollment', label: 'Benefit Enrollment', storyBeat: 'SNAP enrolled, housing pending, gaps flagged', activePatient: 'MARIA_SD_001' },
    ],
  },
  {
    id: 'bh-crisis',
    role: 'P6',
    title: 'BH & Crisis Specialist',
    color: '#9f1853',
    bgLight: '#fff0f7',
    textColor: '#740937',
    initials: 'BH',
    steps: [
      { stepNum: 21, route: '/crisis-pathway', label: 'Crisis Pathway', storyBeat: 'SDOH context + 988/CSU/Mobile/ED dispatch + post-crisis linkage' },
      { stepNum: 22, route: '/crisis-pathway', label: 'Patient Pathway — Dorothy Simmons', storyBeat: 'PRAPARE → SNAP → BH engagement → A1C 9.2% → 7.1%' },
      { stepNum: 23, route: '/cbo-directory', label: 'CBO Directory', storyBeat: 'Community org network — domain-tagged, capacity status' },
    ],
  },
  {
    id: 'specialist',
    role: 'P7',
    title: 'Specialist / Care Team',
    color: '#f1620a',
    bgLight: '#fff2e8',
    textColor: '#8a3800',
    initials: 'SP',
    steps: [
      { stepNum: 24, route: '/care-team-inbox', label: 'Care Team Inbox', storyBeat: 'Universal task inbox — all programs' },
      { stepNum: 25, route: '/specialist-inbox', label: 'Specialist Inbox', storyBeat: 'Clinical specialist role view + gain-share value' },
      { stepNum: 26, route: '/referral-tracking', label: 'Referral Tracking', storyBeat: 'Referrals in flight + multi-program tasks' },
      { stepNum: 27, route: '/referral-journey-tracker', label: 'Referral Journey Tracker', storyBeat: 'End-to-end journey — 7 stages + audit trail' },
    ],
  },
  {
    id: 'analyst',
    role: 'P8',
    title: 'Quality / Compliance Analyst',
    color: '#8a3ffc',
    bgLight: '#f6f2ff',
    textColor: '#31135e',
    initials: 'QA',
    steps: [
      { stepNum: 28, route: '/care-gap-closure-verification', label: 'Care Gap Closure & Verification', storyBeat: 'Multi-program evidence chain — FHIR provenance' },
      { stepNum: 29, route: '/stars-hedis-mips', label: 'Care Manager Attribution', storyBeat: 'Clinical + BH + Social program quality measures — 5 tabs' },
      { stepNum: 30, route: '/outcomes-linkage', label: 'Outcomes Linkage', storyBeat: 'Social ROI — executive closing proof' },
      { stepNum: 31, route: '/executive-outcomes-dashboard', label: 'Executive Dashboard', storyBeat: 'Closed loop — patient → network → state outcome' },
    ],
  },
  {
    id: 'agentic-maria',
    role: 'P9',
    title: 'Agentic Story — Maria Redhawk',
    color: '#4f46e5',
    bgLight: '#ede9fe',
    textColor: '#2e1065',
    initials: 'AM',
    steps: [
      { stepNum: 32, route: '/uhg-orchestrate/fragmentation-split-system-view', label: 'One Enterprise · Five Entities', storyBeat: 'Why fragmentation breaks Maria\'s care across UHC, Optum, Surest, UMR, Rally', activePatient: 'MARIA_SD_001' },
      { stepNum: 33, route: '/uhg-orchestrate/cdp-assembly-split', label: 'CDP Assembly', storyBeat: '52 data dimensions unified — Maria\'s consent-governed citizen profile assembled', activePatient: 'MARIA_SD_001' },
      { stepNum: 34, route: '/whole-person-care-summary', label: 'Whole Person Care View', storyBeat: 'All 52 dimensions of Maria\'s life visible in one knowledge graph — 4 roles, 14 streams, 4 consent layers', activePatient: 'MARIA_SD_001' },
      { stepNum: 35, route: '/uhg-orchestrate/consumer-360', label: 'Journey-Aware Context', storyBeat: 'Maria\'s live episode window — milestones, expected vs. unexpected signals', activePatient: 'MARIA_SD_001' },
      { stepNum: 36, route: '/uhg-orchestrate/whole-person-care', label: 'Whole Person Care Intelligence', storyBeat: 'SDOH amplifiers: Financial 82, Caregiver Burden 88, Transport blocker → care plan mods', activePatient: 'MARIA_SD_001' },
      { stepNum: 37, route: '/uhg-orchestrate/signal-disposition-engine', label: 'Signal Disposition Engine', storyBeat: 'Live signals from Maria\'s care events — agents dispatched in real-time', activePatient: 'MARIA_SD_001' },
      { stepNum: 38, route: '/uhg-orchestrate/controller-agentic-super-orchestration-centerpiece', label: 'Agentic Super Orchestration', storyBeat: 'Controller agent coordinates CHW + Clinical + BH + Social agents for Maria', activePatient: 'MARIA_SD_001' },
      { stepNum: 39, route: '/uhg-orchestrate/agent-library', label: 'Agentic Marketplace', storyBeat: 'Agents activated for Maria\'s case — roles, triggers, outcomes', activePatient: 'MARIA_SD_001' },
      { stepNum: 40, route: '/uhg-orchestrate/family-sofia', label: 'Family Thread — Sofia', storyBeat: 'Maria\'s dependent Sofia — pediatric gaps surfaced and orchestrated in the household loop', activePatient: 'MARIA_SD_001' },
      { stepNum: 41, route: '/uhg-orchestrate/caregiver-elena', label: 'Caregiver Intelligence — Elena', storyBeat: 'Maria as caregiver — Elena\'s INR, polypharmacy, Martin Pharmacy refill sync', activePatient: 'MARIA_SD_001' },
      { stepNum: 42, route: '/uhg-orchestrate/portfolio-scale', label: 'Live Population Filter', storyBeat: 'Maria\'s profile at population scale — cohort, risk tier, at-scale impact', activePatient: 'MARIA_SD_001' },
      { stepNum: 43, route: '/uhg-orchestrate/agent-impact-dashboard', label: 'Agent Impact Dashboard', storyBeat: 'What agents achieved for Maria — A1C, appointments, SDOH tasks, cost avoidance', activePatient: 'MARIA_SD_001' },
      { stepNum: 44, route: '/uhg-orchestrate/reporting-dashboard', label: 'Agent Impact — Reporting', storyBeat: 'Closed loop — Maria\'s case as proof-point for enterprise agentic ROI', activePatient: 'MARIA_SD_001' },
    ],
  },
];

// Flat list of all steps for prev/next navigation
const ALL_STEPS: (DemoStep & { personaId: string; personaColor: string })[] = DEMO_PERSONAS.flatMap((p) =>
  p.steps.map((s) => ({ ...s, personaId: p.id, personaColor: p.color }))
);

const TOTAL_STEPS = ALL_STEPS.length;

// ─── Component ────────────────────────────────────────────────────────────────

export default function DemoNavigator() {
  const pathname = usePathname();
  const router = useRouter();
  const { setActivePatientId } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Track the last explicitly-navigated stepNum so duplicate-route pages
  // (e.g. /crisis-pathway appears at steps 21 AND 22) resolve to the right step.
  const lastStepNumRef = useRef<number | null>(null);

  // Disambiguated lookup: if multiple steps share a pathname, prefer the one
  // whose stepNum matches the last navigation; otherwise fall back to first match.
  const currentStepIndex = (() => {
    const matches = ALL_STEPS.reduce<number[]>((acc, s, i) => {
      if (s.route === pathname) acc.push(i);
      return acc;
    }, []);
    if (matches.length === 0) return -1;
    if (matches.length === 1) return matches[0];
    const preferred = matches.find((i) => ALL_STEPS[i].stepNum === lastStepNumRef.current);
    return preferred ?? matches[0];
  })();

  const currentStep = currentStepIndex >= 0 ? ALL_STEPS[currentStepIndex] : null;
  const currentPersona = currentStep
    ? DEMO_PERSONAS.find((p) => p.id === currentStep.personaId) ?? null
    : null;

  const prevStep = currentStepIndex > 0 ? ALL_STEPS[currentStepIndex - 1] : null;
  const nextStep = currentStepIndex >= 0 && currentStepIndex < ALL_STEPS.length - 1
    ? ALL_STEPS[currentStepIndex + 1]
    : null;

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [expanded]);

  // Helper: navigate to a step, setting active patient if specified.
  // Records stepNum so the disambiguated lookup above resolves correctly on arrival.
  const navigateToStep = (step: DemoStep) => {
    lastStepNumRef.current = step.stepNum;
    if (step.activePatient) {
      setActivePatientId(step.activePatient);
    }
    router.push(step.route);
    setExpanded(false);
  };

  const pillColor = currentPersona?.color ?? '#0043ce';
  const stepLabel = currentStep
    ? `${currentStep.stepNum} / ${TOTAL_STEPS} — ${currentStep.label}`
    : 'Demo Navigator';

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2"
    >
      {/* Expanded panel */}
      {expanded && (
        <div className="bg-white border border-carbon-gray-20 shadow-2xl w-80 max-h-[70vh] overflow-y-auto flex flex-col"
          style={{ borderRadius: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-carbon-gray-20 bg-carbon-gray-10 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Icon name="MapIcon" size={16} className="text-carbon-gray-70" />
              <span className="text-xs font-semibold text-carbon-gray-100 uppercase tracking-wide">Demo Sequence</span>
              <span className="text-2xs text-carbon-gray-50">9 Personas · {TOTAL_STEPS} Steps</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="p-1 text-carbon-gray-50 hover:text-carbon-gray-100 transition-colors"
            >
              <Icon name="XMarkIcon" size={14} />
            </button>
          </div>

          {/* Persona groups */}
          <div className="flex-1 overflow-y-auto py-2">
            {DEMO_PERSONAS.map((persona) => {
              const isActivePersona = persona.id === currentPersona?.id;
              return (
                <div key={persona.id} className="mb-1">
                  {/* Persona header */}
                  <div
                    className="flex items-center gap-2 px-4 py-2"
                    style={{ backgroundColor: isActivePersona ? persona.bgLight : undefined }}
                  >
                    <div
                      className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-2xs font-bold text-white"
                      style={{ backgroundColor: persona.color, borderRadius: 0 }}
                    >
                      {persona.initials}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-2xs font-semibold uppercase tracking-wide"
                        style={{ color: persona.color }}
                      >
                        {persona.role}
                      </p>
                      <p className="text-xs font-medium text-carbon-gray-100 truncate">{persona.title}</p>
                    </div>
                  </div>

                  {/* Steps */}
                  {persona.steps.map((step) => {
                    const isCurrentStep = step.route === pathname && step.stepNum === currentStep?.stepNum;
                    return (
                      <button
                        key={step.stepNum}
                        onClick={() => navigateToStep(step)}
                        className={`w-full flex items-start gap-3 px-4 py-2 text-left transition-colors hover:bg-carbon-gray-10 ${
                          isCurrentStep ? 'bg-carbon-gray-10' : ''
                        }`}
                      >
                        {/* Step number */}
                        <div
                          className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5 text-2xs font-bold"
                          style={{
                            backgroundColor: isCurrentStep ? persona.color : 'transparent',
                            color: isCurrentStep ? '#fff' : persona.color,
                            border: `1.5px solid ${persona.color}`,
                            borderRadius: 0,
                          }}
                        >
                          {step.stepNum}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-medium ${isCurrentStep ? 'text-carbon-gray-100' : 'text-carbon-gray-70'}`}
                          >
                            {step.label}
                          </p>
                          <p className="text-2xs text-carbon-gray-50 truncate">{step.storyBeat}</p>
                          {step.activePatient === 'MARIA_SD_001' && (
                            <p className="text-2xs font-semibold mt-0.5" style={{ color: '#007d79' }}>↗ Maria Redhawk</p>
                          )}
                        </div>
                        {isCurrentStep && (
                          <Icon name="ChevronRightIcon" size={12} className="flex-shrink-0 mt-1" style={{ color: persona.color } as React.CSSProperties} />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Prev / Next footer */}
          <div className="border-t border-carbon-gray-20 flex items-stretch flex-shrink-0">
            <button
              disabled={!prevStep}
              onClick={() => prevStep && navigateToStep(prevStep)}
              className="flex-1 flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-carbon-gray-70 hover:bg-carbon-gray-10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-carbon-gray-20"
            >
              <Icon name="ChevronLeftIcon" size={13} />
              <span className="truncate">{prevStep ? prevStep.label : 'Start'}</span>
            </button>
            <button
              disabled={!nextStep}
              onClick={() => nextStep && navigateToStep(nextStep)}
              className="flex-1 flex items-center justify-end gap-1.5 px-3 py-2.5 text-xs font-medium text-carbon-gray-70 hover:bg-carbon-gray-10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="truncate">{nextStep ? nextStep.label : 'End'}</span>
              <Icon name="ChevronRightIcon" size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Collapsed pill — three zones: ◀ · label (toggles panel) · ▶ */}
      <div
        className="flex items-stretch shadow-lg text-white text-xs font-semibold"
        style={{ backgroundColor: pillColor, borderRadius: 0, minWidth: 200 }}
      >
        {/* ◀ Prev */}
        <button
          disabled={!prevStep}
          onClick={(e) => { e.stopPropagation(); prevStep && navigateToStep(prevStep); }}
          className="flex items-center justify-center px-2.5 py-2 hover:bg-black/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-r border-white/20 flex-shrink-0"
          title={prevStep ? `Back: ${prevStep.label}` : 'Start of sequence'}
        >
          <Icon name="ChevronLeftIcon" size={13} />
        </button>

        {/* Centre label — click to open/close panel */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 flex-1 min-w-0 hover:bg-black/10 transition-colors"
          title="Demo Navigator"
        >
          <Icon name="MapIcon" size={13} className="flex-shrink-0" />
          <span className="flex-1 text-left truncate">{stepLabel}</span>
          <Icon name={expanded ? 'ChevronDownIcon' : 'ChevronUpIcon'} size={11} className="flex-shrink-0" />
        </button>

        {/* ▶ Next */}
        <button
          disabled={!nextStep}
          onClick={(e) => { e.stopPropagation(); nextStep && navigateToStep(nextStep); }}
          className="flex items-center justify-center px-2.5 py-2 hover:bg-black/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border-l border-white/20 flex-shrink-0"
          title={nextStep ? `Next: ${nextStep.label}` : 'End of sequence'}
        >
          <Icon name="ChevronRightIcon" size={13} />
        </button>
      </div>
    </div>
  );
}
