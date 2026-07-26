/**
 * Tier-B backbone configuration (increment GT-10 / #4).
 *
 * The offline build runs on dev stubs + the mock policy library. Live,
 * standards-conformant operation needs the Tier-B backbone (WSO2 APIM/IS + Open
 * Health accelerator + Ballerina services + FHIR server + ITX for X12). Those
 * endpoints are configured here from env; `isBackboneConfigured()` gates the
 * live clients so nothing attempts a live call unless the stack is present.
 */
export interface BackboneConfig {
  apimBase?: string; // WSO2 API Manager gateway
  identityBase?: string; // WSO2 Identity Server (SMART/OAuth)
  fhirBase?: string; // FHIR server / OH accelerator
  eligibilityService?: string; // Ballerina 270/271 service
  crdService?: string; // Da Vinci CRD (CDS Hooks)
  dtrService?: string; // Da Vinci DTR ($questionnaire-package)
  pasService?: string; // Da Vinci PAS (Claim/$submit)
  x12Converter?: string; // ITX FHIR↔X12 278/275
}

export function backboneConfig(): BackboneConfig {
  const e = process.env;
  return {
    apimBase: e.BACKBONE_APIM_BASE,
    identityBase: e.BACKBONE_IS_BASE,
    fhirBase: e.BACKBONE_FHIR_BASE,
    eligibilityService: e.BACKBONE_ELIGIBILITY_URL,
    crdService: e.BACKBONE_CRD_URL,
    dtrService: e.BACKBONE_DTR_URL,
    pasService: e.BACKBONE_PAS_URL,
    x12Converter: e.BACKBONE_X12_URL,
  };
}

export type BackboneCapability = 'eligibility-270-271' | 'crd' | 'dtr' | 'pas' | 'x12-278-275';

/** Which capabilities are configured (have an endpoint). */
export function backboneCapabilities(
  cfg: BackboneConfig = backboneConfig()
): Record<BackboneCapability, boolean> {
  return {
    'eligibility-270-271': !!cfg.eligibilityService,
    crd: !!cfg.crdService,
    dtr: !!cfg.dtrService,
    pas: !!cfg.pasService,
    'x12-278-275': !!cfg.x12Converter,
  };
}

/** True when the core PA path (CRD/DTR/PAS) is configured for live operation. */
export function isBackboneConfigured(cfg: BackboneConfig = backboneConfig()): boolean {
  return !!(cfg.crdService && cfg.dtrService && cfg.pasService);
}
