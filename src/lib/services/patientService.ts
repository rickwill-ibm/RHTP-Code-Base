/**
 * patientService.ts — Single data access point for patient data.
 *
 * All patient-facing pages call getActivePatient() instead of importing
 * patientRegistry directly.  This is the toggle point for mock vs FHIR live.
 *
 * When NEXT_PUBLIC_USE_MOCK_DATA=true  → reads from patientRegistry (static TS)
 * When NEXT_PUBLIC_USE_MOCK_DATA=false → calls HAPI FHIR, falls back to registry
 *
 * Usage:
 *   import { getActivePatient, getAllRegistryPatients } from '@/lib/services/patientService';
 *   const patient = await getActivePatient(activePatientId);
 */

import {
  getPatientById,
  getAllPatients,
  type RegistryPatient,
} from '@/lib/patientRegistry';

const USE_MOCK =
  (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? 'true').toLowerCase() === 'true';

/**
 * Fetch a single patient by platform ID (e.g. 'MARIA_SD_001', 'PAT-0042').
 *
 * Mock mode  : instant registry lookup, no network call.
 * Live mode  : tries HAPI FHIR getRegistryPatient(), falls back to registry on error.
 */
export async function getActivePatient(
  platformId: string,
): Promise<RegistryPatient | undefined> {
  if (USE_MOCK) {
    return getPatientById(platformId);
  }

  // Live FHIR path — resolve platform ID to FHIR ID then fetch
  try {
    const { getFhirClient } = await import('./fhirClient');
    const { FHIR_ID_MAP } = await import('@/lib/patientRegistry');

    // Invert FHIR_ID_MAP to find fhirId for this platformId
    const fhirId = Object.entries(FHIR_ID_MAP).find(
      ([, pid]) => pid === platformId,
    )?.[0];

    if (fhirId) {
      const livePatient = await getFhirClient().getRegistryPatient(fhirId);
      if (livePatient) return livePatient;
    }
  } catch (err) {
    console.warn(
      `[patientService] FHIR fetch failed for ${platformId}, using registry fallback:`,
      err,
    );
  }

  // Fallback to static registry
  return getPatientById(platformId);
}

/**
 * Synchronous registry lookup — use this inside components/hooks that
 * cannot be async (e.g. render-time constant derivation).
 * Always returns registry data regardless of USE_MOCK flag.
 */
export function getPatientSync(platformId: string): RegistryPatient | undefined {
  return getPatientById(platformId);
}

/**
 * Returns all patients.
 * Used to populate the patient switcher dropdown.
 * Always reads from the registry (the registry is the source of truth for the list).
 */
export function getAllRegistryPatients(): RegistryPatient[] {
  return getAllPatients();
}
