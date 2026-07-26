/**
 * Financial Clearance machine (increment GT-5).
 *
 * The parent orchestrator that threads the four Golden Thread stages —
 * Eligibility → Medical Necessity → Prior Auth → Patient Estimation — launched
 * in-context from SMART. Pure + deterministic (same discipline as `paMachine`,
 * which owns the PA sub-lifecycle inside stage 3).
 *
 * Routing note: when the net determination does not require PA (no policy match
 * or a gold-card exemption), stage 3 is skipped and the thread goes straight to
 * Patient Estimation.
 */
export type FcStage =
  | 'Launched'
  | 'Eligibility'
  | 'MedicalNecessity'
  | 'PriorAuth'
  | 'PatientEstimation'
  | 'Cleared'
  | 'Blocked';

export type FcEvent =
  | { type: 'start' }
  | { type: 'eligibility-complete'; active: boolean }
  | { type: 'med-nec-complete'; requiresPA: boolean }
  | { type: 'pa-complete'; decision: 'approved' | 'denied' | 'more-info' }
  | { type: 'estimation-complete' };

export interface FcContext {
  requiresPA?: boolean;
  completed: FcStage[];
  blockedReason?: string;
}

export interface FcTransition {
  state: FcStage;
  context: FcContext;
  error?: string;
}

export const FC_INITIAL: FcStage = 'Launched';

function complete(context: FcContext, stage: FcStage): FcStage[] {
  return context.completed.includes(stage) ? context.completed : [...context.completed, stage];
}

export function advance(state: FcStage, event: FcEvent, context: FcContext): FcTransition {
  switch (state) {
    case 'Launched':
      if (event.type === 'start') return { state: 'Eligibility', context };
      break;
    case 'Eligibility':
      if (event.type === 'eligibility-complete') {
        const completed = complete(context, 'Eligibility');
        return event.active
          ? { state: 'MedicalNecessity', context: { ...context, completed } }
          : {
              state: 'Blocked',
              context: { ...context, completed, blockedReason: 'coverage not active' },
            };
      }
      break;
    case 'MedicalNecessity':
      if (event.type === 'med-nec-complete') {
        const completed = complete(context, 'MedicalNecessity');
        return {
          state: event.requiresPA ? 'PriorAuth' : 'PatientEstimation',
          context: { ...context, requiresPA: event.requiresPA, completed },
        };
      }
      break;
    case 'PriorAuth':
      if (event.type === 'pa-complete') {
        if (event.decision === 'denied')
          return {
            state: 'Blocked',
            context: { ...context, blockedReason: 'prior authorization denied' },
          };
        if (event.decision === 'more-info') return { state: 'PriorAuth', context };
        return {
          state: 'PatientEstimation',
          context: { ...context, completed: complete(context, 'PriorAuth') },
        };
      }
      break;
    case 'PatientEstimation':
      if (event.type === 'estimation-complete')
        return {
          state: 'Cleared',
          context: { ...context, completed: complete(context, 'PatientEstimation') },
        };
      break;
    case 'Cleared':
    case 'Blocked':
      break;
  }
  return { state, context, error: `illegal transition: ${event.type} from ${state}` };
}

/** The ordered rail of stages for the UI. */
export const FC_STAGES: { key: FcStage; label: string }[] = [
  { key: 'Eligibility', label: 'Eligibility' },
  { key: 'MedicalNecessity', label: 'Medical Necessity' },
  { key: 'PriorAuth', label: 'Prior Authorization' },
  { key: 'PatientEstimation', label: 'Patient Estimation' },
];
