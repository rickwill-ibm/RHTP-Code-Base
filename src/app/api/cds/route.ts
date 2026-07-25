/**
 * BFF: invoke CRD (CDS Hooks) — plan Slice 4.
 * POST { hookId, hookRequest } → cards.
 */
import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/server/smartSession';
import { invokeCrd } from '@/lib/server/cdsClient';
import { correlationFrom } from '@/lib/server/correlation';
import { ooError } from '@/lib/fhir/operationOutcome';

export const runtime = 'nodejs';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const correlationId = correlationFrom(req.headers);
  if (!(await isAuthenticated().catch(() => false))) {
    return NextResponse.json(ooError('Not authenticated', 'login'), { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    hookId?: string;
    hookRequest?: unknown;
  } | null;
  if (!body?.hookId) {
    return NextResponse.json(ooError('hookId required', 'required'), { status: 400 });
  }
  const result = await invokeCrd(body.hookId, body.hookRequest ?? {}, {
    actor: 'session-user',
    correlationId,
  });
  return NextResponse.json(
    { cards: result.cards, correlationId: result.correlationId },
    {
      status: result.ok ? 200 : result.status || 502,
    }
  );
}
