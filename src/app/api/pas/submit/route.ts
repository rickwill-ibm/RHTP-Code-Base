/**
 * BFF: submit prior authorization (PAS) — plan Slice 4. HUMAN-GATED.
 *
 * Guardrail (blueprint §4D): an agent may PREPARE the Claim bundle, but the
 * actual submission requires an explicit human approver. Without an `approvedBy`
 * this route returns 202 "requires human approval" and does NOT submit.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { submitPas } from '@/lib/server/pasClient';
import { correlationFrom, newCorrelationId } from '@/lib/server/correlation';
import { ooError, operationOutcome } from '@/lib/fhir/operationOutcome';
import { devMockEnabled, devClaimResponseApproved } from '@/lib/server/devStubs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as {
    claimBundle?: unknown;
    approvedBy?: string;
    patientId?: string;
  } | null;
  if (!body?.claimBundle) {
    return NextResponse.json(ooError('claimBundle required', 'required'), { status: 400 });
  }

  // HUMAN GATE — refuse to submit without an approver.
  const approvedBy = body.approvedBy || req.headers.get('x-approved-by') || '';
  if (!approvedBy) {
    return NextResponse.json(
      operationOutcome([
        {
          severity: 'information',
          code: 'informational',
          diagnostics:
            'Prior-authorization submission requires human approval. Re-POST with approvedBy set.',
        },
      ]),
      { status: 202 }
    );
  }

  // Extract patientId from claimBundle if not provided at top level
  const claimPatientId = body.patientId
    ?? (() => {
      try {
        const bundle = body.claimBundle as { entry?: { resource?: { patient?: { reference?: string } } }[] };
        const ref = bundle.entry?.[0]?.resource?.patient?.reference ?? '';
        return ref.startsWith('Patient/') ? ref.slice(8) : undefined;
      } catch { return undefined; }
    })();

  // Dev demo: return a canned approved decision (human gate above still enforced).
  if (devMockEnabled()) {
    return NextResponse.json(devClaimResponseApproved(approvedBy, claimPatientId), { status: 200 });
  }

  const idempotencyKey = req.headers.get('idempotency-key') || newCorrelationId();
  const result = await submitPas(body.claimBundle, {
    actor: 'session-user',
    approvedBy,
    idempotencyKey,
    correlationId,
  });
  return NextResponse.json(result.claimResponse ?? ooError('submit failed', 'exception'), {
    status: result.ok ? 200 : result.status || 502,
  });
}
