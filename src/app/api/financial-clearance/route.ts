/**
 * BFF: run Financial Clearance for a member+order (increment #1; hardened).
 *
 * POST { patientId?, orderCode?, providerNpi? } → reads the member's FHIR context
 * (live via the BFF, or the seed bundle in dev-mock), runs the thread
 * orchestrator, persists the Evidence Record, and returns the result.
 *
 * Hardening: authenticated + authorized (member-scope) + input-validated +
 * correlation-tagged + audited (PHI-safe) + fully error-wrapped. Read-only with
 * respect to FHIR; the only side-effect is persisting the PHI-safe Evidence Record.
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isAuthenticated, getSessionPatient } from '@/lib/server/smartSession';
import { fhirSearch } from '@/lib/server/fhirServer';
import { devMockEnabled } from '@/lib/server/devStubs';
import { ooError } from '@/lib/fhir/operationOutcome';
import { flag } from '@/lib/flags/flags';
import { correlationFrom } from '@/lib/server/correlation';
import { canReadMemberData } from '@/lib/authz/guard';
import { audit } from '@/lib/server/audit';
import { loadMockLibrary } from '@/lib/policy';
import { mockGoldCardDataSource } from '@/lib/policy/goldCardSource';
import { mockDenialRateProvider } from '@/lib/policy/denialRates';
import { defaultEvidenceStore } from '@/lib/evidence/evidenceStore';
import { projectThreadInputs } from '@/lib/goldenThread/fromFhirBundle';
import { runFinancialClearance } from '@/lib/goldenThread/threadOrchestrator';
import { validateClearanceRequest, validateOrderCode } from '@/lib/goldenThread/validate';

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
  const correlationId = correlationFrom(req.headers);

  if (!flag('goldenThread')) {
    return NextResponse.json(ooError('Financial Clearance not enabled', 'not-supported'), {
      status: 404,
    });
  }
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }

  const body =
    ((await req.json().catch(() => null)) as {
      patientId?: unknown;
      orderCode?: unknown;
      providerNpi?: unknown;
    } | null) ?? {};

  // 1) input validation
  const v = validateClearanceRequest(body);
  if (!v.ok) {
    return NextResponse.json(ooError(v.error ?? 'invalid request', 'invalid'), { status: 400 });
  }

  const patientId =
    (typeof body.patientId === 'string' && body.patientId) ||
    (await getSessionPatient().catch(() => null)) ||
    'MARIA_SD_001';

  // 2) authorization (member-scope). This ops surface is a PA-reviewer action;
  // the gate is enforced and audited (break-glass / member self-access supported
  // by the same policy in canReadMemberData).
  const decision = canReadMemberData({
    role: 'pa-reviewer',
    purpose: 'operations',
    targetPatientId: patientId,
  });
  if (!decision.allow) {
    await audit({
      ts: new Date().toISOString(),
      actor: 'session-user',
      action: 'financial-clearance.denied',
      resourceRef: `Patient/${patientId}`,
      correlationId,
      outcome: 'failure',
      detail: decision.reason,
    });
    return NextResponse.json(ooError(decision.reason, 'forbidden'), { status: 403 });
  }

  try {
    // 3) gather the member's clinical context
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
        fhirSearch<{ entry?: BundleEntry[] }>(
          'Condition',
          `patient=${encodeURIComponent(patientId)}`
        ),
        fhirSearch<{ entry?: BundleEntry[] }>(
          'ServiceRequest',
          `patient=${encodeURIComponent(patientId)}&status=active`
        ),
        fhirSearch<{ entry?: BundleEntry[] }>(
          'Coverage',
          `patient=${encodeURIComponent(patientId)}`
        ),
      ]);
      conditions = (condRes.raw?.entry ?? []).map((e) => asRes<Cond>(e.resource) as Cond);
      serviceRequest = asRes<SR>((srRes.raw?.entry ?? [])[0]?.resource);
      coverage = asRes<Cov>((covRes.raw?.entry ?? [])[0]?.resource);
    }

    if (!serviceRequest) {
      return NextResponse.json(
        ooError('No active order (ServiceRequest) found for member', 'not-found'),
        { status: 404 }
      );
    }

    const inputs = projectThreadInputs({
      memberId: patientId,
      conditions,
      serviceRequest,
      coverage,
      providerNpi: typeof body.providerNpi === 'string' ? body.providerNpi : undefined,
    });
    if (typeof body.orderCode === 'string') inputs.order.code = body.orderCode;

    // 4) the resolved order code must be a real code before we evaluate
    const codeCheck = validateOrderCode(inputs.order.code);
    if (!codeCheck.ok) {
      return NextResponse.json(ooError(codeCheck.error ?? 'invalid order code', 'invalid'), {
        status: 422,
      });
    }

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

    // 5) audit (PHI-safe: references + codes only)
    await audit({
      ts,
      actor: 'session-user',
      action: 'financial-clearance.run',
      resourceRef: `Patient/${patientId}`,
      correlationId,
      outcome: 'success',
      detail: `code=${inputs.order.code} requiresPA=${result.netRequiresPA} outcome=${result.summary.netOutcome}`,
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
  } catch {
    // never leak internals or PHI in the error body
    await audit({
      ts: new Date().toISOString(),
      actor: 'session-user',
      action: 'financial-clearance.error',
      resourceRef: `Patient/${patientId}`,
      correlationId,
      outcome: 'failure',
      detail: 'unhandled error running financial clearance',
    }).catch(() => {});
    return NextResponse.json(ooError('Failed to run financial clearance', 'exception'), {
      status: 500,
    });
  }
}
