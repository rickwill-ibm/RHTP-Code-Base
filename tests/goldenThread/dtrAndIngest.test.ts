import { describe, it, expect } from 'vitest';
import { generateQuestionnaireFromPolicy } from '@/lib/goldenThread/dtrFromPolicy';
import {
  loadMockLibrary,
  ingestLibrary,
  evaluate,
  buildLibrary,
  ingestRecord,
  type MemberContext,
} from '@/lib/policy';

/** GT-8 offline DTR generation + GT-9 generic PA-list ingestion. */
const lib = loadMockLibrary();

describe('GT-8 — deterministic DTR questionnaire from a policy', () => {
  it('builds a draft questionnaire from Aetna Cardiac MRI #0520 indications', () => {
    const policy = lib.findByNumber('0520')!;
    const q = generateQuestionnaireFromPolicy(policy);
    expect(q.status).toBe('draft'); // human review required
    expect(q.generatedBy).toBe('deterministic-offline');
    // one item per indication + supporting-dx + documentation
    const indicationItems = q.item.filter((i) => i.linkId.startsWith('indication-'));
    expect(indicationItems.length).toBe(policy.indications!.length);
    expect(q.item.some((i) => i.linkId === 'supporting-diagnosis')).toBe(true);
    expect(q.item.some((i) => i.linkId === 'clinical-documentation' && i.required)).toBe(true);
    expect(q.derivedFrom.number).toBe('0520');
  });
});

describe('GT-9 — ingest ANY state-agency PA list via the generic adapter', () => {
  const stateList = {
    policyId: 'txmed-2026',
    source: 'Texas Medicaid',
    sourceType: 'prior-authorization-requirements-list',
    plan: 'STAR+PLUS',
    effectiveDate: 'January 1, 2026',
    paItems: [
      { category: 'Advanced Imaging', codes: ['72148', '70450'], effectiveDate: 'Jan. 1, 2026' },
      { category: 'DME', codes: ['E0250'], effectiveDate: 'Jan. 1, 2026' },
    ],
  };

  it('normalizes preserving the agency as the source (not UHC)', () => {
    const p = ingestRecord(stateList);
    expect(p).toBeTruthy();
    expect(p!.source).toBe('Texas Medicaid');
    expect(p!.determinationBasis).toBe('code-on-pa-required-list');
    expect(p!.allPaCodes).toEqual(expect.arrayContaining(['72148', '70450', 'E0250']));
  });

  it('evaluates a member order against the newly ingested agency library', () => {
    const { library, skipped } = ingestLibrary([stateList]);
    expect(skipped).toBe(0);
    const member: MemberContext = { memberId: 'M-TX', diagnoses: [] };
    const det = evaluate(member, { code: '72148', codeSystem: 'CPT' }, library);
    expect(det.requiresPA).toBe(true);
    expect(det.outcome).toBe('pa-required-list');
    expect(det.matchedPolicies[0].source).toBe('Texas Medicaid');
  });

  it('the seed UHC lists still normalize as UnitedHealthcare', () => {
    const uhc = lib.policies.filter((p) => p.source === 'UnitedHealthcare');
    expect(uhc.length).toBe(2);
    // and a hand-built library round-trips
    const rebuilt = buildLibrary(lib.policies);
    expect(rebuilt.findByCode('72148').length).toBeGreaterThan(0);
  });
});
