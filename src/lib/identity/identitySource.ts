/**
 * Cross-source identity registry seam (Dev Plan Workstream A5/A6).
 *
 * Same data-source-seam pattern as lib/policy/goldCardSource.ts: an interface
 * that lets a real production source replace the in-memory mock without changing
 * callers. Two integration modes are supported, matching the choice V3 offered HCA:
 *
 *  - "standalone": the platform operates its own identity registry (this mock is
 *    the standalone implementation, seeded with demo cross-source records).
 *  - "hca-mpi": the platform defers to HCA's existing Master Patient/Client Index.
 *    No adapter is implemented against a specific HCA system yet — this is a
 *    business/architecture decision that must be made jointly with HCA (Dev Plan
 *    task A5), so this file only defines the seam, not a live integration.
 */
import type { SourceIdentityRecord, SourceSystem } from './mpiTypes';

export type IdentityIntegrationMode = 'standalone' | 'hca-mpi';

export interface IdentitySource {
  id: string;
  mode: IdentityIntegrationMode;
  /** All known records for a source system (used to search for match candidates). */
  recordsFor(sourceSystem: SourceSystem): SourceIdentityRecord[];
}

const MOCK_RECORDS: SourceIdentityRecord[] = [
  {
    sourceSystem: 'emr',
    sourceRecordId: 'emr-pat-4471',
    traits: {
      firstName: 'Maria',
      lastName: 'Redhawk',
      dob: '1985-04-12',
      sex: 'female',
      zip: '57104',
      phone: '605-555-0142',
    },
  },
  {
    sourceSystem: 'payer',
    sourceRecordId: 'payer-mem-MARIA_SD_001',
    traits: {
      firstName: 'Maria',
      lastName: 'Redhawk',
      dob: '1985-04-12',
      sex: 'female',
      medicaidId: 'SD-MEDICAID-88213',
      zip: '57104',
    },
  },
  {
    sourceSystem: 'state-agency',
    sourceRecordId: 'sd-hca-enroll-99231',
    traits: {
      firstName: 'Maria',
      lastName: 'Redhawk',
      dob: '1985-04-12',
      medicaidId: 'SD-MEDICAID-88213',
      ssnLast4: '4471',
    },
  },
];

/** In-memory standalone registry — swap for a real cross-source client in production. */
function createMockIdentitySource(): IdentitySource {
  return {
    id: 'mock-standalone-identity-registry',
    mode: 'standalone',
    recordsFor(sourceSystem: SourceSystem): SourceIdentityRecord[] {
      return MOCK_RECORDS.filter((r) => r.sourceSystem === sourceSystem);
    },
  };
}

export const mockIdentitySource: IdentitySource = createMockIdentitySource();
