import { describe, it, expect } from 'vitest';
import {
  loadMockNetwork,
  networkStates,
  computeCell,
  computeMetrics,
  computeGaps,
  validateCell,
  recommendAugmentation,
  haversineMiles,
} from '@/lib/networkAdequacy';

/** NA-1 ΓÇö adequacy engine over the GA+SD seed. */
const net = loadMockNetwork();

describe('Network seed + engine', () => {
  it('loads both states (GA + SD, MariaΓÇÖs state)', () => {
    expect(networkStates(net).sort()).toEqual(['GA', 'SD']);
    expect(net.providers.length).toBeGreaterThan(100);
  });

  it('haversine is sane (FultonΓåÆRapid City Γëê 1000+ mi)', () => {
    const d = haversineMiles(33.79, -84.47, 44.0, -102.82);
    expect(d).toBeGreaterThan(1000);
  });

  it('urban commercial pediatrics is adequate; Medicaid behavioral is a gap', () => {
    const comm = computeCell(net, {
      county: 'Fulton',
      specialty: 'Pediatrics',
      lob: 'Commercial',
    })!;
    const mh = computeCell(net, { county: 'Fulton', specialty: 'Mental Health', lob: 'Medicaid' })!;
    expect(comm.adequacyPct).toBeGreaterThanOrEqual(85);
    expect(comm.gapStatus).toBe(false);
    expect(mh.gapStatus).toBe(true);
    expect(mh.state).toBe('GA');
  });

  it('frontier reservation counties have critical specialist gaps (Pine Ridge)', () => {
    const peds = computeCell(net, {
      county: 'Oglala Lakota',
      specialty: 'Pediatrics',
      lob: 'Medicaid',
    })!;
    expect(peds.state).toBe('SD');
    expect(peds.providerCount).toBe(0);
    expect(peds.adequacyPct).toBeLessThan(50);
    expect(peds.gapStatus).toBe(true);
  });
});

describe('State-scoped metrics + gaps', () => {
  it('filters metrics and gaps to MariaΓÇÖs state (SD)', () => {
    const sd = computeMetrics(net, { state: 'SD' });
    expect(sd.length).toBeGreaterThan(0);
    expect(sd.every((m) => m.state === 'SD')).toBe(true);
    const gaps = computeGaps(net, { state: 'SD' });
    expect(gaps.every((g) => g.state === 'SD')).toBe(true);
    // gaps sorted worst-first (critical before low)
    expect(gaps[0].severity === 'critical' || gaps[0].severity === 'high').toBe(true);
  });
});

describe('Validation against CMS standards', () => {
  it('validates a frontier cell as NON-COMPLIANT with failing checks', () => {
    const v = validateCell(net, {
      county: 'Oglala Lakota',
      specialty: 'Pediatrics',
      lob: 'Medicaid',
    })!;
    expect(v.compliant).toBe(false);
    expect(v.checks.some((c) => c.standard === 'time-distance' && !c.pass)).toBe(true);
    expect(v.checks.find((c) => c.standard === 'ratio')!.pass).toBe(false);
  });

  it('surfaces a wait-time failure where measured (Fulton MH Medicaid, 18d > 10d)', () => {
    const v = validateCell(net, { county: 'Fulton', specialty: 'Mental Health', lob: 'Medicaid' })!;
    const wt = v.checks.find((c) => c.standard === 'wait-time')!;
    expect(wt.pass).toBe(false);
    expect(wt.actual).toBe(18);
  });
});

describe('Augmentation', () => {
  it('recommends a provider add with a positive adequacy lift', () => {
    const a = recommendAugmentation(net, {
      county: 'Fulton',
      specialty: 'Mental Health',
      lob: 'Medicaid',
    })!;
    expect(a.adequacyLiftPct).toBeGreaterThan(0);
    expect(a.newAdequacyPct).toBeGreaterThan(0);
  });
});
