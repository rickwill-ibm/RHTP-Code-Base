/**
 * Tier-B backbone client seams (increment GT-10 / #4).
 *
 * Interfaces for the live services, plus a guard that refuses to call them when
 * the backbone is not configured — so offline code fails loud and clear instead
 * of silently hitting a missing endpoint. The live HTTP implementations are wired
 * when the Tier-B stack is stood up; until then `assertBackbone()` throws and the
 * dev stubs remain the offline path.
 */
import { backboneConfig, isBackboneConfigured, type BackboneConfig } from './config';

export class BackboneNotConfiguredError extends Error {
  constructor(capability: string) {
    super(
      `Tier-B backbone not configured for "${capability}". Configure BACKBONE_* env or use dev stubs.`
    );
    this.name = 'BackboneNotConfiguredError';
  }
}

export function assertBackbone(capability: string, cfg: BackboneConfig = backboneConfig()): void {
  if (!isBackboneConfigured(cfg)) throw new BackboneNotConfiguredError(capability);
}

/** Eligibility (X12 270 → 271). */
export interface EligibilityClient {
  check(input: { memberId: string; payerId: string; serviceCode?: string }): Promise<{
    active: boolean;
    requiresPA?: boolean;
    raw271?: unknown;
  }>;
}

/** Da Vinci PA path (CRD → DTR → PAS) + X12 278/275 conversion. */
export interface PriorAuthBackbone {
  crd(input: { patientId: string; order: unknown }): Promise<{ cards: unknown[] }>;
  dtrPackage(input: { questionnaireUrl: string; patientId: string }): Promise<{ bundle: unknown }>;
  pasSubmit(input: {
    claimBundle: unknown;
    approvedBy: string;
  }): Promise<{ claimResponse: unknown }>;
}

export interface X12Converter {
  fhirToX12_278(claimBundle: unknown): Promise<string>;
  x12_275ToFhir(x12: string): Promise<unknown>;
}

/**
 * Live client factories. These throw until the backbone is configured; when it
 * is, replace the bodies with fetch() calls to the configured endpoints.
 */
export function liveEligibilityClient(cfg: BackboneConfig = backboneConfig()): EligibilityClient {
  return {
    async check() {
      assertBackbone('eligibility-270-271', cfg);
      throw new BackboneNotConfiguredError('eligibility-270-271'); // replaced by fetch(cfg.eligibilityService)
    },
  };
}

export function livePriorAuthBackbone(cfg: BackboneConfig = backboneConfig()): PriorAuthBackbone {
  const guard = () => assertBackbone('prior-auth', cfg);
  return {
    async crd() {
      guard();
      throw new BackboneNotConfiguredError('crd');
    },
    async dtrPackage() {
      guard();
      throw new BackboneNotConfiguredError('dtr');
    },
    async pasSubmit() {
      guard();
      throw new BackboneNotConfiguredError('pas');
    },
  };
}

export function liveX12Converter(cfg: BackboneConfig = backboneConfig()): X12Converter {
  return {
    async fhirToX12_278() {
      assertBackbone('x12-278-275', cfg);
      throw new BackboneNotConfiguredError('x12-278-275');
    },
    async x12_275ToFhir() {
      assertBackbone('x12-278-275', cfg);
      throw new BackboneNotConfiguredError('x12-278-275');
    },
  };
}
