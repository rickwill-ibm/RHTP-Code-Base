/**
 * FHIR R4 HTTP Client
 *
 * A thin, fetch-based FHIR R4 client.  When NEXT_PUBLIC_USE_MOCK_DATA=true
 * every method short-circuits to return empty / stub data so the app works
 * without a live FHIR server.
 *
 * When NEXT_PUBLIC_USE_MOCK_DATA=false the client issues real HTTP requests
 * against NEXT_PUBLIC_FHIR_BASE_URL (default http://localhost:8080/fhir).
 */

import type { RegistryPatient } from '../patientRegistry';

const FHIR_BASE =
  process.env.NEXT_PUBLIC_FHIR_BASE_URL ?? 'http://localhost:8080/fhir';

const TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_FHIR_TIMEOUT ?? 30_000);

const USE_MOCK =
  (process.env.NEXT_PUBLIC_USE_MOCK_DATA ?? 'true').toLowerCase() === 'true';

// ─── Low-level fetch wrapper ──────────────────────────────────────────────────

async function fhirFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${FHIR_BASE}/${path.replace(/^\//, '')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`FHIR ${res.status} ${res.statusText} — ${path}: ${body.slice(0, 200)}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export class FhirClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? FHIR_BASE;
  }

  /** Read a single resource by type and id */
  async read<T = unknown>(resourceType: string, id: string): Promise<T> {
    if (USE_MOCK) {
      console.debug(`[FhirClient][mock] read ${resourceType}/${id}`);
      return { resourceType, id } as T;
    }
    return fhirFetch<T>(`${resourceType}/${id}`);
  }

  /** Create a resource (server assigns id) */
  async create<T = unknown>(resource: Record<string, unknown>): Promise<T> {
    if (USE_MOCK) {
      console.debug(`[FhirClient][mock] create ${resource.resourceType}`);
      return { ...resource, id: `mock-${Date.now()}` } as T;
    }
    return fhirFetch<T>(`${resource.resourceType}`, {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  }

  /** Update (PUT) a resource — id must be set on the resource */
  async update<T = unknown>(resource: Record<string, unknown> & { id: string }): Promise<T> {
    if (USE_MOCK) {
      console.debug(`[FhirClient][mock] update ${resource.resourceType}/${resource.id}`);
      return resource as T;
    }
    return fhirFetch<T>(`${resource.resourceType}/${resource.id}`, {
      method: 'PUT',
      body: JSON.stringify(resource),
    });
  }

  /** Search for resources */
  async search<T = unknown>(
    resourceType: string,
    params: Record<string, string | number | boolean>,
  ): Promise<T> {
    if (USE_MOCK) {
      console.debug(`[FhirClient][mock] search ${resourceType}`, params);
      return { resourceType: 'Bundle', entry: [] } as T;
    }
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    ).toString();
    return fhirFetch<T>(`${resourceType}?${qs}`);
  }

  /** Delete a resource */
  async delete(resourceType: string, id: string): Promise<void> {
    if (USE_MOCK) {
      console.debug(`[FhirClient][mock] delete ${resourceType}/${id}`);
      return;
    }
    await fhirFetch<void>(`${resourceType}/${id}`, { method: 'DELETE' });
  }

  // ── High-level patient helpers ──────────────────────────────────────────────

  /**
   * Fetch a patient from HAPI FHIR by FHIR id and inflate it into a
   * RegistryPatient including related Observations, Flags, and RiskAssessment.
   *
   * Returns undefined if not found.
   */
  async getRegistryPatient(fhirPatientId: string): Promise<RegistryPatient | undefined> {
    if (USE_MOCK) return undefined;

    try {
      const { mapFhirPatientToRegistryPatient, bundleEntries } = await import('./fhirResourceMappers');

      const [patient, obsBundle, flagBundle, riskBundle] = await Promise.all([
        fhirFetch<{ resourceType: string; id: string }>(`Patient/${fhirPatientId}`).catch(
          () => undefined,
        ),
        fhirFetch<{ resourceType: string; entry?: unknown[] }>(
          `Observation?subject=Patient/${fhirPatientId}&_count=100`,
        ).catch(() => ({ resourceType: 'Bundle', entry: [] })),
        fhirFetch<{ resourceType: string; entry?: unknown[] }>(
          `Flag?subject=Patient/${fhirPatientId}&_count=100`,
        ).catch(() => ({ resourceType: 'Bundle', entry: [] })),
        fhirFetch<{ resourceType: string; entry?: unknown[] }>(
          `RiskAssessment?subject=Patient/${fhirPatientId}&_count=5`,
        ).catch(() => ({ resourceType: 'Bundle', entry: [] })),
      ]);

      if (!patient || patient.resourceType !== 'Patient') return undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const observations = bundleEntries(obsBundle as any, 'Observation') as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flags = bundleEntries(flagBundle as any, 'Flag') as any[];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const risks = bundleEntries(riskBundle as any, 'RiskAssessment') as any[];

      return mapFhirPatientToRegistryPatient(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        patient as any,
        observations,
        flags,
        risks[0],
      );
    } catch (err) {
      console.error(`[FhirClient] getRegistryPatient(${fhirPatientId}) failed:`, err);
      return undefined;
    }
  }

  /**
   * Fetch all patients from HAPI FHIR and return them as RegistryPatient[].
   * Falls back to empty array on error.
   */
  async getAllRegistryPatients(): Promise<RegistryPatient[]> {
    if (USE_MOCK) return [];

    try {
      const bundle = await fhirFetch<{ resourceType: string; entry?: { resource?: { id?: string } }[] }>(
        'Patient?_count=100',
      );
      const ids = (bundle.entry ?? [])
        .map((e) => e.resource?.id)
        .filter((id): id is string => !!id);

      const patients = await Promise.all(ids.map((id) => this.getRegistryPatient(id)));
      return patients.filter((p): p is RegistryPatient => !!p);
    } catch (err) {
      console.error('[FhirClient] getAllRegistryPatients() failed:', err);
      return [];
    }
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _instance: FhirClient | null = null;

export function getFhirClient(): FhirClient {
  if (!_instance) _instance = new FhirClient();
  return _instance;
}

export const fhirClient = { getFhirClient };
