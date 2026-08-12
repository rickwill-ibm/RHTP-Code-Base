import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  loadMockLibrary,
  evaluate,
  toMemberContext,
  serviceRequestToOrder,
  type MemberContext,
} from '@/lib/policy';

/**
 * Policy Engine — mock-data demonstration + accuracy harness.
 *
 * Proves (1) the real parsed library loads and indexes, (2) Maria's actual
 * FHIR order evaluates against real payer policy, (3) the criteria-gated
 * medical-necessity path (Aetna CPB #0520) resolves supporting vs missing
 * diagnoses, and (4) the library still matches known policy anchors.
 */

const lib = loadMockLibrary();

interface FhirResource {
  resourceType: string;
  id?: string;
  code?: { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
}
interface Entry {
  resource: FhirResource;
}
const bundle = JSON.parse(
  readFileSync(join(process.cwd(), 'tools/seed/maria.bundle.json'), 'utf8')
) as { entry: Entry[] };
function ofType(t: string): FhirResource[] {
  return bundle.entry.filter((e) => e.resource.resourceType === t).map((e) => e.resource);
}

describe('Policy library — loads real parsed corpus', () => {
  it('loads 17 policies from the seed', () => {
    expect(lib.policies.length).toBe(17);
  });
  it('indexes the Aetna Cardiac MRI CPB by number 0520', () => {
    const mri = lib.findByNumber('0520');
    expect(mri).toBeTruthy();
    expect(mri!.title).toMatch(/Cardiac MRI/i);
    expect(mri!.codes!.cptCovered).toEqual(expect.arrayContaining(['75557', '75561', '75565']));
  });
  it('indexes CPT codes to governing policies', () => {
    expect(lib.findByCode('75561').some((p) => p.number === '0520')).toBe(true);
    expect(lib.findByCode('72148').some((p) => p.source === 'UnitedHealthcare')).toBe(true);
  });
});

describe('Policy Engine — Maria (real FHIR mock data)', () => {
  const conditions = ofType('Condition');
  const sr = ofType('ServiceRequest')[0];
  const member: MemberContext = toMemberContext('MARIA_SD_001', conditions, {
    payer: 'UnitedHealthcare Community Plan',
    plan: 'Texas STAR',
  });
  const order = serviceRequestToOrder(sr);

  it('projects the order as CPT 72148', () => {
    expect(order.code).toBe('72148');
    expect(order.codeSystem).toBe('CPT');
  });

  it('determines PA is required because 72148 is on the payer PA list', () => {
    const det = evaluate(member, order, lib);
    expect(det.requiresPA).toBe(true);
    expect(det.outcome).toBe('pa-required-list');
    expect(det.matchedPolicies.some((m) => m.source === 'UnitedHealthcare')).toBe(true);
    expect(det.deficiencies.length).toBeGreaterThan(0);
    expect(det.propensityToDeny).toBeGreaterThan(0);
  });

  it('does not falsely match SNOMED diagnoses as ICD-10', () => {
    // Maria's conditions are SNOMED-coded; none should surface as ICD-10 codes.
    expect(member.diagnoses.every((d) => d.code === undefined)).toBe(true);
    expect(member.diagnoses.map((d) => d.display)).toEqual(
      expect.arrayContaining(['Type 2 diabetes mellitus'])
    );
  });
});

describe('Policy Engine — criteria-gated medical necessity (Aetna CPB #0520)', () => {
  const cardiacOrder = { code: '75561', codeSystem: 'CPT' as const, display: 'Cardiac MRI' };

  it('APPROVES-path: supporting cardiac diagnosis meets criteria', () => {
    // I42.0 dilated cardiomyopathy is in the CPB covered ICD-10 set root I42.
    const member: MemberContext = {
      memberId: 'TEST_CARDIAC_1',
      diagnoses: [{ code: 'I42.0', display: 'Dilated cardiomyopathy' }],
    };
    const det = evaluate(member, cardiacOrder, lib);
    expect(det.outcome).toBe('pa-required-criteria-review');
    expect(det.criteriaMet).toBe(true);
    expect(det.propensityToDeny).toBeLessThan(40);
    expect(det.indicationsConsidered.length).toBeGreaterThan(0);
  });

  it('DEFICIENCY-path: no supporting diagnosis raises denial risk', () => {
    const member: MemberContext = {
      memberId: 'TEST_CARDIAC_2',
      diagnoses: [{ code: 'E11.9', display: 'Type 2 diabetes' }],
    };
    const det = evaluate(member, cardiacOrder, lib);
    expect(det.outcome).toBe('pa-required-criteria-review');
    expect(det.criteriaMet).toBe(false);
    expect(det.deficiencies.some((d) => d.kind === 'missing-supporting-diagnosis')).toBe(true);
    expect(det.propensityToDeny).toBeGreaterThanOrEqual(70);
  });
});

describe('Policy Engine — experimental / not-covered path (Aetna CPB #0930 CCM)', () => {
  it('flags an experimental code as a likely denial', () => {
    const ccm = lib.findByNumber('0930');
    expect(ccm).toBeTruthy();
    const code = ccm!.codes!.cptNotCovered[0] ?? ccm!.codes!.hcpcsNotCovered[0];
    expect(code).toBeTruthy();
    const det = evaluate({ memberId: 'TEST_EXP', diagnoses: [] }, { code, codeSystem: 'CPT' }, lib);
    expect(det.outcome).toBe('likely-denial-experimental');
    expect(det.propensityToDeny).toBeGreaterThanOrEqual(90);
  });
});

describe('Policy library — accuracy anchors (real source values)', () => {
  it('MRI #0520 covered CPT set is exactly the five cardiac MRI codes', () => {
    const mri = lib.findByNumber('0520')!;
    expect(new Set(mri.codes!.cptCovered)).toEqual(
      new Set(['75557', '75559', '75561', '75563', '75565'])
    );
  });
  it('UHC Texas STAR lists bariatric + advanced-imaging codes for PA', () => {
    const uhc = lib.policies.find((p) => p.plan === 'Texas STAR')!;
    expect(uhc.allPaCodes).toEqual(expect.arrayContaining(['43644', '43645', '72148']));
    expect(uhc.allPaCodes!.length).toBeGreaterThan(1000);
  });
});
