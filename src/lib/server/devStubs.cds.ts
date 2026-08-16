// ─── devStubs.cds.ts ──────────────────────────────────────────────────────────
// CRD (Coverage Requirements Discovery) card stubs.

import type { CdsCard } from './cdsClient';
import { profileFor } from './devStubs.profiles';

/** CRD cards — patient-aware; defaults to lumbar MRI for MARIA_SD_001. */
export function devCrdCards(patientId?: string): CdsCard[] {
  const p = profileFor(patientId ?? 'MARIA_SD_001');
  return [
    {
      summary: `Prior authorization required: ${p.paScenario.procedureName} (CPT ${p.paScenario.cptCode})`,
      indicator: 'critical',
      detail: `Payer coverage policy requires documentation review. Complete the DTR questionnaire to proceed with ${p.paScenario.procedureName}.`,
      links: [{ label: 'Open documentation (DTR)', url: '/prior-auth', type: 'smart' }],
    },
    {
      summary: 'Alternative covered without prior authorization — see policy',
      indicator: 'info',
    },
  ];
}
