import { describe, it, expect } from 'vitest';
import {
  backboneCapabilities,
  isBackboneConfigured,
  type BackboneConfig,
} from '@/lib/backbone/config';
import {
  assertBackbone,
  BackboneNotConfiguredError,
  liveEligibilityClient,
  livePriorAuthBackbone,
} from '@/lib/backbone/clients';

/** #4 / GT-10 — backbone config gating (offline: nothing configured). */

const empty: BackboneConfig = {};
const full: BackboneConfig = {
  crdService: 'https://crd',
  dtrService: 'https://dtr',
  pasService: 'https://pas',
  eligibilityService: 'https://elig',
  x12Converter: 'https://x12',
};

describe('Backbone config', () => {
  it('reports all capabilities off when nothing is configured', () => {
    const caps = backboneCapabilities(empty);
    expect(Object.values(caps).every((v) => v === false)).toBe(true);
    expect(isBackboneConfigured(empty)).toBe(false);
  });

  it('reports configured when CRD/DTR/PAS are set', () => {
    expect(isBackboneConfigured(full)).toBe(true);
    expect(backboneCapabilities(full)['x12-278-275']).toBe(true);
  });
});

describe('Backbone guards', () => {
  it('assertBackbone throws when not configured', () => {
    expect(() => assertBackbone('pas', empty)).toThrow(BackboneNotConfiguredError);
  });

  it('live clients reject calls offline', async () => {
    await expect(
      liveEligibilityClient(empty).check({ memberId: 'm', payerId: 'p' })
    ).rejects.toThrow(BackboneNotConfiguredError);
    await expect(livePriorAuthBackbone(empty).crd({ patientId: 'p', order: {} })).rejects.toThrow(
      BackboneNotConfiguredError
    );
  });
});
