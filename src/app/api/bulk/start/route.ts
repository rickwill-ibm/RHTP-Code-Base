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
    memberMatch?: unknown;
  } | null;
  if (!body?.priorPayer) {
    return NextResponse.json(ooError('priorPayer required', 'required'), { status: 400 });
  }
  if (devMockEnabled()) {
    return NextResponse.json({ ...devBulkStart(), correlationId }, { status: 202 });
  }
  const result = await startExport(body.priorPayer, body.memberMatch ?? {}, {
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
