import { describe, it, expect } from 'vitest';
import { runEligibility } from '@/lib/goldenThread/eligibility';
import { estimatePatientCost, MOCK_ALLOWED_AMOUNTS } from '@/lib/goldenThread/patientEstimation';
import { routeToQueue, isSlaBreached } from '@/lib/goldenThread/workQueue';
import { advance, FC_INITIAL, type FcContext } from '@/lib/goldenThread/financialClearanceMachine';

/** GT-5/6/7 — eligibility, estimation, work queue, orchestration machine. */

describe('GT-6 Eligibility stage', () => {
  it('flags PA required for an active-coverage order', () => {
    const vm = runEligibility(
      { status: 'active', payer: 'UHC', plan: 'Texas STAR' },
      { requiresPA: true, goldCardApplied: false }
    );
    expect(vm.active).toBe(true);
    expect(vm.requiresPA).toBe(true);
    expect(vm.note).toMatch(/requires prior authorization/i);
  });
  it('reports PA exempt when gold-carded', () => {
    const vm = runEligibility(
      { status: 'active', payer: 'UHC' },
      { requiresPA: true, goldCardApplied: true }
    );
    expect(vm.requiresPA).toBe(false);
    expect(vm.note).toMatch(/gold-carded/i);
  });
});

describe('GT-6 Patient Estimation stage', () => {
  it('computes member responsibility with deductible + coinsurance, capped at OOP max', () => {
    const vm = estimatePatientCost({
      code: '72148',
      allowedAmount: MOCK_ALLOWED_AMOUNTS['72148'],
      benefit: { deductibleRemaining: 300, coinsuranceRate: 0.2, outOfPocketRemaining: 5000 },
    });
    // 300 deductible + 20% of (1150-300)=170 → 470
    expect(vm.appliedToDeductible).toBe(300);
    expect(vm.coinsurance).toBe(170);
    expect(vm.memberResponsibility).toBe(470);
    expect(vm.planPays).toBe(680);
    expect(vm.disclaimer).toMatch(/Good Faith Estimate/);
  });
  it('caps member responsibility at the remaining out-of-pocket maximum', () => {
    const vm = estimatePatientCost({
      code: '75561',
      allowedAmount: 2400,
      benefit: { deductibleRemaining: 5000, coinsuranceRate: 0.2, outOfPocketRemaining: 250 },
    });
    expect(vm.memberResponsibility).toBe(250);
    expect(vm.propensityToPay.band).toBe('medium');
  });
});

describe('GT-7 Work queue + SLA', () => {
  const baseline = {
    priority: 'expedited' as const,
    submittedAt: '2026-07-26T00:00:00.000Z',
    evidenceId: 'ev1',
    memberId: 'MARIA_SD_001',
    code: '72148',
  };
  it('routes a gold-card exempt order to auto-cleared', () => {
    const item = routeToQueue({
      ...baseline,
      netOutcome: 'pa-exempt-gold-card',
      requiresPA: false,
    });
    expect(item.queue).toBe('auto-cleared');
    expect(item.disposition).toBe('gold-card-exempt');
  });
  it('routes a high-propensity PA order to high-risk-review with a 72h SLA', () => {
    const item = routeToQueue({
      ...baseline,
      netOutcome: 'pa-required-list',
      requiresPA: true,
      propensity: { score: 80, band: 'high' },
    });
    expect(item.queue).toBe('high-risk-review');
    expect(item.slaHours).toBe(72);
    expect(item.dueBy).toBe('2026-07-29T00:00:00.000Z');
  });
  it('detects SLA breach', () => {
    const item = routeToQueue({
      ...baseline,
      netOutcome: 'pa-required-list',
      requiresPA: true,
      propensity: { score: 20, band: 'low' },
    });
    expect(isSlaBreached(item, '2026-07-30T00:00:00.000Z')).toBe(true);
    expect(isSlaBreached(item, '2026-07-28T00:00:00.000Z')).toBe(false);
  });
  it('routes a denial to the appeal queue', () => {
    const item = routeToQueue({
      ...baseline,
      netOutcome: 'pa-required-list',
      requiresPA: true,
      decision: 'denied',
    });
    expect(item.queue).toBe('denied-appeal');
  });
});

describe('GT-5 Financial Clearance machine', () => {
  const ctx0: FcContext = { completed: [] };

  it('runs the full thread when PA is required and approved', () => {
    let s = FC_INITIAL;
    let c = ctx0;
    ({ state: s, context: c } = advance(s, { type: 'start' }, c));
    expect(s).toBe('Eligibility');
    ({ state: s, context: c } = advance(s, { type: 'eligibility-complete', active: true }, c));
    expect(s).toBe('MedicalNecessity');
    ({ state: s, context: c } = advance(s, { type: 'med-nec-complete', requiresPA: true }, c));
    expect(s).toBe('PriorAuth');
    ({ state: s, context: c } = advance(s, { type: 'pa-complete', decision: 'approved' }, c));
    expect(s).toBe('PatientEstimation');
    ({ state: s, context: c } = advance(s, { type: 'estimation-complete' }, c));
    expect(s).toBe('Cleared');
    expect(c.completed).toContain('PriorAuth');
  });

  it('skips Prior Auth when no PA is required (e.g. gold-carded)', () => {
    let s = FC_INITIAL;
    let c = ctx0;
    ({ state: s, context: c } = advance(s, { type: 'start' }, c));
    ({ state: s, context: c } = advance(s, { type: 'eligibility-complete', active: true }, c));
    ({ state: s, context: c } = advance(s, { type: 'med-nec-complete', requiresPA: false }, c));
    expect(s).toBe('PatientEstimation'); // PA skipped
    expect(c.requiresPA).toBe(false);
  });

  it('blocks on denied PA and on inactive coverage', () => {
    const denied = advance('PriorAuth', { type: 'pa-complete', decision: 'denied' }, ctx0);
    expect(denied.state).toBe('Blocked');
    const inactive = advance('Eligibility', { type: 'eligibility-complete', active: false }, ctx0);
    expect(inactive.state).toBe('Blocked');
  });

  it('rejects illegal transitions', () => {
    const t = advance('Cleared', { type: 'start' }, ctx0);
    expect(t.error).toBeTruthy();
  });
});
