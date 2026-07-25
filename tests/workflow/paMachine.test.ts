import { describe, it, expect } from 'vitest';
import {
  transition,
  requiresHumanApproval,
  slaHours,
  INITIAL,
  type PaContext,
} from '@/lib/workflow/paMachine';

const ctx: PaContext = { priority: 'expedited' };

describe('PA state machine (Slice 4)', () => {
  it('walks the happy path CRD → DTR → submit → approve → close', () => {
    let s = INITIAL;
    s = transition(s, { type: 'order-created' }, ctx).state;
    expect(s).toBe('CRD');
    s = transition(s, { type: 'crd-required' }, ctx).state;
    expect(s).toBe('RequirementsKnown');
    s = transition(s, { type: 'launch-dtr' }, ctx).state;
    s = transition(s, { type: 'prepopulated' }, ctx).state;
    s = transition(s, { type: 'evidence-complete' }, ctx).state;
    expect(s).toBe('EvidenceComplete');
    // human gate: submit without approver is refused
    const blocked = transition(s, { type: 'submit' }, ctx);
    expect(blocked.error).toMatch(/human approval/);
    expect(blocked.state).toBe('EvidenceComplete');
    // with approver
    s = transition(s, { type: 'submit', approvedBy: 'Dr. Smith' }, ctx).state;
    expect(s).toBe('Submitted');
    s = transition(s, { type: 'acknowledged' }, ctx).state;
    expect(s).toBe('Pending');
    s = transition(s, { type: 'claim-response', decision: 'approved' }, ctx).state;
    expect(s).toBe('Approved');
    // gap closure is human-gated too
    expect(transition(s, { type: 'close-gap' }, ctx).error).toMatch(/human approval/);
    s = transition(s, { type: 'close-gap', approvedBy: 'CM Jones' }, ctx).state;
    expect(s).toBe('GapClosed');
  });

  it('routes a denial with reasons', () => {
    const t = transition(
      'Pending',
      { type: 'claim-response', decision: 'denied', reasons: ['not medically necessary'] },
      ctx
    );
    expect(t.state).toBe('Denied');
    expect(t.context.denialReasons).toEqual(['not medically necessary']);
  });

  it('routes crd-none to NoAuthRequired', () => {
    const t = transition('CRD', { type: 'crd-none' }, ctx);
    expect(t.state).toBe('NoAuthRequired');
  });

  it('rejects illegal transitions', () => {
    expect(transition('Draft', { type: 'acknowledged' }, ctx).error).toMatch(/illegal transition/);
  });

  it('flags human-gated events and computes SLA', () => {
    expect(requiresHumanApproval({ type: 'submit' })).toBe(true);
    expect(requiresHumanApproval({ type: 'close-gap' })).toBe(true);
    expect(requiresHumanApproval({ type: 'acknowledged' })).toBe(false);
    expect(slaHours('expedited')).toBe(72);
    expect(slaHours('standard')).toBe(168);
  });
});
