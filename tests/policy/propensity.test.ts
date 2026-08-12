import { describe, it, expect } from 'vitest';
import { scorePropensity, propensityInputFromDetermination } from '@/lib/policy/propensity';
import { loadMockLibrary, evaluate, type MemberContext } from '@/lib/policy';

/** GT-4 — transparent, additive propensity-to-deny. */
const lib = loadMockLibrary();

describe('Propensity — banding and factors', () => {
  it('gold-card exemption short-circuits to 0 / low', () => {
    const r = scorePropensity({
      outcome: 'pa-required-list',
      criteriaMet: null,
      openDeficiencies: 1,
      goldCardApplied: true,
    });
    expect(r.score).toBe(0);
    expect(r.band).toBe('low');
    expect(r.rationale).toMatch(/gold-carded/i);
  });

  it('experimental outcome scores high', () => {
    const r = scorePropensity({
      outcome: 'likely-denial-experimental',
      criteriaMet: false,
      openDeficiencies: 1,
    });
    expect(r.band).toBe('high');
    expect(r.score).toBeGreaterThan(66);
  });

  it('criteria met with no deficiencies scores low', () => {
    const r = scorePropensity({
      outcome: 'pa-required-criteria-review',
      criteriaMet: true,
      openDeficiencies: 0,
    });
    expect(r.band).toBe('low');
    expect(r.factors.some((f) => f.points < 0)).toBe(true); // the supporting-dx credit
  });

  it('criteria NOT met raises the score into medium/high', () => {
    const r = scorePropensity({
      outcome: 'pa-required-criteria-review',
      criteriaMet: false,
      openDeficiencies: 1,
    });
    expect(r.score).toBeGreaterThan(33);
  });

  it('every point is attributable to a named factor', () => {
    const r = scorePropensity({
      outcome: 'pa-required-list',
      criteriaMet: null,
      openDeficiencies: 2,
      missingDtrAnswers: 1,
      historicalDenialRate: 0.5,
    });
    const sum = r.factors.reduce((s, f) => s + f.points, 0);
    expect(Math.max(0, Math.min(100, Math.round(sum)))).toBe(r.score);
    expect(r.disclaimer).toMatch(/not a coverage determination/i);
  });
});

describe('Propensity — from a real determination', () => {
  it('builds an input from Maria’s determination and scores it', () => {
    const member: MemberContext = { memberId: 'MARIA_SD_001', diagnoses: [] };
    const det = evaluate(member, { code: '72148', codeSystem: 'CPT' }, lib);
    const input = propensityInputFromDetermination(det);
    const r = scorePropensity(input);
    expect(r.score).toBeGreaterThan(0);
    expect(['low', 'medium', 'high']).toContain(r.band);
  });
});
