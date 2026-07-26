/**
 * BFF: run Financial Clearance for a member+order (increment #1).
 *
 * POST { patientId?, orderCode, providerNpi? } → reads the member's FHIR context
 * (live via the BFF, or the seed bundle in dev-mock), runs the thread
 * orchestrator, persists the Evidence Record, and returns the result. Guarded by
 * auth + the goldenThread flag. Read-only with respect to FHIR; the only
 * side-effect is persisting the (PHI-safe) Evidence Record.
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isAuthenticated, getSessionPatient } from '@/lib/server/smartSession';
import { fhirRead, fhirSearch } from '@/lib/server/fhirServer';
import { devMockEnabled } from '@/lib/server/devStubs';
import { ooError } from '@/lib/fhir/operationOutcome';
import { flag } from '@/lib/flags/flags';
import { loadMockLibrary } from '@/lib/policy';
import { mockGoldCardDataSource } from '@/lib/policy/goldCardSource';
import { mockDenialRateProvider } from '@/lib/policy/denialRates';
import { defaultEvidenceStore } from '@/lib/evidence/evidenceStore';
import { projectThreadInputs } from '@/lib/goldenThread/fromFhirBundle';
import { runFinancialClearance } from '@/lib/goldenThread/threadOrchestrator';

export const runtime = 'nodejs';

interface BundleEntry {
  resource: { resourceType: string; id?: string; [k: string]: unknown };
}

async function readSeedBundle(): Promise<BundleEntry[]> {
  const p = path.join(process.cwd(), 'tools/seed/maria.bundle.json');
  const parsed = JSON.parse(await fs.readFile(p, 'utf8')) as { entry: BundleEntry[] };
  return parsed.entry;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!flag('goldenThread')) {
    return NextResponse.json(ooError('Financial Clearance not enabled', 'not-supported'), {
      status: 404,
    });
  }
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    patientId?: string;
    orderCode?: string;
    providerNpi?: string;
  } | null;

  const patientId =
    body?.patientId || (await getSessionPatient().catch(() => null)) || 'MARIA_SD_001';

  // Gather the member's clinical context.
  type CC = { text?: string; coding?: { system?: string; code?: string; display?: string }[] };
  type Cond = { code?: CC };
  type SR = {
    code?: CC;
    requester?: { identifier?: { value?: string }; display?: string };
    performer?: { identifier?: { value?: string } }[];
  };
  type Cov = {
    status?: string;
    type?: CC;
    payor?: { display?: string }[];
    class?: { type?: CC; name?: string }[];
  };
  const asRes = <T>(r: BundleEntry['resource'] | undefined): T | undefined => r as unknown as T;

  let conditions: Cond[] = [];
  let serviceRequest: SR | undefined;
  let coverage: Cov | undefined;

  if (devMockEnabled()) {
    const entries = await readSeedBundle().catch(() => [] as BundleEntry[]);
    conditions = entries
      .filter((e) => e.resource.resourceType === 'Condition')
      .map((e) => asRes<Cond>(e.resource) as Cond);
    serviceRequest = asRes<SR>(
      entries.find((e) => e.resource.resourceType === 'ServiceRequest')?.resource
    );
    coverage = asRes<Cov>(entries.find((e) => e.resource.resourceType === 'Coverage')?.resource);
  } else {
    const [condRes, srRes, covRes] = await Promise.all([
      fhirSearch<{ entry?: BundleEntry[] }>('Condition', `patient=${patientId}`),
      fhirSearch<{ entry?: BundleEntry[] }>('ServiceRequest', `patient=${patientId}&status=active`),
      fhirSearch<{ entry?: BundleEntry[] }>('Coverage', `patient=${patientId}`),
    ]);
    conditions = (condRes.raw?.entry ?? []).map((e) => asRes<Cond>(e.resource) as Cond);
    serviceRequest = asRes<SR>((srRes.raw?.entry ?? [])[0]?.resource);
    coverage = asRes<Cov>((covRes.raw?.entry ?? [])[0]?.resource);
    void fhirRead; // reserved for single-resource reads
  }

  if (!serviceRequest) {
    return NextResponse.json(
      ooError('No active order (ServiceRequest) found for member', 'not-found'),
      {
        status: 404,
      }
    );
  }

  const inputs = projectThreadInputs({
    memberId: patientId,
    conditions,
    serviceRequest,
    coverage,
    providerNpi: body?.providerNpi,
  });
  if (body?.orderCode) inputs.order.code = body.orderCode;

  const ts = new Date().toISOString();
  const evId = `ev-${patientId}-${inputs.order.code}-${Date.parse(ts)}`;
  const result = await runFinancialClearance(inputs, {
    library: loadMockLibrary(),
    goldCardSource: mockGoldCardDataSource,
    denialRates: mockDenialRateProvider,
    store: defaultEvidenceStore(),
    ts,
    ids: {
      evidence: evId,
      determination: `${evId}-det`,
      goldCard: `${evId}-gc`,
      propensity: `${evId}-prop`,
      eligibility: `${evId}-elig`,
      estimation: `${evId}-est`,
    },
  });

  return NextResponse.json(
    {
      evidenceId: result.evidence.id,
      memberId: result.memberId,
      netRequiresPA: result.netRequiresPA,
      netOutcome: result.summary.netOutcome,
      eligibility: result.eligibility,
      medicalNecessity: result.medicalNecessity.vm,
      estimate: result.estimate,
      workItem: result.workItem,
    },
    { status: 200 }
  );
}
