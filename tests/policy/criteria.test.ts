import { describe, it, expect } from 'vitest';
import {
  evaluateCriteria,
  evaluatePredicate,
  CARDIAC_MRI_0520_CRITERIA,
} from '@/lib/policy/criteria';

/** #3 / GT-9 — structured (CQL-style) criteria evaluation. */

describe('Criteria predicates', () => {
  it('hasDiagnosisIn matches on a 3-char ICD-10 root', () => {
    expect(
      evaluatePredicate(
        { kind: 'hasDiagnosisIn', icd10: ['I42'] },
        { diagnoses: [{ code: 'I42.0' }] }
      )
    ).toBe(true);
    expect(
      evaluatePredicate(
        { kind: 'hasDiagnosisIn', icd10: ['I42'] },
        { diagnoses: [{ code: 'E11.9' }] }
      )
    ).toBe(false);
  });

  it('compound all/any/not compose correctly', () => {
    const facts = { diagnoses: [{ code: 'I48.0' }], priorTherapies: ['rate-control'] };
    expect(
      evaluatePredicate(
        {
          kind: 'all',
          of: [
            { kind: 'hasDiagnosisIn', icd10: ['I48'] },
            { kind: 'priorTherapyFailed', therapy: 'rate-control' },
          ],
        },
        facts
      )
    ).toBe(true);
    expect(
      evaluatePredicate({ kind: 'not', of: { kind: 'ageAtLeast', years: 18 } }, { diagnoses: [] })
    ).toBe(true);
  });

  it('age predicates require an age fact', () => {
    expect(
      evaluatePredicate({ kind: 'ageBelow', years: 18 }, { diagnoses: [], ageYears: 10 })
    ).toBe(true);
    expect(evaluatePredicate({ kind: 'ageBelow', years: 18 }, { diagnoses: [] })).toBe(false);
  });
});

describe('Criteria set — Aetna #0520 PoC', () => {
  it('is met for a cardiomyopathy diagnosis', () => {
    const r = evaluateCriteria(CARDIAC_MRI_0520_CRITERIA, { diagnoses: [{ code: 'I42.0' }] });
    expect(r.met).toBe(true);
    expect(r.satisfiedIndications).toContain('M. Cardiomyopathy');
  });

  it('is NOT met for an unrelated diagnosis', () => {
    const r = evaluateCriteria(CARDIAC_MRI_0520_CRITERIA, { diagnoses: [{ code: 'E11.9' }] });
    expect(r.met).toBe(false);
    expect(r.satisfiedIndications).toHaveLength(0);
  });

  it('requires the failed-therapy fact for the AFib compound rule', () => {
    const withoutTherapy = evaluateCriteria(CARDIAC_MRI_0520_CRITERIA, {
      diagnoses: [{ code: 'I48.0' }],
    });
    expect(withoutTherapy.satisfiedIndications).not.toContain(
      'H. Atrial fibrillation with a failed rate-control therapy'
    );
    const withTherapy = evaluateCriteria(CARDIAC_MRI_0520_CRITERIA, {
      diagnoses: [{ code: 'I48.0' }],
      priorTherapies: ['rate-control'],
    });
    expect(withTherapy.satisfiedIndications).toContain(
      'H. Atrial fibrillation with a failed rate-control therapy'
    );
  });

  it('is flagged NOT SME-reviewed (blocks auto-approval)', () => {
    const r = evaluateCriteria(CARDIAC_MRI_0520_CRITERIA, { diagnoses: [{ code: 'I42.0' }] });
    expect(r.smeReviewed).toBe(false);
  });
});
