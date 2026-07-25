/**
 * Prior-Authorization lifecycle state machine (plan Slice 4 / blueprint §6.4).
 *
 * Pure + deterministic. The LLM/agent NEVER sets Approved/Denied — those come
 * only from a payer `ClaimResponse` (event 'claim-response'). Submission and
 * gap closure are HUMAN-GATED (see requiresHumanApproval).
 */

export type PaState =
  | 'Draft'
  | 'CRD'
  | 'NoAuthRequired'
  | 'RequirementsKnown'
  | 'DTR'
  | 'Prepopulated'
  | 'EvidenceComplete'
  | 'Submitted'
  | 'Pending'
  | 'Approved'
  | 'Denied'
  | 'MoreInfo'
  | 'AppealOrReview'
  | 'GapClosed';

export type PaEvent =
  | { type: 'order-created' }
  | { type: 'crd-none' }
  | { type: 'crd-required' }
  | { type: 'launch-dtr' }
  | { type: 'prepopulated' }
  | { type: 'evidence-complete' }
  | { type: 'submit'; approvedBy?: string } // HUMAN-GATED
  | { type: 'acknowledged' }
  | { type: 'claim-response'; decision: 'approved' | 'denied' | 'more-info'; reasons?: string[] }
  | { type: 'resubmit' }
  | { type: 'close-gap'; approvedBy?: string } // HUMAN-GATED
  | { type: 'appeal' };

export interface PaContext {
  priority: 'expedited' | 'standard';
  denialReasons?: string[];
}

export interface PaTransition {
  state: PaState;
  context: PaContext;
  error?: string;
}

/** SLA in hours per CMS-0057-F operational provisions (2026). */
export function slaHours(priority: PaContext['priority']): number {
  return priority === 'expedited' ? 72 : 24 * 7;
}

/** Events that must not fire without a human approver (blueprint §4D). */
export function requiresHumanApproval(event: PaEvent): boolean {
  return event.type === 'submit' || event.type === 'close-gap';
}

const TABLE: Partial<Record<PaState, Partial<Record<PaEvent['type'], PaState>>>> = {
  Draft: { 'order-created': 'CRD' },
  CRD: { 'crd-none': 'NoAuthRequired', 'crd-required': 'RequirementsKnown' },
  RequirementsKnown: { 'launch-dtr': 'DTR' },
  DTR: { prepopulated: 'Prepopulated' },
  Prepopulated: { 'evidence-complete': 'EvidenceComplete' },
  EvidenceComplete: { submit: 'Submitted' },
  Submitted: { acknowledged: 'Pending' },
  Pending: { 'claim-response': 'Pending' }, // resolved below by decision
  MoreInfo: { resubmit: 'Submitted' },
  Approved: { 'close-gap': 'GapClosed' },
  Denied: { appeal: 'AppealOrReview' },
  NoAuthRequired: { 'close-gap': 'GapClosed' },
};

export function transition(current: PaState, event: PaEvent, context: PaContext): PaTransition {
  // Human-gate enforcement.
  if (requiresHumanApproval(event) && !('approvedBy' in event && event.approvedBy)) {
    return { state: current, context, error: `${event.type} requires human approval (approvedBy)` };
  }

  // ClaimResponse resolves Pending by decision.
  if (current === 'Pending' && event.type === 'claim-response') {
    if (event.decision === 'approved') return { state: 'Approved', context };
    if (event.decision === 'denied')
      return { state: 'Denied', context: { ...context, denialReasons: event.reasons ?? [] } };
    return { state: 'MoreInfo', context };
  }

  const next = TABLE[current]?.[event.type];
  if (!next) {
    return { state: current, context, error: `illegal transition: ${event.type} from ${current}` };
  }
  return { state: next, context };
}

export const INITIAL: PaState = 'Draft';
