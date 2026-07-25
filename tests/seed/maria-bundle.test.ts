import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { toCoverageVM, toConditionVM, toPaStatusVM } from '@/lib/fhir/viewModels';

/**
 * Seed-data demonstration guard (mock data). Loads the actual Maria bundle and
 * proves the resources the Patient Access page queries are present and map to
 * the expected view models — including an approved PA and a denied PA w/ reasons.
 */
interface Entry {
  resource: { resourceType: string; [k: string]: unknown };
}
const bundle = JSON.parse(
  readFileSync(join(process.cwd(), 'tools/seed/maria.bundle.json'), 'utf8')
) as { entry: Entry[] };

function ofType(t: string): Record<string, unknown>[] {
  return bundle.entry.filter((e) => e.resource.resourceType === t).map((e) => e.resource);
}

describe('Maria seed — mock demonstration data', () => {
  it('has the Patient and Coverage the member page queries', () => {
    expect(ofType('Patient').some((p) => p.id === 'MARIA_SD_001')).toBe(true);
    const cov = ofType('Coverage');
    expect(cov.length).toBeGreaterThan(0);
    const vm = toCoverageVM(cov[0]);
    expect(vm.payer).toContain('Medicaid');
  });

  it('has multiple Conditions that project cleanly', () => {
    const conds = ofType('Condition');
    expect(conds.length).toBeGreaterThanOrEqual(3);
    const displays = conds.map((c) => toConditionVM(c).display);
    expect(displays).toContain('Type 2 diabetes mellitus');
  });

  it('has an APPROVED and a DENIED ClaimResponse for the PA-status view', () => {
    const crs = ofType('ClaimResponse').map((r) => toPaStatusVM(r));
    const approved = crs.find((r) => r.status === 'approved');
    const denied = crs.find((r) => r.status === 'denied');
    expect(approved).toBeTruthy();
    expect(denied).toBeTruthy();
    expect(denied!.denialReasons.length).toBeGreaterThan(0);
    expect(denied!.denialReasons[0]).toMatch(/medical necessity/i);
  });

  it('includes supporting resources for provenance and DTR', () => {
    expect(ofType('Organization').length).toBeGreaterThanOrEqual(2); // payer + provider
    expect(ofType('Practitioner').length).toBeGreaterThanOrEqual(1);
    expect(
      ofType('Questionnaire').some((q) => q.url === 'http://example.org/Questionnaire/mri-lumbar')
    ).toBe(true);
    expect(ofType('ServiceRequest').length).toBeGreaterThanOrEqual(1); // CPT 72148 for CRD/PAS
  });
});
