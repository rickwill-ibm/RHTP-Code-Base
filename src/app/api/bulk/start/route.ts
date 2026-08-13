/**
 * BFF: start a Payer-to-Payer bulk export — plan Slice 3.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { startExport } from '@/lib/server/bulkClient';
import { correlationFrom } from '@/lib/server/correlation';
import { ooError } from '@/lib/fhir/operationOutcome';
import { devMockEnabled, devBulkStart } from '@/lib/server/devStubs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    priorPayer?: string;
    patientId?: string;
    memberMatch?: unknown;
  } | null;
  if (!body?.priorPayer) {
    return NextResponse.json(ooError('priorPayer required', 'required'), { status: 400 });
  }
  if (devMockEnabled()) {
    return NextResponse.json({ ...devBulkStart(), patientId: body.patientId, correlationId }, { status: 202 });
  }
  // Build a proper $member-match payload from the patientId if provided
  const memberMatchPayload = body.memberMatch && Object.keys(body.memberMatch as object).length > 0
    ? body.memberMatch
    : body.patientId
      ? { resourceType: 'Parameters', parameter: [{ name: 'MemberPatient', resource: { resourceType: 'Patient', id: body.patientId } }] }
      : {};
  const result = await startExport(body.priorPayer, memberMatchPayload, {
    actor: 'session-user',
    correlationId,
  });
  return NextResponse.json(
    { jobId: result.jobId, correlationId: result.correlationId },
    {
      status: result.ok ? 202 : result.status || 502,
    }
  );
}
