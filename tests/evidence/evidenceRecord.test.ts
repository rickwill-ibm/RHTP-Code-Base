import { describe, it, expect } from 'vitest';
import {
  createEvidenceRecord,
  appendEntry,
  recordDetermination,
  recordGoldCard,
  summarize,
  latestOfType,
  entriesForStage,
  toAuditEvents,
  type EvidenceRecord,
} from '@/lib/evidence';
import { assertPhiSafe } from '@/lib/server/audit';
import { loadMockLibrary, evaluate, type MemberContext } from '@/lib/policy';

/**
 * GT-2 Evidence Record — append-only spine, gold-card override, PHI-safe audit.
 */
const lib = loadMockLibrary();

function baseRecord(): EvidenceRecord {
  return createEvidenceRecord({
    id: 'ev-1',
    memberId: 'MARIA_SD_001',
    order: { code: '72148', display: 'MRI lumbar', providerNpi: '1972interest' },
    createdAt: '2026-07-26T00:00:00.000Z',
  });
}

describe('Evidence Record — append-only immutability', () => {
  it('appendEntry returns a new record and never mutates the input', () => {
    const r0 = baseRecord();
    const r1 = appendEntry(r0, {
      id: 'e1',
      ts: '2026-07-26T00:01:00.000Z',
      stage: 'eligibility',
      type: 'eligibility',
      requiresPA: true,
    });
    expect(r0.entries.length).toBe(0); // original untouched
    expect(r1.entries.length).toBe(1);
    expect(r1).not.toBe(r0);
  });
});

describe('Evidence Record — threads a real Policy Engine determination', () => {
  it('records Maria’s coverage determination and summarizes it', () => {
    const member: MemberContext = { memberId: 'MARIA_SD_001', diagnoses: [] };
    const det = evaluate(member, { code: '72148', codeSystem: 'CPT' }, lib);
    const r = recordDetermination(baseRecord(), {
      id: 'e-det',
      ts: '2026-07-26T00:02:00.000Z',
      determination: det,
    });
    const s = summarize(r);
    expect(s.currentDetermination?.outcome).toBe('pa-required-list');
    expect(s.requiresPA).toBe(true);
    expect(s.goldCardApplied).toBe(false);
    expect(s.netOutcome).toBe('pa-required-list');
    expect(entriesForStage(r, 'medical-necessity').length).toBe(1);
    expect(latestOfType(r, 'coverage-determination')).toBeTruthy();
  });
});

describe('Evidence Record — gold-card exemption overrides PA', () => {
  it('a determination requiring PA is waived when a gold card is applied', () => {
    const member: MemberContext = { memberId: 'MARIA_SD_001', diagnoses: [] };
    const det = evaluate(member, { code: '72148', codeSystem: 'CPT' }, lib);
    let r = recordDetermination(baseRecord(), {
      id: 'e-det',
      ts: '2026-07-26T00:02:00.000Z',
      determination: det,
    });
    // provider is gold-carded for this code with this payer
    r = recordGoldCard(r, {
      id: 'e-gc',
      ts: '2026-07-26T00:03:00.000Z',
      exemption: {
        applied: true,
        providerNpi: '1972interest',
        code: '72148',
        payer: 'UnitedHealthcare Community Plan',
        approvalRate: 0.97,
        lookbackMonths: 12,
        sampleSize: 42,
        basis: 'payer voluntary program',
        expiresOn: '2027-07-01',
        reason: '97% approval over 12 months (n=42) ≥ 90% threshold',
      },
    });
    const s = summarize(r);
    expect(s.goldCardApplied).toBe(true);
    expect(s.requiresPA).toBe(false); // waived
    expect(s.netOutcome).toBe('pa-exempt-gold-card');
    expect(s.openDeficiencies.length).toBe(0);
    // determination is still on the record (auditable), just overridden
    expect(latestOfType(r, 'coverage-determination')).toBeTruthy();
  });

  it('a NON-applied gold card does not waive PA', () => {
    const member: MemberContext = { memberId: 'MARIA_SD_001', diagnoses: [] };
    const det = evaluate(member, { code: '72148', codeSystem: 'CPT' }, lib);
    let r = recordDetermination(baseRecord(), {
      id: 'e-det',
      ts: '2026-07-26T00:02:00.000Z',
      determination: det,
    });
    r = recordGoldCard(r, {
      id: 'e-gc',
      ts: '2026-07-26T00:03:00.000Z',
      exemption: {
        applied: false,
        providerNpi: '1972interest',
        code: '72148',
        payer: 'UnitedHealthcare Community Plan',
        approvalRate: 0.62,
        reason: '62% approval < 90% threshold',
      },
    });
    const s = summarize(r);
    expect(s.goldCardApplied).toBe(false);
    expect(s.requiresPA).toBe(true);
    expect(s.netOutcome).toBe('pa-required-list');
  });
});

describe('Evidence Record — PHI-safe audit projection', () => {
  it('projects entries to AuditEvents that pass the PHI gate', () => {
    const member: MemberContext = { memberId: 'MARIA_SD_001', diagnoses: [] };
    const det = evaluate(member, { code: '72148', codeSystem: 'CPT' }, lib);
    const r = recordDetermination(baseRecord(), {
      id: 'e-det',
      ts: '2026-07-26T00:02:00.000Z',
      determination: det,
    });
    const events = toAuditEvents(r, 'corr-123');
    expect(events.length).toBe(1);
    for (const ev of events) {
      expect(ev.action).toMatch(/^evidence\./);
      expect(ev.correlationId).toBe('corr-123');
      assertPhiSafe(ev); // throws if any PHI-bearing key leaks
    }
  });
});
