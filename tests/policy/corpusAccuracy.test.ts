import { describe, it, expect } from 'vitest';
import { loadMockLibrary } from '@/lib/policy';

/**
 * #3 / GT-9 — corpus-wide accuracy-regression suite. Guards invariants across
 * ALL 17 parsed policies so a parser change can't silently degrade the library.
 */
const lib = loadMockLibrary();

describe('Policy corpus invariants', () => {
  it('has 17 policies, each with an id, title, source, and basis', () => {
    expect(lib.policies.length).toBe(17);
    for (const p of lib.policies) {
      expect(p.policyId).toBeTruthy();
      expect(p.title).toBeTruthy();
      expect(p.source).toBeTruthy();
      expect(p.determinationBasis).toBeTruthy();
    }
  });

  it('every Aetna CPB has a policy number and well-formed codes', () => {
    const aetna = lib.policies.filter((p) => p.source === 'Aetna');
    expect(aetna.length).toBe(15);
    const CPT = /^\d{4}[0-9A-Z]$/;
    const HCPCS = /^[A-Z]\d{4}$/;
    for (const p of aetna) {
      expect(p.number).toMatch(/^\d{3,4}$/);
      const c = p.codes!;
      // every extracted CPT/HCPCS code is a valid code token
      for (const code of [...c.cptCovered, ...c.cptNotCovered]) expect(code).toMatch(CPT);
      for (const code of [...c.hcpcsCovered, ...c.hcpcsNotCovered]) expect(code).toMatch(HCPCS);
    }
  });

  it('every UHC list has PA items and a flat allPaCodes matching the items', () => {
    const uhc = lib.policies.filter((p) => p.source === 'UnitedHealthcare');
    expect(uhc.length).toBe(2);
    for (const p of uhc) {
      expect(p.paItems!.length).toBeGreaterThan(0);
      const fromItems = new Set(p.paItems!.flatMap((i) => i.codes));
      for (const c of p.allPaCodes!) expect(fromItems.has(c)).toBe(true);
    }
  });

  it('experimental policies have not-covered codes and no covered-criteria codes', () => {
    for (const p of lib.policies.filter((x) => x.experimental)) {
      const c = p.codes!;
      expect(c.cptCovered.length + c.hcpcsCovered.length).toBe(0);
      expect(c.cptNotCovered.length + c.hcpcsNotCovered.length).toBeGreaterThan(0);
    }
  });

  it('anchor: Cardiac MRI #0520 still resolves its five covered CPT codes', () => {
    const mri = lib.findByNumber('0520')!;
    expect(new Set(mri.codes!.cptCovered)).toEqual(
      new Set(['75557', '75559', '75561', '75563', '75565'])
    );
  });
});
