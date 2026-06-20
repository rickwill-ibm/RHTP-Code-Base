// uhg/data/journeys.ts — configurable care-journey LIBRARY.
//
// Journeys are defined once here as reusable, medically-grounded templates (a journey =
// an ordered set of clinical stages/steps over a condition-appropriate window). Patients
// map into a journey via { id, currentDay } on their registry record; journeyFor() resolves
// the patient's current stage/step and progress. Multiple patients can share one journey.
//
// This keeps the product configurable: add a template here, point a patient at it — no
// screen changes required.

export type JourneyStage = 'Admission' | 'Transition' | 'Follow-up' | 'Monitoring' | 'Close';

export interface JourneyStep {
  day: number;        // day offset from journey start
  label: string;      // milestone name
  sublabel: string;   // clinical detail
  stage: JourneyStage;
}
export interface JourneyExpectedSignal {
  type: 'expected' | 'unexpected' | 'positive';
  label: string;
  detail: string;     // may contain {day} token, interpolated at resolve time
}
export interface JourneyTemplate {
  id: string;
  label: string;            // e.g. 'COPD Exacerbation — 30-day post-acute'
  conditionTags: string[];
  windowDays: number;       // total journey window
  steps: JourneyStep[];     // ordered clinical checkpoints
  expectedSignals: JourneyExpectedSignal[];
}

// ─── Library ────────────────────────────────────────────────────────────────────

export const JOURNEY_LIBRARY: Record<string, JourneyTemplate> = {
  // Maria Redhawk — authored to preserve the flagship walkthrough
  POSTPARTUM_90D: {
    id: 'POSTPARTUM_90D',
    label: 'Postpartum — 90-day post-acute episode',
    conditionTags: ['Postpartum', 'Maternal health'],
    windowDays: 90,
    steps: [
      { day: 0, label: 'Admission', sublabel: 'Postpartum event', stage: 'Admission' },
      { day: 14, label: 'Discharge', sublabel: 'Post-acute transition', stage: 'Transition' },
      { day: 34, label: 'Active Monitoring', sublabel: 'Day 34 checkpoint', stage: 'Monitoring' },
      { day: 60, label: 'Follow-up Appt', sublabel: 'Cardiology review', stage: 'Follow-up' },
      { day: 90, label: 'Episode Close', sublabel: '90-day window end', stage: 'Close' },
    ],
    expectedSignals: [
      { type: 'expected', label: 'Auth renewal', detail: 'Expected at Day {day} — standard post-discharge authorization cycle' },
      { type: 'unexpected', label: 'HbA1c care gap', detail: 'Unexpected — should have closed by Day 21. Now 13 days overdue.' },
      { type: 'positive', label: 'Portal engagement', detail: 'Positive — expected post-discharge. 2x/week login indicates receptivity.' },
    ],
  },

  // COPD exacerbation — 30-day CMS readmission window
  COPD_30D: {
    id: 'COPD_30D',
    label: 'COPD Exacerbation — 30-day post-acute',
    conditionTags: ['COPD', 'Respiratory'],
    windowDays: 30,
    steps: [
      { day: 0, label: 'ED Admission', sublabel: 'Acute exacerbation', stage: 'Admission' },
      { day: 3, label: 'Discharge', sublabel: 'Steroid + antibiotic course', stage: 'Transition' },
      { day: 7, label: 'TOC Call', sublabel: 'Medication reconciliation', stage: 'Transition' },
      { day: 14, label: 'Active Monitoring', sublabel: 'Spirometry + PCP follow-up', stage: 'Monitoring' },
      { day: 30, label: 'Episode Close', sublabel: '30-day readmission window end', stage: 'Close' },
    ],
    expectedSignals: [
      { type: 'expected', label: 'Spirometry follow-up', detail: 'Expected at Day {day} — post-exacerbation pulmonary function recheck' },
      { type: 'unexpected', label: 'Spirometry care gap', detail: 'Unexpected — overdue beyond the post-discharge window; readmission-risk driver' },
      { type: 'positive', label: 'Care-manager engagement', detail: 'Positive — responsive to phone outreach; NEMT transport active' },
    ],
  },

  // CHF + diabetes — heart-failure disease-management episode
  CHF_DM_120D: {
    id: 'CHF_DM_120D',
    label: 'Heart Failure + Diabetes — 120-day disease management',
    conditionTags: ['CHF', 'Diabetes', 'Cardiac'],
    windowDays: 120,
    steps: [
      { day: 0, label: 'CHF Admission', sublabel: 'Decompensation', stage: 'Admission' },
      { day: 7, label: 'TOC Call', sublabel: 'Weight + symptom check', stage: 'Transition' },
      { day: 30, label: 'Cardiology + A1C', sublabel: 'Disease-management visit', stage: 'Follow-up' },
      { day: 90, label: 'Active Monitoring', sublabel: 'HF + diabetes co-management', stage: 'Monitoring' },
      { day: 120, label: 'Episode Close', sublabel: 'Disease-management cycle end', stage: 'Close' },
    ],
    expectedSignals: [
      { type: 'expected', label: 'A1C recheck', detail: 'Expected around Day {day} — diabetes control monitoring' },
      { type: 'unexpected', label: 'A1C recheck care gap', detail: 'Unexpected — overdue; CHF + diabetes interaction risk' },
      { type: 'positive', label: 'Adherence signal', detail: 'Positive — refills on schedule; home weight log active' },
    ],
  },

  // Hypertension + CKD — quarterly renal monitoring cycle
  CKD_180D: {
    id: 'CKD_180D',
    label: 'Hypertension + CKD — 180-day monitoring cycle',
    conditionTags: ['CKD', 'Hypertension', 'Renal'],
    windowDays: 180,
    steps: [
      { day: 0, label: 'Baseline Labs', sublabel: 'eGFR / ACR / BP', stage: 'Admission' },
      { day: 30, label: 'BP Recheck', sublabel: 'Antihypertensive titration', stage: 'Transition' },
      { day: 90, label: 'eGFR + ACR', sublabel: 'CKD staging labs', stage: 'Follow-up' },
      { day: 150, label: 'Nephrology Review', sublabel: 'Renal-protection plan', stage: 'Monitoring' },
      { day: 180, label: 'Cycle Close', sublabel: 'Quarterly review', stage: 'Close' },
    ],
    expectedSignals: [
      { type: 'expected', label: 'BP control check', detail: 'Expected around Day {day} — hypertension management' },
      { type: 'unexpected', label: 'BP control care gap', detail: 'Unexpected — overdue; CKD progression risk' },
      { type: 'positive', label: 'Urban access', detail: 'Positive — adequate transport; portal-engaged' },
    ],
  },

  // Asthma + obesity — annual chronic-care cycle
  ASTHMA_OBESITY_365D: {
    id: 'ASTHMA_OBESITY_365D',
    label: 'Asthma + Obesity — 365-day chronic-care cycle',
    conditionTags: ['Asthma', 'Obesity', 'Respiratory'],
    windowDays: 365,
    steps: [
      { day: 0, label: 'Asthma Action Plan', sublabel: 'Baseline + AAP', stage: 'Admission' },
      { day: 90, label: 'Spirometry + Weight', sublabel: 'Controller titration', stage: 'Follow-up' },
      { day: 180, label: '6-Month Review', sublabel: 'Step up / down assessment', stage: 'Follow-up' },
      { day: 210, label: 'Active Monitoring', sublabel: 'Asthma + weight management', stage: 'Monitoring' },
      { day: 365, label: 'Annual Review', sublabel: 'Episode close', stage: 'Close' },
    ],
    expectedSignals: [
      { type: 'expected', label: 'Asthma action plan update', detail: 'Expected around Day {day} — periodic AAP review' },
      { type: 'unexpected', label: 'Asthma action plan care gap', detail: 'Unexpected — review overdue' },
      { type: 'positive', label: 'Portal engagement', detail: 'Positive — regular logins; receptive to digital outreach' },
    ],
  },
};

export const DEFAULT_JOURNEY_ID = 'POSTPARTUM_90D';

// ─── Resolver ─────────────────────────────────────────────────────────────────

export interface ResolvedJourney {
  id: string;
  label: string;
  windowDays: number;
  currentDay: number;
  progressPct: number;
  currentStage: JourneyStage;
  currentStepIndex: number;   // index of the most recently passed step
  steps: JourneyStep[];
  expectedSignals: JourneyExpectedSignal[];
}

// Map a patient's { id, currentDay } onto a journey template → current stage/step + progress.
export function journeyFor(j?: { id: string; currentDay: number }): ResolvedJourney {
  const tpl = (j && JOURNEY_LIBRARY[j.id]) || JOURNEY_LIBRARY[DEFAULT_JOURNEY_ID];
  const currentDay = Math.max(0, Math.min(tpl.windowDays, j ? j.currentDay : 34));
  const passedIdx = tpl.steps.reduce((acc, s, i) => (s.day <= currentDay ? i : acc), 0);
  const currentStage = tpl.steps[passedIdx]?.stage ?? tpl.steps[0].stage;
  return {
    id: tpl.id,
    label: tpl.label,
    windowDays: tpl.windowDays,
    currentDay,
    progressPct: Math.round((currentDay / tpl.windowDays) * 100),
    currentStage,
    currentStepIndex: passedIdx,
    steps: tpl.steps,
    expectedSignals: tpl.expectedSignals.map((e) => ({ ...e, detail: e.detail.replace(/\{day\}/g, String(currentDay)) })),
  };
}


// Patient-aware resolver — works for ANY patient (mock today, production later).
// 1) Honor an explicit journey mapping if present.
// 2) Otherwise INFER the journey template from the patient's condition (episode/cohort),
//    and place the member at their real episode day. No code changes needed for new patients.
export function journeyForPatient(p: {
  journey?: { id: string; currentDay: number };
  episodeType?: string;
  cohortFlag?: string;
  episodeDaysActive?: number;
}): ResolvedJourney {
  if (p.journey && JOURNEY_LIBRARY[p.journey.id]) return journeyFor(p.journey);
  const hay = `${p.episodeType || ''} ${p.cohortFlag || ''}`.toLowerCase();
  const tpl =
    Object.values(JOURNEY_LIBRARY).find((t) => t.conditionTags.some((c) => hay.includes(c.toLowerCase()))) ||
    JOURNEY_LIBRARY[DEFAULT_JOURNEY_ID];
  return journeyFor({ id: tpl.id, currentDay: Math.max(0, p.episodeDaysActive ?? 0) });
}
